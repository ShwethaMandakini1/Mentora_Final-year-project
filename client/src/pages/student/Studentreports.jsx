import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { getMySubmissions } from '../../api/api';

// Remove this stub once you add requestRegrade to your api.js
const requestRegrade = (submissionId, data) =>
  Promise.resolve({ data: { success: true } });
import './dashboard.css';

export default function StudentReports() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── Re-grade request state ───────────────────────────────────
  const [showRegradeModal, setShowRegradeModal] = useState(false);
  const [regradeReason, setRegradeReason]       = useState('');
  const [regradeStatus, setRegradeStatus]       = useState(null); // 'loading' | 'success' | 'error'
  const [regradeError, setRegradeError]         = useState('');

  useEffect(() => {
    getMySubmissions()
      .then(r => {
        const graded = (r.data.submissions || []).filter(s => s.status === 'Graded');
        setSubmissions(graded);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avg = submissions.length > 0
    ? Math.round(submissions.reduce((a, s) => a + (s.score || 0), 0) / submissions.length)
    : 0;

  const bestGrade = submissions.length > 0
    ? submissions.reduce((best, s) => {
        const order = ['A+','A','A-','B+','B','B-','C+','C','F'];
        const bi = order.indexOf(best);
        const si = order.indexOf(s.grade);
        return si < bi ? s.grade : best;
      }, submissions[0]?.grade || '—')
    : '—';

  // ── Re-grade submit handler ──────────────────────────────────
  const handleRegradeSubmit = async () => {
    if (!regradeReason.trim()) return;
    setRegradeStatus('loading');
    setRegradeError('');
    try {
      await requestRegrade(selected._id, { reason: regradeReason.trim() });
      setRegradeStatus('success');
      setRegradeReason('');
      // Mark locally so button reflects the new state
      setSelected(prev => ({ ...prev, regradeRequested: true }));
      setSubmissions(prev =>
        prev.map(s => s._id === selected._id ? { ...s, regradeRequested: true } : s)
      );
    } catch (err) {
      setRegradeStatus('error');
      setRegradeError(
        err?.response?.data?.message || 'Failed to submit request. Please try again.'
      );
    }
  };

  const closeModal = () => {
    setShowRegradeModal(false);
    setRegradeReason('');
    setRegradeStatus(null);
    setRegradeError('');
  };

  // ── DETAIL VIEW ──────────────────────────────────────────────
  if (selected) return (
    <StudentLayout>
      <div className="topbar">
        <div className="topbar-left"><h1>Reports</h1><p>Detailed feedback</p></div>
      </div>
      <div className="page-content">
        <button className="back-btn" onClick={() => { setSelected(null); closeModal(); }}>
          ← Back to Reports
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* ── Left: Score + Rubric ── */}
          <div className="card">
            <div className="card-title">{selected.assignmentName}</div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#eff6ff', borderRadius: 12, padding: 18,
                            flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Score</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: '#1f2937' }}>
                  {selected.score != null ? `${selected.score}%` : '—'}
                </div>
              </div>
              <div style={{ background: '#dcfce7', borderRadius: 12, padding: 18,
                            flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Grade</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: '#16a34a' }}>
                  {selected.grade || '—'}
                </div>
              </div>
            </div>

            {selected.rubricScores && selected.rubricScores.length > 0 ? (
              <>
                <div className="card-title">Rubric Breakdown</div>
                {selected.rubricScores.map((r, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                        {r.criterion}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {r.score}/{r.maxScore}
                      </span>
                    </div>
                    <div className="prog-wrap">
                      <div className="prog-fill" style={{
                        width: `${(r.score / r.maxScore) * 100}%`,
                        background: '#22c55e'
                      }}/>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>
                No rubric breakdown available for this submission.
              </div>
            )}

            {/* ── Re-grade Request Button ── */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
              {selected.regradeRequested ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#fefce8', border: '1px solid #fde68a',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e'
                }}>
                  <span>⏳</span>
                  <span>Re-grade request submitted — awaiting lecturer review.</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowRegradeModal(true)}
                  style={{
                    width: '100%', padding: '10px 16px',
                    background: '#fff', border: '1.5px solid #e5e7eb',
                    borderRadius: 8, fontSize: 13, fontWeight: 600,
                    color: '#374151', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                >
                  🔄 Request Re-grade
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Feedback + Info ── */}
          <div className="card">
            <div className="card-title">Lecturer Feedback</div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd',
                          borderRadius: 10, padding: 16, fontSize: 13,
                          color: '#0c4a6e', lineHeight: 1.8 }}>
              {selected.feedback
                ? selected.feedback
                : 'No feedback has been provided for this submission yet.'}
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="card-title">Submission Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['Module',     selected.moduleName  || selected.moduleCode || '—'],
                  ['Assignment', selected.assignmentName || '—'],
                  ['Submitted',  selected.submittedAt
                                   ? new Date(selected.submittedAt).toLocaleDateString('en-US',
                                       { year: 'numeric', month: 'long', day: 'numeric' })
                                   : '—'],
                  ['Graded',     selected.gradedAt
                                   ? new Date(selected.gradedAt).toLocaleDateString('en-US',
                                       { year: 'numeric', month: 'long', day: 'numeric' })
                                   : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                    <span style={{ color: '#6b7280', minWidth: 90 }}>{label}:</span>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Re-grade Modal ── */}
      {showRegradeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 28,
            width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            {regradeStatus === 'success' ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  Request Submitted
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                  Your re-grade request has been sent to the lecturer for review.
                </div>
                <button className="btn-primary" onClick={closeModal}
                  style={{ padding: '9px 28px' }}>
                  Close
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      Request Re-grade
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {selected.assignmentName}
                    </div>
                  </div>
                  <button onClick={closeModal}
                    style={{ background: 'none', border: 'none', fontSize: 20,
                             cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>
                    ✕
                  </button>
                </div>

                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                  Reason for requesting re-grade <span style={{ color: '#ef4444' }}>*</span>
                </div>
                <textarea
                  value={regradeReason}
                  onChange={e => setRegradeReason(e.target.value)}
                  placeholder="Explain why you believe this submission should be re-graded (e.g. grading error, missing rubric criteria, technical issue)..."
                  rows={5}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    border: '1.5px solid #e5e7eb', borderRadius: 8,
                    resize: 'vertical', outline: 'none', color: '#111827',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>
                  {regradeReason.trim().length} / 500 characters
                </div>

                {regradeError && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', background: '#fef2f2',
                    border: '1px solid #fecaca', borderRadius: 6,
                    fontSize: 12, color: '#dc2626'
                  }}>
                    {regradeError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button onClick={closeModal}
                    style={{
                      flex: 1, padding: '9px 0', background: '#f9fafb',
                      border: '1.5px solid #e5e7eb', borderRadius: 8,
                      fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                    }}>
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleRegradeSubmit}
                    disabled={!regradeReason.trim() || regradeStatus === 'loading' || regradeReason.trim().length > 500}
                    style={{ flex: 1, padding: '9px 0', fontSize: 13,
                             opacity: (!regradeReason.trim() || regradeStatus === 'loading') ? 0.6 : 1 }}
                  >
                    {regradeStatus === 'loading' ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );

  // ── LIST VIEW ────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Reports</h1>
          <p>View your graded submission feedback</p>
        </div>
      </div>
      <div className="page-content">

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Graded', val: submissions.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Average Score', val: submissions.length > 0 ? `${avg}%` : '—', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Best Grade',   val: bestGrade, color: '#7c3aed', bg: '#f3e8ff' },
          ].map(s => (
            <div key={s.label} className="card"
              style={{ textAlign: 'center', background: s.bg, boxShadow: 'none' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Graded Submissions</div>

          {loading ? (
            <p style={{ fontSize: 14, color: '#9ca3af', padding: '20px 0' }}>Loading...</p>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <p style={{ fontSize: 14 }}>No graded submissions yet.</p>
              <p style={{ fontSize: 13 }}>Your results will appear here once your lecturer has marked your assignments.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.assignmentName}
                        {s.regradeRequested && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 7px',
                            background: '#fefce8', color: '#92400e',
                            border: '1px solid #fde68a', borderRadius: 20,
                          }}>Re-grade Pending</span>
                        )}
                      </div>
                    </td>
                    <td>{s.moduleName || s.moduleCode || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: '#e5e7eb',
                                      borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${s.score || 0}%`, height: '100%',
                                        background: '#22c55e', borderRadius: 3 }}/>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{s.score || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge graded">{s.grade || '—'}</span>
                    </td>
                    <td>
                      <button className="btn-primary"
                        style={{ padding: '5px 14px', fontSize: 12 }}
                        onClick={() => setSelected(s)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}