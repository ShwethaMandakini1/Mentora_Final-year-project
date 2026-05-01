import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LecturerLayout from './Lecturerlayout';
import { useAuth } from '../../context/AuthContext';
import { getAllSubmissions, getAllStudents } from '../../api/api';
import './dashboard.css';

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');  // ← NEW

  useEffect(() => {
    Promise.allSettled([
      getAllSubmissions().then(r => setSubmissions(r.data.submissions)).catch(() => {}),
      getAllStudents().then(r => setStudents(r.data.students)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const mockRecent = [
    {_id:'1',student:{username:'Kavindi K'},assignmentName:'HCI Final Report',moduleName:'HCI',status:'Pending',submittedAt:'2026-02-09'},
    {_id:'2',student:{username:'Amal P'},   assignmentName:'SE Proposal',      moduleName:'SE', status:'Graded', submittedAt:'2026-02-13',score:82},
    {_id:'3',student:{username:'Nimal S'},  assignmentName:'AI Research',      moduleName:'AI', status:'Pending',submittedAt:'2026-01-10'},
    {_id:'4',student:{username:'Saman W'},  assignmentName:'DBMS Research',    moduleName:'DBMS',status:'Graded',submittedAt:'2026-01-10',score:75},
    {_id:'5',student:{username:'Priya R'},  assignmentName:'ML Paper',         moduleName:'AI', status:'Pending',submittedAt:'2026-01-21'},
  ];
  const mockStudents = [
    {_id:'1',username:'Kavindi Kinkini',studentId:'10934567'},
    {_id:'2',username:'Amal Perera',    studentId:'10934568'},
    {_id:'3',username:'Nimal Silva',    studentId:'10934569'},
    {_id:'4',username:'Saman Wickrama', studentId:'10934570'},
  ];

  const srcSubs    = loading ? [] : (submissions.length > 0 ? submissions : mockRecent);
  const srcStudents = loading ? [] : (students.length > 0 ? students : mockStudents);

  // ── Search filter logic ──────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();

  const filteredRecent = q
    ? srcSubs.filter(s =>
        s.student?.username?.toLowerCase().includes(q) ||
        s.assignmentName?.toLowerCase().includes(q)    ||
        s.moduleName?.toLowerCase().includes(q)        ||
        s.status?.toLowerCase().includes(q)
      )
    : srcSubs.slice(0, 5);

  const filteredStudents = q
    ? srcStudents.filter(s =>
        s.username?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q)
      )
    : srcStudents;

  // ── Stats (always from full unfiltered source) ───────────────────────────
  const total      = loading ? '—' : srcSubs.length;
  const graded     = loading ? '—' : srcSubs.filter(s => s.status === 'Graded').length;
  const pending    = loading ? '—' : srcSubs.filter(s => s.status === 'Pending').length;
  const gradedSubs = srcSubs.filter(s => s.score);
  const avgScore   = loading
    ? '—'
    : (gradedSubs.length > 0
        ? `${Math.round(gradedSubs.reduce((a, s) => a + s.score, 0) / gradedSubs.length)}%`
        : '—');

  // ── Shared topbar JSX (variable, NOT a component — prevents remount on state change) ──
  const topbarJSX = (
    <div className="topbar">
      <div className="topbar-left">
        <h1>Dashboard</h1>
        <p>{new Date().toLocaleDateString('en-US', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</p>
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <input
            placeholder="Search students or assignments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery
            ? <span
                style={{ color:'#9ca3af', cursor:'pointer', userSelect:'none' }}
                onClick={() => setSearchQuery('')}
              >✕</span>
            : <span style={{ color:'#9ca3af' }}>🔍</span>
          }
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }} onClick={() => navigate('/lecturer/profile')}>
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'L'}</div>
          <span className="topbar-username">{user?.username || 'Lecturer'}</span>
        </div>
      </div>
    </div>
  );

  // ── Loading spinner ──────────────────────────────────────────────────────
  if (loading) return (
    <LecturerLayout>
      {topbarJSX}
      <div className="page-content">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:16 }}>
          <div style={{
            width:40, height:40, border:'4px solid #e5e7eb',
            borderTop:'4px solid #2563eb', borderRadius:'50%',
            animation:'spin 0.8s linear infinite',
          }} />
          <div style={{ color:'#9ca3af', fontSize:13 }}>Loading dashboard...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </LecturerLayout>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <LecturerLayout>
      {topbarJSX}

      <div className="page-content">
        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'20px' }}>
          {[
            { label:'Total Submissions', val: total,    color:'#2563eb' },
            { label:'Graded',            val: graded,   color:'#16a34a' },
            { label:'Pending',           val: pending,  color:'#f59e0b' },
            { label:'Average Score',     val: avgScore, color:'#7c3aed' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-num" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px' }}>
          {/* Recent Submissions */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
              <div className="card-title" style={{ marginBottom:0 }}>
                {q ? `Search Results (${filteredRecent.length})` : 'Recent Submissions'}
              </div>
              <button className="btn-outline" style={{ padding:'6px 14px', fontSize:'12px' }}
                onClick={() => navigate('/lecturer/submissions')}>View All</button>
            </div>

            {filteredRecent.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'#9ca3af', fontSize:13 }}>
                No submissions match "{searchQuery}"
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Assignment</th><th>Module</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {filteredRecent.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight:'500' }}>{s.student?.username || 'Student'}</td>
                      <td>{s.assignmentName}</td>
                      <td>{s.moduleName}</td>
                      <td><span className={`badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                      <td>
                        <button className="btn-primary" style={{ padding:'5px 12px', fontSize:'11px' }}
                          onClick={() => navigate('/lecturer/submissions')}>
                          {s.status === 'Pending' ? 'Mark' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Students list */}
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <div className="card-title" style={{ marginBottom:0 }}>Students</div>
              <span style={{ fontSize:'12px', color:'#9ca3af' }}>{filteredStudents.length} total</span>
            </div>

            {filteredStudents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'#9ca3af', fontSize:13 }}>
                No students match "{searchQuery}"
              </div>
            ) : (
              filteredStudents.map(s => (
                <div key={s._id} className="student-row">
                  <div className="student-avatar">{s.username?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'500', color:'#374151' }}>{s.username}</div>
                    <div style={{ fontSize:'11px', color:'#9ca3af' }}>ID: {s.studentId || '—'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </LecturerLayout>
  );
}