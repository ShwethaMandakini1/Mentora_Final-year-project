import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { getMySubmissions } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

const BAR_COLOURS = ['#22c55e','#2563eb','#60a5fa','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const gradeOrder  = ['A+','A','A-','B+','B','B-','C+','C','F'];
const gradeNum    = (g) => Math.max(0, 9 - gradeOrder.indexOf(g ?? 'F'));

export default function StudentAnalytics() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiInsights, setAiInsights]   = useState(null);
  const [aiError, setAiError]         = useState('');

  useEffect(() => {
    getMySubmissions()
      .then(r => setSubmissions(r.data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── derived stats ─────────────────────────────────────────
  const graded = submissions.filter(s => s.status === 'Graded');
  const total  = submissions.length;

  // module grouping
  const moduleMap = {};
  graded.forEach(s => {
    const key = s.moduleCode || s.moduleName || 'Unknown';
    if (!moduleMap[key]) moduleMap[key] = { name: key, scores: [], grade: s.grade || 'F' };
    moduleMap[key].scores.push(s.score || 0);
    if (gradeNum(s.grade) > gradeNum(moduleMap[key].grade)) moduleMap[key].grade = s.grade;
  });
  const modules = Object.values(moduleMap).map((m, i) => ({
    ...m,
    avg:   Math.round(m.scores.reduce((a,b) => a+b, 0) / m.scores.length),
    color: BAR_COLOURS[i % BAR_COLOURS.length],
  })).sort((a,b) => b.avg - a.avg);

  const overallAvg = graded.length > 0
    ? Math.round(graded.reduce((a,s) => a+(s.score||0), 0) / graded.length)
    : 0;

  const bestModule = modules[0]?.name || '—';

  const improvement = (() => {
    if (graded.length < 2) return null;
    const sorted = [...graded].sort((a,b) => new Date(a.submittedAt)-new Date(b.submittedAt));
    const half   = Math.floor(sorted.length / 2);
    const avgOld = sorted.slice(0, half).reduce((a,s) => a+(s.score||0),0) / half;
    const avgNew = sorted.slice(half).reduce((a,s)  => a+(s.score||0),0) / (sorted.length - half);
    return Math.round(avgNew - avgOld);
  })();

  // ── skill assessment: only count rubric criteria that have maxScore > 0 ──
  const skillMap = {};
  graded.forEach(s => {
    (s.rubricScores || []).forEach(r => {
      if (!r.criterion) return;
      const max = Number(r.maxScore) || 0;
      const sc  = Number(r.score)    || 0;
      if (max <= 0) return;                     // skip empty criteria
      if (!skillMap[r.criterion]) skillMap[r.criterion] = { total: 0, max: 0 };
      skillMap[r.criterion].total += sc;
      skillMap[r.criterion].max   += max;
    });
  });
  const skills = Object.entries(skillMap)
    .filter(([, v]) => v.max > 0)
    .map(([label, v]) => ({
      label,
      val: Math.round((v.total / v.max) * 100),
    }))
    .sort((a,b) => b.val - a.val);

  // ── AI insights via backend ───────────────────────────────
  const fetchAIInsights = async () => {
    if (graded.length === 0) return;
    setAiLoading(true);
    setAiError('');
    setAiInsights(null);
    try {
      const res = await API.post('/ai/insights', {
        overallAverage:    overallAvg,
        totalSubmissions:  total,
        gradedSubmissions: graded.length,
        modules:           modules.map(m => ({ module: m.name, averageScore: m.avg, grade: m.grade })),
        skills:            skills.map(s => ({ skill: s.label, percentage: s.val })),
        improvement,
      });
      setAiInsights(res.data.insights);
    } catch {
      setAiError('Could not load AI insights. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && graded.length > 0) fetchAIInsights();
  }, [loading]);

  // ── RENDER ────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Analytics</h1>
          <p>Your academic performance overview</p>
        </div>
      </div>
      <div className="page-content">

        {/* top stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Overall Average', val: graded.length > 0 ? `${overallAvg}%` : '—',
              color: '#2563eb', bg: '#eff6ff' },
            { label: 'Best Module',     val: bestModule,
              color: '#16a34a', bg: '#dcfce7' },
            { label: 'Submissions',     val: total,
              color: '#7c3aed', bg: '#f3e8ff' },
            { label: 'Improvement',
              val: improvement === null ? '—'
                 : improvement > 0 ? `+${improvement}%`
                 : improvement < 0 ? `${improvement}%` : '0%',
              color: improvement > 0 ? '#16a34a' : improvement < 0 ? '#dc2626' : '#f59e0b',
              bg: '#fef3c7' },
          ].map(s => (
            <div key={s.label} className="card"
              style={{ textAlign: 'center', background: s.bg, boxShadow: 'none' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 14 }}>
            Loading your analytics...
          </div>
        ) : graded.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No graded submissions yet</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
              Your analytics will appear here once your lecturer has marked your assignments.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Module performance */}
            <div className="card">
              <div className="card-title">Module Performance</div>
              {modules.map(m => (
                <div key={m.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{m.name}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge graded" style={{ background: '#dcfce7', color: '#166534' }}>
                        {m.grade || '—'}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{m.avg}%</span>
                    </div>
                  </div>
                  <div className="prog-wrap" style={{ height: 8 }}>
                    <div className="prog-fill" style={{ width: `${m.avg}%`, background: m.color }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Skill assessment */}
              <div className="card">
                <div className="card-title">Skill Assessment</div>
                {skills.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>
                    Skill data will appear once your lecturer grades with rubric scores.
                  </p>
                ) : (
                  skills.map(s => (
                    <div key={s.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{s.label}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{s.val}%</span>
                      </div>
                      <div className="prog-wrap">
                        <div className="prog-fill" style={{
                          width: `${s.val}%`,
                          background: s.val >= 80 ? '#22c55e' : s.val >= 70 ? '#60a5fa' : '#f59e0b'
                        }}/>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Insights */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between',
                               alignItems: 'center', marginBottom: 12 }}>
                  <div className="card-title" style={{ margin: 0 }}>AI Insights</div>
                  <button onClick={fetchAIInsights} disabled={aiLoading}
                    style={{ background: 'none', border: '1px solid #e5e7eb',
                             borderRadius: 8, padding: '4px 12px', fontSize: 12,
                             cursor: aiLoading ? 'not-allowed' : 'pointer', color: '#6b7280' }}>
                    {aiLoading ? 'Loading…' : '↻ Refresh'}
                  </button>
                </div>

                {aiLoading && (
                  <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                    Generating personalised insights...
                  </div>
                )}
                {aiError && (
                  <div style={{ fontSize: 13, color: '#dc2626', padding: '8px 0' }}>{aiError}</div>
                )}
                {aiInsights && !aiLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'strength',    emoji: '🤖', color: '#7c3aed', bg: '#f5f3ff' },
                      { key: 'improvement', emoji: '📈', color: '#d97706', bg: '#fef3c7' },
                      { key: 'motivation',  emoji: '🌟', color: '#16a34a', bg: '#dcfce7' },
                    ].map(({ key, emoji, color, bg }) => (
                      <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                                              background: bg, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 22 }}>{emoji}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 4 }}>
                            {aiInsights[key]?.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                            {aiInsights[key]?.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!aiLoading && !aiInsights && !aiError && (
                  <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                    AI insights will appear here once your assignments are graded.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}