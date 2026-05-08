import React, { useState, useEffect } from 'react';
import LecturerLayout from './Lecturerlayout';
import axios from 'axios';
import './dashboard.css';

const API = 'http://localhost:5000/api';
const BASE = 'http://localhost:5000';

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle = {
  display: 'block', fontSize: 12, color: '#6b7280',
  marginBottom: 4, fontWeight: 500,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Builds a clean file URL from filePath stored in DB
function buildFileUrl(filePath) {
  if (!filePath) return null;
  // Normalize backslashes to forward slashes
  let clean = filePath.replace(/\\/g, '/');
  // If it already starts with http, return as-is
  if (clean.startsWith('http')) return clean;
  // If it's an absolute Windows path like D:/Mentora/.../submissions/file.pdf
  // extract just the filename and build a clean URL
  if (clean.includes(':/') || clean.includes('/submissions/')) {
    const filename = clean.split('/submissions/').pop();
    return `${BASE}/submissions/${filename}`;
  }
  // Strip any leading slash so we don't double up
  return `${BASE}/${clean.replace(/^\//, '')}`;
}

// Returns the file extension in lowercase
function getExt(filePath) {
  if (!filePath) return '';
  return filePath.split('.').pop().toLowerCase();
}

// Returns a viewer URL: Google Docs Viewer for docx/doc, direct URL for pdf
function getViewerUrl(filePath) {
  const url = buildFileUrl(filePath);
  if (!url) return null;
  const ext = getExt(filePath);
  if (ext === 'docx' || ext === 'doc') {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url; // PDF opens directly in new tab
}

// ─────────────────────────────────────────────────────────────────────────────
// File Viewer Modal — opens file in a modal with iframe
// ─────────────────────────────────────────────────────────────────────────────
function FileViewerModal({ filePath, fileName, onClose }) {
  const ext       = getExt(filePath);
  const fileUrl   = buildFileUrl(filePath);
  const viewerUrl = getViewerUrl(filePath);
  const isDoc     = ext === 'docx' || ext === 'doc';
  const isPdf     = ext === 'pdf';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900,
        height: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{isPdf ? '📄' : '📝'}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{fileName || 'Submitted File'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{ext.toUpperCase()} file</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Download button */}
            <a
              href={fileUrl}
              download
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#f9fafb', color: '#374151', fontSize: 12, fontWeight: 500,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              ⬇️ Download
            </a>
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: '#f9fafb', color: '#374151', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, overflow: 'hidden', borderRadius: '0 0 16px 16px' }}>
          {isDoc ? (
            <iframe
              src={viewerUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Document Viewer"
            />
          ) : isPdf ? (
            <iframe
              src={viewerUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Viewer"
            />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', color: '#6b7280', gap: 12,
            }}>
              <div style={{ fontSize: 48 }}>📎</div>
              <div style={{ fontSize: 14 }}>This file type cannot be previewed.</div>
              <a href={fileUrl} download style={{ color: '#2563eb', fontSize: 13 }}>⬇️ Download to view</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rubric Builder
// ─────────────────────────────────────────────────────────────────────────────
function RubricBuilder({ rubric, onChange }) {
  const add    = () => onChange([...rubric, { criterion: '', description: '', maxScore: '' }]);
  const remove = i  => onChange(rubric.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    onChange(rubric.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: '#1e293b' }}>Rubric Builder</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['Criterion', 'Description', 'Max Score', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: '5px 4px' }}>
                  <input value={r.criterion} onChange={e => update(i, 'criterion', e.target.value)}
                    placeholder="e.g. Clarity" style={{ ...inputStyle, padding: '6px 8px', fontSize: 12, width: 110 }} />
                </td>
                <td style={{ padding: '5px 4px' }}>
                  <input value={r.description} onChange={e => update(i, 'description', e.target.value)}
                    placeholder="Description..." style={{ ...inputStyle, padding: '6px 8px', fontSize: 12, width: 170 }} />
                </td>
                <td style={{ padding: '5px 4px' }}>
                  <input type="number" value={r.maxScore} onChange={e => update(i, 'maxScore', e.target.value)}
                    placeholder="0" style={{ ...inputStyle, padding: '6px 8px', fontSize: 12, width: 65 }} />
                </td>
                <td style={{ padding: '5px 4px' }}>
                  <button onClick={() => remove(i)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', color: '#dc2626', fontSize: 14 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={add} style={{ marginTop: 10, background: 'none', border: '1px dashed #94a3b8', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', color: '#64748b', fontSize: 13 }}>
        + Add Criterion
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Field
// ─────────────────────────────────────────────────────────────────────────────
function FileUploadField({ label, icon, file, existingUrl, onFileChange }) {
  const displayName = file
    ? file.name
    : existingUrl
      ? `Current: ${existingUrl.split('/').pop()}`
      : `Click to upload ${label} (PDF / DOCX)`;

  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        border: `1px dashed ${file ? '#3b82f6' : '#93c5fd'}`, borderRadius: 8, cursor: 'pointer',
        background: file ? '#eff6ff' : '#f8fafc', fontSize: 13, color: '#1d4ed8',
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
        {file && (
          <span onClick={e => { e.preventDefault(); onFileChange(null); }}
            style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, flexShrink: 0, lineHeight: 1 }}>✕</span>
        )}
        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
          onChange={e => onFileChange(e.target.files[0] || null)} />
      </label>
      {existingUrl && !file && (
        <a href={`${BASE}${existingUrl}`} target="_blank" rel="noreferrer"
          style={{ fontSize: 11, color: '#1d4ed8', marginTop: 4, display: 'inline-block' }}>
          📥 View current file
        </a>
      )}
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
  const existingInstruction = assignment?.instructionFile || null;
  const existingTemplate    = assignment?.templateFile    || null;
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
      fd.append('title',          form.title);
      fd.append('moduleCode',     form.moduleCode);
      fd.append('moduleName',     form.moduleName);
      fd.append('description',    form.description);
      fd.append('deadline',       form.deadline);
      fd.append('submissionMode', form.submissionMode);
      fd.append('maxWordCount',   form.maxWordCount);
      fd.append('instructions',   form.instructions);
      fd.append('maxScore',       form.maxScore);
      fd.append('rubric', JSON.stringify(form.rubric.filter(r => r.criterion.trim())));
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 960, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: '#111827', margin: 0 }}>
            {isEdit ? '✏️ Edit Assignment' : '📋 Upload Assignment'}
          </h2>
          <button onClick={onClose} className="btn-outline" style={{ padding: '6px 14px' }}>✕ Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>Assignment Details</div>
            <div><label style={labelStyle}>Assignment Title *</label>
              <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Data Structures Report" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Module Code *</label>
                <input value={form.moduleCode} onChange={e => update('moduleCode', e.target.value)} placeholder="e.g. CS201" style={inputStyle} />
              </div>
              <div><label style={labelStyle}>Module Name *</label>
                <input value={form.moduleName} onChange={e => update('moduleName', e.target.value)} placeholder="e.g. Data Structures" style={inputStyle} />
              </div>
            </div>
            <div><label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Brief overview..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Deadline</label>
                <input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} style={inputStyle} />
              </div>
              <div><label style={labelStyle}>Max Score</label>
                <input type="number" value={form.maxScore} onChange={e => update('maxScore', e.target.value)} placeholder="100" style={inputStyle} />
              </div>
            </div>
            <div><label style={labelStyle}>Submission Mode</label>
              <select value={form.submissionMode} onChange={e => update('submissionMode', e.target.value)} style={inputStyle}>
                {SUBMISSION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Max Word Count</label>
              <select value={form.maxWordCount} onChange={e => update('maxWordCount', e.target.value)} style={inputStyle}>
                {WORD_COUNTS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Instructions</label>
              <textarea value={form.instructions} onChange={e => update('instructions', e.target.value)}
                placeholder="Detailed instructions for students..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>📎 Attach Documents</div>
              <FileUploadField label="Instruction Document" icon="📄" file={instructionFile} existingUrl={existingInstruction} onFileChange={setInstructionFile} />
              <FileUploadField label="Template Document"    icon="📋" file={templateFile}    existingUrl={existingTemplate}    onFileChange={setTemplateFile} />
            </div>
          </div>
          {/* Right: Rubric */}
          <div>
            <RubricBuilder rubric={form.rubric} onChange={r => update('rubric', r)} />
            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
              💡 Rubric criteria are used for AI-assisted marking. Sum of Max Scores should equal {form.maxScore}.
            </div>
          </div>
        </div>

        {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 14, padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '10px 24px' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '10px 28px', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : isEdit ? 'Update Assignment' : 'Upload Assignment'}
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: '#111827', margin: '0 0 10px', textAlign: 'center' }}>Delete Assignment</h3>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', textAlign: 'center' }}>
          Are you sure you want to delete <strong>"{assignment.title}"</strong>?<br />This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} className="btn-outline" style={{ padding: '10px 24px' }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grade Modal — FIXED: file viewer + corrections panel
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
  const ext = getExt(submission.filePath || '');
  const fileLabel = ext === 'pdf' ? '📄 View PDF' : ext === 'docx' || ext === 'doc' ? '📝 View Word Doc' : '📎 View File';

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
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: 32,
          width: '100%', maxWidth: 640,
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111827', margin: 0 }}>📝 Grade Submission</h2>
            <button onClick={onClose} className="btn-outline" style={{ padding: '6px 14px' }}>✕</button>
          </div>

          {/* Submission info */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>{submission.assignmentName}</div>
            <div style={{ color: '#6b7280' }}>Student: <strong>{studentName}</strong> · {submission.moduleCode} · {submission.moduleName}</div>
            <div style={{ color: '#9ca3af', marginTop: 4, fontSize: 12 }}>
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
            </div>

            {/* ── FIXED: View file button opens modal viewer ── */}
            {submission.filePath && (
              <button
                onClick={() => setViewerOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 10, padding: '6px 14px',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 8, color: '#2563eb', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                {fileLabel}
              </button>
            )}
          </div>

          {/* Score + Grade */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Score</label>
                <input type="number" value={score} onChange={e => setScore(e.target.value)} min={0} placeholder="0" style={inputStyle} />
              </div>
              <div><label style={labelStyle}>Grade</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} style={inputStyle}>
                  <option value="">Select grade</option>
                  {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {/* Feedback */}
            <div><label style={labelStyle}>Feedback</label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Write detailed feedback for the student..." rows={4}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* ── Corrections / Inline Notes ── */}
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>
                ✏️ Corrections & Notes
                <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                  (visible to student)
                </span>
              </label>

              {/* Existing corrections */}
              {corrections.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {corrections.map((c, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      background: '#fffbeb', border: '1px solid #fde68a',
                      borderRadius: 8, padding: '8px 12px', fontSize: 12,
                    }}>
                      <span style={{ fontSize: 14 }}>📌</span>
                      <div style={{ flex: 1, color: '#92400e', lineHeight: 1.5 }}>{c.note}</div>
                      <button
                        onClick={() => removeCorrection(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: 0, flexShrink: 0 }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new correction */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCorrection()}
                  placeholder="e.g. Page 3: Citation missing, Page 5: Incorrect formula used..."
                  style={{ ...inputStyle, fontSize: 12 }}
                />
                <button
                  onClick={addCorrection}
                  style={{
                    flexShrink: 0, padding: '0 16px', borderRadius: 8,
                    border: 'none', background: '#2563eb', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + Add
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Press Enter or click Add. Each note pinpoints a specific mistake for the student.
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={onClose} className="btn-outline" style={{ padding: '10px 24px' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '10px 24px', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </div>
      </div>

      {/* File viewer modal */}
      {viewerOpen && (
        <FileViewerModal
          filePath={submission.filePath}
          fileName={submission.fileName}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View Submissions Tab
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
    <div className="card">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
          {['All', 'Pending', 'Graded', 'Rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search student, assignment, module..."
          style={{ flex: 1, minWidth: 220, padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        <button onClick={fetchSubmissions} className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Loading submissions...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <div style={{ color: '#9ca3af', fontSize: 14 }}>No submissions found.</div>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              {['Student', 'Assignment', 'Module', 'File', 'Submitted', 'Status', 'Score', 'Action'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const fileUrl = buildFileUrl(s.filePath);
              const ext     = getExt(s.filePath || '');
              const isDoc   = ext === 'docx' || ext === 'doc';
              const viewUrl = isDoc
                ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=false`
                : fileUrl;
              return (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.student?.username || s.student?.email || '—'}</div>
                    {s.student?.studentId && <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.student.studentId}</div>}
                  </td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.assignmentName || '—'}
                  </td>
                  <td>
                    <div>{s.moduleCode}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.moduleName}</div>
                  </td>
                  <td>
                    {/* ── FIXED: opens in new tab, docx via Google Docs Viewer ── */}
                    {s.filePath
                      ? <a href={viewUrl} target="_blank" rel="noreferrer"
                          style={{ color: '#2563eb', fontSize: 12, textDecoration: 'none' }}>
                          {isDoc ? '📝' : '📄'} {s.fileName || 'View'}
                        </a>
                      : '—'}
                  </td>
                  <td style={{ fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <span className={`badge ${s.status?.toLowerCase()}`}>{s.status}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {s.status === 'Graded' ? `${s.score ?? 0}${s.grade ? ` · ${s.grade}` : ''}` : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setGrading(s)}
                      className="btn-primary"
                      style={{ padding: '5px 12px', fontSize: 11, background: s.status === 'Graded' ? '#6366f1' : undefined }}
                    >
                      {s.status === 'Graded' ? '✏️ Re-grade' : '📝 Grade'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {grading && (
        <GradeModal submission={grading} onClose={() => setGrading(null)} onSaved={() => { setGrading(null); fetchSubmissions(); }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload Assignments Tab
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setModal('create')} className="btn-primary" style={{ padding: '10px 20px' }}>
          + Upload Assignment
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="card" style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ color: '#6b7280', fontSize: 15 }}>No assignments yet.</div>
          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>Click "Upload Assignment" to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignments.map(a => (
            <div key={a._id} className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{a.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  <span style={{ fontWeight: 500, color: '#374151' }}>{a.moduleCode}</span> · {a.moduleName}
                  {a.deadline && <span> · Due: <strong>{new Date(a.deadline).toLocaleDateString()}</strong></span>}
                  <span> · Max Score: <strong>{a.maxScore}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{a.submissionMode}</span>
                  <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{a.maxWordCount}</span>
                  {a.rubric?.length > 0 && <span className="badge" style={{ background: '#fef9c3', color: '#ca8a04', fontSize: 11, padding: '2px 10px', borderRadius: 20 }}>{a.rubric.length} rubric criteria</span>}
                  {a.instructionFile && <a href={`${BASE}${a.instructionFile}`} target="_blank" rel="noreferrer" style={{ background: '#f0f9ff', color: '#0369a1', fontSize: 11, padding: '2px 10px', borderRadius: 20, textDecoration: 'none' }}>📄 Instructions</a>}
                  {a.templateFile    && <a href={`${BASE}${a.templateFile}`}    target="_blank" rel="noreferrer" style={{ background: '#f0f9ff', color: '#0369a1', fontSize: 11, padding: '2px 10px', borderRadius: 20, textDecoration: 'none' }}>📋 Template</a>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setModal({ edit: a })} className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>✏️ Edit</button>
                <button onClick={() => setModal({ delete: a })} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || modal?.edit) && (
        <AssignmentModal assignment={modal?.edit || null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchAssignments(); }} />
      )}
      {modal?.delete && (
        <DeleteModal assignment={modal.delete} onClose={() => setModal(null)} onConfirm={() => { setModal(null); fetchAssignments(); }} />
      )}
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
      <div className="topbar">
        <div className="topbar-left">
          <h1>Submissions</h1>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24, gap: 4 }}>
          {[['view', 'View Submissions'], ['upload', 'Upload Assignments']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '10px 24px', cursor: 'pointer', fontSize: 14,
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? '#2563eb' : '#6b7280',
              borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none', border: 'none', outline: 'none',
              marginBottom: -2, transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {activeTab === 'view' ? <SubmissionsTab /> : <UploadTab />}
      </div>
    </LecturerLayout>
  );
}