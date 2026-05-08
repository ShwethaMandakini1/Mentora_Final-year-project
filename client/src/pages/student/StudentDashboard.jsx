import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getMySubmissions, getAssignments } from '../../api/api';
import './dashboard.css';

function Calendar() {
  const today = new Date();
  const [cur, setCur] = useState(new Date());
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y,m,1).getDay();
  const dim   = new Date(y,m+1,0).getDate();
  const dprev = new Date(y,m,0).getDate();
  const cells = [];
  for (let i=first-1;i>=0;i--) cells.push({d:dprev-i,other:true});
  for (let i=1;i<=dim;i++) cells.push({d:i,other:false});
  while(cells.length%7) cells.push({d:cells.length-dim-first+1,other:true});

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'16px'}}
          onClick={()=>setCur(new Date(y,m-1,1))}>‹</button>
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <select value={months[m]} onChange={e=>setCur(new Date(y,months.indexOf(e.target.value),1))}
            style={{border:'1px solid var(--border)',borderRadius:'6px',padding:'2px 6px',fontSize:'11px',fontFamily:'var(--font)',color:'var(--text-sec)',cursor:'pointer',background:'white',outline:'none'}}>
            {months.map(mn=><option key={mn}>{mn}</option>)}
          </select>
          <select value={y} onChange={e=>setCur(new Date(Number(e.target.value),m,1))}
            style={{border:'1px solid var(--border)',borderRadius:'6px',padding:'2px 6px',fontSize:'11px',fontFamily:'var(--font)',color:'var(--text-sec)',cursor:'pointer',background:'white',outline:'none'}}>
            {[2024,2025,2026,2027].map(yr=><option key={yr}>{yr}</option>)}
          </select>
        </div>
        <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'16px'}}
          onClick={()=>setCur(new Date(y,m+1,1))}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',textAlign:'center'}}>
        {days.map(d=><div key={d} style={{fontSize:'10px',color:'var(--text-muted)',padding:'3px 0',fontWeight:'600'}}>{d}</div>)}
        {cells.map((c,i)=>{
          const isToday=!c.other&&c.d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
          return (
            <div key={i} style={{
              fontSize:'11px',padding:'5px 2px',borderRadius:'50%',cursor:'pointer',
              background:isToday?'var(--sky)':'transparent',
              color:isToday?'white':c.other?'var(--border)':'var(--text-sec)',
              fontWeight:isToday?'700':'400',
              aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',
            }}>{c.d}</div>
          );
        })}
      </div>
    </div>
  );
}

function getGrade(pct) {
  if(pct>=90)return'A+'; if(pct>=85)return'A'; if(pct>=80)return'A-';
  if(pct>=75)return'B+'; if(pct>=70)return'B'; if(pct>=65)return'B-';
  if(pct>=60)return'C+'; if(pct>=55)return'C'; return'F';
}

function generateFeedback(average, bars, hasGraded) {
  if (!hasGraded) return 'No graded submissions yet. Submit your assignments to receive feedback on your academic performance.';
  const best    = bars.length>0 ? [...bars].sort((a,b)=>b.val-a.val)[0] : null;
  const weakest = bars.length>0 ? [...bars].sort((a,b)=>a.val-b.val)[0] : null;
  if (average>=85) return `Excellent academic performance with an overall average of ${average}%. ${best?`You are excelling in ${best.label}.`:''} Keep up the outstanding work.`;
  if (average>=75) return `Good academic performance with an overall average of ${average}%. ${best?`Your strongest subject is ${best.label}.`:''} ${weakest&&weakest.val<75?`Focus on improving ${weakest.label} to boost your average.`:'Keep maintaining this solid performance.'}`;
  if (average>=60) return `Satisfactory academic performance with an average of ${average}%. ${weakest?`Consider dedicating more time to ${weakest.label}.`:''}`;
  if (average > 0) return `Your current average is ${average}%. There is room for significant improvement. ${weakest?`Focus especially on ${weakest.label}`:'Review your study habits'} and seek additional support from your lecturers.`;
  return `Your graded submissions show a score of 0%. Please review your work and resubmit, or speak to your lecturer for guidance.`;
}

