import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import { getMySubmissions, getAssignments, submitAssignment, updateSubmission, deleteSubmission } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

// ── AI Report Component ───────────────────────────────────────────────────────
function AIReport({ submission }) {
  const ai = submission?.aiAnalysis;

  if (!ai || ai.status === 'pending') {
    return (
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12,
                    padding: '20px 24px', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0369a1' }}>AI Report — Analysing...</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Your submission is being analysed based on the assignment rubric and instructions. Refresh in a few seconds.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', width: 20, height: 20, border: '3px solid #bae6fd',
                        borderTop: '3px solid #0369a1', borderRadius: '50%',
                        animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (ai.status === 'failed') {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                    padding: '18px 24px', marginTop: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626', marginBottom: 4 }}>
          🤖 AI Report — Analysis Failed
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {ai.message || 'Could not analyse this submission. Please try re-uploading the file.'}
        </div>
      </div>
    );
  }

  if (ai.status !== 'done') return null;

  const importanceColor = (imp) => {
    if (imp === 'High')   return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    if (imp === 'Medium') return { bg: '#fef3c7', color: '#d97706', border: '#fde68a' };
    return                       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
  };

  const gradeColor = (g) => {
    if (!g) return '#6b7280';
    if (g.startsWith('A')) return '#16a34a';
    if (g.startsWith('B')) return '#2563eb';
    if (g.startsWith('C')) return '#d97706';
    return '#dc2626';
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>AI Report</h3>
        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>
          Analysed {ai.analysedAt ? new Date(ai.analysedAt).toLocaleString() : ''}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                      padding: '18px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#16a34a' }}>
            {ai.predictedScore ?? '—'}%
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Predicted Score</div>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12,
                      padding: '18px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: gradeColor(ai.predictedGrade) }}>
            {ai.predictedGrade ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Predicted Grade</div>
        </div>
      </div>

      {ai.summary && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
                      padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>📋 Summary</div>
          <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{ai.summary}</p>
        </div>
      )}

      {ai.strengths?.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                      padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#15803d', marginBottom: 10 }}>✅ Strengths</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ai.strengths.map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {ai.missingParts?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                      padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626', marginBottom: 12 }}>⚠️ Missing Parts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ai.missingParts.map((m, i) => {
              const c = importanceColor(m.importance);
              return (
                <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`,
                                      borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{m.part}</span>
                    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                                   borderRadius: 20, padding: '1px 10px', fontSize: 11, fontWeight: 700 }}>
                      {m.importance}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
                    💡 {m.suggestion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ai.enhancements?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                      padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#d97706', marginBottom: 12 }}>📈 Enhancements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ai.enhancements.map((e, i) => (
              <div key={i} style={{ background: '#fef9c3', border: '1px solid #fde68a',
                                    borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 4 }}>{e.area}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  <strong>Current:</strong> {e.current}
                </div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>
                  <strong>💡 Suggestion:</strong> {e.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ai.rubricBreakdown?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                      padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 12 }}>
            📊 Rubric Breakdown
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Criterion', 'Score', 'Comment'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left',
                                       fontWeight: 600, color: '#6b7280',
                                       borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ai.rubricBreakdown.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#374151' }}>{r.criterion}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{r.score}/{r.maxScore}</span>
                    <div style={{ marginTop: 4, background: '#e5e7eb', borderRadius: 4, height: 6 }}>
                      <div style={{
                        width: `${r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0}%`,
                        background: '#2563eb', borderRadius: 4, height: 6
                      }} />
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#6b7280' }}>{r.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentSubmissions() {
  const location = useLocation();
  const [tab, setTab]                 = useState(location.state?.tab || 'assignments');
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [msg, setMsg]                 = useState('');
  const [editMode, setEditMode]       = useState(false);
  const [removing, setRemoving]       = useState(false);
  const [viewSub, setViewSub]         = useState(null);
  const pollRef                       = useRef(null);

  const fetchAll = () => {
    getMySubmissions().then(r => setSubmissions(r.data.submissions || [])).catch(() => {});
    getAssignments().then(r  => setAssignments(r.data.assignments   || [])).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Poll every 5s while AI is analysing ──────────────────────
  useEffect(() => {
    if (viewSub && viewSub.aiAnalysis?.status === 'pending') {
      pollRef.current = setInterval(async () => {
        try {
          const res     = await API.get(`/submissions/${viewSub._id}`);
          const updated = res.data.submission;
          if (updated.aiAnalysis?.status !== 'pending') {
            setViewSub(updated);
            setSubmissions(prev => prev.map(s => s._id === updated._id ? updated : s));
            clearInterval(pollRef.current);
          }
        } catch {}
      }, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [viewSub]);

  // ── Upload / Edit submission ──────────────────────────────────
  const handleUpload = async () => {
    if (!file || !selected) return;
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('file',           file);
      fd.append('moduleCode',     selected.moduleCode  || '');
      fd.append('moduleName',     selected.moduleName  || selected.title);
      fd.append('assignmentName', selected.title);
      fd.append('assignmentId',   selected._id);
      fd.append('instructions',   selected.instructions || '');
      fd.append('description',    selected.description  || '');
      fd.append('rubric',         JSON.stringify(selected.rubric || []));

      let updatedSub;
      if (editMode && existingSub) {
        const r = await updateSubmission(existingSub._id, fd);
        updatedSub = r.data.submission;
        setMsg('✅ Submission updated! AI is analysing your file...');
      } else {
        const r = await submitAssignment(fd);
        updatedSub = r.data.submission;
        setMsg('✅ Submitted! AI is analysing your file...');
      }

      setFile(null);
      setEditMode(false);
      setViewSub(updatedSub);
      fetchAll();
    } catch { setMsg('❌ Upload failed. Please try again.'); }
    finally  { setUploading(false); }
  };

  // ── Remove submission ─────────────────────────────────────────
  const handleRemove = async () => {
    if (!existingSub) return;
    const removedId = existingSub._id;
    try {
      await deleteSubmission(removedId);
      // ✅ immediately remove from local state so dashboard updates instantly
      setSubmissions(prev => prev.filter(s => s._id !== removedId));
      setSelected(null);
      setRemoving(false);
      setViewSub(null);
      setMsg('');
      // also re-fetch to sync with server
      fetchAll();
    } catch {
      setMsg('❌ Failed to remove submission.');
      setRemoving(false);
    }
  };

  const fmt    = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
  const isPast = (d) => d && new Date(d) < new Date();

  const existingSub = selected
    ? submissions.find(s => s.assignmentName === selected.title || s.assignment === selected._id)
    : null;

  // ─────────────────────────────────────────────────────────────
  // ASSIGNMENT DETAIL PAGE
  // ─────────────────────────────────────────────────────────────
  if (selected) {
    const past       = isPast(selected.deadline);
    const displaySub = viewSub || existingSub;

    return (
      <StudentLayout>
        <div style={{ padding: '30px 40px' }}>

          <button
            onClick={() => { setSelected(null); setMsg(''); setFile(null); setEditMode(false); setRemoving(false); setViewSub(null); clearInterval(pollRef.current); }}
            style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 14,
                     cursor: 'pointer', marginBottom: 20 }}>
            ← Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>📋</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{selected.title}</h2>
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
            {selected.moduleCode} – Assignment detail
          </p>

          {existingSub && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          borderRadius: 8, padding: '8px 16px', marginBottom: 20,
                          fontSize: 13, color: '#15803d', fontWeight: 600 }}>
              ✓ Done: Make a submission
            </div>
          )}

          {selected.createdAt && (
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
              <strong>Opened:</strong> {fmt(selected.createdAt)}
            </p>
          )}
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 20 }}>
            <strong>Due:</strong> {fmt(selected.deadline)}
            {past && <span style={{ color: '#dc2626', marginLeft: 8, fontWeight: 600 }}>(Deadline passed)</span>}
          </p>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                        padding: '22px 28px', marginBottom: 24 }}>
            <ul style={{ listStyle: 'disc', paddingLeft: 20, lineHeight: 2.1,
                          fontSize: 14, color: '#374151', margin: 0 }}>
              <li>Submission Deadline – <strong>{fmt(selected.deadline)}</strong></li>
              <li>Submission Mode – <strong>{selected.submissionMode || 'PDF report submission'}</strong></li>
              {selected.maxWordCount  && <li>Maximum Word Count – <strong>{selected.maxWordCount}</strong></li>}
              {selected.description   && <li>{selected.description}</li>}
              {selected.instructions  && <li><strong>Instructions:</strong> {selected.instructions}</li>}
              <li>File Naming Convention – <strong>StudentID_ModuleCode_AssignmentName</strong></li>
              <li>Submit via the Mentora Student Portal</li>
            </ul>

            {selected.rubric?.length > 0 && (
              <div style={{ marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 10 }}>
                  📊 Marking Rubric
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Criterion', 'Max Score', 'Description'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left',
                                             fontWeight: 600, color: '#6b7280',
                                             borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.rubric.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{r.criterion}</td>
                        <td style={{ padding: '8px 12px', color: '#2563eb', fontWeight: 700 }}>{r.maxScore}</td>
                        <td style={{ padding: '8px 12px', color: '#6b7280' }}>{r.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {existingSub && !past && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button onClick={() => { setEditMode(true); setRemoving(false); setMsg(''); }}
                style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                         padding: '9px 22px', fontSize: 14, fontWeight: 500,
                         cursor: 'pointer', color: '#374151' }}>
                Edit submission
              </button>
              <button onClick={() => { setRemoving(true); setEditMode(false); setMsg(''); }}
                style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                         padding: '9px 22px', fontSize: 14, fontWeight: 500,
                         cursor: 'pointer', color: '#374151' }}>
                Remove submission
              </button>
            </div>
          )}

          {removing && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                          padding: '18px 24px', marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 14 }}>
                ⚠️ Are you sure you want to remove this submission? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleRemove}
                  style={{ background: '#dc2626', color: '#fff', border: 'none',
                           borderRadius: 8, padding: '8px 20px', fontSize: 13,
                           fontWeight: 600, cursor: 'pointer' }}>
                  Yes, Remove
                </button>
                <button onClick={() => setRemoving(false)}
                  style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db',
                           borderRadius: 8, padding: '8px 20px', fontSize: 13,
                           fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                        padding: '22px 28px', marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Submission status</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {[
                  ['Submission status', existingSub ? 'Submitted for grading' : 'No submission yet', !!existingSub],
                  ['Grading status',    existingSub?.status === 'Graded' ? 'Graded' : 'Not marked', false],
                  ['Time remaining',    past ? 'Assignment is now closed' : `Due ${fmt(selected.deadline)}`, false],
                  ['Last modified',     existingSub ? fmt(existingSub.submittedAt) : '—', false],
                  ['File submissions',  existingSub?.fileName || '—', false],
                ].map(([label, value, highlight]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#374151',
                                 background: '#f9fafb', width: '35%', fontSize: 13 }}>
                      {label}
                    </td>
                    <td style={{ padding: '11px 16px',
                                 background: highlight ? '#f0fdf4' : '#fff',
                                 color: highlight ? '#15803d' : '#111827',
                                 fontWeight: highlight ? 600 : 400 }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!existingSub || editMode) && !past && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                          padding: '22px 28px', marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                {editMode ? 'Replace Submission File' : 'Upload Submission'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input type="file" accept=".pdf,.docx"
                  onChange={e => { setFile(e.target.files[0]); setMsg(''); }}
                  style={{ fontSize: 13, color: '#374151' }} />
                <button onClick={handleUpload} disabled={!file || uploading}
                  style={{ background: file && !uploading ? '#2563eb' : '#93c5fd',
                           color: '#fff', border: 'none', borderRadius: 8,
                           padding: '9px 22px', fontSize: 14, fontWeight: 600,
                           cursor: file && !uploading ? 'pointer' : 'not-allowed' }}>
                  {uploading ? 'Uploading…' : editMode ? 'Save Changes' : 'Upload Submission'}
                </button>
                {editMode && (
                  <button onClick={() => { setEditMode(false); setFile(null); setMsg(''); }}
                    style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
                             padding: '9px 20px', fontSize: 14, fontWeight: 500,
                             cursor: 'pointer', color: '#374151' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {msg && (
            <p style={{ marginTop: 12, fontSize: 13,
                        color: msg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
              {msg}
            </p>
          )}

          {past && !existingSub && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                          padding: '16px 24px', color: '#dc2626', fontSize: 14, fontWeight: 600 }}>
              ⚠️ The deadline for this assignment has passed. Submissions are no longer accepted.
            </div>
          )}

          {displaySub && <AIReport submission={displaySub} />}

        </div>
      </StudentLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN SUBMISSIONS PAGE
  // ─────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div style={{ padding: '30px 40px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Submissions</h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
          Manage your assignments and submission history
        </p>

        {/* tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
          {[['assignments','Assignments'],['history','Submission History']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: 'none', border: 'none', padding: '10px 24px',
                       fontSize: 14, fontWeight: 600, cursor: 'pointer',
                       color: tab === t ? '#2563eb' : '#6b7280',
                       borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
                       marginBottom: -2 }}>
              {label}
            </button>
          ))}
        </div>

        {/* ASSIGNMENTS TAB */}
        {tab === 'assignments' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', background: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 15 }}>
              Submission Points
            </div>
            {assignments.length === 0 && (
              <div style={{ padding: 50, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                No assignments available yet.
              </div>
            )}
            {assignments.map((asgn, i) => {
              const sub  = submissions.find(s => s.assignmentName === asgn.title || s.assignment === asgn._id);
              const done = !!sub;
              const past = isPast(asgn.deadline);
              return (
                <div key={asgn._id}
                  style={{ borderBottom: i < assignments.length - 1 ? '1px solid #f3f4f6' : 'none',
                           padding: '18px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                background: done ? '#d1fae5' : '#dbeafe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {done ? '✅' : '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                                  justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        onClick={() => { setSelected(asgn); setMsg(''); setEditMode(false); setRemoving(false); setViewSub(null); }}
                        style={{ background: 'none', border: 'none', padding: 0,
                                 fontSize: 15, fontWeight: 700, color: '#2563eb',
                                 cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
                        {asgn.title}
                      </button>
                      {done && (
                        <span style={{ background: '#d1fae5', color: '#065f46',
                                       borderRadius: 20, padding: '3px 12px',
                                       fontSize: 12, fontWeight: 700 }}>
                          ✓ Done
                        </span>
                      )}
                    </div>
                    <ul style={{ listStyle: 'disc', paddingLeft: 18, marginTop: 8,
                                  fontSize: 13, color: '#374151', lineHeight: 2 }}>
                      <li>Submission Deadline – <strong>{fmt(asgn.deadline)}</strong>
                        {past && <span style={{ color: '#dc2626', marginLeft: 8 }}>(Closed)</span>}
                      </li>
                      <li>Submission Mode – {asgn.submissionMode || 'PDF report submission'}</li>
                      {asgn.maxWordCount && <li>Maximum Word Count – {asgn.maxWordCount}</li>}
                      <li>Module – {asgn.moduleCode} {asgn.moduleName}</li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SUBMISSION HISTORY TAB */}
        {tab === 'history' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb',
                        borderRadius: 12, overflow: 'hidden' }}>
            {submissions.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                <p style={{ fontSize: 14 }}>No submissions yet.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['File','Assignment','Module','Status','Submitted','Score','AI Report'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left',
                                           fontWeight: 600, color: '#374151', fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, i) => (
                    <tr key={s._id || i}
                      style={{ borderBottom: '1px solid #f3f4f6',
                               background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6,
                                       color: '#2563eb', fontWeight: 500 }}>
                          <span style={{ color: '#dc2626' }}>📄</span>
                          {s.fileName || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#374151' }}>{s.assignmentName || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#374151' }}>{s.moduleCode || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: s.status === 'Graded'   ? '#d1fae5'
                                    : s.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                          color:      s.status === 'Graded'   ? '#065f46'
                                    : s.status === 'Rejected' ? '#991b1b' : '#92400e',
                          borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700
                        }}>
                          {s.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#374151' }}>{fmt(s.submittedAt)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                        {s.score != null ? s.score : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {s.aiAnalysis?.status === 'done' ? (
                          <span style={{ background: '#d1fae5', color: '#065f46',
                                         borderRadius: 20, padding: '3px 10px',
                                         fontSize: 11, fontWeight: 700 }}>
                            ✅ {s.aiAnalysis.predictedGrade} ({s.aiAnalysis.predictedScore}%)
                          </span>
                        ) : s.aiAnalysis?.status === 'pending' ? (
                          <span style={{ background: '#fef3c7', color: '#92400e',
                                         borderRadius: 20, padding: '3px 10px',
                                         fontSize: 11, fontWeight: 700 }}>
                            ⏳ Analysing...
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}