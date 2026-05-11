/**
 * LecturerRequests.jsx — Pre Approvals Page
 *
 * Flow:
 *  1. Student submits a draft for pre-approval → appears here as "Pending Review"
 *  2. Lecturer opens the draft → reads the document and gives a review comment
 *  3. Lecturer approves or rejects the draft with a comment
 *  4. Lecturer clicks:
 *       "Approve Draft" → student notified that the draft is ready
 *       "Reject with Feedback"    → student notified to revise and resubmit
 *
 * Uses PATCH /submissions/:id/mark-and-decide for pre-approval decision only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import LecturerLayout from './LecturerLayout';
import API from '../../api/api';
import mammoth from 'mammoth';
import './dashboard.css';

// ── Base URL for building file download/view links ─────────────────────────
const BASE = import.meta.env.VITE_API_URL.replace('/api', '');

// ── Build a full URL from a stored filePath (e.g. "submissions/abc.pdf") ──
function buildFileUrl(filePath) {
  if (!filePath) return null;
  let clean = filePath.replace(/\\/g, '/');
  if (clean.startsWith('http')) return clean;
  if (clean.includes('/submissions/'))
    return `${BASE}/submissions/${clean.split('/submissions/').pop()}`;
  return `${BASE}/${clean.replace(/^\//, '')}`;
}

// ── Get lowercase extension from file path ─────────────────────────────────
function getExt(fp) { return fp ? fp.split('.').pop().toLowerCase() : ''; }

// ── Auto-compute letter grade from percentage ──────────────────────────────
function calcGrade(pct) {
  if (pct >= 90) return 'A+'; if (pct >= 85) return 'A';  if (pct >= 80) return 'A-';
  if (pct >= 75) return 'B+'; if (pct >= 70) return 'B';  if (pct >= 65) return 'B-';
  if (pct >= 60) return 'C+'; if (pct >= 55) return 'C';  return 'F';
}

// ── Format a date/time string into a readable format ──────────────────────
function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS — inline SVGs instead of icon libraries for no extra dependency
// ─────────────────────────────────────────────────────────────────────────────
const Icons = {
  Pending:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Approved:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Rejected:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  User:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Document:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Sparkle:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></svg>,
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Check:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>,
  X:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Inbox:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" opacity="0.3"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Download:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Eye:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Rubric:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Inline document viewer
// Shows PDF in an iframe, DOCX converted to HTML via mammoth, others download-only
// ─────────────────────────────────────────────────────────────────────────────
function DocumentViewer({ submission }) {
  const ext     = getExt(submission.filePath || '');
  const fileUrl = buildFileUrl(submission.filePath);
  const isPdf   = ext === 'pdf';
  const isDoc   = ext === 'docx' || ext === 'doc';

  const [html,    setHtml]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Load DOCX content using mammoth when this section is shown
  useEffect(() => {
    if (!isDoc || !fileUrl) return;
    setLoading(true); setError('');
    const token = localStorage.getItem('token');
    fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => { if (!r.ok) throw new Error(`Server ${r.status}`); return r.arrayBuffer(); })
      .then(ab => mammoth.convertToHtml({ arrayBuffer: ab }))
      .then(r  => setHtml(r.value || '<p style="color:#94a3b8;text-align:center;padding:40px">Document is empty</p>'))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [fileUrl, isDoc]);

  // Download file using authenticated fetch (handles protected routes)
  const download = async () => {
    if (!fileUrl) return;
    const token = localStorage.getItem('token');
    const res  = await fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: submission.fileName || 'document' });
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="ios-section-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Viewer header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--foam)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
          <Icons.Document />
          {submission.fileName || 'Submitted Document'}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', marginLeft: 4 }}>.{ext}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--ocean)', textDecoration: 'none' }}>
              <Icons.Eye /> Open
            </a>
          )}
          <button onClick={download}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Icons.Download /> Download
          </button>
        </div>
      </div>

      {/* Viewer body */}
      <div style={{ height: 420, overflow: 'auto', background: '#e2e8f0', position: 'relative' }}>
        {isPdf && fileUrl && (
          <iframe src={fileUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Viewer" />
        )}

        {isDoc && loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'var(--text-muted)' }}>
            <div className="ios-spinner" />
            <p style={{ margin: 0, fontSize: 14 }}>Loading document...</p>
          </div>
        )}

        {isDoc && !loading && error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#dc2626', fontWeight: 600, margin: 0 }}>Could not render document</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>{error}</p>
            <button onClick={download} className="ios-action-btn ios-action-btn--primary" style={{ marginTop: 8 }}>
              <Icons.Download /> Download Instead
            </button>
          </div>
        )}

        {isDoc && !loading && !error && html && (
          <div style={{
            background: '#fff', padding: '40px 60px', maxWidth: 860, margin: '20px auto',
            boxShadow: '0 4px 20px rgba(0,0,0,.08)', borderRadius: 4,
            fontFamily: "'Calibri','Segoe UI',Arial,sans-serif", fontSize: 15, lineHeight: 1.7, color: '#1e293b',
          }} dangerouslySetInnerHTML={{ __html: html }} />
        )}

        {!isPdf && !isDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text-muted)' }}>
            <Icons.Document />
            <p style={{ margin: 0, fontWeight: 500 }}>Preview not available for .{ext} files</p>
            <button onClick={download} className="ios-action-btn ios-action-btn--primary" style={{ marginTop: 8 }}>
              <Icons.Download /> Download to View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Score progress bar for rubric criteria