const OCEAN_BARS = ['#0077B6','#0096C7','#00B4D8','#48CAE4','#90E0EF','#ADE8F4'];
const BG_COLORS  = ['#E0F2FE','#DCFCE7','#F0F9FF','#FDF4FF','#FEF3C7','#FFE4E6'];
const TC_COLORS  = ['#0369A1','#166534','#0C4A6E','#6B21A8','#92400E','#9F1239'];

const BellIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SearchIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats,       setStats]       = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(()=>{
    Promise.allSettled([
      getDashboardStats().then(r=>setStats(r.data.stats||null)),
      getMySubmissions().then(r=>setSubmissions(r.data.submissions||[])),
      getAssignments().then(r=>setAssignments(r.data.assignments||[])),
    ]).finally(()=>setLoading(false));
  },[]);

  const gradedSubs = submissions.filter(s => s.status === 'Graded');
  const moduleMap  = {};
  gradedSubs.forEach(s => {
    const mod = s.moduleName || s.module || 'Other';
    if (!moduleMap[mod]) moduleMap[mod] = [];
    moduleMap[mod].push(Number(s.score) || 0);
  });
  const bars = Object.entries(moduleMap).map(([label, scores], i) => ({
    label,
    val:   Math.round(scores.reduce((a, v) => a + v, 0) / scores.length),
    color: OCEAN_BARS[i % OCEAN_BARS.length],
  }));

  const hasGraded   = gradedSubs.length > 0;
  const realAverage = hasGraded
    ? Math.round(gradedSubs.reduce((a, s) => a + (Number(s.score) || 0), 0) / gradedSubs.length)
    : 0;
  const displayAvg   = stats !== null ? (stats.average ?? realAverage) : realAverage;
  const displayGrade = getGrade(displayAvg);
  const feedbackText = generateFeedback(displayAvg, bars, hasGraded);

  const sorted   = [...bars].sort((a, b) => b.val - a.val);
  const perfTags = bars.length >= 2 ? [
    { bg: '#E0F2FE', tc: '#0369A1', label: 'Very good at:',    val: sorted[0]?.label },
    { bg: '#DCFCE7', tc: '#166534', label: 'Good at:',         val: sorted[1]?.label },
    { bg: '#FDF4FF', tc: '#6B21A8', label: 'Need to improve:', val: sorted[sorted.length - 1]?.label },
  ] : [];

  const recentSubs = submissions
    .filter(s => s.status === 'Graded' || s.status === 'Pending')
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 3);

  const submittedNames = new Set(submissions.map(s => s.assignmentName));
  const submittedIds   = new Set(submissions.map(s => s.assignment?._id || s.assignment));
  const displayUpcoming = assignments
    .filter(a => !submittedIds.has(a._id) && !submittedNames.has(a.title))
    .sort((a, b) => new Date(a.deadline || a.dueDate) - new Date(b.deadline || b.dueDate))
    .slice(0, 3);

  const goToHistory = () => navigate('/student/submissions', { state: { tab: 'history' } });
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <StudentLayout>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>Dashboard</h1>
          <p>{dateStr}</p>
        </div>
        <div className="topbar-right">
          <div className="search-bar">
            <SearchIcon />
            <input placeholder="Search…" />
          </div>
          <button className="notif-btn" onClick={() => navigate('/student/notifications')}>
            <BellIcon />
          </button>
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'S'}</div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 265px', gap: '20px' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>

            {/* Performance card */}
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '18px', marginBottom: '16px' }}>

                {/* Academic Average */}
                <div style={{ background: 'linear-gradient(135deg, var(--foam), rgba(0,150,199,0.08))', borderRadius: 'var(--radius-md)', padding: '18px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '10px' }}>Academic Average</div>
                  <div style={{ fontSize: '52px', fontWeight: '800', color: 'var(--navy)', lineHeight: '1', marginBottom: '12px', letterSpacing: '-2px' }}>
                    {loading ? '...' : `${displayAvg}%`}
                  </div>
                  <div style={{ background: 'var(--sky)', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', letterSpacing: '0.2px' }}>
                    Grade: {loading ? '...' : displayGrade}
                  </div>
                </div>

                {/* Bar chart */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '10px' }}>Subject Performance</div>
                  {bars.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '95px', color: 'var(--text-muted)', fontSize: '12px', flexDirection: 'column', gap: '6px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      No graded subjects yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '95px', paddingRight: '8px', flexShrink: 0, paddingBottom: '18px' }}>
                        {[100,75,50,25].map(v=><span key={v} style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{v}</span>)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flex: 1, height: '95px' }}>
                        {bars.map(b=>(
                          <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--navy)' }}>{b.val}</span>
                            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: b.color, height: `${Math.max(4, (b.val / 100) * 65)}px`, minWidth: '20px', transition: 'height .5s' }}/>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{b.label.substring(0, 5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance tags */}
              {perfTags.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {perfTags.map(t=>(
                    <div key={t.val} style={{ background: t.bg, borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: '11px', color: t.tc }}>{t.label}</div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: t.tc, marginTop: 2 }}>{t.val}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(0,150,199,0.04)', borderRadius: 'var(--radius-md)', padding: '13px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border)' }}>
                  Performance tags will appear once assignments are graded
                </div>
              )}
            </div>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

              {/* Feedback Summary */}
              <div className="card">
                <div className="card-title">Feedback Summary</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '6px' }}>Overall Feedback</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>{feedbackText}</div>
                {gradedSubs.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    {gradedSubs.slice(0, 2).map(s => (
                      s.feedback && (
                        <div key={s._id} style={{ marginBottom: '6px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-sec)' }}>{s.assignmentName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.feedback}</div>
                        </div>
                      )
                    ))}
                    <span style={{ fontSize: '11px', color: 'var(--sky)', cursor: 'pointer', fontWeight: '600' }}
                      onClick={() => navigate('/student/reports')}>View full feedback →</span>
                  </div>
                )}
              </div>

              {/* Submitted assignments */}
              <div className="card">
                <div className="card-title">Submitted Assignments</div>
                {recentSubs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    No submissions yet
                  </div>
                ) : (
                  <>
                    {recentSubs.map((a, i) => (
                      <div key={a._id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 12px', borderRadius: 'var(--radius-md)', marginBottom: '6px',
                        background: BG_COLORS[i % BG_COLORS.length], cursor: 'pointer',
                        border: '1px solid rgba(0,0,0,0.04)',
                      }} onClick={goToHistory}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: TC_COLORS[i % TC_COLORS.length] }}>{a.assignmentName}</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: TC_COLORS[i % TC_COLORS.length] }}>View →</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sky)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}
                      onClick={goToHistory}>
                      View More →
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', paddingTop: '6px', cursor: 'pointer' }} onClick={() => navigate('/student/profile')}>
              <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sky), var(--cyan))', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white', fontWeight: '700' }}>
                {user?.username?.[0]?.toUpperCase() || 'S'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-sec)' }}>{user?.username || 'Student'}</div>
            </div>

            <div className="card" style={{ padding: '14px' }}><Calendar /></div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '10px', letterSpacing: '0.2px' }}>Upcoming Submissions</div>
              {displayUpcoming.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '9px', background: 'white' }}>
                  No upcoming submissions
                </div>
              ) : (
                displayUpcoming.map(item => (
                  <div key={item._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    marginBottom: '9px', fontSize: '13px', color: 'var(--text-sec)', cursor: 'pointer', background: 'white',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                    onClick={() => navigate(`/student/submissions?assignment=${item._id}`)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sky)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--foam)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <span style={{ fontSize: 12 }}>{item.title || item.name}</span>
                    <span style={{ color: 'var(--sky)' }}>›</span>
                  </div>
                ))
              )}
              <button className="btn-primary" style={{ width: '100%', padding: '12px' }}
                onClick={() => navigate('/student/submissions')}>
                See all →
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}