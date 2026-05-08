import React, { useState, useEffect } from 'react';
import LecturerLayout from './LecturerLayout';
import API from '../../api/api';
import './dashboard.css';

export default function LecturerRequests() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [feedback, setFeedback]       = useState('');
  const [acting, setActing]           = useState(false);
  const [msg, setMsg]                 = useState('');
  const [filter, setFilter]           = useState('pending_review');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get('/submissions/pending-approvals');
      setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    setActing(true); setMsg('');
    try {
      await API.patch(`/submissions/${id}/approve`);
      setMsg('✅ Assignment approved and submitted to Mentora!');
      setSelected(null);
      fetchPending();
    } catch { setMsg('❌ Failed to approve. Try again.'); }
    finally  { setActing(false); }
  };

  const handleReject = async (id) => {
    if (!feedback.trim()) { setMsg('⚠️ Please provide feedback before rejecting.'); return; }
    setActing(true); setMsg('');
    try {
      await API.patch(`/submissions/${id}/reject`, { feedback });
      setMsg('❌ Assignment rejected. Student has been notified.');
      setSelected(null);
      setFeedback('');
      fetchPending();
    } catch { setMsg('❌ Failed to reject. Try again.'); }
    finally  { setActing(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const statusStyle = (s) => {
    if (s === 'approved') return { bg: '#d1fae5', color: '#065f46' };
    if (s === 'rejected') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#fef3c7', color: '#92400e' };
  };

  // ── Detail View ────────────────────────────────────────────────────────────
  if (selected) {
    const ss = statusStyle(selected.approvalStatus);
    return (
      <LecturerLayout>
        <div style={{ padding: '30px 40px' }}>
          <button onClick={() => { setSelected(null); setMsg(''); setFeedback(''); }}
            style={{ background: 'none', border: 'none', color: '#3b82f6',
                     fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>
            ← Back to Requests
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{selected.assignmentName}</h2>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                {selected.moduleCode} · Submitted {fmt(selected.submittedAt)}
              </p>
            </div>
            <span style={{ background: ss.bg, color: ss.color, borderRadius: 20,
                           padding: '5px 16px', fontSize: 13, fontWeight: 700 }}>
              {selected.approvalStatus === 'pending_review' ? '⏳ Pending Review'
             : selected.approvalStatus === 'approved'       ? '✅ Approved'
             :                                                 '❌ Rejected'}
            </span>
          </div>

          {/* Student Info */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
                        padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 12 }}>
              👤 Student Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                ['Name',       selected.student?.username  || '—'],
                ['Email',      selected.student?.email     || '—'],
                ['Student ID', selected.student?.studentId || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
                                textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Info */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                        padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 12 }}>
              📄 Submission Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['File Name',   selected.fileName   || '—'],
                ['Module Code', selected.moduleCode || '—'],
                ['Module Name', selected.moduleName || '—'],
                ['Submitted',   fmt(selected.submittedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
                                textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: '#111827' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Summary */}
          {selected.aiAnalysis?.status === 'done' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12,
                          padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8', marginBottom: 12 }}>
                🤖 AI Pre-Analysis
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
                    {selected.aiAnalysis.predictedScore ?? '—'}%
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Predicted Score</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>
                    {selected.aiAnalysis.predictedGrade ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Predicted Grade</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>
                    {selected.aiAnalysis.strengths?.length ?? 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Strengths Found</div>
                </div>
              </div>
              {selected.aiAnalysis.summary && (
                <p style={{ fontSize: 13, color: '#374151', marginTop: 14, lineHeight: 1.7 }}>
                  {selected.aiAnalysis.summary}
                </p>
              )}
            </div>
          )}

          {/* Action Panel — only for pending */}
          {selected.approvalStatus === 'pending_review' && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                          padding: '24px 28px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>
                📋 Review Decision
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Feedback / Reason for Rejection (required if rejecting)
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Write feedback for the student here..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8,
                           border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical',
                           fontFamily: 'inherit', boxSizing: 'border-box',
                           outline: 'none', color: '#374151' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => handleApprove(selected._id)} disabled={acting}
                  style={{ background: acting ? '#86efac' : '#16a34a', color: '#fff',
                           border: 'none', borderRadius: 8, padding: '11px 28px',
                           fontSize: 14, fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer',
                           transition: 'background 0.2s' }}>
                  {acting ? '...' : '✅ Approve & Submit'}
                </button>
                <button onClick={() => handleReject(selected._id)} disabled={acting}
                  style={{ background: acting ? '#fca5a5' : '#dc2626', color: '#fff',
                           border: 'none', borderRadius: 8, padding: '11px 28px',
                           fontSize: 14, fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer',
                           transition: 'background 0.2s' }}>
                  {acting ? '...' : '❌ Reject'}
                </button>
              </div>

              {msg && (
                <p style={{ marginTop: 14, fontSize: 13,
                            color: msg.startsWith('✅') ? '#16a34a'
                                 : msg.startsWith('⚠️') ? '#d97706' : '#dc2626' }}>
                  {msg}
                </p>
              )}
            </div>
          )}

          {/* Already actioned message */}
          {selected.approvalStatus !== 'pending_review' && (
            <div style={{ background: selected.approvalStatus === 'approved' ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${selected.approvalStatus === 'approved' ? '#bbf7d0' : '#fecaca'}`,
                          borderRadius: 12, padding: '18px 24px' }}>
              <p style={{ fontSize: 14, fontWeight: 600,
                          color: selected.approvalStatus === 'approved' ? '#15803d' : '#dc2626',
                          margin: 0 }}>
                {selected.approvalStatus === 'approved'
                  ? `✅ Approved on ${fmt(selected.approvedAt)}`
                  : `❌ Rejected on ${fmt(selected.rejectedAt)}`}
              </p>
              {selected.approvalFeedback && (
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
                  Feedback: {selected.approvalFeedback}
                </p>
              )}
            </div>
          )}
        </div>
      </LecturerLayout>
    );
  }

  // ── List View ──────────────────────────────────────────────────────────────
  return (
    <LecturerLayout>
      <div style={{ padding: '30px 40px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Assignment Requests</h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
          Review student submissions before they are officially submitted to Mentora
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Pending Review', value: submissions.filter(s => s.approvalStatus === 'pending_review').length, color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
            { label: 'Approved',       value: submissions.filter(s => s.approvalStatus === 'approved').length,       color: '#16a34a', bg: '#d1fae5', icon: '✅' },
            { label: 'Rejected',       value: submissions.filter(s => s.approvalStatus === 'rejected').length,       color: '#dc2626', bg: '#fee2e2', icon: '❌' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 12,
                                           padding: '20px 24px', display: 'flex',
                                           alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📬 Pending Approvals</span>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {submissions.length} total requests
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              Loading requests...
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 8 }}>
                No pending requests
              </div>
              <div style={{ fontSize: 14 }}>
                Student pre-approval requests will appear here.
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Student', 'Assignment', 'Module', 'Submitted', 'AI Score', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left',
                                         fontWeight: 600, color: '#374151', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => {
                  const ss = statusStyle(s.approvalStatus);
                  return (
                    <tr key={s._id || i}
                      style={{ borderBottom: '1px solid #f3f4f6',
                               background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          {s.student?.username || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {s.student?.studentId || s.student?.email || ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#374151', fontWeight: 500 }}>
                        {s.assignmentName || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280' }}>
                        {s.moduleCode || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                        {fmt(s.submittedAt)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {s.aiAnalysis?.status === 'done' ? (
                          <span style={{ background: '#d1fae5', color: '#065f46',
                                         borderRadius: 20, padding: '3px 10px',
                                         fontSize: 12, fontWeight: 700 }}>
                            {s.aiAnalysis.predictedGrade} ({s.aiAnalysis.predictedScore}%)
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>Analysing...</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: ss.bg, color: ss.color, borderRadius: 20,
                                       padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                          {s.approvalStatus === 'pending_review' ? '⏳ Pending'
                         : s.approvalStatus === 'approved'       ? '✅ Approved'
                         :                                          '❌ Rejected'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => { setSelected(s); setMsg(''); setFeedback(''); }}
                          style={{ background: '#2563eb', color: '#fff', border: 'none',
                                   borderRadius: 8, padding: '7px 16px', fontSize: 13,
                                   fontWeight: 600, cursor: 'pointer' }}>
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </LecturerLayout>
  );
}