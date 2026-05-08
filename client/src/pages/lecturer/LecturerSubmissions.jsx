import React, { useState, useEffect } from 'react';
import LecturerLayout from './Lecturerlayout';
import axios from 'axios';
import './dashboard.css';

const API = 'http://localhost:5000/api';
const BASE = 'http://localhost:5000';

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildFileUrl(filePath) {
  if (!filePath) return null;
  let clean = filePath.replace(/\\/g, '/');
  if (clean.startsWith('http')) return clean;
  if (clean.includes(':/') || clean.includes('/submissions/')) {
    const filename = clean.split('/submissions/').pop();
    return `${BASE}/submissions/${filename}`;
  }
  return `${BASE}/${clean.replace(/^\//, '')}`;
}

function getExt(filePath) {
  if (!filePath) return '';
  return filePath.split('.').pop().toLowerCase();
}

function getViewerUrl(filePath) {
  const url = buildFileUrl(filePath);
  if (!url) return null;
  const ext = getExt(filePath);
  if (ext === 'docx' || ext === 'doc') {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  File: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  Pdf: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 12v6"></path><path d="M8 12h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8"></path></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>,
  Search: () => <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" /><path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  Pin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3h0a3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>,
  EmptyBox: () => <svg viewBox="0 0 40 40" fill="none" width="48" height="48" style={{ color: '#cbd5e1' }}><rect x="6" y="10" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.8" /><path d="M12 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" /><path d="M6 16h28M16 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

// ── Global Styles Injection ───────────────────────────────────────────────────
// These styles guarantee the "ultra-modern" look overriding any generic CSS.
const styleInjection = `
  .ultra-input {
    width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px;
    font-size: 14px; color: #0f172a; background: #f8fafc; outline: none; transition: all 0.2s;
    box-sizing: border-box; font-family: inherit;
  }
  .ultra-input:focus { background: #fff; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
  .ultra-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
  .ultra-btn { display: inline-flex; alignItems: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; border: none; }
  .ultra-btn-primary { background: #6366f1; color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.25); }
  .ultra-btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
  .ultra-btn-ghost { background: #f1f5f9; color: #475569; }
  .ultra-btn-ghost:hover { background: #e2e8f0; color: #0f172a; }
  .ultra-btn-danger { background: #fee2e2; color: #dc2626; }
  .ultra-btn-danger:hover { background: #fecaca; }
  .ultra-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
  .ultra-card { background: #fff; border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; transition: transform 0.2s, box-shadow 0.2s; }
  .ultra-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); border-color: #e2e8f0; }
  .floating-row { background: #fff; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .floating-row:hover { transform: translateY(-2px) scale(1.002); box-shadow: 0 8px 24px rgba(0,0,0,0.06); position: relative; z-index: 10; border-radius: 12px; }
  .floating-row td { padding: 16px 20px; border-bottom: none; border-top: 1px solid transparent; border-bottom: 1px solid transparent; }
  .floating-row td:first-child { border-radius: 16px 0 0 16px; border-left: 1px solid transparent; }
  .floating-row td:last-child { border-radius: 0 16px 16px 0; border-right: 1px solid transparent; }
  .ultra-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; opacity: 0; animation: fadeIn 0.2s forwards; }
  .ultra-modal { background: #fff; border-radius: 24px; box-shadow: 0 24px 64px rgba(0,0,0,0.2); overflow: hidden; transform: scale(0.95); animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; max-height: 90vh; display: flex; flex-direction: column; }
  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes scaleUp { to { transform: scale(1); } }
  .ultra-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .ultra-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .ultra-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// File Viewer Modal
// ─────────────────────────────────────────────────────────────────────────────
function FileViewerModal({ filePath, fileName, onClose }) {
  const ext       = getExt(filePath);
  const fileUrl   = buildFileUrl(filePath);
  const viewerUrl = getViewerUrl(filePath);
  const isDoc     = ext === 'docx' || ext === 'doc';
  const isPdf     = ext === 'pdf';

  return (
    <div className="ultra-modal-overlay">
      <div className="ultra-modal" style={{ width: '100%', maxWidth: 1000, height: '90vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: isPdf ? '#fee2e2' : '#e0e7ff', color: isPdf ? '#dc2626' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPdf ? <Icons.Pdf /> : <Icons.File />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{fileName || 'Submitted Document'}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext} Format</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={fileUrl} download className="ultra-btn ultra-btn-ghost" style={{ textDecoration: 'none' }}>
              <Icons.Download /> Download
            </a>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost">
              <Icons.Close /> Close
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', background: '#e2e8f0' }}>
          {isDoc || isPdf ? (
            <iframe src={viewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
              <div style={{ color: '#94a3b8', marginBottom: 16 }}><Icons.File /></div>
              <p style={{ fontSize: 16, fontWeight: 500 }}>Preview not available for this format.</p>
              <a href={fileUrl} download style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600, marginTop: 8 }}>Download to view directly</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card-Based Rubric Builder
// ─────────────────────────────────────────────────────────────────────────────
function RubricBuilder({ rubric, onChange }) {
  const add    = () => onChange([...rubric, { criterion: '', description: '', maxScore: '' }]);
  const remove = i  => onChange(rubric.filter((_, idx) => idx !== i));
  const update = (i, field, value) => onChange(rubric.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  return (
    <div>
      <div className="ultra-label">Rubric Criteria</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rubric.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="ultra-input" value={r.criterion} onChange={e => update(i, 'criterion', e.target.value)} placeholder="Criterion Title (e.g. Code Quality)" style={{ background: '#fff', padding: '10px 14px' }} />
              <input className="ultra-input" value={r.description} onChange={e => update(i, 'description', e.target.value)} placeholder="Detailed description..." style={{ background: '#fff', padding: '10px 14px' }} />
            </div>
            <div style={{ width: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="ultra-input" type="number" value={r.maxScore} onChange={e => update(i, 'maxScore', e.target.value)} placeholder="Pts" style={{ background: '#fff', padding: '10px 14px', textAlign: 'center' }} />
              <button onClick={() => remove(i)} className="ultra-btn ultra-btn-danger" style={{ padding: '10px', justifyContent: 'center' }}><Icons.Trash /></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="ultra-btn ultra-btn-ghost" style={{ marginTop: 16, width: '100%', justifyContent: 'center', border: '1px dashed #cbd5e1', background: 'transparent' }}>
        <Icons.Plus /> Add New Criterion
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
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', border: `2px dashed ${file ? '#6366f1' : '#cbd5e1'}`, borderRadius: 16, background: file ? '#eef2ff' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
        <div style={{ color: file ? '#6366f1' : '#94a3b8' }}>{icon}</div>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, color: file ? '#4f46e5' : '#64748b', fontWeight: 500 }}>{displayName}</span>
        {file && (
          <span onClick={e => { e.preventDefault(); onFileChange(null); }} style={{ padding: 4, color: '#dc2626' }}><Icons.Close /></span>
        )}
        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => onFileChange(e.target.files[0] || null)} />
      </label>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assignment Modal (Create / Edit)
// ─────────────────────────────────────────────────────────────────────────────
const SUBMISSION_MODES = ['PDF report submission', 'Online text submission', 'File upload', 'Presentation'];
const WORD_COUNTS      = ['1000-2000 words', '2000-3000 words', '3000-5000 words', '5000+ words', 'No limit'];

function AssignmentModal({ assignment, onClose, onSave }) {
  const isEdit = !!assignment?._id;
  const [form, setForm] = useState({
    title:          assignment?.title          || '',
    moduleCode:     assignment?.moduleCode     || '',
    moduleName:     assignment?.moduleName     || '',
    description:    assignment?.description    || '',
    deadline:       assignment?.deadline       ? assignment.deadline.slice(0, 10) : '',
    submissionMode: assignment?.submissionMode || 'PDF report submission',
    maxWordCount:   assignment?.maxWordCount   || '3000-5000 words',
    instructions:   assignment?.instructions   || '',
    maxScore:       assignment?.maxScore       ?? 100,
    rubric: assignment?.rubric?.length
      ? assignment.rubric.map(r => ({ criterion: r.criterion || '', description: r.description || '', maxScore: r.maxScore || '' }))
      : [{ criterion: '', description: '', maxScore: '' }, { criterion: '', description: '', maxScore: '' }],
  });
  const [instructionFile, setInstructionFile] = useState(null);
  const [templateFile,    setTemplateFile]    = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.moduleCode.trim() || !form.moduleName.trim()) {
      setError('Title, Module Code and Module Name are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const fd = new FormData();
      Object.keys(form).forEach(k => {
        if (k === 'rubric') fd.append(k, JSON.stringify(form[k].filter(r => r.criterion.trim())));
        else fd.append(k, form[k]);
      });
      if (instructionFile) fd.append('instructionFile', instructionFile);
      if (templateFile)    fd.append('templateFile',    templateFile);

      const config = { headers: { ...headers, 'Content-Type': 'multipart/form-data' } };
      if (isEdit) await axios.put(`${API}/assignments/${assignment._id}`, fd, config);
      else        await axios.post(`${API}/assignments`, fd, config);
      onSave();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save assignment.');
    } finally { setSaving(false); }
  };

  return (
    <div className="ultra-modal-overlay">
      <div className="ultra-modal" style={{ width: '100%', maxWidth: 1040, height: '90vh' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Edit Assignment' : 'New Assignment'}</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4, marginBottom: 0 }}>Configure assignment details and marking rubric.</p>
          </div>
          <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ borderRadius: '50%', padding: 10 }}><Icons.Close /></button>
        </div>

        <div className="ultra-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="ultra-label">Assignment Title *</label>
              <input className="ultra-input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Enterprise Architecture Final" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div>
                <label className="ultra-label">Module Code *</label>
                <input className="ultra-input" value={form.moduleCode} onChange={e => update('moduleCode', e.target.value)} placeholder="CS304" />
              </div>
              <div>
                <label className="ultra-label">Module Name *</label>
                <input className="ultra-input" value={form.moduleName} onChange={e => update('moduleName', e.target.value)} placeholder="Software Engineering" />
              </div>
            </div>
            <div>
              <label className="ultra-label">Description</label>
              <textarea className="ultra-input" value={form.description} onChange={e => update('description', e.target.value)} placeholder="A brief overview..." style={{ minHeight: 100, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="ultra-label">Deadline</label>
                <input className="ultra-input" type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
              </div>
              <div>
                <label className="ultra-label">Max Score</label>
                <input className="ultra-input" type="number" value={form.maxScore} onChange={e => update('maxScore', e.target.value)} placeholder="100" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="ultra-label">Submission Mode</label>
                <select className="ultra-input" value={form.submissionMode} onChange={e => update('submissionMode', e.target.value)}>
                  {SUBMISSION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="ultra-label">Word Count Limit</label>
                <select className="ultra-input" value={form.maxWordCount} onChange={e => update('maxWordCount', e.target.value)}>
                  {WORD_COUNTS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="ultra-label">Instructions & Brief</label>
              <textarea className="ultra-input" value={form.instructions} onChange={e => update('instructions', e.target.value)} placeholder="Specific student instructions..." style={{ minHeight: 100, resize: 'vertical' }} />
            </div>
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FileUploadField label="Attach Guidelines (PDF/Doc)" icon={<Icons.File />} file={instructionFile} existingUrl={assignment?.instructionFile} onFileChange={setInstructionFile} />
              <FileUploadField label="Attach Base Template" icon={<Icons.File />} file={templateFile} existingUrl={assignment?.templateFile} onFileChange={setTemplateFile} />
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0 }}>
            <RubricBuilder rubric={form.rubric} onChange={r => update('rubric', r)} />
            <div style={{ marginTop: 24, padding: 16, background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe', color: '#1e40af', fontSize: 13, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 24 }}>💡</div>
              <div style={{ lineHeight: 1.5 }}>
                <strong>AI Marking relies on rubrics.</strong><br/>
                Ensure your total rubric score adds up to the Assignment's Max Score ({form.maxScore} pts) for optimal grading accuracy.
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 32px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          {error && <span style={{ color: '#dc2626', fontSize: 14, fontWeight: 500, marginRight: 'auto' }}>{error}</span>}
          <button onClick={onClose} className="ultra-btn ultra-btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="ultra-btn ultra-btn-primary" style={{ minWidth: 160, justifyContent: 'center' }}>
            {saving ? 'Processing...' : isEdit ? 'Save Changes' : 'Publish Assignment'}
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
      await axios.delete(`${API}/assignments/${assignment._id}`, { headers: { Authorization: `Bearer ${token}` } });
      onConfirm();
    } catch { setDeleting(false); }
  };
  return (
    <div className="ultra-modal-overlay">
      <div className="ultra-modal" style={{ maxWidth: 440, padding: 32, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path></svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Delete Assignment?</h3>
        <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 32px', lineHeight: 1.5 }}>
          You are about to permanently delete <strong>{assignment.title}</strong>.<br/>This action cannot be undone.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="ultra-btn ultra-btn-danger" style={{ justifyContent: 'center' }}>
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grade Modal 
// ─────────────────────────────────────────────────────────────────────────────
function GradeModal({ submission, onClose, onSaved }) {
  const [score,       setScore]       = useState(submission.score    ?? 0);
  const [grade,       setGrade]       = useState(submission.grade    || '');
  const [feedback,    setFeedback]    = useState(submission.feedback || '');
  const [corrections, setCorrections] = useState(submission.corrections || []);
  const [newNote,     setNewNote]     = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [viewerOpen,  setViewerOpen]  = useState(false);

  const studentName = submission.student?.username || submission.student?.email || '—';
  
  const addCorrection = () => {
    if (!newNote.trim()) return;
    setCorrections(prev => [...prev, { note: newNote.trim(), addedAt: new Date().toISOString() }]);
    setNewNote('');
  };
  const removeCorrection = (i) => setCorrections(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/submissions/${submission._id}/grade`,
        { score: Number(score), grade, feedback, corrections },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save grade.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="ultra-modal-overlay">
        <div className="ultra-modal" style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>Submission Grading</h2>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ padding: 8, borderRadius: '50%' }}><Icons.Close /></button>
          </div>

          <div className="ultra-scrollbar" style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>{submission.assignmentName}</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>Student: <strong style={{ color: '#334155' }}>{studentName}</strong> • {submission.moduleCode}</div>
                <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 12 }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
              </div>
              {submission.filePath && (
                <button onClick={() => setViewerOpen(true)} className="ultra-btn ultra-btn-primary" style={{ background: '#e0e7ff', color: '#4f46e5', boxShadow: 'none' }}>
                  <Icons.File /> View Document
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="ultra-label">Total Score</label>
                <input className="ultra-input" type="number" value={score} onChange={e => setScore(e.target.value)} min={0} placeholder="0" style={{ fontSize: 20, fontWeight: 700 }} />
              </div>
              <div>
                <label className="ultra-label">Letter Grade</label>
                <select className="ultra-input" value={grade} onChange={e => setGrade(e.target.value)} style={{ fontSize: 16, fontWeight: 600 }}>
                  <option value="">Select Grade</option>
                  {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="ultra-label">Overall Feedback</label>
              <textarea className="ultra-input" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide detailed feedback for the student..." style={{ minHeight: 120, resize: 'vertical' }} />
            </div>

            <div>
              <label className="ultra-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Pinned Corrections <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: 12 }}>(Visible annotations)</span>
              </label>

              {corrections.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {corrections.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, background: '#fffbeb', padding: 16, borderRadius: 12, borderLeft: '4px solid #f59e0b', color: '#92400e', fontSize: 14, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 2 }}><Icons.Pin /></div>
                      <div style={{ flex: 1, lineHeight: 1.5 }}>{c.note}</div>
                      <button onClick={() => removeCorrection(i)} style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', padding: 4 }}><Icons.Close /></button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <input className="ultra-input" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCorrection()} placeholder="e.g. Pg 4: Citation missing..." style={{ flex: 1 }} />
                <button onClick={addCorrection} className="ultra-btn ultra-btn-primary" style={{ padding: '12px 24px' }}>Add Note</button>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {error && <div style={{ color: '#dc2626', fontWeight: 600, marginRight: 'auto', alignSelf: 'center' }}>{error}</div>}
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ultra-btn ultra-btn-primary" style={{ minWidth: 140, justifyContent: 'center' }}>
              {saving ? 'Saving...' : 'Finalize Grade'}
            </button>
          </div>
        </div>
      </div>
      {viewerOpen && <FileViewerModal filePath={submission.filePath} fileName={submission.fileName} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View Submissions Tab (Floating Table Rows)
// ─────────────────────────────────────────────────────────────────────────────
function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('All');
  const [search,      setSearch]      = useState('');
  const [grading,     setGrading]     = useState(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/submissions/all`, { headers: { Authorization: `Bearer ${token}` } });
      setSubmissions(res.data.submissions || []);
    } catch { setSubmissions([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const filtered = submissions.filter(s => {
    const matchStatus = filter === 'All' || s.status === filter;
    const name = s.student?.username || s.student?.email || '';
    const matchSearch = !search
      || name.toLowerCase().includes(search.toLowerCase())
      || (s.assignmentName || '').toLowerCase().includes(search.toLowerCase())
      || (s.moduleCode     || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          {['All', 'Pending', 'Graded', 'Rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 16px', border: 'none', background: filter === s ? '#f1f5f9' : 'transparent', color: filter === s ? '#0f172a' : '#64748b', fontWeight: 600, fontSize: 13, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
              {s}
            </button>
          ))}
        </div>
        
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><Icons.Search /></div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, assignment..." style={{ width: '100%', padding: '12px 16px 12px 42px', border: 'none', borderRadius: 12, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', fontSize: 14, outline: 'none' }} />
        </div>

        <button onClick={fetchSubmissions} className="ultra-btn ultra-btn-ghost" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <Icons.Refresh />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          Loading submissions...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Icons.EmptyBox /></div>
          <h3 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 8px' }}>No Submissions Found</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', minWidth: 900 }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 700 }}>Student</th>
                <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 700 }}>Assignment</th>
                <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 700 }}>Document</th>
                <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0 20px', textAlign: 'left', fontWeight: 700 }}>Score</th>
                <th style={{ padding: '0 20px', textAlign: 'right', fontWeight: 700 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const fileUrl = buildFileUrl(s.filePath);
                const ext     = getExt(s.filePath || '');
                const isDoc   = ext === 'docx' || ext === 'doc';
                const viewUrl = isDoc ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=false` : fileUrl;
                
                return (
                  <tr key={s._id} className="floating-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                          {(s.student?.username?.[0] || s.student?.email?.[0] || 'S').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{s.student?.username || s.student?.email || '—'}</div>
                          {s.student?.studentId && <div style={{ fontSize: 12, color: '#64748b' }}>ID: {s.student.studentId}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{s.assignmentName || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: 12, display: 'inline-block', marginTop: 4, fontWeight: 600 }}>{s.moduleCode}</div>
                    </td>
                    <td>
                      {s.filePath ? (
                        <a href={viewUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
                          <span style={{ color: '#4f46e5' }}>{isDoc ? <Icons.File /> : <Icons.Pdf />}</span> View
                        </a>
                      ) : <span style={{ color: '#94a3b8', fontSize: 13 }}>No File</span>}
                    </td>
                    <td>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.status === 'Graded' ? '#dcfce7' : s.status === 'Rejected' ? '#fee2e2' : '#fef9c3', color: s.status === 'Graded' ? '#166534' : s.status === 'Rejected' ? '#991b1b' : '#854d0e' }}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      {s.status === 'Graded' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{s.score ?? 0}</span>
                          {s.grade && <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#e0e7ff', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{s.grade}</span>}
                        </div>
                      ) : <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => setGrading(s)} className={`ultra-btn ${s.status === 'Graded' ? 'ultra-btn-ghost' : 'ultra-btn-primary'}`} style={{ padding: '8px 16px', fontSize: 13 }}>
                        {s.status === 'Graded' ? 'Edit Grade' : 'Evaluate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {grading && <GradeModal submission={grading} onClose={() => setGrading(null)} onSaved={() => { setGrading(null); fetchSubmissions(); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Assignments Tab (Dashboard Grid Layout)
// ─────────────────────────────────────────────────────────────────────────────
function UploadTab() {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      setAssignments(res.data.assignments || []);
    } catch { setAssignments([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button onClick={() => setModal('create')} className="ultra-btn ultra-btn-primary" style={{ padding: '12px 24px', fontSize: 15, borderRadius: 12 }}>
          <Icons.Plus /> Create Assignment
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          Loading assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 24, padding: '80px 20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Icons.EmptyBox /></div>
          <h3 style={{ fontSize: 18, color: '#0f172a', margin: '0 0 8px' }}>No Active Assignments</h3>
          <p style={{ color: '#64748b', margin: '0 0 24px' }}>Create your first assignment to start accepting submissions.</p>
          <button onClick={() => setModal('create')} className="ultra-btn ultra-btn-primary"><Icons.Plus /> Create Now</button>
        </div>
      ) : (
        <div className="ultra-card-grid">
          {assignments.map(a => (
            <div key={a._id} className="ultra-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ background: '#e0e7ff', color: '#4f46e5', fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.05em' }}>
                  {a.moduleCode}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setModal({ edit: a })} className="ultra-btn ultra-btn-ghost" style={{ padding: 8, borderRadius: 8 }}><Icons.Edit /></button>
                  <button onClick={() => setModal({ delete: a })} className="ultra-btn ultra-btn-danger" style={{ padding: 8, borderRadius: 8 }}><Icons.Trash /></button>
                </div>
              </div>
              
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>{a.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>{a.moduleName}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Deadline</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No Limit'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Max Pts</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{a.maxScore}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
                <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600, borderRadius: 20 }}>{a.submissionMode}</span>
                {a.rubric?.length > 0 && <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 600, borderRadius: 20 }}>{a.rubric.length} Criteria</span>}
                {a.templateFile && <span style={{ padding: '4px 10px', background: '#e0f2fe', color: '#0284c7', fontSize: 12, fontWeight: 600, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}><Icons.Check /> Template</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || modal?.edit) && <AssignmentModal assignment={modal?.edit || null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchAssignments(); }} />}
      {modal?.delete && <DeleteModal assignment={modal.delete} onClose={() => setModal(null)} onConfirm={() => { setModal(null); fetchAssignments(); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LecturerSubmissions() {
  const [activeTab, setActiveTab] = useState('view');

  return (
    <LecturerLayout>
      <style>{styleInjection}</style>
      
      <div style={{ padding: '32px 40px 12px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Submission Hub</h1>
        <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>Review assignments, manage grading rubrics, and track student progress.</p>
      </div>

      <div style={{ padding: '0 40px 40px' }}>
        {/* Sleek Segmented Control (Pill Tabs) */}
        <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: 6, borderRadius: 16, marginBottom: 32 }}>
          <button 
            onClick={() => setActiveTab('view')} 
            style={{ padding: '10px 24px', border: 'none', borderRadius: 12, background: activeTab === 'view' ? '#fff' : 'transparent', color: activeTab === 'view' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: 14, boxShadow: activeTab === 'view' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Review Submissions
          </button>
          <button 
            onClick={() => setActiveTab('upload')} 
            style={{ padding: '10px 24px', border: 'none', borderRadius: 12, background: activeTab === 'upload' ? '#fff' : 'transparent', color: activeTab === 'upload' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: 14, boxShadow: activeTab === 'upload' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Manage Assignments
          </button>
        </div>

        {activeTab === 'view' ? <SubmissionsTab /> : <UploadTab />}
      </div>
    </LecturerLayout>
  );
}