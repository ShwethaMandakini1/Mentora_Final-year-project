import React, { useState, useEffect } from 'react';
import LecturerLayout from './LecturerLayout';
import { getAllSubmissions } from '../../api/api';
import './dashboard.css';

export default function LecturerReports() {
  const [submissions, setSubmissions] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getAllSubmissions()
      .then(r => setSubmissions(r.data.submissions.filter(s => s.status === 'Graded')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mock = [
    { _id:'1', student:{ username:'Kavindi K' }, assignmentName:'HCI Final Report', moduleName:'HCI', score:85, grade:'A',
      feedback:'Excellent work on HCI principles.',
      rubricScores:[{ criterion:'Thesis', score:27, maxScore:30 }, { criterion:'Evidence', score:22, maxScore:25 }, { criterion:'Structure', score:17, maxScore:20 }, { criterion:'Analysis', score:12, maxScore:15 }, { criterion:'Writing', score:7, maxScore:10 }] },
    { _id:'2', student:{ username:'Amal P' }, assignmentName:'SE Proposal', moduleName:'SE', score:82, grade:'A-',
      feedback:'Good proposal with clear objectives.',
      rubricScores:[{ criterion:'Thesis', score:25, maxScore:30 }, { criterion:'Evidence', score:21, maxScore:25 }, { criterion:'Structure', score:16, maxScore:20 }, { criterion:'Analysis', score:12, maxScore:15 }, { criterion:'Writing', score:8, maxScore:10 }] },
    { _id:'3', student:{ username:'Saman W' }, assignmentName:'DBMS Research', moduleName:'DBMS', score:75, grade:'B+',
      feedback:'Satisfactory research on database systems.',
      rubricScores:[{ criterion:'Thesis', score:22, maxScore:30 }, { criterion:'Evidence', score:19, maxScore:25 }, { criterion:'Structure', score:15, maxScore:20 }, { criterion:'Analysis', score:11, maxScore:15 }, { criterion:'Writing', score:8, maxScore:10 }] },
  ];

  const display = loading ? [] : (submissions.length > 0 ? submissions : mock);
  const avg     = display.length > 0 ? Math.round(display.reduce((a, s) => a + (s.score || 0), 0) / display.length) : 0;
  const highest = display.length > 0 ? Math.max(...display.map(s => s.score || 0)) : 0;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const topbar = (
    <div className="ios-topbar">
      <div className="ios-topbar-left">
        <h1 className="ios-page-title">Reports</h1>
        <p className="ios-page-date">Grading summary and feedback records · {dateStr}</p>
      </div>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <LecturerLayout>
      {topbar}
      <div className="ios-page-content">
        <div className="ios-loading-state">
          <div className="ios-spinner" />
          <p>Loading reports…</p>
        </div>
      </div>
    </LecturerLayout>
  );

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) return (
    <LecturerLayout>
      {topbar}
      <div className="ios-page-content">
        <button className="ios-back-btn" onClick={() => setSelected(null)}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          <div className="ios-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>
              {selected.assignmentName} — {selected.student?.username}
            </div>
            <div className="ios-score-cards">
              <div className="ios-score-card ios-score-card--score">
                <div className="ios-score-card-label">Score</div>
                <div className="ios-score-card-value">{selected.score}%</div>
              </div>
              <div className="ios-score-card ios-score-card--grade">
                <div className="ios-score-card-label">Grade</div>
                <div className="ios-score-card-value">{selected.grade}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Rubric Breakdown</div>
            {(selected.rubricScores || []).map(r => (
              <div key={r.criterion} className="ios-rubric-row">
                <div className="ios-rubric-header">
                  <span className="ios-rubric-criterion">{r.criterion}</span>
                  <span className="ios-rubric-score">{r.score}/{r.maxScore}</span>
                </div>
                <div className="ios-progress-wrap">
                  <div className="ios-progress-fill" style={{ width: `${(r.score / r.maxScore) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="ios-card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Feedback Given</div>
            <div className="ios-feedback-panel">
              {selected.feedback || 'No feedback recorded.'}
            </div>
          </div>
        </div>
      </div>
    </LecturerLayout>
  );

  // ── Main list view ─────────────────────────────────────────────────────────
  return (
    <LecturerLayout>
      {topbar}
      <div className="ios-page-content">

        <div className="ios-stats-grid-3">
          {[
            { label: 'Total Graded',  val: display.length, colorClass: 'stat-blue',  icon: 'icon-graded' },
            { label: 'Class Average', val: `${avg}%`,       colorClass: 'stat-green', icon: 'icon-avg'    },
            { label: 'Highest Score', val: `${highest}%`,   colorClass: 'stat-ocean', icon: 'icon-avg'    },
          ].map(s => (
            <div key={s.label} className={`ios-stat-card ${s.colorClass}`}>
              <div className="ios-stat-icon-wrap">
                <StatIcon name={s.icon} />
              </div>
              <div className="ios-stat-num">{s.val}</div>
              <div className="ios-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="ios-card">
          <div className="ios-card-header">
            <span className="ios-card-title">Graded Submissions</span>
            <span className="ios-count-pill">{display.length}</span>
          </div>

          {display.length === 0 ? (
            <div className="ios-empty-state">
              <svg viewBox="0 0 40 40" fill="none" className="ios-empty-icon">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                <path d="M13 20h14M20 13v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              </svg>
              <p>No graded submissions yet.</p>
            </div>
          ) : (
            <div className="ios-table-wrap">
              <table className="ios-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Assignment</th><th>Module</th>
                    <th>Score</th><th>Grade</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {display.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="ios-student-cell">
                          <div className="ios-table-avatar">{s.student?.username?.[0]?.toUpperCase() || 'S'}</div>
                          <span className="ios-student-name">{s.student?.username || '—'}</span>
                        </div>
                      </td>
                      <td className="ios-assignment-cell">{s.assignmentName}</td>
                      <td><span className="ios-module-tag">{s.moduleName}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="ios-progress-wrap" style={{ width: 50, flex: 'none' }}>
                            <div className="ios-progress-fill" style={{ width: `${s.score || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{s.score || 0}%</span>
                        </div>
                      </td>
                      <td><span className="ios-badge ios-badge--grade">{s.grade || '—'}</span></td>
                      <td>
                        <button className="ios-action-btn ios-action-btn--ghost" onClick={() => setSelected(s)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LecturerLayout>
  );
}

function StatIcon({ name }) {
  const icons = {
    'icon-graded': (
      <svg viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 11l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    'icon-avg': (
      <svg viewBox="0 0 22 22" fill="none">
        <path d="M3 16l5-5 4 4 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
  return icons[name] || null;
}