import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { getMySubmissions, requestRegrade } from '../../api/api';
import './dashboard.css';

const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

const getGradeColor = (grade) => {
  if (!grade) return '#64748b';
  if (grade.startsWith('A')) return '#16a34a';
  if (grade.startsWith('B')) return '#2563eb';
  if (grade.startsWith('C')) return '#d97706';
  if (grade.startsWith('D')) return '#ea580c';
  return '#dc2626';
};

const getScoreColor = (score) => {
  const n = Number(score) || 0;
  if (n >= 80) return '#16a34a';
  if (n >= 65) return '#2563eb';
  if (n >= 50) return '#d97706';
  return '#dc2626';
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getShortText = (text, limit = 90) => {
  if (!text) return 'No feedback has been provided.';
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const getDisplayRubricScores = (submission) => {
  const saved = Array.isArray(submission?.rubricScores) ? submission.rubricScores : [];
  const assignmentRubric = Array.isArray(submission?.assignmentRubric) ? submission.assignmentRubric : [];

  if (saved.length > 0) {
    return saved.map((r) => ({
      criterion: r.criterion || '',
      score: Number(r.score) || 0,
      maxScore: Number(r.maxScore) || 0,
      percentage: r.maxScore > 0 ? Math.round((Number(r.score) / Number(r.maxScore)) * 100) : 0,
      marksEntered: true,
    }));
  }

  return assignmentRubric.map((r) => ({
    criterion: r.criterion || r.title || '',
    score: 0,
    maxScore: Number(r.maxScore) || Number(r.marks) || 0,
    percentage: 0,
    marksEntered: false,
  }));
};

function StatCard({ label, value, sub, icon, bg, color }) {
  return (
    <div
      className="card"
      style={{
        background: bg,
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: 'none',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 5, fontWeight: 600 }}>
            {label}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      style={{
        height: 8,
        background: '#e5e7eb',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${safe}%`,
          height: '100%',
          background: color || getScoreColor(safe),
          borderRadius: 999,
        }}
      />
    </div>
  );
}

function RubricMini({ rubricScores }) {
  if (!rubricScores || rubricScores.length === 0) {
    return (
      <div
        style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: 12,
          padding: 14,
          color: '#94a3b8',
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        No rubric breakdown available.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rubricScores.slice(0, 3).map((r, i) => {
        const percent = r.maxScore > 0 ? Math.round((Number(r.score) / Number(r.maxScore)) * 100) : 0;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
                {r.criterion || `Criterion ${i + 1}`}
              </span>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                {r.score}/{r.maxScore}
              </span>
            </div>
            <ProgressBar value={percent} />
          </div>
        );
      })}

      {rubricScores.length > 3 && (
        <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
          +{rubricScores.length - 3} more criteria
        </div>
      )}
    </div>
  );
}

export default function StudentReports() {
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showRegradeModal, setShowRegradeModal] = useState(false);
  const [regradeReason, setRegradeReason] = useState('');
  const [regradeStatus, setRegradeStatus] = useState(null);
  const [regradeError, setRegradeError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const r = await getMySubmissions();
      const graded = (r.data.submissions || [])
        .filter((s) => s.status === 'Graded' && s.published !== false)
        .sort((a, b) => new Date(b.gradedAt || b.updatedAt || b.submittedAt) - new Date(a.gradedAt || a.updatedAt || a.submittedAt));
      setSubmissions(graded);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const avg = submissions.length > 0
    ? Math.round(submissions.reduce((a, s) => a + (Number(s.score) || 0), 0) / submissions.length)
    : 0;

  const bestGrade = submissions.length > 0
    ? submissions.reduce((best, s) => {
        const bi = gradeOrder.indexOf(best);
        const si = gradeOrder.indexOf(s.grade);
        if (si === -1) return best;
        if (bi === -1) return s.grade;
        return si < bi ? s.grade : best;
      }, submissions[0]?.grade || '—')
    : '—';

  const highestScore = submissions.length > 0
    ? Math.max(...submissions.map((s) => Number(s.score) || 0))
    : 0;

  const regradePending = submissions.filter((s) => s.regrade?.status === 'pending').length;

  const moduleGroups = submissions.reduce((acc, s) => {
    const key = s.moduleCode || s.moduleName || 'Unknown';
    if (!acc[key]) {
      acc[key] = {
        moduleCode: s.moduleCode || key,
        moduleName: s.moduleName || key,
        count: 0,
        total: 0,
      };
    }
    acc[key].count += 1;
    acc[key].total += Number(s.score) || 0;
    return acc;
  }, {});

  const modules = Object.values(moduleGroups).map((m) => ({
    ...m,
    average: m.count > 0 ? Math.round(m.total / m.count) : 0,
  }));

  const handleRegradeSubmit = async () => {
    if (!regradeReason.trim() || !selected) return;

    setRegradeStatus('loading');
    setRegradeError('');

    try {
      await requestRegrade(selected._id, { reason: regradeReason.trim() });

      const pendingRegrade = {
        status: 'pending',
        reason: regradeReason.trim(),
        requestedAt: new Date().toISOString(),
      };

      setRegradeStatus('success');
      setRegradeReason('');

      setSelected((prev) => ({
        ...prev,
        regrade: pendingRegrade,
      }));

      setSubmissions((prev) =>
        prev.map((s) =>
          s._id === selected._id ? { ...s, regrade: pendingRegrade } : s
        )
      );
    } catch (err) {
      setRegradeStatus('error');
      setRegradeError(err?.response?.data?.message || 'Failed to submit request. Please try again.');
    }
  };

  const closeModal = () => {
    setShowRegradeModal(false);
    setRegradeReason('');
    setRegradeStatus(null);
    setRegradeError('');
  };

  if (selected) {
    const gradeColor = getGradeColor(selected.grade);
    const scoreColor = getScoreColor(selected.score);
    const rubricScores = getDisplayRubricScores(selected);
    const ai = selected.aiAnalysis;
    const totalRubric = rubricScores.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
    const totalMax = rubricScores.reduce((sum, r) => sum + (Number(r.maxScore) || 0), 0);

    return (
      <StudentLayout>
        <div className="topbar">
          <div className="topbar-left">
            <h1>Reports</h1>
            <p>Detailed assignment performance report</p>
          </div>
        </div>

        <div className="page-content">
          <button
            className="back-btn"
            onClick={() => {
              setSelected(null);
              closeModal();
            }}
            style={{ marginBottom: 18 }}
          >
            ← Back to Reports
          </button>

          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a, #075985)',
              borderRadius: 18,
              padding: '24px 28px',
              color: '#fff',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>
                {selected.moduleCode || selected.moduleName || 'Module'}
              </div>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
                {selected.assignmentName}
              </h2>
              <p style={{ margin: '8px 0 0', opacity: 0.78, fontSize: 14 }}>
                Submitted {formatDate(selected.submittedAt)} · Graded {formatDate(selected.gradedAt)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14 }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 16,
                  padding: '16px 24px',
                  textAlign: 'center',
                  minWidth: 110,
                }}
              >
                <div style={{ fontSize: 38, fontWeight: 900 }}>{selected.score ?? 0}%</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Score</div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 16,
                  padding: '16px 24px',
                  textAlign: 'center',
                  minWidth: 110,
                }}
              >
                <div style={{ fontSize: 38, fontWeight: 900 }}>{selected.grade || '—'}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Grade</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-title">Rubric Criteria Marks</div>

                {rubricScores.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {rubricScores.map((r, i) => {
                      const percent = r.maxScore > 0 ? Math.round((Number(r.score) / Number(r.maxScore)) * 100) : 0;
                      const c = getScoreColor(percent);
                      return (
                        <div
                          key={i}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 14,
                            padding: 16,
                            background: '#fff',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 10 }}>
                            <div>
                              <div style={{ fontWeight: 800, color: '#111827', fontSize: 14 }}>
                                {r.criterion || `Criterion ${i + 1}`}
                              </div>
                              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                                {percent}% achievement
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: c, fontWeight: 900, fontSize: 20 }}>
                                {r.score}/{r.maxScore}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: 11 }}>marks</div>
                            </div>
                          </div>
                          <ProgressBar value={percent} color={c} />
                        </div>
                      );
                    })}

                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 14,
                        padding: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#166534' }}>Total Rubric Marks</span>
                      <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 22 }}>
                        {totalRubric}/{totalMax}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 28,
                      border: '1px dashed #cbd5e1',
                      borderRadius: 14,
                      textAlign: 'center',
                      color: '#64748b',
                      background: '#f8fafc',
                    }}
                  >
                    No rubric criteria/marks are available for this assignment yet.
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-title">Lecturer Feedback</div>
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 18,
                    color: '#334155',
                    fontSize: 14,
                    lineHeight: 1.8,
                    minHeight: 90,
                  }}
                >
                  {selected.feedback || 'No feedback has been provided for this submission yet.'}
                </div>
              </div>

              {ai?.status === 'done' && (
                <div className="card">
                  <div className="card-title">AI Report Summary</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                    <div
                      style={{
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        borderRadius: 14,
                        padding: 18,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 30, fontWeight: 900, color: '#4f46e5' }}>
                        {ai.predictedScore ?? '—'}%
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>AI Predicted Score</div>
                    </div>

                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 14,
                        padding: 18,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 30, fontWeight: 900, color: getGradeColor(ai.predictedGrade) }}>
                        {ai.predictedGrade ?? '—'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>AI Predicted Grade</div>
                    </div>
                  </div>

                  {ai.summary && (
                    <div
                      style={{
                        background: '#f8fafc',
                        borderRadius: 14,
                        padding: 16,
                        color: '#334155',
                        lineHeight: 1.7,
                        fontSize: 14,
                      }}
                    >
                      {ai.summary}
                    </div>
                  )}

                  {ai.strengths?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 800, color: '#166534', marginBottom: 8, fontSize: 13 }}>
                        Strengths
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', lineHeight: 1.8 }}>
                        {ai.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {ai.enhancements?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 800, color: '#92400e', marginBottom: 8, fontSize: 13 }}>
                        Improvement Suggestions
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ai.enhancements.map((e, i) => (
                          <div
                            key={i}
                            style={{
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: 12,
                              padding: 12,
                              fontSize: 13,
                              color: '#78350f',
                            }}
                          >
                            <strong>{e.area || 'Area'}:</strong> {e.suggestion || e.current}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <div className="card-title">Submission Info</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {[
                    ['Module', selected.moduleName || selected.moduleCode || '—'],
                    ['Assignment', selected.assignmentName || '—'],
                    ['Submitted', formatDate(selected.submittedAt)],
                    ['Graded', formatDate(selected.gradedAt)],
                    ['Status', selected.status || '—'],
                    ['File', selected.fileName || '—'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 14,
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: 10,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ color: '#111827', fontWeight: 700, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Performance Insight</div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Score Progress</span>
                    <strong style={{ color: scoreColor }}>{selected.score || 0}%</strong>
                  </div>
                  <ProgressBar value={selected.score || 0} color={scoreColor} />
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 13,
                    color: '#475569',
                    lineHeight: 1.6,
                  }}
                >
                  {(Number(selected.score) || 0) >= 80
                    ? 'Excellent work. Keep maintaining this standard and continue improving weaker rubric areas.'
                    : (Number(selected.score) || 0) >= 65
                      ? 'Good performance. Review lecturer feedback and focus on rubric criteria with lower marks.'
                      : (Number(selected.score) || 0) >= 50
                        ? 'You passed, but there is room for improvement. Recheck the feedback and missing rubric requirements.'
                        : 'This submission needs serious improvement. Review feedback carefully and ask for guidance if needed.'}
                </div>
              </div>

              <div className="card">
                <div className="card-title">Re-grade Request</div>

                {selected.regrade?.status === 'pending' ? (
                  <div
                    style={{
                      background: '#fefce8',
                      border: '1px solid #fde68a',
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 13,
                      color: '#92400e',
                      lineHeight: 1.6,
                    }}
                  >
                    ⏳ Re-grade request submitted and waiting for lecturer review.
                  </div>
                ) : selected.regrade?.status === 'accepted' ? (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 13,
                      color: '#166534',
                      lineHeight: 1.6,
                    }}
                  >
                    ✅ Your re-grade request has been accepted.
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRegradeModal(true)}
                    className="btn-outline"
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    Request Re-grade
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showRegradeModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 28,
                width: '100%',
                maxWidth: 460,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}
            >
              {regradeStatus === 'success' ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                    Request Submitted
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                    Your re-grade request has been sent to the lecturer for review.
                  </div>
                  <button className="btn-primary" onClick={closeModal} style={{ padding: '9px 28px' }}>
                    Close
                  </button>
                </div>
              ) : (
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
                    <button
                      onClick={closeModal}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 20,
                        cursor: 'pointer',
                        color: '#9ca3af',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 500 }}>
                    Reason for requesting re-grade <span style={{ color: '#ef4444' }}>*</span>
                  </div>

                  <textarea
                    value={regradeReason}
                    onChange={(e) => setRegradeReason(e.target.value)}
                    placeholder="Explain why you believe this submission should be re-graded..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: 13,
                      border: '1.5px solid #e5e7eb',
                      borderRadius: 8,
                      resize: 'vertical',
                      outline: 'none',
                      color: '#111827',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />

                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>
                    {regradeReason.trim().length} / 500 characters
                  </div>

                  {regradeError && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#dc2626',
                      }}
                    >
                      {regradeError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <button
                      onClick={closeModal}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        background: '#f9fafb',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleRegradeSubmit}
                      disabled={!regradeReason.trim() || regradeStatus === 'loading' || regradeReason.trim().length > 500}
                      style={{
                        flex: 1,
                        padding: '9px 0',
                        fontSize: 13,
                        opacity: (!regradeReason.trim() || regradeStatus === 'loading') ? 0.6 : 1,
                      }}
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
  }

  return (
    <StudentLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Reports</h1>
          <p>View all marks, rubric results, feedback, and performance insights</p>
        </div>
      </div>

      <div className="page-content">
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
            border: '1px solid #bfdbfe',
            borderRadius: 18,
            padding: '24px 28px',
            marginBottom: 22,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
                Academic Performance Report
              </h2>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
                A complete overview of your graded submissions, feedback, rubric marks, and improvement areas.
              </p>
            </div>

            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: '14px 18px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                minWidth: 120,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: getScoreColor(avg) }}>
                {avg || '—'}{avg ? '%' : ''}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Overall Average</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 22,
          }}
        >
          <StatCard
            label="Total Graded"
            value={submissions.length}
            sub="Marked assignments"
            icon="📄"
            bg="#eff6ff"
            color="#2563eb"
          />
          <StatCard
            label="Average Score"
            value={submissions.length > 0 ? `${avg}%` : '—'}
            sub="Across all submissions"
            icon="📊"
            bg="#f0fdf4"
            color="#16a34a"
          />
          <StatCard
            label="Best Grade"
            value={bestGrade}
            sub={`Highest score: ${highestScore || '—'}${highestScore ? '%' : ''}`}
            icon="🏆"
            bg="#fefce8"
            color="#d97706"
          />
          <StatCard
            label="Re-grade Pending"
            value={regradePending}
            sub="Awaiting lecturer review"
            icon="🔄"
            bg="#fff7ed"
            color="#ea580c"
          />
        </div>

        {modules.length > 0 && (
          <div className="card" style={{ marginBottom: 22 }}>
            <div className="card-title">Module Performance</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {modules.map((m) => (
                <div
                  key={m.moduleCode}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    padding: 16,
                    background: '#fff',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                    {m.moduleCode}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
                    {m.moduleName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{m.count} submission{m.count === 1 ? '' : 's'}</span>
                    <strong style={{ color: getScoreColor(m.average) }}>{m.average}%</strong>
                  </div>
                  <ProgressBar value={m.average} />
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>
            Loading reports...
          </div>
        ) : submissions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
            <h3 style={{ margin: 0, color: '#111827' }}>No graded submissions yet</h3>
            <p style={{ marginTop: 8 }}>
              Your results will appear here once your lecturer publishes marks.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
            {submissions.map((s) => {
              const c = getScoreColor(s.score);
              return (
                <div
                  key={s._id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div
                    style={{
                      padding: '18px 20px',
                      background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 16, color: '#111827', fontWeight: 800 }}>
                          {s.assignmentName}
                        </h3>
                        <div style={{ color: '#64748b', fontSize: 12, marginTop: 5 }}>
                          {s.moduleName || s.moduleCode || '—'} · Graded {formatDate(s.gradedAt)}
                        </div>
                      </div>

                      <div
                        style={{
                          background: `${c}15`,
                          color: c,
                          border: `1px solid ${c}35`,
                          borderRadius: 14,
                          padding: '8px 12px',
                          textAlign: 'center',
                          minWidth: 76,
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: 20 }}>{s.score || 0}%</div>
                        <div style={{ fontSize: 11, fontWeight: 800 }}>{s.grade || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>Score Progress</span>
                        <span style={{ fontSize: 13, color: c, fontWeight: 800 }}>{s.score || 0}%</span>
                      </div>
                      <ProgressBar value={s.score || 0} color={c} />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 9 }}>
                        Rubric Preview
                      </div>
                      <RubricMini rubricScores={getDisplayRubricScores(s)} />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                        Feedback
                      </div>
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: 12,
                          color: '#475569',
                          fontSize: 13,
                          lineHeight: 1.6,
                          minHeight: 62,
                        }}
                      >
                        {getShortText(s.feedback)}
                      </div>
                    </div>

                    {s.regrade?.status === 'pending' && (
                      <div
                        style={{
                          background: '#fefce8',
                          border: '1px solid #fde68a',
                          borderRadius: 12,
                          padding: '8px 12px',
                          color: '#92400e',
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 14,
                        }}
                      >
                        ⏳ Re-grade request pending
                      </div>
                    )}

                    <button
                      className="btn-primary"
                      onClick={() => setSelected(s)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: 13,
                      }}
                    >
                      View Full Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
