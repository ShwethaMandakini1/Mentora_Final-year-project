// ─────────────────────────────────────────────────────────────────────────────
// REPLACE the existing GradeModal in LecturerSubmissions.jsx with this version.
//
// Key fixes:
//  1. Loads rubric criteria from the assignment (assignmentRubric) so the
//     lecturer can score each criterion individually.
//  2. Sends rubricScores[] to the backend so analytics Skill Assessment works.
//  3. Auto-calculates total score from rubric scores.
// ─────────────────────────────────────────────────────────────────────────────

function GradeModal({ submission, onClose, onSaved }) {
  // ── Initialise rubric scores from existing data or assignment rubric ────────
  const initRubricScores = () => {
    const rubric = submission.assignmentRubric || [];
    if (submission.rubricScores?.length > 0) {
      // Pre-fill with existing graded scores
      return submission.rubricScores.map(r => ({
        criterion: r.criterion || '',
        score:     r.score     ?? 0,
        maxScore:  r.maxScore  ?? 0,
      }));
    }
    if (rubric.length > 0) {
      // Pre-fill from assignment rubric with 0 scores
      return rubric.map(r => ({
        criterion: r.criterion || '',
        score:     0,
        maxScore:  Number(r.maxScore) || 0,
      }));
    }
    return [];
  };

  const [rubricScores, setRubricScores] = useState(initRubricScores);
  const [grade,        setGrade]        = useState(submission.grade    || '');
  const [feedback,     setFeedback]     = useState(submission.feedback || '');
  const [corrections,  setCorrections]  = useState(submission.corrections || []);
  const [newNote,      setNewNote]      = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [useRubric,    setUseRubric]    = useState(rubricScores.length > 0);

  // ── Auto-compute total score from rubric ──────────────────────────────────
  const totalMaxScore = rubricScores.reduce((a, r) => a + (Number(r.maxScore) || 0), 0);
  const totalScore    = rubricScores.reduce((a, r) => a + (Number(r.score)    || 0), 0);
  const scorePercent  = totalMaxScore > 0
    ? Math.round((totalScore / totalMaxScore) * 100)
    : (submission.score ?? 0);

  // ── Manual score state (used when no rubric) ──────────────────────────────
  const [manualScore, setManualScore] = useState(submission.score ?? 0);

  const finalScore = useRubric && rubricScores.length > 0 ? scorePercent : Number(manualScore) || 0;

  const studentName = submission.student?.username || submission.student?.email || '—';

  const updateRubricScore = (i, val) => {
    setRubricScores(prev => prev.map((r, idx) =>
      idx === i ? { ...r, score: Math.min(Number(val) || 0, r.maxScore) } : r
    ));
  };

  const addCorrection = () => {
    if (!newNote.trim()) return;
    setCorrections(prev => [...prev, { note: newNote.trim(), addedAt: new Date().toISOString() }]);
    setNewNote('');
  };
  const removeCorrection = i => setCorrections(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/submissions/${submission._id}/grade`,
        {
          score:       finalScore,
          grade,
          feedback,
          rubricScores: useRubric ? rubricScores : [],
          corrections,
          published:   true,
        },
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
        <div className="ultra-modal" style={{ maxWidth: 720 }}>
          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>Mark & Feedback</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Final grading — these marks will be released to the student.</p>
            </div>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost" style={{ padding: 8, borderRadius: '50%' }}><Icons.Close /></button>
          </div>

          <div className="ultra-scrollbar" style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Submission info ── */}
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>{submission.assignmentName}</div>
                <div style={{ color: '#64748b', fontSize: 14 }}>Student: <strong style={{ color: '#334155' }}>{studentName}</strong> • {submission.moduleCode}</div>
                <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 12 }}>Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
              </div>
              {submission.filePath && (
                <button onClick={() => setViewerOpen(true)} className="ultra-btn" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                  <Icons.File /> View Document
                </button>
              )}
            </div>

            {/* ── Rubric scoring (if rubric exists) ── */}
            {rubricScores.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label className="ultra-label" style={{ margin: 0 }}>Rubric Scoring</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Use rubric to calculate score</span>
                    <button
                      onClick={() => setUseRubric(v => !v)}
                      style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: useRubric ? '#6366f1' : '#cbd5e1', transition: 'background 0.2s', position: 'relative' }}
                    >
                      <span style={{ position: 'absolute', top: 3, left: useRubric ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                </div>

                {useRubric && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rubricScores.map((r, i) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{r.criterion}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Max: {r.maxScore} pts</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="number"
                            min={0}
                            max={r.maxScore}
                            value={r.score}
                            onChange={e => updateRubricScore(i, e.target.value)}
                            style={{ width: 70, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 15, fontWeight: 700, textAlign: 'center', outline: 'none', color: '#0f172a' }}
                          />
                          <span style={{ fontSize: 13, color: '#64748b' }}>/ {r.maxScore}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.maxScore > 0 && (r.score / r.maxScore) >= 0.7 ? '#16a34a' : '#f59e0b', background: r.maxScore > 0 && (r.score / r.maxScore) >= 0.7 ? '#dcfce7' : '#fef9c3', padding: '3px 8px', borderRadius: 8 }}>
                            {r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Total computed score */}
                    <div style={{ background: '#e0e7ff', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: 14 }}>Computed Total Score</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#4f46e5' }}>{totalScore}</span>
                        <span style={{ fontSize: 14, color: '#6366f1' }}>/ {totalMaxScore} pts</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', background: '#fff', padding: '4px 12px', borderRadius: 8 }}>{scorePercent}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Manual score (shown when no rubric, or rubric toggle off) ── */}
            {(!useRubric || rubricScores.length === 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="ultra-label">Total Score (%)</label>
                  <input
                    className="ultra-input"
                    type="number"
                    value={manualScore}
                    onChange={e => setManualScore(e.target.value)}
                    min={0} max={100}
                    style={{ fontSize: 20, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label className="ultra-label">Letter Grade</label>
                  <select className="ultra-input" value={grade} onChange={e => setGrade(e.target.value)} style={{ fontSize: 16, fontWeight: 600 }}>
                    <option value="">Select Grade</option>
                    {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── Letter grade (shown alongside rubric too) ── */}
            {useRubric && rubricScores.length > 0 && (
              <div>
                <label className="ultra-label">Letter Grade</label>
                <select className="ultra-input" value={grade} onChange={e => setGrade(e.target.value)} style={{ fontSize: 16, fontWeight: 600, maxWidth: 240 }}>
                  <option value="">Select Grade</option>
                  {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ── Feedback ── */}
            <div>
              <label className="ultra-label">Overall Feedback</label>
              <textarea
                className="ultra-input"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Provide detailed feedback for the student..."
                style={{ minHeight: 120, resize: 'vertical' }}
              />
            </div>

            {/* ── Pinned corrections ── */}
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
                <input
                  className="ultra-input"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCorrection()}
                  placeholder="e.g. Pg 4: Citation missing..."
                  style={{ flex: 1 }}
                />
                <button onClick={addCorrection} className="ultra-btn ultra-btn-primary" style={{ padding: '12px 24px' }}>Add Note</button>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {error && <div style={{ color: '#dc2626', fontWeight: 600, marginRight: 'auto', alignSelf: 'center' }}>{error}</div>}
            <div style={{ marginRight: 'auto', fontSize: 13, color: '#64748b' }}>
              Final score: <strong style={{ color: '#0f172a', fontSize: 16 }}>{finalScore}%</strong>
              {grade && <span style={{ marginLeft: 8, background: '#e0e7ff', color: '#4f46e5', padding: '2px 10px', borderRadius: 8, fontWeight: 700 }}>{grade}</span>}
            </div>
            <button onClick={onClose} className="ultra-btn ultra-btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="ultra-btn ultra-btn-primary" style={{ minWidth: 140, justifyContent: 'center' }}>
              {saving ? 'Saving...' : 'Finalize & Publish'}
            </button>
          </div>
        </div>
      </div>
      {viewerOpen && <FileViewerModal filePath={submission.filePath} fileName={submission.fileName} onClose={() => setViewerOpen(false)} />}
    </>
  );
}