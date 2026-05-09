import React, { useState, useEffect, useCallback } from 'react';
import LecturerLayout from './Lecturerlayout';
import { getAllSubmissions, gradeSubmission } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

const BASE = 'http://localhost:5000';
const API_URL = 'import.meta.env.VITE_API_URL';

function getGrade(pct) {
  if (pct >= 90) return 'A+'; if (pct >= 85) return 'A'; if (pct >= 80) return 'A-';
  if (pct >= 75) return 'B+'; if (pct >= 70) return 'B'; if (pct >= 65) return 'B-';
  if (pct >= 60) return 'C+'; if (pct >= 55) return 'C'; return 'F';
}

function gradeColor(g) {
  if (!g) return 'var(--text-muted)';
  if (g.startsWith('A')) return '#15803d'; // Success green
  if (g.startsWith('B')) return 'var(--ocean)'; // Ocean blue
  if (g.startsWith('C')) return '#d97706'; // Warning orange
  return '#dc2626'; // Danger red
}

function buildFileUrl(fp) {
  if (!fp) return null;
  let c = fp.replace(/\\/g, '/');
  if (c.startsWith('http')) return c;
  if (c.includes(':/') || c.includes('/submissions/')) {
    return `${BASE}/submissions/${c.split('/submissions/').pop()}`;
  }
  return `${BASE}/${c.replace(/^\//, '')}`;
}

