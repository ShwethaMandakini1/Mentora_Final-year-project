import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LecturerLayout from './LecturerLayout';
import axios from 'axios';
import mammoth from 'mammoth';
import './dashboard.css';

const API  = import.meta.env.VITE_API_URL;
const BASE = import.meta.env.VITE_API_URL.replace('/api', '');

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildFileUrl(filePath) {
  if (!filePath) return null;
  let clean = filePath.replace(/\\/g, '/');
  if (clean.startsWith('http')) return clean;
  if (clean.includes(':/') || clean.includes('/submissions/')) {
    return `${BASE}/submissions/${clean.split('/submissions/').pop()}`;
  }
  return `${BASE}/${clean.replace(/^\//, '')}`;
}
function getExt(fp) { return fp ? fp.split('.').pop().toLowerCase() : ''; }
function gradeColor(g) {
  if (!g) return '#64748b';
  if (g.startsWith('A')) return '#16a34a';
  if (g.startsWith('B')) return '#0284c7';
  if (g.startsWith('C')) return '#d97706';
  return '#dc2626';
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  File:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Pdf:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12v6"/><path d="M8 12h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8"/></svg>,
  Download:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Close:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Plus:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Refresh:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Search:      () => <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/><path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  Pin:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3h0a3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
  EmptyBox:    () => <svg viewBox="0 0 40 40" fill="none" width="48" height="48" style={{color:'#cbd5e1'}}><rect x="6" y="10" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.8"/><path d="M12 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/><path d="M6 16h28M16 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/></svg>,
  Check:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  XCircle:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Eye:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ExternalLink:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Sparkle:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></svg>,
  Lock:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

// ── Global Styles ─────────────────────────────────────────────────────────────
const styleInjection = `
  .ultra-input{width:100%;padding:12px 16px;border:1px solid #e2e8f0;border-radius:12px;font-size:14px;color:#0f172a;background:#f8fafc;outline:none;transition:all .2s;box-sizing:border-box;font-family:inherit}
  .ultra-input:focus{background:#fff;border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.1)}
  .ultra-label{display:block;font-size:13px;font-weight:600;color:#475569;margin-bottom:6px}
  .ultra-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;border:none}
  .ultra-btn-primary{background:#6366f1;color:#fff;box-shadow:0 4px 12px rgba(99,102,241,.25)}
  .ultra-btn-primary:hover{background:#4f46e5;transform:translateY(-1px)}
  .ultra-btn-ghost{background:#f1f5f9;color:#475569}
  .ultra-btn-ghost:hover{background:#e2e8f0;color:#0f172a}
  .ultra-btn-danger{background:#fee2e2;color:#dc2626}
  .ultra-btn-danger:hover{background:#fecaca}
  .ultra-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px}
  .ultra-card{background:#fff;border-radius:20px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.03);border:1px solid #f1f5f9;transition:transform .2s,box-shadow .2s}
  .ultra-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.06);border-color:#e2e8f0}
  .floating-row{background:#fff;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.02)}
  .floating-row:hover{transform:translateY(-2px) scale(1.002);box-shadow:0 8px 24px rgba(0,0,0,.06);position:relative;z-index:10}
  .floating-row td{padding:16px 20px}
  .floating-row td:first-child{border-radius:16px 0 0 16px}
  .floating-row td:last-child{border-radius:0 16px 16px 0}
  .ultra-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;opacity:0;animation:fadeIn .2s forwards}
  .ultra-modal{background:#fff;border-radius:24px;box-shadow:0 24px 64px rgba(0,0,0,.2);overflow:hidden;transform:scale(.95);animation:scaleUp .3s cubic-bezier(.16,1,.3,1) forwards;max-height:90vh;display:flex;flex-direction:column}
  @keyframes fadeIn{to{opacity:1}}@keyframes scaleUp{to{transform:scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}
  .ultra-scrollbar::-webkit-scrollbar{width:6px}.ultra-scrollbar::-webkit-scrollbar-track{background:transparent}.ultra-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
  .docx-preview{background:#fff;padding:60px 80px;max-width:900px;margin:24px auto;box-shadow:0 4px 24px rgba(0,0,0,.08);border-radius:4px;color:#1e293b;font-family:'Calibri','Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.7}
  .docx-preview h1{font-size:26px;font-weight:700;margin:24px 0 12px;color:#0f172a}
  .docx-preview h2{font-size:22px;font-weight:700;margin:20px 0 10px;color:#0f172a}
  .docx-preview p{margin:0 0 12px}
  .docx-preview ul,.docx-preview ol{margin:0 0 12px;padding-left:28px}
  .docx-preview table{border-collapse:collapse;margin:16px 0;width:100%}
  .docx-preview table td,.docx-preview table th{border:1px solid #cbd5e1;padding:8px 12px}
`;

// ─────────────────────────────────────────────────────────────────────────────
// File Viewer Modal
// ─────────────────────────────────────────────────────────────────────────────
function FileViewerModal({ filePath, fileName, onClose }) {
  const ext   = getExt(filePath);
  const fileUrl = buildFileUrl(filePath);
  const isDoc = ext === 'docx' || ext === 'doc';
  const isPdf = ext === 'pdf';
  const [docxHtml, setDocxHtml] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!isDoc || !fileUrl) return;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const buf = await res.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buf });
        setDocxHtml(result.value || '<p style="color:#94a3b8;text-align:center;padding:40px;">Empty document.</p>');
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [fileUrl, isDoc]);

  const handleDownload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res  = await fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fileName || 'document';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ultra-modal-overlay">
      <div className="ultra-modal" style={{ width:'100%', maxWidth:1100, height:'90vh' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:40, height:40, borderRadius:12, background: isPdf ? '#fee2e2' : '#e0e7ff', color: isPdf ? '#dc2626' : '#4f46e5', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {isPdf ? <Icons.Pdf /> : <Icons.File />}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:'#0f172a' }}>{fileName || 'Submitted Document'}</div>
              <div style={{ fontSize:12, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>{ext} Format</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={handleDownload} className="ultra-btn ultra-btn-ghost"><Icons.Download /> Download</button>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost"><Icons.Close /> Close</button>
          </div>
        </div>
        <div className="ultra-scrollbar" style={{ flex:1, overflow:'auto', background:'#e2e8f0' }}>
          {isPdf && <iframe src={fileUrl} style={{ width:'100%', height:'100%', border:'none' }} title="PDF" />}
          {isDoc && loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#64748b' }}>
              <div style={{ width:40, height:40, border:'3px solid #cbd5e1', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 1s linear infinite', marginBottom:16 }} />
              <p>Loading document…</p>
            </div>
          )}
          {isDoc && !loading && error && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:40, textAlign:'center' }}>
              <p style={{ color:'#dc2626', fontWeight:600 }}>Could not preview document</p>
              <p style={{ fontSize:14, marginBottom:16, color:'#64748b' }}>{error}</p>
              <button onClick={handleDownload} className="ultra-btn ultra-btn-primary"><Icons.Download /> Download instead</button>
            </div>
          )}
          {isDoc && !loading && !error && docxHtml && <div className="docx-preview" dangerouslySetInnerHTML={{ __html: docxHtml }} />}
          {!isPdf && !isDoc && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#64748b' }}>
              <p style={{ fontSize:16, fontWeight:500 }}>Preview not available for this format.</p>
              <button onClick={handleDownload} className="ultra-btn ultra-btn-primary" style={{ marginTop:12 }}><Icons.Download /> Download to view</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-Approval Modal
// ─────────────────────────────────────────────────────────────────────────────
function ApprovalModal({ submission, onClose, onActioned }) {
  const [feedback,   setFeedback]   = useState('');
  const [working,    setWorking]    = useState(false);
  const [action,     setAction]     = useState(null);
  const [error,      setError]      = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const studentName = submission.student?.username || submission.student?.email || '—';

  const handleApprove = async () => {
    setAction('approve'); setWorking(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/submissions/${submission._id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      onActioned();
    } catch (e) { setError(e.response?.data?.message || 'Failed.'); setWorking(false); setAction(null); }
  };
  const handleReject = async () => {
    if (!feedback.trim()) { setError('Please provide feedback before rejecting.'); return; }
    setAction('reject'); setWorking(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/submissions/${submission._id}/reject`, { feedback }, { headers: { Authorization: `Bearer ${token}` } });
      onActioned();
    } catch (e) { setError(e.response?.data?.message || 'Failed.'); setWorking(false); setAction(null); }
  };

  return (
    <>
      <div className="ultra-modal-overlay">
        <div className="ultra-modal" style={{ maxWidth:640 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #e2e8f0' }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:700, margin:0, color:'#0f172a' }}>Pre-Approval Review</h2>
              <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>Approve → moves to marking queue. Reject → sends feedback to student.</p>
            </div>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ padding:8, borderRadius:'50%' }}><Icons.Close /></button>
          </div>
          <div className="ultra-scrollbar" style={{ padding:24, overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ background:'#f8fafc', borderRadius:16, padding:20, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16, color:'#0f172a', marginBottom:6 }}>{submission.assignmentName}</div>
                <div style={{ color:'#64748b', fontSize:14 }}>Student: <strong>{studentName}</strong> · {submission.moduleCode}</div>
                <div style={{ color:'#94a3b8', fontSize:12, marginTop:6 }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
              </div>
              {submission.filePath && (
                <button onClick={() => setViewerOpen(true)} className="ultra-btn" style={{ background:'#e0e7ff', color:'#4f46e5' }}><Icons.File /> View Document</button>
              )}
            </div>
            <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:12, padding:14, color:'#92400e', fontSize:13 }}>
              ℹ️ Approve to move to <strong>Mark &amp; Feedback</strong>. Reject to send revision feedback.
            </div>
            <div>
              <label className="ultra-label">Feedback <span style={{ color:'#94a3b8', fontWeight:400 }}>(required for rejection)</span></label>
              <textarea className="ultra-input" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Explain what needs revision…" style={{ minHeight:110, resize:'vertical' }} />
            </div>
          </div>
          <div style={{ padding:'20px 24px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            {error && <div style={{ color:'#dc2626', fontWeight:600, marginRight:'auto', fontSize:13 }}>{error}</div>}
            <button onClick={onClose} disabled={working} className="ultra-btn ultra-btn-ghost">Cancel</button>
            <button onClick={handleReject} disabled={working} className="ultra-btn ultra-btn-danger" style={{ minWidth:120, justifyContent:'center' }}>
              <Icons.XCircle /> {working && action==='reject' ? 'Rejecting…' : 'Reject'}
            </button>
            <button onClick={handleApprove} disabled={working} className="ultra-btn ultra-btn-primary" style={{ background:'#16a34a', boxShadow:'0 4px 12px rgba(22,163,74,.25)', minWidth:130, justifyContent:'center' }}>
              <Icons.CheckCircle /> {working && action==='approve' ? 'Approving…' : 'Approve → Mark'}
            </button>
          </div>
        </div>
      </div>
      {viewerOpen && <FileViewerModal filePath={submission.filePath} fileName={submission.fileName} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW MARKS MODAL — read-only, shown when marks are published/locked
// ─────────────────────────────────────────────────────────────────────────────
function ViewMarksModal({ submission, onClose }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const studentName  = submission.student?.username || submission.student?.email || '—';
  const rubricScores = submission.rubricScores || [];
  const aiAnalysis   = submission.aiAnalysis;
  const hasAI        = aiAnalysis?.status === 'done';
  const corrections  = submission.corrections || [];
  const aiBreakdown  = aiAnalysis?.rubricBreakdown || aiAnalysis?.breakdown || [];
  const totalScore   = rubricScores.reduce((a, r) => a + (Number(r.score) || 0), 0);
  const totalMax     = rubricScores.reduce((a, r) => a + (Number(r.maxScore) || 0), 0);
  const sc           = gradeColor(submission.grade);

  return (
    <>
      <div className="ultra-modal-overlay">
        <div className="ultra-modal" style={{ maxWidth:800 }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ background:'#dcfce7', color:'#16a34a', borderRadius:10, padding:'5px 12px', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                <Icons.Lock /> Published &amp; Locked
              </div>
              <div>
                <h2 style={{ fontSize:19, fontWeight:700, margin:0, color:'#0f172a' }}>Marks Overview</h2>
                <p style={{ fontSize:12, color:'#64748b', margin:'2px 0 0' }}>These marks are published to the student and cannot be edited here.</p>
              </div>
            </div>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ padding:8, borderRadius:'50%' }}><Icons.Close /></button>
          </div>

          <div className="ultra-scrollbar" style={{ padding:24, overflowY:'auto', display:'flex', flexDirection:'column', gap:22 }}>

            {/* Student + Assignment */}
            <div style={{ background:'#f8fafc', borderRadius:16, padding:18, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#0f172a', marginBottom:4 }}>{submission.assignmentName}</div>
                <div style={{ color:'#64748b', fontSize:13 }}>Student: <strong>{studentName}</strong> · {submission.moduleCode}</div>
                <div style={{ color:'#94a3b8', fontSize:11, marginTop:4 }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
              </div>
              {submission.filePath && (
                <button onClick={() => setViewerOpen(true)} className="ultra-btn" style={{ background:'#e0e7ff', color:'#4f46e5', fontSize:13 }}>
                  <Icons.Eye /> View Document
                </button>
              )}
            </div>

            {/* Score + Grade */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:`${sc}10`, border:`1px solid ${sc}40`, borderRadius:16, padding:24, textAlign:'center' }}>
                <div style={{ fontSize:52, fontWeight:900, color:sc, lineHeight:1 }}>{submission.score ?? 0}%</div>
                <div style={{ fontSize:13, color:'#64748b', marginTop:6, fontWeight:500 }}>Total Score</div>
              </div>
              <div style={{ background:`${sc}10`, border:`1px solid ${sc}40`, borderRadius:16, padding:24, textAlign:'center' }}>
                <div style={{ fontSize:52, fontWeight:900, color:sc, lineHeight:1 }}>{submission.grade || '—'}</div>
                <div style={{ fontSize:13, color:'#64748b', marginTop:6, fontWeight:500 }}>Letter Grade</div>
              </div>
            </div>

            {/* Rubric Scores Table */}
            {rubricScores.length > 0 && (
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Rubric Breakdown</div>
                <div style={{ border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#f8fafc', fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                        <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:700 }}>Criterion</th>
                        <th style={{ padding:'12px 16px', textAlign:'center', fontWeight:700 }}>Score</th>
                        <th style={{ padding:'12px 16px', textAlign:'center', fontWeight:700 }}>Max</th>
                        <th style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, minWidth:140 }}>Progress</th>
                        {hasAI && <th style={{ padding:'12px 16px', textAlign:'center', fontWeight:700 }}>AI Score</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {rubricScores.map((r, i) => {
                        const pct   = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
                        const bc    = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
                        const aiRb  = hasAI ? aiBreakdown.find(rb => rb.criterion?.toLowerCase() === r.criterion?.toLowerCase()) : null;
                        return (
                          <tr key={i} style={{ borderTop:'1px solid #f1f5f9' }}>
                            <td style={{ padding:'13px 16px', fontWeight:600, color:'#0f172a', fontSize:13 }}>{r.criterion}</td>
                            <td style={{ padding:'13px 16px', textAlign:'center', fontWeight:800, color:bc, fontSize:16 }}>{r.score}</td>
                            <td style={{ padding:'13px 16px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>{r.maxScore}</td>
                            <td style={{ padding:'13px 16px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                                  <div style={{ width:`${pct}%`, height:'100%', background:bc, borderRadius:99 }} />
                                </div>
                                <span style={{ fontSize:11, fontWeight:600, color:bc, minWidth:34 }}>{pct}%</span>
                              </div>
                            </td>
                            {hasAI && (
                              <td style={{ padding:'13px 16px', textAlign:'center' }}>
                                {aiRb
                                  ? <span style={{ fontWeight:700, fontSize:14, color:'#7c3aed' }}>{aiRb.score}<span style={{ color:'#94a3b8', fontWeight:400, fontSize:11 }}>/{r.maxScore}</span></span>
                                  : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:'#f0fdf4', borderTop:'2px solid #bbf7d0' }}>
                        <td style={{ padding:'13px 16px', fontWeight:700, color:'#166534' }}>TOTAL</td>
                        <td style={{ padding:'13px 16px', textAlign:'center', fontWeight:800, color:'#16a34a', fontSize:18 }}>{totalScore}</td>
                        <td style={{ padding:'13px 16px', textAlign:'center', color:'#94a3b8' }}>{totalMax}</td>
                        <td style={{ padding:'13px 16px' }}><span style={{ fontWeight:700, color:'#16a34a' }}>{totalMax > 0 ? Math.round((totalScore/totalMax)*100) : 0}%</span></td>
                        {hasAI && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* AI Summary */}
            {hasAI && (
              <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:16, padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, color:'#7c3aed', marginBottom:14, fontSize:14 }}>
                  <Icons.Sparkle /> AI Analysis Comparison
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom: aiAnalysis.summary ? 14 : 0 }}>
                  <div style={{ background:'#fff', borderRadius:12, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:'#7c3aed' }}>{aiAnalysis.predictedScore}%</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>AI Predicted Score</div>
                  </div>
                  <div style={{ background:'#fff', borderRadius:12, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:28, fontWeight:800, color:gradeColor(aiAnalysis.predictedGrade) }}>{aiAnalysis.predictedGrade}</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>AI Predicted Grade</div>
                  </div>
                </div>
                {aiAnalysis.summary && (
                  <div style={{ background:'#fff', borderRadius:12, padding:14, color:'#4c1d95', fontSize:13, lineHeight:1.6 }}>{aiAnalysis.summary}</div>
                )}
              </div>
            )}

            {/* Feedback */}
            {submission.feedback && (
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:10 }}>Lecturer Feedback</div>
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:18, color:'#334155', fontSize:14, lineHeight:1.7 }}>
                  {submission.feedback}
                </div>
              </div>
            )}

            {/* Pinned corrections */}
            {corrections.length > 0 && (
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:10 }}>Pinned Corrections ({corrections.length})</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {corrections.map((c, i) => (
                    <div key={i} style={{ display:'flex', gap:12, background:'#fffbeb', padding:14, borderRadius:12, borderLeft:'4px solid #f59e0b', color:'#92400e', fontSize:13, alignItems:'flex-start' }}>
                      <Icons.Pin />
                      <div style={{ flex:1, lineHeight:1.5 }}>{c.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lock notice */}
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:14, color:'#166534', fontSize:13, display:'flex', alignItems:'center', gap:10 }}>
              <Icons.Lock />
              <span>These marks are <strong>final and published</strong>. To make any changes, use the <strong>Marking &amp; Feedback</strong> page from the sidebar.</span>
            </div>
          </div>

          <div style={{ padding:'16px 24px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end' }}>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost">Close</button>
          </div>
        </div>
      </div>
      {viewerOpen && <FileViewerModal filePath={submission.filePath} fileName={submission.fileName} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADE MODAL — for ungraded OR draft-saved (not published) submissions only
//   "Save Draft"     → saves marks without publishing
//   "Publish Marks"  → publishes & locks; student notified; cannot edit here again
// ─────────────────────────────────────────────────────────────────────────────
function GradeModal({ submission, onClose, onSaved }) {
  const [score,       setScore]       = useState(submission.score    ?? '');
  const [grade,       setGrade]       = useState(submission.grade    || '');
  const [feedback,    setFeedback]    = useState(submission.feedback || '');
  const [corrections, setCorrections] = useState(submission.corrections || []);
  const [newNote,     setNewNote]     = useState('');
  const [saving,      setSaving]      = useState(false);
  const [action,      setAction]      = useState(null);
  const [error,       setError]       = useState('');
  const [viewerOpen,  setViewerOpen]  = useState(false);

  // Rubric scores come from existing saved marks first.
  // If no marks are saved yet, use the assignment rubric criteria.
  const [rubricScores, setRubricScores] = useState(() => {
    const saved = Array.isArray(submission.rubricScores) ? submission.rubricScores : [];
    const assignmentRubric = Array.isArray(submission.assignmentRubric) ? submission.assignmentRubric : [];

    if (saved.length > 0) {
      return saved.map((r) => ({
        criterion: r.criterion || '',
        score: Number(r.score) || 0,
        maxScore: Number(r.maxScore) || 0,
        percentage: r.maxScore > 0 ? Math.round((Number(r.score) / Number(r.maxScore)) * 100) : 0,
      }));
    }

    return assignmentRubric.map((r) => ({
      criterion: r.criterion || r.title || '',
      score: 0,
      maxScore: Number(r.maxScore) || Number(r.marks) || 0,
      percentage: 0,
    }));
  });

  const updateRubricScore = (index, value) => {
    setRubricScores((prev) => {
      const next = [...prev];
      const raw = Number(value);
      const max = Number(next[index]?.maxScore) || 0;
      const scoreValue = Number.isNaN(raw) ? 0 : Math.max(0, Math.min(raw, max || raw));

      next[index] = {
        ...next[index],
        score: scoreValue,
        percentage: max > 0 ? Math.round((scoreValue / max) * 100) : 0,
      };

      return next;
    });
  };

  const rubricTotal = rubricScores.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const rubricMax = rubricScores.reduce((sum, r) => sum + (Number(r.maxScore) || 0), 0);

  const studentName = submission.student?.username || submission.student?.email || '—';

  const addCorrection = () => {
    if (!newNote.trim()) return;
    setCorrections(prev => [...prev, { note: newNote.trim(), addedAt: new Date().toISOString() }]);
    setNewNote('');
  };
  const removeCorrection = (i) => setCorrections(prev => prev.filter((_, idx) => idx !== i));

  const doSave = async (publish) => {
    if (publish && !feedback.trim()) { setError('Please add feedback before publishing.'); return; }
    setAction(publish ? 'publish' : 'draft'); setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const cleanedRubricScores = rubricScores
        .filter((r) => r.criterion || Number(r.maxScore) > 0)
        .map((r) => ({
          criterion: r.criterion || '',
          score: Number(r.score) || 0,
          maxScore: Number(r.maxScore) || 0,
          percentage: Number(r.maxScore) > 0
            ? Math.round(((Number(r.score) || 0) / Number(r.maxScore)) * 100)
            : 0,
        }));

      await axios.put(
        `${API}/submissions/${submission._id}/grade`,
        {
          score: Number(score) || 0,
          grade,
          feedback,
          corrections,
          rubricScores: cleanedRubricScores,
          ...(publish && { published: true }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save.');
      setSaving(false); setAction(null);
    }
  };

  return (
    <>
      <div className="ultra-modal-overlay">
        <div className="ultra-modal" style={{ maxWidth:700 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #e2e8f0' }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:700, margin:0, color:'#0f172a' }}>Mark Submission</h2>
              <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>
                <strong>Save Draft</strong> to continue later in Marking &amp; Feedback. <strong>Publish</strong> to send marks to the student (locked after).
              </p>
            </div>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ padding:8, borderRadius:'50%' }}><Icons.Close /></button>
          </div>

          <div className="ultra-scrollbar" style={{ padding:24, overflowY:'auto', display:'flex', flexDirection:'column', gap:22 }}>
            {/* Info */}
            <div style={{ background:'#f8fafc', borderRadius:16, padding:18, border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#0f172a', marginBottom:4 }}>{submission.assignmentName}</div>
                <div style={{ color:'#64748b', fontSize:13 }}>Student: <strong>{studentName}</strong> · {submission.moduleCode}</div>
                <div style={{ color:'#94a3b8', fontSize:11, marginTop:4 }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
              </div>
              {submission.filePath && (
                <button onClick={() => setViewerOpen(true)} className="ultra-btn" style={{ background:'#e0e7ff', color:'#4f46e5', fontSize:13 }}>
                  <Icons.File /> View Document
                </button>
              )}
            </div>

            {/* Score + Grade */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label className="ultra-label">Total Score (%)</label>
                <input className="ultra-input" type="number" value={score} onChange={e => setScore(e.target.value)} min={0} max={100} placeholder="0" style={{ fontSize:20, fontWeight:700 }} />
              </div>
              <div>
                <label className="ultra-label">Letter Grade</label>
                <select className="ultra-input" value={grade} onChange={e => setGrade(e.target.value)} style={{ fontSize:16, fontWeight:600 }}>
                  <option value="">Select Grade</option>
                  {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Rubric Criteria Marks */}
            {rubricScores.length > 0 && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <label className="ultra-label" style={{ margin:0 }}>Rubric Criteria Marks</label>
                  <span style={{ background:'#f0fdf4', color:'#166534', padding:'5px 12px', borderRadius:20, fontWeight:800, fontSize:12 }}>
                    Total: {rubricTotal}/{rubricMax || '—'}
                  </span>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {rubricScores.map((r, i) => {
                    const max = Number(r.maxScore) || 0;
                    const value = Number(r.score) || 0;
                    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
                    const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';

                    return (
                      <div
                        key={i}
                        style={{
                          background:'#f8fafc',
                          border:'1px solid #e2e8f0',
                          borderRadius:14,
                          padding:14,
                        }}
                      >
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 110px', gap:12, alignItems:'center' }}>
                          <div>
                            <div style={{ fontWeight:800, color:'#0f172a', fontSize:13 }}>
                              {r.criterion || `Criterion ${i + 1}`}
                            </div>
                            <div style={{ marginTop:8, height:6, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99 }} />
                            </div>
                          </div>

                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <input
                              className="ultra-input"
                              type="number"
                              min="0"
                              max={max || undefined}
                              value={r.score}
                              onChange={(e) => updateRubricScore(i, e.target.value)}
                              style={{ padding:'9px 10px', textAlign:'center', fontWeight:800 }}
                            />
                            <span style={{ color:'#64748b', fontSize:13, fontWeight:700 }}>
                              /{max}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop:10, fontSize:12, color:'#64748b' }}>
                  These criterion marks will appear in the student's report page after saving or publishing.
                </div>
              </div>
            )}

            {/* Feedback */}
            <div>
              <label className="ultra-label">
                Feedback for Student <span style={{ color:'#dc2626' }}>*</span>
                <span style={{ color:'#94a3b8', fontWeight:400 }}> (required before publishing)</span>
              </label>
              <textarea className="ultra-input" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide detailed feedback…" style={{ minHeight:130, resize:'vertical' }} />
            </div>

            {/* Pinned corrections */}
            <div>
              <label className="ultra-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
                Pinned Corrections <span style={{ color:'#94a3b8', fontWeight:400, fontSize:12 }}>(annotations visible to student)</span>
              </label>
              {corrections.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
                  {corrections.map((c, i) => (
                    <div key={i} style={{ display:'flex', gap:12, background:'#fffbeb', padding:14, borderRadius:12, borderLeft:'4px solid #f59e0b', color:'#92400e', fontSize:13, alignItems:'flex-start' }}>
                      <Icons.Pin />
                      <div style={{ flex:1, lineHeight:1.5 }}>{c.note}</div>
                      <button onClick={() => removeCorrection(i)} style={{ background:'none', border:'none', color:'#b45309', cursor:'pointer', padding:4 }}><Icons.Close /></button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <input className="ultra-input" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key==='Enter' && addCorrection()} placeholder="e.g. Pg 4: Citation missing…" style={{ flex:1 }} />
                <button onClick={addCorrection} className="ultra-btn ultra-btn-primary" style={{ padding:'12px 20px' }}>Add Note</button>
              </div>
            </div>

            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:14, color:'#1e40af', fontSize:13 }}>
              💡 For detailed rubric scoring and AI comparison, use <strong>Marking &amp; Feedback</strong> in the sidebar. Save Draft here first, then open that page.
            </div>
          </div>

          <div style={{ padding:'20px 24px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            {error && <div style={{ color:'#dc2626', fontWeight:600, marginRight:'auto', fontSize:13 }}>{error}</div>}
            {!error && (
              <div style={{ marginRight:'auto', fontSize:13, color:'#64748b' }}>
                Score: <strong style={{ color:'#0f172a', fontSize:15 }}>{score||'—'}%</strong>
                {grade && <span style={{ marginLeft:8, background:'#e0e7ff', color:'#4f46e5', padding:'2px 10px', borderRadius:8, fontWeight:700 }}>{grade}</span>}
              </div>
            )}
            <button onClick={onClose} disabled={saving} className="ultra-btn ultra-btn-ghost">Cancel</button>
            <button onClick={() => doSave(false)} disabled={saving} className="ultra-btn ultra-btn-ghost" style={{ border:'1px solid #e2e8f0' }}>
              {saving && action==='draft' ? 'Saving…' : '💾 Save Draft'}
            </button>
            <button onClick={() => doSave(true)} disabled={saving} className="ultra-btn ultra-btn-primary" style={{ background:'#16a34a', boxShadow:'0 4px 12px rgba(22,163,74,.25)', minWidth:150, justifyContent:'center' }}>
              <Icons.CheckCircle />
              {saving && action==='publish' ? 'Publishing…' : 'Publish Marks'}
            </button>
          </div>
        </div>
      </div>
      {viewerOpen && <FileViewerModal filePath={submission.filePath} fileName={submission.fileName} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rubric Builder
// ─────────────────────────────────────────────────────────────────────────────
function RubricBuilder({ rubric, onChange }) {
  const add    = () => onChange([...rubric, { criterion:'', description:'', maxScore:'' }]);
  const remove = i  => onChange(rubric.filter((_, idx) => idx !== i));
  const update = (i, field, val) => onChange(rubric.map((r, idx) => idx===i ? {...r,[field]:val} : r));
  return (
    <div>
      <div className="ultra-label">Rubric Criteria</div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {rubric.map((r, i) => (
          <div key={i} style={{ display:'flex', gap:12, background:'#f8fafc', padding:16, borderRadius:16, border:'1px solid #e2e8f0', alignItems:'flex-start' }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              <input className="ultra-input" value={r.criterion} onChange={e => update(i,'criterion',e.target.value)} placeholder="Criterion Title" style={{ background:'#fff' }} />
              <input className="ultra-input" value={r.description} onChange={e => update(i,'description',e.target.value)} placeholder="Description…" style={{ background:'#fff' }} />
            </div>
            <div style={{ width:100, display:'flex', flexDirection:'column', gap:8 }}>
              <input className="ultra-input" type="number" value={r.maxScore} onChange={e => update(i,'maxScore',e.target.value)} placeholder="Pts" style={{ background:'#fff', textAlign:'center' }} />
              <button onClick={() => remove(i)} className="ultra-btn ultra-btn-danger" style={{ padding:10, justifyContent:'center' }}><Icons.Trash /></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="ultra-btn ultra-btn-ghost" style={{ marginTop:14, width:'100%', justifyContent:'center', border:'1px dashed #cbd5e1', background:'transparent' }}>
        <Icons.Plus /> Add Criterion
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Field
// ─────────────────────────────────────────────────────────────────────────────
function FileUploadField({ label, icon, file, existingUrl, onFileChange }) {
  const displayName = file ? file.name : existingUrl ? `Current: ${existingUrl.split('/').pop()}` : `Click to upload ${label}`;
  return (
    <div>
      <span className="ultra-label">{label}</span>
      <label style={{ display:'flex', alignItems:'center', gap:12, padding:16, border:`2px dashed ${file?'#6366f1':'#cbd5e1'}`, borderRadius:16, background: file?'#eef2ff':'#f8fafc', cursor:'pointer' }}>
        <div style={{ color: file?'#6366f1':'#94a3b8' }}>{icon}</div>
        <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:14, color: file?'#4f46e5':'#64748b', fontWeight:500 }}>{displayName}</span>
        {file && <span onClick={e => { e.preventDefault(); onFileChange(null); }} style={{ padding:4, color:'#dc2626' }}><Icons.Close /></span>}
        <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={e => onFileChange(e.target.files[0]||null)} />
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assignment Modal
// ─────────────────────────────────────────────────────────────────────────────
const SUBMISSION_MODES = ['PDF report submission','Online text submission','File upload','Presentation'];
const WORD_COUNTS      = ['1000-2000 words','2000-3000 words','3000-5000 words','5000+ words','No limit'];

function AssignmentModal({ assignment, onClose, onSave }) {
  const isEdit = !!assignment?._id;
  const [form, setForm] = useState({
    title: assignment?.title||'', moduleCode: assignment?.moduleCode||'',
    moduleName: assignment?.moduleName||'', description: assignment?.description||'',
    deadline: assignment?.deadline ? assignment.deadline.slice(0,10) : '',
    submissionMode: assignment?.submissionMode||'PDF report submission',
    maxWordCount: assignment?.maxWordCount||'3000-5000 words',
    instructions: assignment?.instructions||'', maxScore: assignment?.maxScore??100,
    rubric: assignment?.rubric?.length
      ? assignment.rubric.map(r => ({ criterion:r.criterion||'', description:r.description||'', maxScore:r.maxScore||'' }))
      : [{ criterion:'', description:'', maxScore:'' },{ criterion:'', description:'', maxScore:'' }],
  });
  const [instructionFile, setInstructionFile] = useState(null);
  const [templateFile,    setTemplateFile]    = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const update = (field, value) => setForm(f => ({...f,[field]:value}));

  const handleSave = async () => {
    if (!form.title.trim()||!form.moduleCode.trim()||!form.moduleName.trim()) { setError('Title, Module Code and Module Name are required.'); return; }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      Object.keys(form).forEach(k => { if (k==='rubric') fd.append(k, JSON.stringify(form[k].filter(r=>r.criterion.trim()))); else fd.append(k, form[k]); });
      if (instructionFile) fd.append('instructionFile', instructionFile);
      if (templateFile)    fd.append('templateFile', templateFile);
      const config = { headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'multipart/form-data' } };
      if (isEdit) await axios.put(`${API}/assignments/${assignment._id}`, fd, config);
      else        await axios.post(`${API}/assignments`, fd, config);
      onSave();
    } catch (e) { setError(e.response?.data?.message||'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="ultra-modal-overlay">
      <div className="ultra-modal" style={{ width:'100%', maxWidth:1040, height:'90vh' }}>
        <div style={{ padding:'24px 32px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:0 }}>{isEdit ? 'Edit Assignment' : 'New Assignment'}</h2>
            <p style={{ color:'#64748b', fontSize:14, marginTop:4, marginBottom:0 }}>Configure details and marking rubric.</p>
          </div>
          <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ borderRadius:'50%', padding:10 }}><Icons.Close /></button>
        </div>
        <div className="ultra-scrollbar" style={{ flex:1, overflowY:'auto', padding:32, display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:48, alignItems:'start' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div><label className="ultra-label">Assignment Title *</label><input className="ultra-input" value={form.title} onChange={e=>update('title',e.target.value)} placeholder="e.g. Final Project" /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
              <div><label className="ultra-label">Module Code *</label><input className="ultra-input" value={form.moduleCode} onChange={e=>update('moduleCode',e.target.value)} placeholder="CS304" /></div>
              <div><label className="ultra-label">Module Name *</label><input className="ultra-input" value={form.moduleName} onChange={e=>update('moduleName',e.target.value)} placeholder="Software Engineering" /></div>
            </div>
            <div><label className="ultra-label">Description</label><textarea className="ultra-input" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Overview…" style={{ minHeight:90, resize:'vertical' }} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div><label className="ultra-label">Deadline</label><input className="ultra-input" type="date" value={form.deadline} onChange={e=>update('deadline',e.target.value)} /></div>
              <div><label className="ultra-label">Max Score</label><input className="ultra-input" type="number" value={form.maxScore} onChange={e=>update('maxScore',e.target.value)} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div><label className="ultra-label">Submission Mode</label><select className="ultra-input" value={form.submissionMode} onChange={e=>update('submissionMode',e.target.value)}>{SUBMISSION_MODES.map(m=><option key={m}>{m}</option>)}</select></div>
              <div><label className="ultra-label">Word Count</label><select className="ultra-input" value={form.maxWordCount} onChange={e=>update('maxWordCount',e.target.value)}>{WORD_COUNTS.map(w=><option key={w}>{w}</option>)}</select></div>
            </div>
            <div><label className="ultra-label">Instructions</label><textarea className="ultra-input" value={form.instructions} onChange={e=>update('instructions',e.target.value)} placeholder="Student instructions…" style={{ minHeight:90, resize:'vertical' }} /></div>
            <div style={{ padding:20, background:'#f8fafc', borderRadius:20, border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:16 }}>
              <FileUploadField label="Attach Guidelines" icon={<Icons.File />} file={instructionFile} existingUrl={assignment?.instructionFile} onFileChange={setInstructionFile} />
              <FileUploadField label="Attach Base Template" icon={<Icons.File />} file={templateFile} existingUrl={assignment?.templateFile} onFileChange={setTemplateFile} />
            </div>
          </div>
          <div style={{ position:'sticky', top:0 }}>
            <RubricBuilder rubric={form.rubric} onChange={r=>update('rubric',r)} />
            <div style={{ marginTop:20, padding:16, background:'#eff6ff', borderRadius:16, border:'1px solid #bfdbfe', color:'#1e40af', fontSize:13 }}>
              💡 <strong>AI Marking relies on rubrics.</strong> Total rubric score should match Max Score ({form.maxScore} pts).
            </div>
          </div>
        </div>
        <div style={{ padding:'20px 32px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:16 }}>
          {error && <span style={{ color:'#dc2626', fontSize:14, fontWeight:500, marginRight:'auto' }}>{error}</span>}
          <button onClick={onClose} className="ultra-btn ultra-btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="ultra-btn ultra-btn-primary" style={{ minWidth:160, justifyContent:'center' }}>
            {saving ? 'Processing…' : isEdit ? 'Save Changes' : 'Publish Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ assignment, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/assignments/${assignment._id}`, { headers:{ Authorization:`Bearer ${token}` } });
      onConfirm();
    } catch { setDeleting(false); }
  };
  return (
    <div className="ultra-modal-overlay">
      <div className="ultra-modal" style={{ maxWidth:440, padding:32, textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#fee2e2', color:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Icons.Trash />
        </div>
        <h3 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:'0 0 12px' }}>Delete Assignment?</h3>
        <p style={{ fontSize:15, color:'#64748b', margin:'0 0 32px', lineHeight:1.5 }}>Permanently delete <strong>{assignment.title}</strong>? This cannot be undone.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ justifyContent:'center' }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="ultra-btn ultra-btn-danger" style={{ justifyContent:'center' }}>{deleting?'Deleting…':'Yes, Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Submission Row
// ─────────────────────────────────────────────────────────────────────────────
function SubmissionRow({ s, onView, statusBadge, scoreCell, actionButton }) {
  const ext   = getExt(s.filePath||'');
  const isDoc = ext==='docx'||ext==='doc';
  return (
    <tr className="floating-row">
      <td>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#e0e7ff', color:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>
            {(s.student?.username?.[0]||'S').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:600, color:'#0f172a', fontSize:14 }}>{s.student?.username||s.student?.email||'—'}</div>
            {s.student?.studentId && <div style={{ fontSize:12, color:'#64748b' }}>ID: {s.student.studentId}</div>}
          </div>
        </div>
      </td>
      <td>
        <div style={{ fontWeight:600, color:'#0f172a', fontSize:14 }}>{s.assignmentName||'—'}</div>
        <div style={{ fontSize:12, color:'#6366f1', background:'#e0e7ff', padding:'2px 8px', borderRadius:12, display:'inline-block', marginTop:4, fontWeight:600 }}>{s.moduleCode}</div>
      </td>
      <td>
        {s.filePath ? (
          <button onClick={()=>onView(s)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, color:'#4f46e5', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {isDoc?<Icons.File />:<Icons.Pdf />} View
          </button>
        ) : <span style={{ color:'#94a3b8', fontSize:13 }}>No File</span>}
      </td>
      <td>{statusBadge}</td>
      <td>{scoreCell}</td>
      <td style={{ textAlign:'right' }}>{actionButton}</td>
    </tr>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// RE-GRADE REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
function RegradeModal({ submission, onClose, onActioned }) {
  const [score, setScore] = useState(submission.score ?? '');
  const [grade, setGrade] = useState(submission.grade || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  const studentName = submission.student?.username || submission.student?.email || '—';

  const handleAccept = async () => {
    if (score === '' || Number.isNaN(Number(score))) {
      setError('Please enter a valid score.');
      return;
    }

    setWorking(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      await axios.put(
        `${API}/submissions/${submission._id}/accept-regrade`,
        {
          score: Number(score) || 0,
          grade,
          feedback,
          rubricScores: submission.rubricScores || [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onActioned();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to accept regrade.');
      setWorking(false);
    }
  };

  return (
    <>
      <div className="ultra-modal-overlay">
        <div className="ultra-modal" style={{ maxWidth:640 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #e2e8f0' }}>
            <div>
              <h2 style={{ fontSize:20, fontWeight:700, margin:0, color:'#0f172a' }}>Review Regrade Request</h2>
              <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>Update marks and notify the student.</p>
            </div>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ padding:8, borderRadius:'50%' }}><Icons.Close /></button>
          </div>

          <div className="ultra-scrollbar" style={{ padding:24, overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ background:'#f8fafc', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
              <div style={{ fontWeight:700, fontSize:16, color:'#0f172a', marginBottom:6 }}>{submission.assignmentName}</div>
              <div style={{ color:'#64748b', fontSize:14 }}>Student: <strong>{studentName}</strong> · {submission.moduleCode}</div>
              <div style={{ color:'#94a3b8', fontSize:12, marginTop:6 }}>
                Requested: {submission.regrade?.requestedAt ? new Date(submission.regrade.requestedAt).toLocaleString() : '—'}
              </div>

              {submission.filePath && (
                <button onClick={() => setViewerOpen(true)} className="ultra-btn" style={{ background:'#e0e7ff', color:'#4f46e5', marginTop:14 }}>
                  <Icons.File /> View Document
                </button>
              )}
            </div>

            <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:12, padding:14, color:'#92400e', fontSize:13 }}>
              <strong>Student reason:</strong><br />
              {submission.regrade?.reason || 'No reason provided'}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label className="ultra-label">Updated Score (%)</label>
                <input className="ultra-input" type="number" value={score} onChange={e => setScore(e.target.value)} min={0} max={100} />
              </div>
              <div>
                <label className="ultra-label">Updated Grade</label>
                <select className="ultra-input" value={grade} onChange={e => setGrade(e.target.value)}>
                  <option value="">Select Grade</option>
                  {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="ultra-label">Feedback</label>
              <textarea
                className="ultra-input"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Explain the updated marks..."
                style={{ minHeight:110, resize:'vertical' }}
              />
            </div>
          </div>

          <div style={{ padding:'20px 24px', borderTop:'1px solid #e2e8f0', background:'#f8fafc', display:'flex', justifyContent:'flex-end', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            {error && <div style={{ color:'#dc2626', fontWeight:600, marginRight:'auto', fontSize:13 }}>{error}</div>}
            <button onClick={onClose} disabled={working} className="ultra-btn ultra-btn-ghost">Cancel</button>
            <button onClick={handleAccept} disabled={working} className="ultra-btn ultra-btn-primary" style={{ minWidth:160, justifyContent:'center' }}>
              {working ? 'Saving…' : 'Accept Regrade'}
            </button>
          </div>
        </div>
      </div>

      {viewerOpen && <FileViewerModal filePath={submission.filePath} fileName={submission.fileName} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RE-GRADE REQUESTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function RegradeRequestsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [reviewing,   setReviewing]   = useState(null);
  const [viewing,     setViewing]     = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/submissions/all`, { headers:{ Authorization:`Bearer ${token}` } });
      const regrades = (res.data.submissions || []).filter(s => s.regrade?.status === 'pending');
      setSubmissions(regrades);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = submissions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.student?.username||s.student?.email||'').toLowerCase().includes(q)
      || (s.assignmentName||'').toLowerCase().includes(q)
      || (s.moduleCode||'').toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ background:'#fef9c3', color:'#854d0e', padding:'10px 16px', borderRadius:12, fontSize:13, fontWeight:600 }}>
          ⚠️ {filtered.length} regrade request{filtered.length===1?'':'s'} awaiting review
        </div>
        <div style={{ flex:1, minWidth:260, position:'relative' }}>
          <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}><Icons.Search /></div>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student, assignment…" style={{ width:'100%', padding:'12px 16px 12px 42px', border:'none', borderRadius:12, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.03)', fontSize:14, outline:'none' }} />
        </div>
        <button onClick={fetchData} className="ultra-btn ultra-btn-ghost" style={{ background:'#fff' }}><Icons.Refresh /></button>
      </div>

      {loading ? (
        <div style={{ padding:'60px 0', textAlign:'center', color:'#64748b' }}>
          <div style={{ width:40, height:40, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
          Loading…
        </div>
      ) : filtered.length===0 ? (
        <div style={{ background:'#fff', borderRadius:24, padding:'80px 20px', textAlign:'center', border:'1px dashed #cbd5e1' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><Icons.EmptyBox /></div>
          <h3 style={{ fontSize:18, color:'#0f172a', margin:'0 0 8px' }}>No Regrade Requests Pending</h3>
          <p style={{ color:'#64748b', margin:0 }}>All caught up! New regrade requests will appear here.</p>
        </div>
      ) : (
        <div style={{ overflowX:'auto', paddingBottom:20 }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 12px', minWidth:900 }}>
            <thead>
              <tr style={{ color:'#64748b', fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {['Student','Assignment','Document','Status','Current Marks / Reason','Action'].map((h,i) => (
                  <th key={h} style={{ padding:'0 20px', textAlign: i===5?'right':'left', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <SubmissionRow key={s._id} s={s} onView={setViewing}
                  statusBadge={<span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'#fef9c3', color:'#854d0e' }}>⏳ Regrade Requested</span>}
                  scoreCell={
                    <div>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:13 }}>
                        Current: {s.score ?? 0}% {s.grade ? `(${s.grade})` : ''}
                      </div>
                      <div style={{ color:'#64748b', fontSize:12, marginTop:4, maxWidth:260, whiteSpace:'normal' }}>
                        Reason: {s.regrade?.reason || 'No reason provided'}
                      </div>
                    </div>
                  }
                  actionButton={<button onClick={()=>setReviewing(s)} className="ultra-btn ultra-btn-primary" style={{ padding:'8px 16px', fontSize:13 }}>Review Regrade</button>}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && <RegradeModal submission={reviewing} onClose={()=>setReviewing(null)} onActioned={()=>{ setReviewing(null); fetchData(); }} />}
      {viewing   && <FileViewerModal filePath={viewing.filePath} fileName={viewing.fileName} onClose={()=>setViewing(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK & FEEDBACK TAB
// Shows submissions with approvalStatus 'approved' OR 'draft' (regular submits)
// Button rules:
//   published === true  → "View Marks"   → ViewMarksModal (read-only, locked)
//   Graded & !published → "Edit Marking" → navigate('/lecturer/marking')
//   Pending             → "Mark"         → GradeModal
// ─────────────────────────────────────────────────────────────────────────────
function GradingTab() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');
  const [search,      setSearch]      = useState('');
  const [grading,     setGrading]     = useState(null);
  const [viewing,     setViewing]     = useState(null);
  const [docViewing,  setDocViewing]  = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // ✅ Correct endpoint + show approved and regular (draft) submissions
      const res = await axios.get(`${API}/submissions/all`, { headers:{ Authorization:`Bearer ${token}` } });
      const toShow = (res.data.submissions||[]).filter(
        s => s.approvalStatus==='approved' || s.approvalStatus==='draft'
      );
      setSubmissions(toShow);
    } catch { setSubmissions([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filtered = submissions.filter(s => {
    const matchStatus = filter==='All'
      || (filter==='Pending' && s.status==='Pending')
      || (filter==='Graded'  && s.status==='Graded');
    const name = s.student?.username||s.student?.email||'';
    const matchSearch = !search
      || name.toLowerCase().includes(search.toLowerCase())
      || (s.assignmentName||'').toLowerCase().includes(search.toLowerCase())
      || (s.moduleCode||'').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = submissions.filter(s => s.status==='Pending').length;
  const gradedCount  = submissions.filter(s => s.status==='Graded').length;

  const getActionButton = (s) => {
    if (s.published) {
      // Published & locked → view only, no editing here
      return (
        <button onClick={()=>setViewing(s)} className="ultra-btn ultra-btn-success" style={{ padding:'8px 16px', fontSize:13 }}>
          <Icons.Eye /> View Marks
        </button>
      );
    }
    if (s.status==='Graded') {
      // Saved but not published → go to full marking & feedback page
      return (
        <button
          onClick={()=>navigate('/lecturer/marking', { state:{ submissionId: s._id } })}
          className="ultra-btn"
          style={{ padding:'8px 16px', fontSize:13, color:'#4f46e5', border:'1px solid #c7d2fe', background:'#eef2ff' }}
        >
          <Icons.ExternalLink /> Edit Marking
        </button>
      );
    }
    // Pending / not graded yet → mark it
    return (
      <button onClick={()=>setGrading(s)} className="ultra-btn ultra-btn-primary" style={{ padding:'8px 16px', fontSize:13 }}>
        Mark
      </button>
    );
  };

  const getStatusBadge = (s) => {
    if (s.published) return <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'#dcfce7', color:'#166534', display:'inline-flex', alignItems:'center', gap:5 }}><Icons.Lock /> Published</span>;
    if (s.status==='Graded') return <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'#fef9c3', color:'#854d0e' }}>💾 Draft Saved</span>;
    return <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:'#f1f5f9', color:'#64748b' }}>⏳ Pending</span>;
  };

  return (
    <div>
      <div style={{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', background:'#fff', borderRadius:12, padding:6, boxShadow:'0 2px 8px rgba(0,0,0,.03)', border:'1px solid #f1f5f9' }}>
          {['All','Pending','Graded'].map(s => (
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:'8px 16px', border:'none', background:filter===s?'#f1f5f9':'transparent', color:filter===s?'#0f172a':'#64748b', fontWeight:600, fontSize:13, borderRadius:8, cursor:'pointer', transition:'all .2s' }}>
              {s}
              {s==='Pending' && pendingCount>0 && <span style={{ marginLeft:4, color:'#dc2626' }}>({pendingCount})</span>}
              {s==='Graded'  && gradedCount>0  && <span style={{ marginLeft:4, color:'#16a34a' }}>({gradedCount})</span>}
            </button>
          ))}
        </div>
        <div style={{ flex:1, minWidth:260, position:'relative' }}>
          <div style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}><Icons.Search /></div>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student, assignment…" style={{ width:'100%', padding:'12px 16px 12px 42px', border:'none', borderRadius:12, background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.03)', fontSize:14, outline:'none' }} />
        </div>
        <button onClick={fetchData} className="ultra-btn ultra-btn-ghost" style={{ background:'#fff' }}><Icons.Refresh /></button>
      </div>

      {loading ? (
        <div style={{ padding:'60px 0', textAlign:'center', color:'#64748b' }}>
          <div style={{ width:40, height:40, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
          Loading submissions…
        </div>
      ) : filtered.length===0 ? (
        <div style={{ background:'#fff', borderRadius:24, padding:'80px 20px', textAlign:'center', border:'1px dashed #cbd5e1' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><Icons.EmptyBox /></div>
          <h3 style={{ fontSize:18, color:'#0f172a', margin:'0 0 8px' }}>No Submissions to Mark</h3>
          <p style={{ color:'#64748b', margin:0 }}>
            {filter==='All' ? 'Student submissions will appear here once received.' : `No ${filter.toLowerCase()} submissions found.`}
          </p>
        </div>
      ) : (
        <div style={{ overflowX:'auto', paddingBottom:20 }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 12px', minWidth:900 }}>
            <thead>
              <tr style={{ color:'#64748b', fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {['Student','Assignment','Document','Status','Score','Action'].map((h,i) => (
                  <th key={h} style={{ padding:'0 20px', textAlign:i===5?'right':'left', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <SubmissionRow key={s._id} s={s} onView={setDocViewing}
                  statusBadge={getStatusBadge(s)}
                  scoreCell={
                    s.status==='Graded' ? (
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{s.score??0}%</span>
                        {s.grade && <span style={{ fontSize:12, fontWeight:700, color:gradeColor(s.grade), background:`${gradeColor(s.grade)}15`, padding:'2px 8px', borderRadius:8 }}>{s.grade}</span>}
                      </div>
                    ) : <span style={{ color:'#94a3b8' }}>—</span>
                  }
                  actionButton={getActionButton(s)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GradeModal — only for non-published submissions */}
      {grading && !grading.published && (
        <GradeModal submission={grading} onClose={()=>setGrading(null)} onSaved={()=>{ setGrading(null); fetchData(); }} />
      )}

      {/* ViewMarksModal — read-only for published */}
      {viewing && <ViewMarksModal submission={viewing} onClose={()=>setViewing(null)} />}

      {/* Document viewer */}
      {docViewing && <FileViewerModal filePath={docViewing.filePath} fileName={docViewing.fileName} onClose={()=>setDocViewing(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGE ASSIGNMENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function UploadTab() {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/assignments`, { headers:{ Authorization:`Bearer ${token}` } });
      setAssignments(res.data.assignments||[]);
    } catch { setAssignments([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAssignments(); }, []);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:24 }}>
        <button onClick={()=>setModal('create')} className="ultra-btn ultra-btn-primary" style={{ padding:'12px 24px', fontSize:15 }}>
          <Icons.Plus /> Create Assignment
        </button>
      </div>
      {loading ? (
        <div style={{ padding:'60px 0', textAlign:'center', color:'#64748b' }}>
          <div style={{ width:40, height:40, border:'3px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
          Loading…
        </div>
      ) : assignments.length===0 ? (
        <div style={{ background:'#fff', borderRadius:24, padding:'80px 20px', textAlign:'center', border:'1px dashed #cbd5e1' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><Icons.EmptyBox /></div>
          <h3 style={{ fontSize:18, color:'#0f172a', margin:'0 0 8px' }}>No Active Assignments</h3>
          <p style={{ color:'#64748b', margin:'0 0 24px' }}>Create your first assignment.</p>
          <button onClick={()=>setModal('create')} className="ultra-btn ultra-btn-primary"><Icons.Plus /> Create Now</button>
        </div>
      ) : (
        <div className="ultra-card-grid">
          {assignments.map(a => (
            <div key={a._id} className="ultra-card" style={{ display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ background:'#e0e7ff', color:'#4f46e5', fontWeight:700, fontSize:12, padding:'4px 10px', borderRadius:8 }}>{a.moduleCode}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>setModal({edit:a})} className="ultra-btn ultra-btn-ghost" style={{ padding:8 }}><Icons.Edit /></button>
                  <button onClick={()=>setModal({delete:a})} className="ultra-btn ultra-btn-danger" style={{ padding:8 }}><Icons.Trash /></button>
                </div>
              </div>
              <h3 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:'0 0 4px', lineHeight:1.3 }}>{a.title}</h3>
              <p style={{ fontSize:14, color:'#64748b', margin:'0 0 20px' }}>{a.moduleName}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20, padding:16, background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
                <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Deadline</div><div style={{ fontSize:14, fontWeight:600, color:'#0f172a', marginTop:2 }}>{a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No Limit'}</div></div>
                <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Max Pts</div><div style={{ fontSize:14, fontWeight:600, color:'#0f172a', marginTop:2 }}>{a.maxScore}</div></div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:'auto' }}>
                <span style={{ padding:'4px 10px', background:'#f1f5f9', color:'#475569', fontSize:12, fontWeight:600, borderRadius:20 }}>{a.submissionMode}</span>
                {a.rubric?.length>0 && <span style={{ padding:'4px 10px', background:'#fef3c7', color:'#d97706', fontSize:12, fontWeight:600, borderRadius:20 }}>{a.rubric.length} Criteria</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {(modal==='create'||modal?.edit) && <AssignmentModal assignment={modal?.edit||null} onClose={()=>setModal(null)} onSave={()=>{ setModal(null); fetchAssignments(); }} />}
      {modal?.delete && <DeleteModal assignment={modal.delete} onClose={()=>setModal(null)} onConfirm={()=>{ setModal(null); fetchAssignments(); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LecturerSubmissions() {
  const [activeTab, setActiveTab] = useState('regrades');
  const tabs = [
    { id:'regrades', label:'Regrade Requests' },
    { id:'grading',      label:'Mark & Feedback' },
    { id:'manage',       label:'Manage Assignments' },
  ];
  return (
    <LecturerLayout>
      <style>{styleInjection}</style>
      <div style={{ padding:'32px 40px 12px' }}>
        <h1 style={{ fontSize:32, fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em', margin:'0 0 8px' }}>Submission Hub</h1>
        <p style={{ fontSize:16, color:'#64748b', margin:0 }}>Review regrade requests, grade submissions, and manage assignments.</p>
      </div>
      <div style={{ padding:'0 40px 40px' }}>
        <div style={{ display:'inline-flex', background:'#e2e8f0', padding:6, borderRadius:16, marginBottom:32, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ padding:'10px 24px', border:'none', borderRadius:12, background:activeTab===t.id?'#fff':'transparent', color:activeTab===t.id?'#0f172a':'#64748b', fontWeight:700, fontSize:14, boxShadow:activeTab===t.id?'0 2px 8px rgba(0,0,0,.05)':'none', cursor:'pointer', transition:'all .2s' }}>
              {t.label}
            </button>
          ))}
        </div>
        {activeTab==='regrades' && <RegradeRequestsTab />}
        {activeTab==='grading'      && <GradingTab />}
        {activeTab==='manage'       && <UploadTab />}
      </div>
    </LecturerLayout>
  );
}