// Shows a visual fill based on score / maxScore ratio
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ score, maxScore }) {
  const pct   = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border-soft)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Rubric marking panel
// Shows each criterion from the assignment rubric as a scoreable row
// If no rubric exists, falls back to a single manual score + grade input
// ─────────────────────────────────────────────────────────────────────────────
function MarkingPanel({ submission, onDecision }) {
  const [feedback,   setFeedback]   = useState(submission.approvalFeedback || '');
  const [acting,     setActing]     = useState(false);
  const [actionType, setActionType] = useState('');
  const [error,      setError]      = useState('');

  const alreadyActioned = submission.approvalStatus !== 'pending_review';

  const submit = async (decision) => {
    if (!feedback.trim()) {
      setError('Please write a review comment before approving or rejecting.');
      return;
    }

    setActing(true);
    setActionType(decision);
    setError('');

    try {
      await API.patch(`/submissions/${submission._id}/mark-and-decide`, {
        decision,
        feedback: feedback.trim(),
      });
      onDecision(decision);
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${decision}. Please try again.`);
      setActing(false);
      setActionType('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div className="ios-section-card" style={{ background: 'linear-gradient(135deg,#eff6ff,#f0fdf4)' }}>
        <div className="ios-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Document /> Pre-Approval Review
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
          This page is only for checking whether the student's draft is ready. Do not add marks here.
          Actual rubric scoring, final marks, and publishing must be done later from <strong>Marking & Feedback</strong>.
        </p>
      </div>

      {submission.aiAnalysis?.status === 'done' && (
        <div className="ios-section-card">
          <div className="ios-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icons.Sparkle /> AI Reading Support
          </div>

          {submission.aiAnalysis.summary && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 12,
            }}>
              {submission.aiAnalysis.summary}
            </div>
          )}

          {submission.aiAnalysis.missingParts?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Possible missing/improvement areas</div>
              {submission.aiAnalysis.missingParts.slice(0, 4).map((m, i) => (
                <div key={i} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412' }}>{m.part || 'Missing area'}</div>
                  <div style={{ fontSize: 12, color: '#7c2d12', marginTop: 4, lineHeight: 1.5 }}>
                    {m.suggestion || m.importance || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ios-section-card">
        <div className="ios-section-title">
          Lecturer Review Comment
          <span style={{ fontSize: 11, fontWeight: 500, color: '#dc2626', marginLeft: 6 }}>
            (required)
          </span>
        </div>

        {alreadyActioned ? (
          <div style={{
            background: submission.approvalStatus === 'approved' ? '#f0fdf4' : '#fffbeb',
            border: submission.approvalStatus === 'approved' ? '1px solid #bbf7d0' : '1px solid #fcd34d',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            fontSize: 14,
            color: submission.approvalStatus === 'approved' ? '#166534' : '#92400e',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {submission.approvalFeedback || 'No review comment provided.'}
          </div>
        ) : (
          <textarea
            className="ios-textarea"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={6}
            placeholder="Write what is good, what must be improved, or whether the draft is ready for final submission..."
          />
        )}
      </div>

      {!alreadyActioned && (
        <div className="ios-section-card" style={{ background: 'var(--foam)' }}>
          <div className="ios-section-title">Pre-Approval Decision</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
            <strong>Approve Draft</strong>: tells the student this draft is ready to continue/submit properly.<br />
            <strong>Reject Draft</strong>: sends your comment so the student can revise and upload again.
          </p>

          {error && (
            <div className="ios-alert ios-alert--error" style={{ marginBottom: 14 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => submit('approve')}
              disabled={acting}
              style={{
                flex: 1,
                minWidth: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 24px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: acting ? 'not-allowed' : 'pointer',
                background: '#16a34a',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '0 4px 12px rgba(22,163,74,.25)',
              }}
            >
              {acting && actionType === 'approve'
                ? <><div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> Saving...</>
                : <><Icons.Check /> Approve Draft</>}
            </button>

            <button
              onClick={() => submit('reject')}
              disabled={acting}
              style={{
                flex: 1,
                minWidth: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 24px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid #fca5a5',
                cursor: acting ? 'not-allowed' : 'pointer',
                background: '#fee2e2',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {acting && actionType === 'reject'
                ? <><div className="ios-spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: '#fca5a5', borderTopColor: '#dc2626' }} /> Saving...</>
                : <><Icons.X /> Reject Draft</>}
            </button>
          </div>
        </div>
      )}

      {alreadyActioned && (
        <div className="ios-section-card"
          style={{
            background: submission.approvalStatus === 'approved' ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.04)',
            borderColor: submission.approvalStatus === 'approved' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.15)',
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            color: submission.approvalStatus === 'approved' ? '#15803d' : '#dc2626',
          }}>
            {submission.approvalStatus === 'approved' ? <Icons.Approved /> : <Icons.Rejected />}
            {submission.approvalStatus === 'approved'
              ? `Draft Approved on ${fmt(submission.approvedAt)}`
              : `Draft Rejected on ${fmt(submission.rejectedAt)}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function LecturerRequests() {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);  // currently open submission

  // Fetch ALL pre-approval submissions (pending + approved + rejected)
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/submissions/pending-approvals');
      setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Called by MarkingPanel after a decision is made — refresh list and close detail
  const handleDecision = async () => {
    await fetchAll();
    setSelected(null);
  };

  // Derived counts for stat cards — computed from the full submissions list
  const pendingCount  = submissions.filter(s => s.approvalStatus === 'pending_review').length;
  const approvedCount = submissions.filter(s => s.approvalStatus === 'approved').length;
  const rejectedCount = submissions.filter(s => s.approvalStatus === 'rejected').length;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── DETAIL VIEW: shown when a row is clicked ───────────────────────────────
  if (selected) {
    const isPending  = selected.approvalStatus === 'pending_review';
    const isApproved = selected.approvalStatus === 'approved';

    return (
      <LecturerLayout>
        <div className="ios-topbar">
          <div className="ios-topbar-left">
            <h1 className="ios-page-title">Pre Approvals</h1>
            <p className="ios-page-date">Review drafts and give approval comments</p>
          </div>
        </div>

        <div className="ios-page-content">
          {/* Back button */}
          <button className="ios-back-btn" onClick={() => setSelected(null)}>
            <Icons.ArrowLeft /> Back to Requests
          </button>

          {/* Header: assignment name + status badge */}
          <div className="ios-section-card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="ios-page-title" style={{ fontSize: 22 }}>{selected.assignmentName}</div>
              <div className="ios-page-date" style={{ marginTop: 4 }}>
                {selected.moduleCode} · {selected.moduleName} · Submitted {fmt(selected.submittedAt)}
              </div>
            </div>
            <span className={`ios-badge ios-badge--${isPending ? 'pending' : isApproved ? 'approved' : 'rejected'}`}
              style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              {isPending  ? <><Icons.Pending />  Pending Review</> : null}
              {isApproved ? <><Icons.Approved /> Approved</> : null}
              {!isPending && !isApproved ? <><Icons.Rejected /> Rejected</> : null}
            </span>
          </div>

          {/* Student information */}
          <div className="ios-section-card">
            <div className="ios-section-title"><Icons.User /> Student</div>
            <div className="ios-detail-grid-3">
              {[
                ['Name',       selected.student?.username  || '—'],
                ['Email',      selected.student?.email     || '—'],
                ['Student ID', selected.student?.studentId || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="ios-detail-field-label">{label}</div>
                  <div className="ios-detail-field-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column layout: document viewer on left, marking panel on right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* LEFT: Document viewer + AI analysis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Inline document viewer */}
              {selected.filePath
                ? <DocumentViewer submission={selected} />
                : (
                  <div className="ios-section-card">
                    <div className="ios-section-title"><Icons.Document /> Submitted Document</div>
                    <div className="ios-empty-state" style={{ padding: '40px 20px' }}>
                      <Icons.Inbox />
                      <p>No file attached to this submission.</p>
                    </div>
                  </div>
                )
              }

              {/* AI pre-analysis (if available) */}
              {selected.aiAnalysis?.status === 'done' && (
                <div className="ios-ai-card">
                  <div className="ios-ai-title"><Icons.Sparkle /> AI Pre-Analysis</div>
                  <div className="ios-detail-grid-3" style={{ marginBottom: 14 }}>
                    <div className="ios-ai-stat">
                      <div className="ios-ai-stat-num" style={{ color: '#16a34a' }}>{selected.aiAnalysis.predictedScore ?? '—'}%</div>
                      <div className="ios-ai-stat-label">AI Predicted Score</div>
                    </div>
                    <div className="ios-ai-stat">
                      <div className="ios-ai-stat-num" style={{ color: 'var(--ocean)' }}>{selected.aiAnalysis.predictedGrade ?? '—'}</div>
                      <div className="ios-ai-stat-label">AI Predicted Grade</div>
                    </div>
                    <div className="ios-ai-stat">
                      <div className="ios-ai-stat-num" style={{ color: 'var(--sky)' }}>{selected.aiAnalysis.strengths?.length ?? 0}</div>
                      <div className="ios-ai-stat-label">Strengths Found</div>
                    </div>
                  </div>
                  {selected.aiAnalysis.summary && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      {selected.aiAnalysis.summary}
                    </p>
                  )}
                </div>
              )}

              {/* AI still running */}
              {selected.aiAnalysis?.status === 'pending' && (
                <div className="ios-ai-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="ios-spinner" />
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    AI analysis is running in the background. It will appear here once complete.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: Marking panel (rubric scoring + feedback + decision buttons) */}
            <div>
              <MarkingPanel submission={selected} onDecision={handleDecision} />
            </div>
          </div>
        </div>
      </LecturerLayout>
    );
  }

  // ── LIST VIEW: default view showing all requests ───────────────────────────
  return (
    <LecturerLayout>
      <div className="ios-topbar">
        <div className="ios-topbar-left">
          <h1 className="ios-page-title">Pre Approvals</h1>
          <p className="ios-page-date">{dateStr}</p>
        </div>
      </div>

      <div className="ios-page-content">

        {/* Stat cards — Pending / Approved / Rejected counts */}
        <div className="ios-stats-grid-3">
          {[
            { label: 'Pending Review', value: pendingCount,  colorClass: 'stat-cyan',  icon: <Icons.Pending />  },
            { label: 'Approved',       value: approvedCount, colorClass: 'stat-green', icon: <Icons.Approved /> },
            { label: 'Rejected',       value: rejectedCount, colorClass: 'stat-blue',  icon: <Icons.Rejected /> },
          ].map(s => (
            <div key={s.label} className={`ios-stat-card ${s.colorClass}`}>
              <div className="ios-stat-icon-wrap">{s.icon}</div>
              <div className="ios-stat-num">{s.value}</div>
              <div className="ios-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Submissions table */}
        <div className="ios-card">
          <div className="ios-card-header">
            <span className="ios-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Pre-Approval Drafts
            </span>
            <span className="ios-count-pill">{submissions.length} total</span>
          </div>

          {loading ? (
            <div className="ios-loading-state"><div className="ios-spinner" /><p>Loading requests…</p></div>
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
                    {['Student', 'Assignment', 'Module', 'Submitted', 'AI Support', 'Status', 'Action'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => {
                    const isPending  = s.approvalStatus === 'pending_review';
                    const isApproved = s.approvalStatus === 'approved';
                    return (
                      <tr key={s._id || i}>
                        {/* Student cell */}
                        <td>
                          <div className="ios-student-cell">
                            <div className="ios-table-avatar">{s.student?.username?.[0]?.toUpperCase() || 'S'}</div>
                            <div>
                              <div className="ios-student-name">{s.student?.username || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.student?.studentId || s.student?.email || ''}</div>
                            </div>
                          </div>
                        </td>

                        {/* Assignment name */}
                        <td className="ios-assignment-cell">{s.assignmentName || '—'}</td>

                        {/* Module code badge */}
                        <td><span className="ios-module-tag">{s.moduleCode || '—'}</span></td>

                        {/* Submission date */}
                        <td className="ios-date-cell">{fmt(s.submittedAt)}</td>

                        {/* AI predicted grade (if analysis is done) */}
                        <td>
                          {s.aiAnalysis?.status === 'done' ? (
                            <span className="ios-badge ios-badge--graded">
                              {s.aiAnalysis.predictedGrade} ({s.aiAnalysis.predictedScore}%)
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              {s.aiAnalysis?.status === 'failed' ? 'Failed' : 'Analysing…'}
                            </span>
                          )}
                        </td>

                        {/* Approval status badge */}
                        <td>
                          <span className={`ios-badge ios-badge--${isPending ? 'pending' : isApproved ? 'approved' : 'rejected'}`}>
                            {isPending ? 'Pending Review' : isApproved ? 'Approved' : 'Rejected'}
                          </span>
                          {/* Show score if already graded */}
                          {!isPending && s.score > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                              {s.score}% · {s.grade}
                            </div>
                          )}
                        </td>

                        {/* Action button: "Review Drafts" for pending, "View" for actioned */}
                        <td>
                          <button
                            className={`ios-action-btn ${isPending ? 'ios-action-btn--primary' : 'ios-action-btn--ghost'}`}
                            onClick={() => setSelected(s)}
                          >
                            {isPending ? 'Review Drafts' : 'View'}
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