function getExt(fp) {
  return fp ? fp.split('.').pop().toLowerCase() : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons (SVG replacements for emojis)
// ─────────────────────────────────────────────────────────────────────────────
const Icons = {
  Sparkle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" /></svg>,
  Save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  Publish: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  Sync: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 01-15 6.7L3 16" /></svg>,
  Compare: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="2" x2="12" y2="22"></line><path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"></path><polyline points="5 14 9 10 5 6"></polyline><path d="M19 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"></path><polyline points="19 10 15 14 19 18"></polyline></svg>,
  Document: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  Warning: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="20 6 9 17 4 12" /></svg>,
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  External: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
};

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Table
// ─────────────────────────────────────────────────────────────────────────────
function ComparisonTable({ rubric, lecturerScores, aiBreakdown, finalScores, onFinalChange }) {
  if (!rubric || rubric.length === 0) return (
    <div className="ios-empty-state">
      <Icons.Document />
      <p>No rubric criteria found for this assignment.</p>
    </div>
  );

  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

  const findAiRb = (criterion) => {
    if (!aiBreakdown?.length) return null;
    let match = aiBreakdown.find(rb => rb.criterion === criterion);
    if (match) return match;
    match = aiBreakdown.find(rb => rb.criterion?.toLowerCase() === criterion.toLowerCase());
    if (match) return match;
    const normC = norm(criterion);
    match = aiBreakdown.find(rb => {
      const normRb = norm(rb.criterion);
      return normC.includes(normRb) || normRb.includes(normC) ||
        normC.split(' ').filter(w => w.length > 3).every(w => normRb.includes(w));
    });
    return match || null;
  };

  const rows = rubric.map(r => {
    const lecVal = lecturerScores[r.criterion];
    const lecScore = (lecVal !== undefined && lecVal !== '') ? Number(lecVal) : null;
    const aiRb = findAiRb(r.criterion);
    const aiScore = aiRb ? Number(aiRb.score) : null;
    const max = Number(r.maxScore) || 1;

    const lecPct = lecScore !== null ? Math.round((lecScore / max) * 100) : null;
    const aiPct = aiScore !== null ? Math.round((aiScore / max) * 100) : null;
    const diff = (lecPct !== null && aiPct !== null) ? Math.abs(lecPct - aiPct) : null;
    const agree = diff !== null && diff <= 10;

    const finalVal = finalScores[r.criterion];
    const final = (finalVal !== undefined && finalVal !== '') ? Number(finalVal) : (lecScore ?? 0);

    return { criterion: r.criterion, max, lecScore, aiScore, lecPct, aiPct, diff, agree, final, aiComment: aiRb?.comment || '' };
  });

  const lecTotal = rows.reduce((a, r) => a + (r.lecScore ?? 0), 0);
  const aiTotal = rows.reduce((a, r) => a + (r.aiScore ?? 0), 0);
  const finalTotal = rows.reduce((a, r) => a + r.final, 0);
  const maxTotal = rows.reduce((a, r) => a + r.max, 0);
  const hasAnyLec = rows.some(r => r.lecScore !== null);
  const hasAnyAI = rows.some(r => r.aiScore !== null);

  const MiniBar = ({ value, max, color }) => {
    const w = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div style={{ height: 5, background: 'var(--border-soft)', borderRadius: 99, marginTop: 4, width: 60, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s ease' }} />
      </div>
    );
  };

  return (
    <div>
      <div className="ios-table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <table className="ios-table">
          <thead>
            <tr>
              <th>Criterion</th>
              <th>Lecturer Score</th>
              <th>AI Score</th>
              <th>Match?</th>
              <th>AI Comment</th>
              <th>Final Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: r.agree === false ? 'rgba(220,38,38,0.02)' : 'transparent' }}>
                <td style={{ fontWeight: 600, color: 'var(--navy)', maxWidth: 160 }}>
                  {r.criterion}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>Max: {r.max}</div>
                </td>

                {/* Lecturer Score */}
                <td>
                  {r.lecScore !== null ? (
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ocean)' }}>{r.lecScore}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/{r.max}</span>
                      <MiniBar value={r.lecScore} max={r.max} color="var(--ocean)" />
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{r.lecPct}%</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Not scored</span>
                  )}
                </td>

                {/* AI Score */}
                <td>
                  {r.aiScore !== null ? (
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#7c3aed' }}>{r.aiScore}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/{r.max}</span>
                      <MiniBar value={r.aiScore} max={r.max} color="#7c3aed" />
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{r.aiPct}%</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No AI data
                    </div>
                  )}
                </td>

                {/* Match */}
                <td>
                  {r.diff !== null ? (
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span className={`ios-badge ${r.agree ? 'ios-badge--graded' : 'ios-badge--rejected'}`}>
                        {r.agree ? 'Match' : 'Differs'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.diff}% gap</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>

                {/* AI Comment */}
                <td style={{ maxWidth: 200, fontSize: 12, lineHeight: 1.5 }}>
                  {r.aiComment ? r.aiComment : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>

                {/* Final Score (Editable) */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="number"
                      min="0"
                      max={r.max}
                      className="ios-input"
                      value={finalScores[r.criterion] ?? r.lecScore ?? ''}
                      onChange={e => {
                        let v = e.target.value === '' ? '' : Number(e.target.value);
                        if (v !== '' && v < 0) v = 0;
                        if (v !== '' && v > r.max) v = r.max;
                        onFinalChange(r.criterion, v);
                      }}
                      style={{ width: 64, textAlign: 'center', fontWeight: 700, padding: '6px 8px' }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>/{r.max}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--foam)', borderTop: '2px solid var(--border)' }}>
              <td style={{ fontWeight: 700, color: 'var(--navy)' }}>TOTAL</td>
              <td>
                {hasAnyLec ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ocean)' }}>{lecTotal}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/{maxTotal}</span>
                    <div style={{ fontSize: 11, color: 'var(--ocean)', fontWeight: 600 }}>
                      {getGrade(Math.round((lecTotal / maxTotal) * 100))} ({Math.round((lecTotal / maxTotal) * 100)}%)
                    </div>
                  </>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>Not scored</span>}
              </td>
              <td>
                {hasAnyAI ? (
                  <>
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#7c3aed' }}>{aiTotal}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/{maxTotal}</span>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                      {getGrade(Math.round((aiTotal / maxTotal) * 100))} ({Math.round((aiTotal / maxTotal) * 100)}%)
                    </div>
                  </>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>No AI data</span>}
              </td>
              <td>
                {hasAnyLec && hasAnyAI ? (() => {
                  const d = Math.abs(Math.round((lecTotal / maxTotal) * 100) - Math.round((aiTotal / maxTotal) * 100));
                  return (
                    <span className={`ios-badge ${d <= 10 ? 'ios-badge--graded' : 'ios-badge--rejected'}`}>
                      {d <= 10 ? 'Match' : `${d}% gap`}
                    </span>
                  );
                })() : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
              </td>
              <td style={{ color: 'var(--text-muted)' }}>—</td>
              <td>
                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy)' }}>{finalTotal}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/{maxTotal}</span>
                <div style={{ fontSize: 12, fontWeight: 700, color: gradeColor(getGrade(Math.round((finalTotal / maxTotal) * 100))) }}>
                  {getGrade(Math.round((finalTotal / maxTotal) * 100))} ({Math.round((finalTotal / maxTotal) * 100)}%)
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: 'var(--ocean)', borderRadius: 2 }} /> Lecturer Score
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: '#7c3aed', borderRadius: 2 }} /> AI Score
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: 'var(--foam)', border: '1px solid var(--sky)', borderRadius: 2 }} /> Final Score (editable)
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Bar
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ score, maxScore }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div className="ios-progress-wrap" style={{ height: 6 }}>
        <div className="ios-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 44 }}>{score}/{maxScore}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function LecturerMarking() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lecScores, setLecScores] = useState({});
  const [finalScores, setFinalScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [reanalysing, setReanalysing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mark');

  const fetchSubs = useCallback(async () => {
    try {
      const r = await getAllSubmissions();
      const subs = r.data.submissions || [];
      setSubmissions(subs);
      return subs;
    } catch { return []; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSubs().then(subs => { if (subs.length > 0) initSub(subs[0]); });
  }, []);

  const initSub = (sub) => {
    setSelected(sub);
    setFeedback(sub.feedback || '');
    setMsg({ text: '', type: '' });
    setActiveTab('mark');
    const lec = {};
    if (sub.rubricScores?.length > 0) {
      sub.rubricScores.forEach(r => { lec[r.criterion] = r.score; });
    }
    setLecScores(lec);
    setFinalScores({ ...lec });
  };

  const getRubric = (sub, aiBreakdown) => {
    if (aiBreakdown?.length > 0) {
      return aiBreakdown.map(rb => ({
        criterion: rb.criterion,
        maxScore: rb.maxScore || rb.max_score || rb.max || 10,
      }));
    }
    if (sub?.assignmentRubric?.length > 0) return sub.assignmentRubric;
    if (sub?.rubricScores?.length > 0)
      return sub.rubricScores.map(r => ({ criterion: r.criterion, maxScore: r.maxScore }));
    return [
      { criterion: 'Thesis & Argument Clarity', maxScore: 30 },
      { criterion: 'Evidence & Source Quality', maxScore: 25 },
      { criterion: 'Structure & Organisation', maxScore: 20 },
      { criterion: 'Critical Analysis', maxScore: 15 },
      { criterion: 'Writing Mechanics', maxScore: 10 },
    ];
  };

  const aiAnalysis = selected?.aiAnalysis;
  const hasAIData = aiAnalysis?.status === 'done';

  const aiBreakdownData = aiAnalysis?.rubricBreakdown
    || aiAnalysis?.breakdown
    || aiAnalysis?.criteria
    || aiAnalysis?.scores
    || aiAnalysis?.rubric
    || [];

  const rubric = getRubric(selected, aiBreakdownData);

  const lecTotal = rubric.reduce((a, r) => {
    const v = lecScores[r.criterion];
    return a + ((v !== undefined && v !== '') ? Number(v) : 0);
  }, 0);
  const maxTotal = rubric.reduce((a, r) => a + (Number(r.maxScore) || 0), 0);
  const lecPct = maxTotal > 0 ? Math.round((lecTotal / maxTotal) * 100) : 0;
  const lecGrade = getGrade(lecPct);

  const finalTotal = rubric.reduce((a, r) => {
    const fv = finalScores[r.criterion];
    const lv = lecScores[r.criterion];
    const val = (fv !== undefined && fv !== '') ? Number(fv) : ((lv !== undefined && lv !== '') ? Number(lv) : 0);
    return a + val;
  }, 0);
  const finalPct = maxTotal > 0 ? Math.round((finalTotal / maxTotal) * 100) : 0;
  const finalGrade = getGrade(finalPct);

  const aiTotal = hasAIData
    ? aiBreakdownData.reduce((a, rb) => a + (Number(rb.score) || 0), 0)
    : null;
  const aiPct = (aiTotal !== null && maxTotal > 0) ? Math.round((aiTotal / maxTotal) * 100) : null;

  const applyAIScoresToFinal = () => {
    if (!hasAIData) {
      reanalyse(true);
      return;
    }
    const normStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const findAiScore = (criterion) => {
      const bd = aiBreakdownData;
      let match = bd.find(rb => rb.criterion === criterion);
      if (!match) match = bd.find(rb => rb.criterion?.toLowerCase() === criterion.toLowerCase());
      if (!match) {
        const nc = normStr(criterion);
        match = bd.find(rb => {
          const nr = normStr(rb.criterion);
          return nc.includes(nr) || nr.includes(nc) ||
            nc.split(' ').filter(w => w.length > 3).every(w => nr.includes(w));
        });
      }
      return match ? match.score : undefined;
    };
    const aiMap = {};
    rubric.forEach(r => {
      const score = findAiScore(r.criterion);
      if (score !== undefined) aiMap[r.criterion] = score;
    });
    setFinalScores(aiMap);
    setMsg({ text: 'AI scores applied to Final column. Your lecturer scores are unchanged. Adjust as needed.', type: 'info' });
    setActiveTab('compare');
  };

  const reanalyse = async (autoApply = false) => {
    if (!selected) return;
    setReanalysing(true);
    setMsg({ text: 'Running AI analysis... This may take up to 30 seconds.', type: 'info' });
    try {
      await API.post(`/submissions/${selected._id}/reanalyse`);
      let attempts = 0;
      const poll = async () => {
        attempts++;
        const subs = await fetchSubs();
        const refreshed = subs.find(s => s._id === selected._id);
        if (refreshed?.aiAnalysis?.status === 'done') {
          initSub(refreshed);
          const rAI = refreshed.aiAnalysis;
          const rBD = rAI?.rubricBreakdown || rAI?.breakdown || rAI?.criteria || rAI?.scores || rAI?.rubric || [];
          if (autoApply && rBD.length > 0) {
            const aiMap = {};
            rBD.forEach(rb => { aiMap[rb.criterion] = rb.score; });
            setFinalScores(aiMap);
            setMsg({ text: 'AI analysis complete! AI scores applied to Final column. Adjust as needed.', type: 'success' });
          } else {
            setMsg({ text: 'AI analysis complete!', type: 'success' });
          }
          setReanalysing(false);
        } else if (refreshed?.aiAnalysis?.status === 'failed') {
          setMsg({ text: 'AI analysis failed. Please try again.', type: 'error' });
          setReanalysing(false);
        } else if (attempts < 10) {
          setTimeout(poll, 5000);
        } else {
          setMsg({ text: 'Analysis is taking longer than expected. Try refreshing the page.', type: 'error' });
          setReanalysing(false);
        }
      };
      setTimeout(poll, 5000);
    } catch {
      setMsg({ text: 'Failed to start AI analysis.', type: 'error' });
      setReanalysing(false);
    }
  };

  const generateFeedback = async () => {
    setLoadingAI(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ai/marking-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentName: selected?.student?.username || 'Unknown',
          assignmentName: selected?.assignmentName || 'Unknown',
          moduleName: selected?.moduleName || 'Unknown',
          rubric, scores: finalScores, pct: finalPct, grade: finalGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.feedback);
        setMsg({ text: 'AI feedback generated based on final scores.', type: 'success' });
      } else {
        setMsg({ text: data.message || 'Failed to generate feedback.', type: 'error' });
      }
    } catch {
      setMsg({ text: 'Could not connect to server.', type: 'error' });
    }
    setLoadingAI(false);
  };

  const save = async (publish = false) => {
    if (!selected || !/^[a-f\d]{24}$/i.test(selected._id)) return;
    publish ? setPublishing(true) : setSaving(true);
    setMsg({ text: '', type: '' });
    try {
      const rubricScores = rubric.map(r => ({
        criterion: r.criterion,
        score: Number(finalScores[r.criterion]) || 0,
        maxScore: Number(r.maxScore) || 0,
        percentage: r.maxScore > 0 ? Math.round(((Number(finalScores[r.criterion]) || 0) / r.maxScore) * 100) : 0,
      }));
      await gradeSubmission(selected._id, {
        score: finalPct, grade: finalGrade, feedback, rubricScores,
        ...(publish && { published: true }),
      });
      setSubmissions(prev => prev.map(s =>
        s._id === selected._id
          ? { ...s, score: finalPct, grade: finalGrade, status: 'Graded', feedback, rubricScores }
          : s
      ));
      setSelected(prev => ({ ...prev, score: finalPct, grade: finalGrade, status: 'Graded', feedback }));
      setMsg({ text: publish ? 'Marks published to student!' : 'Saved successfully!', type: 'success' });
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Save failed.', type: 'error' });
    }
    publish ? setPublishing(false) : setSaving(false);
  };

  const fileUrl = selected?.filePath ? buildFileUrl(selected.filePath) : null;
  const ext = getExt(selected?.filePath || '');
  const viewerUrl = fileUrl
    ? (ext === 'docx' || ext === 'doc'
      ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
      : fileUrl)
    : null;

  const TABS = [
    { key: 'mark', label: 'Manual Marking' },
    { key: 'compare', label: 'Comparison Table' },
    { key: 'analysis', label: `AI Analysis ${hasAIData ? '✓' : ''}` },
  ];

  return (
    <LecturerLayout>
      <div className="ios-topbar">
        <div className="ios-topbar-left">
          <h1 className="ios-page-title">Marking & Feedback</h1>
          <p className="ios-page-date">Manually mark submissions, review AI analysis, then decide final scores</p>
        </div>
      </div>

      <div className="ios-page-content">
        {loading ? (
          <div className="ios-loading-state">
            <div className="ios-spinner"></div>
            <p>Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="ios-empty-state" style={{ marginTop: '40px' }}>
            <Icons.Document />
            <p>No submissions found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

            {/* ══ LEFT PANEL ══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="ios-section-card">
                <div className="ios-section-title">Student Submission</div>

                <select
                  className="ios-input"
                  value={selected?._id || ''}
                  onChange={e => {
                    const sub = submissions.find(s => s._id === e.target.value);
                    if (sub) initSub(sub);
                  }}
                  style={{ maxWidth: '100%', marginBottom: '16px', cursor: 'pointer' }}
                >
                  {submissions.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.student?.username} — {s.assignmentName} ({s.status})
                    </option>
                  ))}
                </select>

                <div style={{ background: 'var(--foam)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>{selected?.assignmentName}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Student: <strong>{selected?.student?.username}</strong>
                    {selected?.moduleCode && <> · {selected.moduleCode} — {selected.moduleName}</>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                    Submitted: {selected?.submittedAt ? new Date(selected.submittedAt).toLocaleString() : '—'}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`ios-badge ${selected?.status === 'Graded' ? 'ios-badge--graded' : 'ios-badge--pending'}`}>
                      {selected?.status || 'Pending'}
                    </span>
                    {hasAIData && (
                      <span className="ios-badge ios-badge--pending" style={{ background: 'rgba(0,150,199,0.10)', color: 'var(--sky)' }}>
                        <Icons.Sparkle /> <span style={{ marginLeft: 4 }}>AI: {aiAnalysis.predictedScore}% ({aiAnalysis.predictedGrade})</span>
                      </span>
                    )}
                  </div>
                </div>

                {viewerUrl ? (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '12px', height: 320 }}>
                    <iframe src={viewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Submission" />
                  </div>
                ) : (
                  <div className="ios-empty-state" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', height: 120, marginBottom: '12px', padding: '20px' }}>
                    <Icons.Document />
                    <p>{selected?.fileName || 'No file attached'}</p>
                  </div>
                )}

                {fileUrl && (
                  <a
                    href={ext === 'docx' || ext === 'doc' ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=false` : fileUrl}
                    target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, fontWeight: 500, color: 'var(--ocean)', textDecoration: 'none' }}
                  >
                    <Icons.External /> Open full file in new tab
                  </a>
                )}

                {/* Score summary — 3 fully independent sources */}
                <div className="ios-stats-grid-3">
                  {[
                    { label: 'Lecturer', pct: lecPct, grade: lecGrade, color: 'var(--ocean)', bg: 'var(--foam)' },
                    { label: 'AI', pct: aiPct, grade: aiPct !== null ? getGrade(aiPct) : '—', color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Final', pct: finalPct, grade: finalGrade, color: '#16a34a', bg: '#f0fdf4' },
                  ].map(item => (
                    <div key={item.label} className="ios-score-card" style={{ background: item.bg }}>
                      <div className="ios-score-card-label">{item.label}</div>
                      <div className="ios-score-card-value" style={{ color: item.color, fontSize: 24 }}>
                        {item.pct !== null ? `${item.pct}%` : '—'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.grade}</div>
                    </div>
                  ))}
                </div>

                {msg.text && (
                  <div className={`ios-alert ios-alert--${msg.type === 'error' ? 'error' : msg.type === 'success' ? 'success' : 'info'}`} style={{ marginTop: 16, marginBottom: 0 }}>
                    {msg.text}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                  <button onClick={() => save(false)} disabled={saving} className="ios-action-btn" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
                      {saving ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icons.Save />}
                      {saving ? 'Saving...' : 'Save Marks & Feedback'}
                    </div>
                  </button>
                  <button onClick={() => save(true)} disabled={publishing} className="ios-action-btn ios-action-btn--primary" style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13 }}>
                      {publishing ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icons.Publish />}
                      {publishing ? 'Publishing...' : 'Publish to Student'}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ══ RIGHT PANEL ══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* iOS Style Filter Pills (Tabs) */}
              <div className="ios-filter-row" style={{ marginBottom: '4px' }}>
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`ios-filter-pill ${activeTab === key ? 'ios-filter-pill--active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Manual Marking tab ── */}
              {activeTab === 'mark' && (
                <>
                  <div className="ios-section-card">
                    <div style={{ marginBottom: 20 }}>
                      <div className="ios-section-title" style={{ marginBottom: 4 }}>Manual Rubric Scoring</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Enter your own scores. AI suggestions shown below each criterion for reference only.
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {rubric.map(r => {
                        const normStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
                        const aiRb = aiBreakdownData?.find(rb => {
                          if (rb.criterion === r.criterion) return true;
                          if (rb.criterion?.toLowerCase() === r.criterion?.toLowerCase()) return true;
                          const nc = normStr(r.criterion), nr = normStr(rb.criterion);
                          return nc.includes(nr) || nr.includes(nc) ||
                            nc.split(' ').filter(w => w.length > 3).every(w => nr.includes(w));
                        });
                        const aiScore = aiRb?.score;
                        const val = lecScores[r.criterion];
                        const pct = (val !== undefined && val !== '' && Number(r.maxScore) > 0)
                          ? Math.round((Number(val) / Number(r.maxScore)) * 100) : null;

                        return (
                          <div key={r.criterion} style={{ borderLeft: '3px solid var(--border)', paddingLeft: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
                                  {r.criterion}
                                  <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 6, fontWeight: 400 }}>/ {r.maxScore}</span>
                                </div>
                                {aiScore !== undefined ? (
                                  <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Icons.Sparkle /> AI suggests: <strong>{aiScore}</strong> / {r.maxScore}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                                    No AI data yet
                                  </div>
                                )}
                              </div>

                              <input
                                type="number" min="0" max={r.maxScore}
                                placeholder="—"
                                className="ios-input"
                                value={val ?? ''}
                                onChange={e => {
                                  let v = e.target.value === '' ? '' : Number(e.target.value);
                                  if (v !== '' && v < 0) v = 0;
                                  if (v !== '' && v > r.maxScore) v = r.maxScore;
                                  setLecScores(prev => ({ ...prev, [r.criterion]: v }));
                                  setFinalScores(prev => ({ ...prev, [r.criterion]: v }));
                                }}
                                style={{ width: 80, padding: '10px', fontSize: 16, fontWeight: 700, textAlign: 'center' }}
                              />
                            </div>

                            {pct !== null && <ScoreBar score={Number(val)} maxScore={Number(r.maxScore)} />}

                            {aiRb?.comment && (
                              <div className="ios-feedback-panel" style={{ marginTop: 10, fontStyle: 'italic' }}>
                                "{aiRb.comment}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--foam)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Lecturer Total</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ocean)' }}>{lecTotal}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {maxTotal}</span>
                        <span className="ios-badge ios-badge--pending" style={{ background: 'var(--card-bg)', color: 'var(--ocean)' }}>
                          {lecGrade} ({lecPct}%)
                        </span>
                      </div>
                    </div>

                    <button onClick={() => setActiveTab('compare')} className="ios-action-btn ios-action-btn--ghost" style={{ width: '100%', marginTop: 16, padding: '12px' }}>
                      View Comparison Table →
                    </button>
                  </div>

                  <div className="ios-section-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div className="ios-section-title" style={{ marginBottom: 0 }}>Feedback for Student</div>
                      <button onClick={generateFeedback} disabled={loadingAI} className="ios-action-btn ios-action-btn--primary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {loadingAI ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Icons.Sparkle />}
                          {loadingAI ? 'Generating...' : 'Generate AI Feedback'}
                        </div>
                      </button>
                    </div>
                    <textarea
                      className="ios-textarea"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Write detailed feedback here, or click 'Generate AI Feedback' to auto-generate based on the final scores..."
                      rows={8}
                    />
                  </div>
                </>
              )}

              {/* ── Comparison Table tab ── */}
              {activeTab === 'compare' && (
                <div className="ios-section-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div className="ios-section-title" style={{ marginBottom: 4 }}>Lecturer vs AI Comparison</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Review scores side-by-side. Edit <strong>Final Score</strong> to set the student's final mark.
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={applyAIScoresToFinal}
                        disabled={reanalysing}
                        className="ios-action-btn"
                        style={{ background: reanalysing ? 'var(--border)' : '#7c3aed', color: reanalysing ? 'var(--text-muted)' : '#fff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {reanalysing ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : (hasAIData ? <Icons.Sparkle /> : <Icons.Sync />)}
                          {reanalysing ? 'Running AI...' : hasAIData ? 'Use AI Scores' : 'Run & Apply AI'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {!hasAIData && (
                    <div className="ios-alert ios-alert--warn">
                      <strong>AI analysis not available yet.</strong> Click "Run AI Analysis" to start it. Your lecturer scores are still visible and usable.
                    </div>
                  )}

                  <ComparisonTable
                    rubric={rubric}
                    lecturerScores={lecScores}
                    aiBreakdown={aiBreakdownData}
                    finalScores={finalScores}
                    onFinalChange={(criterion, val) => setFinalScores(prev => ({ ...prev, [criterion]: val }))}
                  />

                  <div style={{ marginTop: 24, padding: '16px 20px', background: '#f0fdf4', borderRadius: 'var(--radius-lg)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Final Decision</div>
                      <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>Based on the Final Score column</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>{finalTotal}</span>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/ {maxTotal}</span>
                      <span className="ios-badge ios-badge--graded" style={{ padding: '6px 14px', fontSize: 14, background: '#dcfce7' }}>
                        {finalGrade} ({finalPct}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button onClick={() => setActiveTab('mark')} className="ios-action-btn ios-action-btn--ghost" style={{ flex: 1, padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icons.ArrowLeft /> Back</div>
                    </button>
                    <button onClick={() => save(false)} disabled={saving} className="ios-action-btn" style={{ flex: 1, padding: '12px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                      {saving ? 'Saving...' : 'Save Final Marks'}
                    </button>
                    <button onClick={() => save(true)} disabled={publishing} className="ios-action-btn ios-action-btn--primary" style={{ flex: 1, padding: '12px' }}>
                      {publishing ? 'Publishing...' : 'Publish to Student'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── AI Analysis tab ── */}
              {activeTab === 'analysis' && (
                <div className="ios-section-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div className="ios-section-title" style={{ marginBottom: 0 }}>
                      <Icons.Sparkle /> <span style={{ marginLeft: 8 }}>AI Analysis Report</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasAIData && (
                        <button onClick={applyAIScoresToFinal} className="ios-action-btn" style={{ background: '#7c3aed', color: '#fff' }}>
                          Apply AI to Final
                        </button>
                      )}
                      <button onClick={reanalyse} disabled={reanalysing} className="ios-action-btn ios-action-btn--ghost">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {reanalysing ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icons.Sync />}
                          Re-analyse
                        </div>
                      </button>
                    </div>
                  </div>

                  {!aiAnalysis || aiAnalysis.status === 'pending' ? (
                    <div className="ios-loading-state" style={{ padding: '60px 0' }}>
                      <div className="ios-spinner"></div>
                      <p>AI analysis running in background...<br /><span style={{ fontSize: 11 }}>Refresh in a few seconds or click Re-analyse</span></p>
                    </div>
                  ) : aiAnalysis.status === 'failed' ? (
                    <div className="ios-alert ios-alert--error" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}><Icons.Warning /> Analysis Failed</div>
                      <div>{aiAnalysis.message}</div>
                      <button onClick={reanalyse} disabled={reanalysing} className="ios-action-btn ios-action-btn--primary" style={{ alignSelf: 'flex-start' }}>
                        {reanalysing ? 'Starting...' : 'Re-analyse Now'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="ios-ai-stat" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}>
                          <div className="ios-ai-stat-num" style={{ color: '#7c3aed', fontSize: 36 }}>{aiAnalysis.predictedScore}%</div>
                          <div className="ios-ai-stat-label">AI Predicted Score</div>
                        </div>
                        <div className="ios-ai-stat" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}>
                          <div className="ios-ai-stat-num" style={{ color: gradeColor(aiAnalysis.predictedGrade), fontSize: 36 }}>{aiAnalysis.predictedGrade}</div>
                          <div className="ios-ai-stat-label">AI Predicted Grade</div>
                        </div>
                      </div>

                      {aiAnalysis.summary && (
                        <div className="ios-feedback-panel" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Summary</div>
                          <div style={{ color: '#0c4a6e' }}>{aiAnalysis.summary}</div>
                        </div>
                      )}

                      {aiBreakdownData.length > 0 && (
                        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Criterion Breakdown</div>
                          {aiBreakdownData.map((rb, i) => {
                            const p = rb.maxScore > 0 ? Math.round((rb.score / rb.maxScore) * 100) : 0;
                            const badge = p >= 70 ? { label: 'Met', c: 'ios-badge--graded' } : p >= 40 ? { label: 'Partial', c: 'ios-badge--pending' } : { label: 'Not Met', c: 'ios-badge--rejected' };
                            return (
                              <div key={i} style={{ borderBottom: i < aiBreakdownData.length - 1 ? '1px solid var(--border-soft)' : 'none', paddingBottom: i < aiBreakdownData.length - 1 ? 16 : 0, marginBottom: i < aiBreakdownData.length - 1 ? 16 : 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', flex: 1 }}>{rb.criterion}</span>
                                  <span className={`ios-badge ${badge.c}`}>{badge.label}</span>
                                  <div style={{ width: 120 }}>
                                    <ScoreBar score={rb.score} maxScore={rb.maxScore} />
                                  </div>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rb.comment}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {aiAnalysis.strengths?.length > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Icons.Check /> Strengths
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 20, color: '#166534', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {aiAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}

                      {aiAnalysis.missingParts?.length > 0 && (
                        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#ea580c', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Icons.Warning /> Missing / Weak Areas
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {aiAnalysis.missingParts.map((mp, i) => (
                              <div key={i}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, color: '#9a3412', fontSize: 14 }}>{mp.part}</span>
                                  <span className={`ios-badge ${mp.importance === 'High' ? 'ios-badge--rejected' : mp.importance === 'Medium' ? 'ios-badge--pending' : ''}`} style={{ padding: '2px 8px', fontSize: 10 }}>
                                    {mp.importance}
                                  </span>
                                </div>
                                <div style={{ color: '#ea580c', fontSize: 13 }}>{mp.suggestion}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={() => setActiveTab('compare')} className="ios-action-btn" style={{ width: '100%', padding: '14px', background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #e9d5ff', marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14 }}>
                          <Icons.Compare /> Compare with My Scores
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LecturerLayout>
  );
}