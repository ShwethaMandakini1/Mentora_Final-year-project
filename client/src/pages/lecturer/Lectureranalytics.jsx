import React, { useState, useEffect } from 'react';
import LecturerLayout from './Lecturerlayout';
import { getAllSubmissions } from '../../api/api';
import './dashboard.css';

export default function LecturerReports() {
  const [submissions, setSubmissions] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true); // ← NEW

  useEffect(() => {
    getAllSubmissions()
      .then(r => setSubmissions(r.data.submissions.filter(s => s.status === 'Graded')))
      .catch(() => {})
      .finally(() => setLoading(false)); // ← NEW: always stop loading
  }, []);

  // Mock is now ONLY used as a dev fallback after loading finishes
  const mock = [
    {_id:'1',student:{username:'Kavindi K'},assignmentName:'HCI Final Report',moduleName:'HCI',score:85,grade:'A',
     feedback:'Excellent work on HCI principles.',rubricScores:[{criterion:'Thesis',score:27,maxScore:30},{criterion:'Evidence',score:22,maxScore:25},{criterion:'Structure',score:17,maxScore:20},{criterion:'Analysis',score:12,maxScore:15},{criterion:'Writing',score:7,maxScore:10}]},
    {_id:'2',student:{username:'Amal P'},   assignmentName:'SE Proposal',      moduleName:'SE', score:82,grade:'A-',
     feedback:'Good proposal with clear objectives.',rubricScores:[{criterion:'Thesis',score:25,maxScore:30},{criterion:'Evidence',score:21,maxScore:25},{criterion:'Structure',score:16,maxScore:20},{criterion:'Analysis',score:12,maxScore:15},{criterion:'Writing',score:8,maxScore:10}]},
    {_id:'3',student:{username:'Saman W'},  assignmentName:'DBMS Research',    moduleName:'DBMS',score:75,grade:'B+',
     feedback:'Satisfactory research on database systems.',rubricScores:[{criterion:'Thesis',score:22,maxScore:30},{criterion:'Evidence',score:19,maxScore:25},{criterion:'Structure',score:15,maxScore:20},{criterion:'Analysis',score:11,maxScore:15},{criterion:'Writing',score:8,maxScore:10}]},
  ];

  // Only fall back to mock AFTER loading is done (i.e. API returned nothing)
  const display = loading ? [] : (submissions.length > 0 ? submissions : mock);

  const avg     = display.length > 0 ? Math.round(display.reduce((a, s) => a + (s.score || 0), 0) / display.length) : 0;
  const highest = display.length > 0 ? Math.max(...display.map(s => s.score || 0)) : 0;

  // ── Loading spinner ────────────────────────────────────────────────────────
  const LoadingScreen = () => (
    <LecturerLayout>
      <div className="topbar">
        <div className="topbar-left"><h1>Reports</h1><p>Grading summary and feedback records</p></div>
      </div>
      <div className="page-content">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:16 }}>
          <div style={{
            width: 40, height: 40, border: '4px solid #e5e7eb',
            borderTop: '4px solid #2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ color:'#9ca3af', fontSize:13 }}>Loading reports...</div>
        </div>
        {/* Inline keyframe for the spinner */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </LecturerLayout>
  );

  // ── Show spinner while fetching ────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) return (
    <LecturerLayout>
      <div className="topbar"><div className="topbar-left"><h1>Reports</h1></div></div>
      <div className="page-content">
        <button className="back-btn" onClick={() => setSelected(null)}>← Back</button>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
          <div className="card">
            <div className="card-title">{selected.assignmentName} — {selected.student?.username}</div>
            <div style={{ display:'flex', gap:'12px', marginBottom:'18px' }}>
              {[['Score', `${selected.score}%`, '#eff6ff', '#2563eb'], ['Grade', selected.grade, '#dcfce7', '#16a34a']].map(([l, v, bg, c]) => (
                <div key={l} style={{ flex:1, background:bg, borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:'11px', color:'#6b7280' }}>{l}</div>
                  <div style={{ fontSize:'36px', fontWeight:'800', color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="card-title">Rubric Breakdown</div>
            {(selected.rubricScores || []).map(r => (
              <div key={r.criterion} style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                  <span style={{ fontSize:'12px', fontWeight:'500', color:'#374151' }}>{r.criterion}</span>
                  <span style={{ fontSize:'12px', color:'#6b7280' }}>{r.score}/{r.maxScore}</span>
                </div>
                <div className="prog-wrap">
                  <div className="prog-fill" style={{ width:`${(r.score / r.maxScore) * 100}%`, background:'#22c55e' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Feedback Given</div>
            <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'10px', padding:'16px', fontSize:'13px', color:'#0c4a6e', lineHeight:'1.8' }}>
              {selected.feedback || 'No feedback recorded.'}
            </div>
          </div>
        </div>
      </div>
    </LecturerLayout>
  );

  // ── Main list view ─────────────────────────────────────────────────────────
  return (
    <LecturerLayout>
      <div className="topbar">
        <div className="topbar-left"><h1>Reports</h1><p>Grading summary and feedback records</p></div>
      </div>
      <div className="page-content">

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'20px' }}>
          {[
            { label:'Total Graded',  val: display.length,  color:'#2563eb' },
            { label:'Class Average', val: `${avg}%`,        color:'#16a34a' },
            { label:'Highest Score', val: `${highest}%`,    color:'#7c3aed' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-num" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-title">Graded Submissions</div>

          {display.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
              No graded submissions yet.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Module</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {display.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight:'500' }}>{s.student?.username || '—'}</td>
                    <td>{s.assignmentName}</td>
                    <td>{s.moduleName}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'50px', height:'5px', background:'#e5e7eb', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ width:`${s.score || 0}%`, height:'100%', background:'#22c55e' }} />
                        </div>
                        <span style={{ fontSize:'12px', fontWeight:'600' }}>{s.score || 0}%</span>
                      </div>
                    </td>
                    <td><span className="badge graded">{s.grade || '—'}</span></td>
                    <td>
                      <button className="btn-primary" style={{ padding:'5px 12px', fontSize:'12px' }} onClick={() => setSelected(s)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </LecturerLayout>
  );
}