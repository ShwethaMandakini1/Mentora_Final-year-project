import React, { useState, useEffect } from 'react';
import LecturerLayout from './LecturerLayout';
import API from '../../api/api';
import './dashboard.css';

// ─────────────────────────────────────────────────────────────────────────────
// Icons (SVG replacements for emojis)
// ─────────────────────────────────────────────────────────────────────────────
const Icons = {
  Pending: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Approved: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  Rejected: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Document: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Sparkle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" /></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="20 6 9 17 4 12" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Inbox: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" opacity="0.3"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
};

export default function LecturerRequests() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get('/submissions/pending-approvals');
      setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    setActing(true); setMsg('');
    try {
      await API.patch(`/submissions/${id}/approve`);
      setMsg('success:Assignment approved and submitted to Mentora!');
      setSelected(null);
      fetchPending();
    } catch { setMsg('error:Failed to approve. Please try again.'); }
    finally { setActing(false); }
  };

  const handleReject = async (id) => {
    if (!feedback.trim()) { setMsg('warn:Please provide feedback before rejecting.'); return; }
    setActing(true); setMsg('');
    try {
      await API.patch(`/submissions/${id}/reject`, { feedback });
      setMsg('success:Assignment rejected. Student has been notified.');
      setSelected(null); setFeedback('');
      fetchPending();
    } catch { setMsg('error:Failed to reject. Please try again.'); }
    finally { setActing(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const [msgType, msgText] = msg ? msg.split(':') : ['', ''];

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const statCards = [
    { label: 'Pending Review', value: submissions.filter(s => s.approvalStatus === 'pending_review').length, colorClass: 'stat-cyan', icon: <Icons.Pending /> },
    { label: 'Approved', value: submissions.filter(s => s.approvalStatus === 'approved').length, colorClass: 'stat-green', icon: <Icons.Approved /> },
    { label: 'Rejected', value: submissions.filter(s => s.approvalStatus === 'rejected').length, colorClass: 'stat-blue', icon: <Icons.Rejected /> },
  ];

  // ── Detail View ────────────────────────────────────────────────────────────
  if (selected) {
    const isPending = selected.approvalStatus === 'pending_review';
    const isApproved = selected.approvalStatus === 'approved';

    return (
      <LecturerLayout>
        <div className="ios-topbar">
          <div className="ios-topbar-left">
            <h1 className="ios-page-title">Assignment Requests</h1>
            <p className="ios-page-date">Review Detail</p>
          </div>
        </div>

        <div className="ios-page-content">
          <button className="ios-back-btn" onClick={() => { setSelected(null); setMsg(''); setFeedback(''); }}>
            <Icons.ArrowLeft /> Back to Requests
          </button>

          {/* Header card */}
          <div className="ios-section-card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="ios-page-title" style={{ fontSize: 20 }}>{selected.assignmentName}</div>
              <div className="ios-page-date" style={{ marginTop: 4 }}>
                {selected.moduleCode} · Submitted {fmt(selected.submittedAt)}
              </div>
            </div>
            <span className={`ios-badge ${isPending ? 'ios-badge--pending' : isApproved ? 'ios-badge--approved' : 'ios-badge--rejected'}`}
              style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700 }}>
              {isPending ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icons.Pending /> Pending Review</span>
                : isApproved ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icons.Approved /> Approved</span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icons.Rejected /> Rejected</span>}
            </span>
          </div>

          {/* Student info */}
          <div className="ios-section-card">
            <div className="ios-section-title"><Icons.User /> Student Information</div>
            <div className="ios-detail-grid-3">
              {[['Name', selected.student?.username || '—'], ['Email', selected.student?.email || '—'], ['Student ID', selected.student?.studentId || '—']].map(([label, value]) => (
                <div key={label}>
                  <div className="ios-detail-field-label">{label}</div>
                  <div className="ios-detail-field-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission details */}
          <div className="ios-section-card">
            <div className="ios-section-title"><Icons.Document /> Submission Details</div>
            <div className="ios-detail-grid-2">
              {[['File Name', selected.fileName || '—'], ['Module Code', selected.moduleCode || '—'], ['Module Name', selected.moduleName || '—'], ['Submitted', fmt(selected.submittedAt)]].map(([label, value]) => (
                <div key={label}>
                  <div className="ios-detail-field-label">{label}</div>
                  <div className="ios-detail-field-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          {selected.aiAnalysis?.status === 'done' && (
            <div className="ios-ai-card">
              <div className="ios-ai-title"><Icons.Sparkle /> AI Pre-Analysis</div>
              <div className="ios-detail-grid-3">
                <div className="ios-ai-stat">
                  <div className="ios-ai-stat-num" style={{ color: '#16a34a' }}>{selected.aiAnalysis.predictedScore ?? '—'}%</div>
                  <div className="ios-ai-stat-label">Predicted Score</div>
                </div>
                <div className="ios-ai-stat">
                  <div className="ios-ai-stat-num" style={{ color: 'var(--ocean)' }}>{selected.aiAnalysis.predictedGrade ?? '—'}</div>
                  <div className="ios-ai-stat-label">Predicted Grade</div>
                </div>
                <div className="ios-ai-stat">
                  <div className="ios-ai-stat-num" style={{ color: 'var(--sky)' }}>{selected.aiAnalysis.strengths?.length ?? 0}</div>
                  <div className="ios-ai-stat-label">Strengths Found</div>
                </div>
              </div>
              {selected.aiAnalysis.summary && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.7 }}>
                  {selected.aiAnalysis.summary}
                </p>
              )}
            </div>
          )}

          {/* Action Panel — pending only */}
          {isPending && (
            <div className="ios-section-card">
              <div className="ios-section-title"><Icons.Clipboard /> Review Decision</div>
              <label className="ios-form-label">
                Feedback / Reason for Rejection (required if rejecting)
              </label>
              <textarea
                className="ios-textarea"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                placeholder="Write feedback for the student here…"
                style={{ marginBottom: 18 }}
              />
              <div className="ios-btn-row">
                <button className="ios-btn--approve" onClick={() => handleApprove(selected._id)} disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {acting ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icons.Check />}
                  {acting ? 'Processing...' : 'Approve & Submit'}
                </button>
                <button className="ios-btn--reject" onClick={() => handleReject(selected._id)} disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {acting ? <div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icons.X />}
                  {acting ? 'Processing...' : 'Reject'}
                </button>
              </div>
              {msgText && (
                <div className={`ios-alert ios-alert--${msgType}`} style={{ marginTop: 14 }}>
                  {msgText}
                </div>
              )}
            </div>
          )}

          {/* Already actioned */}
          {!isPending && (
            <div className="ios-section-card"
              style={{ background: isApproved ? 'rgba(22,163,74,0.05)' : 'rgba(220,38,38,0.04)', borderColor: isApproved ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: isApproved ? '#15803d' : '#dc2626', margin: 0 }}>
                {isApproved ? <Icons.Approved /> : <Icons.Rejected />}
                {isApproved ? `Approved on ${fmt(selected.approvedAt)}` : `Rejected on ${fmt(selected.rejectedAt)}`}
              </div>
              {selected.approvalFeedback && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, marginBottom: 0 }}>
                  <strong>Feedback:</strong> {selected.approvalFeedback}
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
      <div className="ios-topbar">
        <div className="ios-topbar-left">
          <h1 className="ios-page-title">Assignment Requests</h1>
          <p className="ios-page-date">{dateStr}</p>
        </div>
      </div>

      <div className="ios-page-content">

        {/* Stat cards */}
        <div className="ios-stats-grid-3">
          {statCards.map(s => (
            <div key={s.label} className={`ios-stat-card ${s.colorClass}`}>
              <div className="ios-stat-icon-wrap">
                {s.icon}
              </div>
              <div className="ios-stat-num">{s.value}</div>
              <div className="ios-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="ios-card">
          <div className="ios-card-header">
            <span className="ios-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.Clipboard /> Pending Approvals
            </span>
            <span className="ios-count-pill">{submissions.length} total</span>
          </div>

          {loading ? (
            <div className="ios-loading-state">
              <div className="ios-spinner" />
              <p>Loading requests…</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="ios-empty-state" style={{ padding: '60px 20px' }}>
              <Icons.Inbox />
              <p>No pending requests</p>
              <p style={{ fontSize: 12 }}>Student pre-approval requests will appear here.</p>
            </div>
          ) : (
            <div className="ios-table-wrap">
              <table className="ios-table">
                <thead>
                  <tr>
                    {['Student', 'Assignment', 'Module', 'Submitted', 'AI Score', 'Status', 'Action'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => {
                    const isPending = s.approvalStatus === 'pending_review';
                    const isApproved = s.approvalStatus === 'approved';
                    return (
                      <tr key={s._id || i}>
                        <td>
                          <div className="ios-student-cell">
                            <div className="ios-table-avatar">{s.student?.username?.[0]?.toUpperCase() || 'S'}</div>
                            <div>
                              <div className="ios-student-name">{s.student?.username || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.student?.studentId || s.student?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="ios-assignment-cell">{s.assignmentName || '—'}</td>
                        <td><span className="ios-module-tag">{s.moduleCode || '—'}</span></td>
                        <td className="ios-date-cell">{fmt(s.submittedAt)}</td>
                        <td>
                          {s.aiAnalysis?.status === 'done' ? (
                            <span className="ios-badge ios-badge--graded">
                              {s.aiAnalysis.predictedGrade} ({s.aiAnalysis.predictedScore}%)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Analysing…</span>
                          )}
                        </td>
                        <td>
                          <span className={`ios-badge ios-badge--${isPending ? 'pending' : isApproved ? 'approved' : 'rejected'}`}>
                            {isPending ? 'Pending' : isApproved ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="ios-action-btn ios-action-btn--primary"
                            onClick={() => { setSelected(s); setMsg(''); setFeedback(''); }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LecturerLayout>
  );
}