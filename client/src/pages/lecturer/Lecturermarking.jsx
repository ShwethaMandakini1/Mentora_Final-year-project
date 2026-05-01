import React, { useState, useEffect, useCallback } from 'react';
import LecturerLayout from './LecturerLayout';
import { getAllSubmissions, gradeSubmission } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

const BASE    = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

function getGrade(pct) {
  if(pct>=90)return'A+';if(pct>=85)return'A';if(pct>=80)return'A-';
  if(pct>=75)return'B+';if(pct>=70)return'B';if(pct>=65)return'B-';
  if(pct>=60)return'C+';if(pct>=55)return'C';return'F';
}

function gradeColor(g) {
  if(!g)return'#6b7280';
  if(g.startsWith('A'))return'#16a34a';
  if(g.startsWith('B'))return'#2563eb';
  if(g.startsWith('C'))return'#d97706';
  return'#dc2626';
}

function buildFileUrl(fp) {
  if (!fp) return null;
  let c = fp.replace(/\\/g, '/');
  if (c.startsWith('http')) return c;
  if (c.includes(':/') || c.includes('/submissions/')) {
    return `${BASE}/submissions/${c.split('/submissions/').pop()}`;
  }
  return `${BASE}/${c.replace(/^\//, '')}`;
}

function getExt(fp) {
  return fp ? fp.split('.').pop().toLowerCase() : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Table
// ─────────────────────────────────────────────────────────────────────────────
function ComparisonTable({ rubric, lecturerScores, aiBreakdown, finalScores, onFinalChange }) {
  if (!rubric || rubric.length === 0) return (
    <div style={{ textAlign:'center', padding:32, color:'#9ca3af', fontSize:13 }}>
      No rubric criteria found for this assignment.
    </div>
  );

  // Normalize a criterion name for fuzzy matching
  // e.g. "Thesis & Argument Clarity" → "thesis argument clarity"
  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

  // Find AI breakdown entry for a rubric criterion — tries exact first, then fuzzy
  const findAiRb = (criterion) => {
    if (!aiBreakdown?.length) return null;
    // 1. Exact match
    let match = aiBreakdown.find(rb => rb.criterion === criterion);
    if (match) return match;
    // 2. Case-insensitive
    match = aiBreakdown.find(rb => rb.criterion?.toLowerCase() === criterion.toLowerCase());
    if (match) return match;
    // 3. Fuzzy — check if all words of one are contained in the other
    const normC = norm(criterion);
    match = aiBreakdown.find(rb => {
      const normRb = norm(rb.criterion);
      return normC.includes(normRb) || normRb.includes(normC) ||
        normC.split(' ').filter(w => w.length > 3).every(w => normRb.includes(w));
    });
    return match || null;
  };

  const rows = rubric.map(r => {
    const lecVal   = lecturerScores[r.criterion];
    const lecScore = (lecVal !== undefined && lecVal !== '') ? Number(lecVal) : null;
    const aiRb     = findAiRb(r.criterion);
    const aiScore  = aiRb ? Number(aiRb.score) : null;
    const max      = Number(r.maxScore) || 1;

    const lecPct = lecScore !== null ? Math.round((lecScore / max) * 100) : null;
    const aiPct  = aiScore  !== null ? Math.round((aiScore  / max) * 100) : null;
    const diff   = (lecPct !== null && aiPct !== null) ? Math.abs(lecPct - aiPct) : null;
    const agree  = diff !== null && diff <= 10;

    const finalVal = finalScores[r.criterion];
    const final    = (finalVal !== undefined && finalVal !== '') ? Number(finalVal) : (lecScore ?? 0);

    return { criterion: r.criterion, max, lecScore, aiScore, lecPct, aiPct, diff, agree, final, aiComment: aiRb?.comment || '' };
  });

  const lecTotal   = rows.reduce((a, r) => a + (r.lecScore ?? 0), 0);
  const aiTotal    = rows.reduce((a, r) => a + (r.aiScore  ?? 0), 0);
  const finalTotal = rows.reduce((a, r) => a + r.final, 0);
  const maxTotal   = rows.reduce((a, r) => a + r.max, 0);
  const hasAnyLec  = rows.some(r => r.lecScore !== null);
  const hasAnyAI   = rows.some(r => r.aiScore  !== null);

  const MiniBar = ({ value, max, color }) => {
    const w = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div style={{ height:5, background:'#e5e7eb', borderRadius:99, marginTop:3, width:60 }}>
        <div style={{ width:`${w}%`, height:'100%', background:color, borderRadius:99 }} />
      </div>
    );
  };

  return (
    <div>
      <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid #e5e7eb' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['Criterion','Lecturer Score','AI Score','Match?','AI Comment','Final Score'].map(h => (
                <th key={h} style={{
                  padding:'12px 14px', textAlign:'left', fontWeight:700,
                  color:'#374151', fontSize:11, borderBottom:'2px solid #e5e7eb',
                  whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{
                borderBottom:'1px solid #f3f4f6',
                background: r.agree === false ? '#fffbeb' : i % 2 === 0 ? '#fff' : '#fafafa',
              }}>

                {/* Criterion */}
                <td style={{ padding:'12px 14px', fontWeight:600, color:'#111827', maxWidth:160 }}>
                  {r.criterion}
                  <div style={{ fontSize:11, color:'#9ca3af', fontWeight:400 }}>Max: {r.max}</div>
                </td>

                {/* Lecturer Score — only what lecturer typed */}
                <td style={{ padding:'12px 14px' }}>
                  {r.lecScore !== null ? (
                    <div>
                      <span style={{ fontWeight:700, fontSize:15, color:'#2563eb' }}>{r.lecScore}</span>
                      <span style={{ color:'#9ca3af', fontSize:11 }}>/{r.max}</span>
                      <MiniBar value={r.lecScore} max={r.max} color="#2563eb" />
                      <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{r.lecPct}%</div>
                    </div>
                  ) : (
                    <span style={{ color:'#d1d5db', fontSize:12, fontStyle:'italic' }}>Not scored yet</span>
                  )}
                </td>

                {/* AI Score — purely from AI, never affected by lecturer */}
                <td style={{ padding:'12px 14px' }}>
                  {r.aiScore !== null ? (
                    <div>
                      <span style={{ fontWeight:700, fontSize:15, color:'#7c3aed' }}>{r.aiScore}</span>
                      <span style={{ color:'#9ca3af', fontSize:11 }}>/{r.max}</span>
                      <MiniBar value={r.aiScore} max={r.max} color="#7c3aed" />
                      <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{r.aiPct}%</div>
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:'#9ca3af', fontStyle:'italic' }}>
                      No AI data
                      <div style={{ fontSize:10, color:'#d1d5db', marginTop:2 }}>Run AI analysis first</div>
                    </div>
                  )}
                </td>

                {/* Match — only meaningful when both have scores */}
                <td style={{ padding:'12px 14px' }}>
                  {r.diff !== null ? (
                    <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{
                        padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                        background: r.agree ? '#dcfce7' : '#fee2e2',
                        color:      r.agree ? '#16a34a' : '#dc2626',
                      }}>
                        {r.agree ? '✅ Match' : '⚠️ Differs'}
                      </span>
                      <span style={{ fontSize:10, color:'#9ca3af' }}>{r.diff}% gap</span>
                    </div>
                  ) : (
                    <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>
                  )}
                </td>

                {/* AI Comment */}
                <td style={{ padding:'12px 14px', maxWidth:200 }}>
                  {r.aiComment
                    ? <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.5 }}>{r.aiComment}</div>
                    : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>
                  }
                </td>

                {/* Final Score — editable, defaults to lecturer's score */}
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <input
                      type="number" min="0" max={r.max}
                      value={finalScores[r.criterion] ?? r.lecScore ?? ''}
                      onChange={e => {
                        let v = e.target.value === '' ? '' : Number(e.target.value);
                        if (v !== '' && v < 0) v = 0;
                        if (v !== '' && v > r.max) v = r.max;
                        onFinalChange(r.criterion, v);
                      }}
                      style={{
                        width:64, border:'2px solid #2563eb', borderRadius:7,
                        padding:'6px 8px', fontSize:14, fontWeight:700,
                        textAlign:'center', outline:'none', color:'#111827',
                        background:'#eff6ff',
                      }}
                    />
                    <span style={{ fontSize:10, color:'#9ca3af', textAlign:'center' }}>/{r.max}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Totals */}
          <tfoot>
            <tr style={{ background:'#f1f5f9', borderTop:'2px solid #e2e8f0' }}>
              <td style={{ padding:'12px 14px', fontWeight:700, color:'#111827', fontSize:13 }}>TOTAL</td>
              <td style={{ padding:'12px 14px' }}>
                {hasAnyLec ? (
                  <>
                    <span style={{ fontWeight:800, fontSize:16, color:'#2563eb' }}>{lecTotal}</span>
                    <span style={{ color:'#9ca3af', fontSize:11 }}>/{maxTotal}</span>
                    <div style={{ fontSize:11, color:'#2563eb' }}>
                      {getGrade(Math.round((lecTotal/maxTotal)*100))} ({Math.round((lecTotal/maxTotal)*100)}%)
                    </div>
                  </>
                ) : <span style={{ color:'#d1d5db', fontSize:12, fontStyle:'italic' }}>Not scored yet</span>}
              </td>
              <td style={{ padding:'12px 14px' }}>
                {hasAnyAI ? (
                  <>
                    <span style={{ fontWeight:800, fontSize:16, color:'#7c3aed' }}>{aiTotal}</span>
                    <span style={{ color:'#9ca3af', fontSize:11 }}>/{maxTotal}</span>
                    <div style={{ fontSize:11, color:'#7c3aed' }}>
                      {getGrade(Math.round((aiTotal/maxTotal)*100))} ({Math.round((aiTotal/maxTotal)*100)}%)
                    </div>
                  </>
                ) : <span style={{ color:'#d1d5db', fontSize:12, fontStyle:'italic' }}>No AI data</span>}
              </td>
              <td style={{ padding:'12px 14px' }}>
                {hasAnyLec && hasAnyAI ? (() => {
                  const d = Math.abs(Math.round((lecTotal/maxTotal)*100) - Math.round((aiTotal/maxTotal)*100));
                  return (
                    <span style={{
                      padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                      background: d <= 10 ? '#dcfce7' : '#fee2e2',
                      color:      d <= 10 ? '#16a34a' : '#dc2626',
                    }}>
                      {d <= 10 ? '✅ Overall Match' : `⚠️ ${d}% gap`}
                    </span>
                  );
                })() : <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>}
              </td>
              <td style={{ padding:'12px 14px', color:'#9ca3af', fontSize:11 }}>—</td>
              <td style={{ padding:'12px 14px' }}>
                <span style={{ fontWeight:800, fontSize:16, color:'#111827' }}>{finalTotal}</span>
                <span style={{ color:'#9ca3af', fontSize:11 }}>/{maxTotal}</span>
                <div style={{ fontSize:12, fontWeight:700, color:gradeColor(getGrade(Math.round((finalTotal/maxTotal)*100))) }}>
                  {getGrade(Math.round((finalTotal/maxTotal)*100))} ({Math.round((finalTotal/maxTotal)*100)}%)
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display:'flex', gap:20, marginTop:12, fontSize:11, color:'#6b7280', flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:10, height:10, background:'#2563eb', borderRadius:2, display:'inline-block' }}/> Lecturer Score
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:10, height:10, background:'#7c3aed', borderRadius:2, display:'inline-block' }}/> AI Score
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:10, height:10, background:'#eff6ff', border:'2px solid #2563eb', borderRadius:2, display:'inline-block' }}/> Final Score (editable)
        </span>
        <span style={{ color:'#9ca3af' }}>✅ Match = within 10% gap &nbsp;|&nbsp; ⚠️ Differs = review needed</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Bar
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ score, maxScore }) {
  const pct   = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
      <div style={{ flex:1, height:5, background:'#e5e7eb', borderRadius:99 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99 }} />
      </div>
      <span style={{ fontSize:11, fontWeight:600, color, minWidth:44 }}>{score}/{maxScore}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function LecturerMarking() {
  const [submissions, setSubmissions] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [lecScores,   setLecScores]   = useState({});  // ONLY lecturer's manually typed scores
  const [finalScores, setFinalScores] = useState({});  // final decided scores (editable)
  const [feedback,    setFeedback]    = useState('');
  const [loadingAI,   setLoadingAI]   = useState(false);
  const [reanalysing, setReanalysing] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [msg,         setMsg]         = useState({ text:'', type:'' });
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('mark');

  const fetchSubs = useCallback(async () => {
    try {
      const r    = await getAllSubmissions();
      const subs = r.data.submissions || [];
      setSubmissions(subs);
      return subs;
    } catch { return []; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSubs().then(subs => { if (subs.length > 0) initSub(subs[0]); });
  }, []);

  const initSub = (sub) => {
    setSelected(sub);
    setFeedback(sub.feedback || '');
    setMsg({ text:'', type:'' });
    setActiveTab('mark');
    // Only pre-fill from previously SAVED rubricScores (lecturer's own past work)
    const lec = {};
    if (sub.rubricScores?.length > 0) {
      sub.rubricScores.forEach(r => { lec[r.criterion] = r.score; });
    }
    setLecScores(lec);
    setFinalScores({ ...lec });
  };

  const getRubric = (sub, aiBreakdown) => {
    // Priority 1: Use AI breakdown criteria — this guarantees rubric matches AI data
    if (aiBreakdown?.length > 0) {
      return aiBreakdown.map(rb => ({
        criterion: rb.criterion,
        maxScore:  rb.maxScore || rb.max_score || rb.max || 10,
      }));
    }
    // Priority 2: Assignment rubric from submission
    if (sub?.assignmentRubric?.length > 0) return sub.assignmentRubric;
    // Priority 3: Previously saved rubricScores
    if (sub?.rubricScores?.length > 0)
      return sub.rubricScores.map(r => ({ criterion: r.criterion, maxScore: r.maxScore }));
    // Fallback default
    return [
      { criterion: 'Thesis & Argument Clarity', maxScore: 30 },
      { criterion: 'Evidence & Source Quality',  maxScore: 25 },
      { criterion: 'Structure & Organisation',   maxScore: 20 },
      { criterion: 'Critical Analysis',          maxScore: 15 },
      { criterion: 'Writing Mechanics',          maxScore: 10 },
    ];
  };

  const aiAnalysis     = selected?.aiAnalysis;
  const hasAIData      = aiAnalysis?.status === 'done';

  // rubricBreakdown can be stored under different field names depending on backend version
  const aiBreakdownData = aiAnalysis?.rubricBreakdown
    || aiAnalysis?.breakdown
    || aiAnalysis?.criteria
    || aiAnalysis?.scores
    || aiAnalysis?.rubric
    || [];

  // Build rubric using AI breakdown criteria when available so they always align
  const rubric = getRubric(selected, aiBreakdownData);

  // Lecturer total — only counts what lecturer actually typed
  const lecTotal = rubric.reduce((a, r) => {
    const v = lecScores[r.criterion];
    return a + ((v !== undefined && v !== '') ? Number(v) : 0);
  }, 0);
  const maxTotal  = rubric.reduce((a, r) => a + (Number(r.maxScore) || 0), 0);
  const lecPct    = maxTotal > 0 ? Math.round((lecTotal / maxTotal) * 100) : 0;
  const lecGrade  = getGrade(lecPct);

  // Final total — uses lecScore as fallback per criterion, matching table row behaviour
  const finalTotal = rubric.reduce((a, r) => {
    const fv = finalScores[r.criterion];
    const lv = lecScores[r.criterion];
    const val = (fv !== undefined && fv !== '') ? Number(fv) : ((lv !== undefined && lv !== '') ? Number(lv) : 0);
    return a + val;
  }, 0);
  const finalPct   = maxTotal > 0 ? Math.round((finalTotal / maxTotal) * 100) : 0;
  const finalGrade = getGrade(finalPct);

  // AI total — purely from AI data, never mixed with lecturer input
  const aiTotal = hasAIData
    ? aiBreakdownData.reduce((a, rb) => a + (Number(rb.score) || 0), 0)
    : null;
  const aiPct = (aiTotal !== null && maxTotal > 0) ? Math.round((aiTotal / maxTotal) * 100) : null;

  // ── "Use AI Scores" → copies AI scores into FINAL column ONLY
  //    Lecturer column is NEVER auto-filled — it only ever shows what the lecturer typed
  const applyAIScoresToFinal = () => {
    if (!hasAIData) {
      reanalyse(true);
      return;
    }
    const normStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const findAiScore = (criterion) => {
      const bd = aiBreakdownData;
      let match = bd.find(rb => rb.criterion === criterion);
      if (!match) match = bd.find(rb => rb.criterion?.toLowerCase() === criterion.toLowerCase());
      if (!match) {
        const nc = normStr(criterion);
        match = bd.find(rb => {
          const nr = normStr(rb.criterion);
          return nc.includes(nr) || nr.includes(nc) ||
            nc.split(' ').filter(w => w.length > 3).every(w => nr.includes(w));
        });
      }
      return match ? match.score : undefined;
    };
    // Key the map by RUBRIC criterion name so it aligns with lecScores/finalScores
    const aiMap = {};
    rubric.forEach(r => {
      const score = findAiScore(r.criterion);
      if (score !== undefined) aiMap[r.criterion] = score;
    });
    setFinalScores(aiMap);
    setMsg({ text: '🤖 AI scores applied to Final column. Your lecturer scores are unchanged. Adjust as needed.', type: 'info' });
    setActiveTab('compare');
  };

  const reanalyse = async (autoApply = false) => {
    if (!selected) return;
    setReanalysing(true);
    setMsg({ text: '⏳ Running AI analysis... This may take up to 30 seconds.', type: 'info' });
    try {
      await API.post(`/submissions/${selected._id}/reanalyse`);

      // Poll every 5s up to 10 times (~50s) until status === 'done'
      let attempts = 0;
      const poll = async () => {
        attempts++;
        const subs = await fetchSubs();
        const refreshed = subs.find(s => s._id === selected._id);
        if (refreshed?.aiAnalysis?.status === 'done') {
          initSub(refreshed);
          const rAI = refreshed.aiAnalysis;
          const rBD = rAI?.rubricBreakdown || rAI?.breakdown || rAI?.criteria || rAI?.scores || rAI?.rubric || [];
          if (autoApply && rBD.length > 0) {
            const aiMap = {};
            rBD.forEach(rb => { aiMap[rb.criterion] = rb.score; });
            setFinalScores(aiMap);
            setMsg({ text: '✅ AI analysis complete! AI scores applied to Final column. Adjust as needed.', type: 'success' });
          } else {
            setMsg({ text: '✅ AI analysis complete!', type: 'success' });
          }
          setReanalysing(false);
        } else if (refreshed?.aiAnalysis?.status === 'failed') {
          setMsg({ text: '❌ AI analysis failed. Please try again.', type: 'error' });
          setReanalysing(false);
        } else if (attempts < 10) {
          setTimeout(poll, 5000);
        } else {
          setMsg({ text: '⚠️ Analysis is taking longer than expected. Try refreshing the page.', type: 'error' });
          setReanalysing(false);
        }
      };
      setTimeout(poll, 5000);
    } catch {
      setMsg({ text: '❌ Failed to start AI analysis.', type: 'error' });
      setReanalysing(false);
    }
  };

  const generateFeedback = async () => {
    setLoadingAI(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ai/marking-feedback`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentName: selected?.student?.username || 'Unknown',
          assignmentName: selected?.assignmentName || 'Unknown',
          moduleName: selected?.moduleName || 'Unknown',
          rubric, scores: finalScores, pct: finalPct, grade: finalGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.feedback);
        setMsg({ text: '✅ AI feedback generated based on final scores.', type: 'success' });
      } else {
        setMsg({ text: '❌ ' + (data.message || 'Failed.'), type: 'error' });
      }
    } catch {
      setMsg({ text: '❌ Could not connect to server.', type: 'error' });
    }
    setLoadingAI(false);
  };

  const save = async (publish = false) => {
    if (!selected || !/^[a-f\d]{24}$/i.test(selected._id)) return;
    publish ? setPublishing(true) : setSaving(true);
    setMsg({ text:'', type:'' });
    try {
      const rubricScores = rubric.map(r => ({
        criterion:  r.criterion,
        score:      Number(finalScores[r.criterion]) || 0,
        maxScore:   Number(r.maxScore) || 0,
        percentage: r.maxScore > 0 ? Math.round(((Number(finalScores[r.criterion]) || 0) / r.maxScore) * 100) : 0,
      }));
      await gradeSubmission(selected._id, {
        score: finalPct, grade: finalGrade, feedback, rubricScores,
        ...(publish && { published: true }),
      });
      setSubmissions(prev => prev.map(s =>
        s._id === selected._id
          ? { ...s, score: finalPct, grade: finalGrade, status: 'Graded', feedback, rubricScores }
          : s
      ));
      setSelected(prev => ({ ...prev, score: finalPct, grade: finalGrade, status: 'Graded', feedback }));
      setMsg({ text: publish ? '✅ Marks published to student!' : '✅ Saved successfully!', type: 'success' });
    } catch (e) {
      setMsg({ text: '❌ ' + (e.response?.data?.message || 'Failed.'), type: 'error' });
    }
    publish ? setPublishing(false) : setSaving(false);
  };

  const fileUrl   = selected?.filePath ? buildFileUrl(selected.filePath) : null;
  const ext       = getExt(selected?.filePath || '');
  const viewerUrl = fileUrl
    ? (ext === 'docx' || ext === 'doc'
        ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
        : fileUrl)
    : null;

  const msgStyle = {
    padding:'9px 14px', borderRadius:8, fontSize:12, marginBottom:12,
    background: msg.type === 'success' ? '#f0fdf4' : msg.type === 'info' ? '#eff6ff' : '#fef2f2',
    color:      msg.type === 'success' ? '#16a34a' : msg.type === 'info' ? '#1d4ed8' : '#dc2626',
    border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : msg.type === 'info' ? '#bfdbfe' : '#fecaca'}`,
  };

  const TABS = [
    { key:'mark',     label:'📝 Manual Marking' },
    { key:'compare',  label:'⚖️ Comparison Table' },
    { key:'analysis', label:`🤖 AI Analysis${hasAIData ? ' ✓' : ''}` },
  ];

  return (
    <LecturerLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Marking & Feedback</h1>
          <p>Manually mark submissions, review AI analysis, then decide final scores</p>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#9ca3af' }}>Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ color:'#9ca3af' }}>No submissions yet.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

            {/* ══ LEFT PANEL ══ */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="card">
                <div className="card-title">Student Submission</div>

                <select value={selected?._id || ''}
                  onChange={e => {
                    const sub = submissions.find(s => s._id === e.target.value);
                    if (sub) initSub(sub);
                  }}
                  style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#374151', marginBottom:12, outline:'none', cursor:'pointer', background:'white', fontFamily:'inherit' }}>
                  {submissions.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.student?.username} — {s.assignmentName} ({s.status})
                    </option>
                  ))}
                </select>

                <div style={{ background:'#f9fafb', borderRadius:8, padding:'10px 14px', marginBottom:12, fontSize:12 }}>
                  <div style={{ fontWeight:700, color:'#111827', marginBottom:3 }}>{selected?.assignmentName}</div>
                  <div style={{ color:'#6b7280' }}>
                    Student: <strong>{selected?.student?.username}</strong>
                    {selected?.moduleCode && <> · {selected.moduleCode} — {selected.moduleName}</>}
                  </div>
                  <div style={{ color:'#9ca3af', fontSize:11, marginTop:2 }}>
                    Submitted: {selected?.submittedAt ? new Date(selected.submittedAt).toLocaleString() : '—'}
                  </div>
                  <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span style={{
                      padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                      background: selected?.status === 'Graded' ? '#dcfce7' : '#fef9c3',
                      color:      selected?.status === 'Graded' ? '#16a34a' : '#92400e',
                    }}>{selected?.status || 'Pending'}</span>
                    {hasAIData && (
                      <span style={{ padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:'#f5f3ff', color:'#7c3aed' }}>
                        🤖 AI: {aiAnalysis.predictedScore}% ({aiAnalysis.predictedGrade})
                      </span>
                    )}
                  </div>
                </div>

                {viewerUrl ? (
                  <div style={{ border:'1.5px solid #e5e7eb', borderRadius:10, overflow:'hidden', marginBottom:8, height:300 }}>
                    <iframe src={viewerUrl} style={{ width:'100%', height:'100%', border:'none' }} title="Submission" />
                  </div>
                ) : (
                  <div style={{ border:'1.5px solid #e5e7eb', borderRadius:10, height:120, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb' }}>
                    <div style={{ textAlign:'center', color:'#9ca3af', fontSize:12 }}>
                      <div style={{ fontSize:28, marginBottom:4 }}>📄</div>
                      {selected?.fileName || 'No file'}
                    </div>
                  </div>
                )}

                {fileUrl && (
                  <a href={ext === 'docx' || ext === 'doc'
                      ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=false`
                      : fileUrl}
                    target="_blank" rel="noreferrer"
                    style={{ display:'inline-block', marginBottom:12, fontSize:12, color:'#2563eb' }}>
                    🔗 Open full file in new tab
                  </a>
                )}

                {/* Score summary — 3 fully independent sources */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                  {[
                    { label:'Lecturer', pct: lecPct,  grade: lecGrade,                               color:'#2563eb', bg:'#eff6ff' },
                    { label:'AI',       pct: aiPct,   grade: aiPct !== null ? getGrade(aiPct) : '—', color:'#7c3aed', bg:'#f5f3ff' },
                    { label:'Final',    pct: finalPct, grade: finalGrade,                             color:'#059669', bg:'#f0fdf4' },
                  ].map(item => (
                    <div key={item.label} style={{ background:item.bg, borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', marginBottom:2 }}>{item.label}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:item.color }}>
                        {item.pct !== null ? `${item.pct}%` : '—'}
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color:item.color }}>{item.grade}</div>
                    </div>
                  ))}
                </div>

                {msg.text && <div style={msgStyle}>{msg.text}</div>}

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <button onClick={() => save(false)} disabled={saving}
                    style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #16a34a', background:'#f0fdf4', color:'#16a34a', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    {saving ? 'Saving...' : '💾 Save Marks & Feedback'}
                  </button>
                  <button onClick={() => save(true)} disabled={publishing}
                    style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'#2563eb', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    {publishing ? 'Publishing...' : '📢 Publish to Student'}
                  </button>
                </div>
              </div>
            </div>

            {/* ══ RIGHT PANEL ══ */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              <div style={{ display:'flex', borderBottom:'2px solid #e5e7eb', gap:2 }}>
                {TABS.map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{
                    padding:'10px 18px', cursor:'pointer', fontSize:13,
                    fontWeight: activeTab === key ? 700 : 400,
                    color:      activeTab === key ? '#2563eb' : '#6b7280',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
                    background:'none', outline:'none',
                    marginBottom:-2, transition:'all 0.15s', whiteSpace:'nowrap', fontFamily:'inherit',
                  }}>{label}</button>
                ))}
              </div>

              {/* ── Manual Marking tab ── */}
              {activeTab === 'mark' && (
                <>
                  <div className="card">
                    <div style={{ marginBottom:16 }}>
                      <div className="card-title" style={{ marginBottom:2 }}>Manual Rubric Scoring</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>
                        Enter your own scores. AI suggestions shown below each criterion for reference only.
                      </div>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      {rubric.map(r => {
                        const normStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
                        const aiRb = aiBreakdownData?.find(rb => {
                          if (rb.criterion === r.criterion) return true;
                          if (rb.criterion?.toLowerCase() === r.criterion?.toLowerCase()) return true;
                          const nc = normStr(r.criterion), nr = normStr(rb.criterion);
                          return nc.includes(nr) || nr.includes(nc) ||
                            nc.split(' ').filter(w => w.length > 3).every(w => nr.includes(w));
                        });
                        const aiScore = aiRb?.score;
                        const val     = lecScores[r.criterion];
                        const pct     = (val !== undefined && val !== '' && Number(r.maxScore) > 0)
                          ? Math.round((Number(val) / Number(r.maxScore)) * 100) : null;

                        return (
                          <div key={r.criterion} style={{ borderLeft:'3px solid #e5e7eb', paddingLeft:12 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
                                  {r.criterion}
                                  <span style={{ color:'#9ca3af', fontSize:11, marginLeft:4 }}>/ {r.maxScore}</span>
                                </div>
                                {/* AI suggestion shown as read-only reference */}
                                {aiScore !== undefined ? (
                                  <div style={{ fontSize:11, color:'#7c3aed', marginTop:1 }}>
                                    🤖 AI suggests: <strong>{aiScore}</strong> / {r.maxScore}
                                  </div>
                                ) : (
                                  <div style={{ fontSize:11, color:'#d1d5db', marginTop:1 }}>🤖 No AI data yet</div>
                                )}
                              </div>
                              {/* Lecturer types their OWN score — NEVER auto-filled by AI */}
                              <input type="number" min="0" max={r.maxScore}
                                placeholder="—"
                                value={val ?? ''}
                                onChange={e => {
                                  let v = e.target.value === '' ? '' : Number(e.target.value);
                                  if (v !== '' && v < 0) v = 0;
                                  if (v !== '' && v > r.maxScore) v = r.maxScore;
                                  setLecScores(prev => ({ ...prev, [r.criterion]: v }));
                                  setFinalScores(prev => ({ ...prev, [r.criterion]: v }));
                                }}
                                style={{
                                  width:70, border:'2px solid #e5e7eb', borderRadius:8,
                                  padding:'8px 10px', fontSize:15, fontWeight:700,
                                  textAlign:'center', outline:'none', color:'#111827',
                                  fontFamily:'inherit',
                                }}
                              />
                            </div>
                            {pct !== null && <ScoreBar score={Number(val)} maxScore={Number(r.maxScore)} />}
                            {aiRb?.comment && (
                              <div style={{ marginTop:5, fontSize:11, color:'#6b7280', fontStyle:'italic', lineHeight:1.5 }}>
                                💬 {aiRb.comment}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop:20, padding:'12px 16px', background:'#f8fafc', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Lecturer Total</span>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:20, fontWeight:800, color:'#2563eb' }}>{lecTotal}</span>
                        <span style={{ fontSize:12, color:'#9ca3af' }}>/ {maxTotal}</span>
                        <span style={{ padding:'3px 12px', borderRadius:99, fontSize:12, fontWeight:700, background:'#eff6ff', color:'#2563eb' }}>
                          {lecGrade} ({lecPct}%)
                        </span>
                      </div>
                    </div>

                    <button onClick={() => setActiveTab('compare')}
                      style={{ width:'100%', marginTop:12, padding:'10px', borderRadius:8, border:'1.5px solid #2563eb', background:'#eff6ff', color:'#2563eb', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      ⚖️ View Comparison Table →
                    </button>
                  </div>

                  <div className="card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <div className="card-title" style={{ marginBottom:0 }}>Feedback for Student</div>
                      <button onClick={generateFeedback} disabled={loadingAI}
                        style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#2563eb', color:'white', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        {loadingAI ? '⏳ Generating...' : '✨ Generate AI Feedback'}
                      </button>
                    </div>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                      placeholder="Write detailed feedback here, or click 'Generate AI Feedback' to auto-generate based on the final scores and rubric..."
                      rows={7}
                      style={{ width:'100%', border:'1.5px solid #e5e7eb', borderRadius:8, padding:'10px 12px', fontSize:13, fontFamily:'inherit', color:'#374151', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.7 }}
                    />
                  </div>
                </>
              )}

              {/* ── Comparison Table tab ── */}
              {activeTab === 'compare' && (
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                    <div>
                      <div className="card-title" style={{ marginBottom:4 }}>Lecturer vs AI Comparison</div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>
                        Your scores vs AI scores. Edit <strong>Final Score</strong> to set the student's mark.
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={applyAIScoresToFinal} disabled={reanalysing}
                        style={{ padding:'7px 14px', borderRadius:8, border:'none', fontSize:12, fontWeight:600, fontFamily:'inherit',
                          background: reanalysing ? '#e5e7eb' : '#7c3aed',
                          color: reanalysing ? '#9ca3af' : 'white',
                          cursor: reanalysing ? 'not-allowed' : 'pointer',
                        }}>
                        {reanalysing ? '⏳ Running AI...' : hasAIData ? '🤖 Use AI Scores' : '🔄 Run & Apply AI Scores'}
                      </button>
                    </div>
                  </div>

                  {!hasAIData && (
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#92400e' }}>
                      ⚠️ AI analysis not available yet. Click <strong>"Run AI Analysis"</strong> to start it.
                      Your lecturer scores are still visible and usable.
                    </div>
                  )}

                  <ComparisonTable
                    rubric={rubric}
                    lecturerScores={lecScores}
                    aiBreakdown={aiBreakdownData}
                    finalScores={finalScores}
                    onFinalChange={(criterion, val) =>
                      setFinalScores(prev => ({ ...prev, [criterion]: val }))
                    }
                  />

                  <div style={{ marginTop:16, padding:'12px 16px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#166534' }}>Final Decision</div>
                      <div style={{ fontSize:11, color:'#4ade80', marginTop:1 }}>Based on the Final Score column above</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:24, fontWeight:800, color:'#16a34a' }}>{finalTotal}</span>
                      <span style={{ fontSize:13, color:'#9ca3af' }}>/ {maxTotal}</span>
                      <span style={{ padding:'4px 14px', borderRadius:99, fontSize:14, fontWeight:800, background:'#dcfce7', color:gradeColor(finalGrade) }}>
                        {finalGrade} ({finalPct}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:10, marginTop:12 }}>
                    <button onClick={() => setActiveTab('mark')}
                      style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      ← Back to Marking
                    </button>
                    <button onClick={() => save(false)} disabled={saving}
                      style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #16a34a', background:'#f0fdf4', color:'#16a34a', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      {saving ? 'Saving...' : '💾 Save Final Marks'}
                    </button>
                    <button onClick={() => save(true)} disabled={publishing}
                      style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#2563eb', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                      {publishing ? 'Publishing...' : '📢 Publish to Student'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── AI Analysis tab ── */}
              {activeTab === 'analysis' && (
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div className="card-title" style={{ marginBottom:0 }}>AI Analysis Report</div>
                    <div style={{ display:'flex', gap:8 }}>
                      {hasAIData && (
                        <button onClick={applyAIScoresToFinal}
                          style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#7c3aed', color:'white', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                          🤖 Apply AI to Final
                        </button>
                      )}
                      <button onClick={reanalyse} disabled={reanalysing}
                        style={{ padding:'7px 14px', borderRadius:8, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        {reanalysing ? '⏳' : '🔄 Re-analyse'}
                      </button>
                    </div>
                  </div>

                  {!aiAnalysis || aiAnalysis.status === 'pending' ? (
                    <div style={{ textAlign:'center', padding:40, color:'#9ca3af', fontSize:13 }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>⏳</div>
                      AI analysis running in background...<br />
                      <span style={{ fontSize:11 }}>Refresh in a few seconds or click Re-analyse</span>
                    </div>
                  ) : aiAnalysis.status === 'failed' ? (
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:16 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'#dc2626', marginBottom:8 }}>⚠️ Analysis Failed</div>
                      <div style={{ fontSize:12, color:'#6b7280', marginBottom:12 }}>{aiAnalysis.message}</div>
                      <button onClick={reanalyse} disabled={reanalysing}
                        style={{ padding:'7px 18px', borderRadius:8, border:'none', background:'#2563eb', color:'white', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        {reanalysing ? '⏳ Starting...' : '🔄 Re-analyse Now'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:10, padding:16, textAlign:'center' }}>
                          <div style={{ fontSize:32, fontWeight:800, color:'#7c3aed' }}>{aiAnalysis.predictedScore}%</div>
                          <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>AI Predicted Score</div>
                        </div>
                        <div style={{ background:'#f5f3ff', border:'1px solid #e9d5ff', borderRadius:10, padding:16, textAlign:'center' }}>
                          <div style={{ fontSize:32, fontWeight:800, color:gradeColor(aiAnalysis.predictedGrade) }}>{aiAnalysis.predictedGrade}</div>
                          <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>AI Predicted Grade</div>
                        </div>
                      </div>

                      {aiAnalysis.summary && (
                        <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:14 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#0369a1', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>📋 Summary</div>
                          <div style={{ fontSize:12, color:'#0c4a6e', lineHeight:1.7 }}>{aiAnalysis.summary}</div>
                        </div>
                      )}

                      {aiBreakdownData.length > 0 && (
                        <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:14 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>📊 Criterion Breakdown</div>
                          {aiBreakdownData.map((rb, i) => {
                            const p = rb.maxScore > 0 ? Math.round((rb.score / rb.maxScore) * 100) : 0;
                            const badge = p>=70 ? {label:'Met',bg:'#dcfce7',c:'#16a34a'} : p>=40 ? {label:'Partial',bg:'#fef9c3',c:'#ca8a04'} : {label:'Not Met',bg:'#fee2e2',c:'#dc2626'};
                            return (
                              <div key={i} style={{ borderLeft:`3px solid ${badge.c}`, paddingLeft:10, marginBottom:10 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                                  <span style={{ fontSize:12, fontWeight:600, color:'#111827', flex:1 }}>{rb.criterion}</span>
                                  <span style={{ fontSize:10, fontWeight:700, background:badge.bg, color:badge.c, padding:'2px 8px', borderRadius:99 }}>{badge.label}</span>
                                  <ScoreBar score={rb.score} maxScore={rb.maxScore} />
                                </div>
                                <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.5 }}>{rb.comment}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {aiAnalysis.strengths?.length > 0 && (
                        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:14 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>✅ Strengths</div>
                          {aiAnalysis.strengths.map((s, i) => (
                            <div key={i} style={{ fontSize:12, color:'#166534', display:'flex', gap:6, marginBottom:4 }}>
                              <span>•</span><span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {aiAnalysis.missingParts?.length > 0 && (
                        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:14 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>⚠️ Missing / Weak Areas</div>
                          {aiAnalysis.missingParts.map((mp, i) => (
                            <div key={i} style={{ marginBottom:8, fontSize:12 }}>
                              <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:2 }}>
                                <span style={{ fontWeight:600, color:'#9a3412' }}>{mp.part}</span>
                                <span style={{ fontSize:10, padding:'1px 6px', borderRadius:99, fontWeight:600,
                                  background: mp.importance==='High'?'#fee2e2':mp.importance==='Medium'?'#fef9c3':'#f3f4f6',
                                  color:      mp.importance==='High'?'#dc2626':mp.importance==='Medium'?'#ca8a04':'#6b7280',
                                }}>{mp.importance}</span>
                              </div>
                              <div style={{ color:'#6b7280' }}>{mp.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {aiAnalysis.enhancements?.length > 0 && (
                        <div style={{ background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:10, padding:14 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'#7c3aed', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>💡 Suggestions</div>
                          {aiAnalysis.enhancements.map((en, i) => (
                            <div key={i} style={{ fontSize:12, marginBottom:8 }}>
                              <div style={{ fontWeight:600, color:'#6d28d9', marginBottom:2 }}>{en.area}</div>
                              {en.current && <div style={{ color:'#9ca3af', marginBottom:2 }}>Current: {en.current}</div>}
                              <div style={{ color:'#4c1d95' }}>→ {en.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setActiveTab('compare')}
                        style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #7c3aed', background:'#f5f3ff', color:'#7c3aed', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        ⚖️ Compare with My Scores →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </LecturerLayout>
  );
}