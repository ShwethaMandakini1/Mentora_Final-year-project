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
  const first  = new Date(y,m,1).getDay();
  const dim    = new Date(y,m+1,0).getDate();
  const dprev  = new Date(y,m,0).getDate();
  const cells  = [];
  for (let i=first-1;i>=0;i--) cells.push({d:dprev-i,other:true});
  for (let i=1;i<=dim;i++) cells.push({d:i,other:false});
  while(cells.length%7) cells.push({d:cells.length-dim-first+1,other:true});

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <button style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:'16px'}}
          onClick={()=>setCur(new Date(y,m-1,1))}>‹</button>
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <select value={months[m]} onChange={e=>setCur(new Date(y,months.indexOf(e.target.value),1))}
            style={{border:'1px solid #e5e7eb',borderRadius:'5px',padding:'2px 4px',fontSize:'11px',fontFamily:'Poppins,sans-serif',color:'#374151',cursor:'pointer'}}>
            {months.map(mn=><option key={mn}>{mn}</option>)}
          </select>
          <select value={y} onChange={e=>setCur(new Date(Number(e.target.value),m,1))}
            style={{border:'1px solid #e5e7eb',borderRadius:'5px',padding:'2px 4px',fontSize:'11px',fontFamily:'Poppins,sans-serif',color:'#374151',cursor:'pointer'}}>
            {[2024,2025,2026,2027].map(yr=><option key={yr}>{yr}</option>)}
          </select>
        </div>
        <button style={{background:'none',border:'none',cursor:'pointer',color:'#6b7280',fontSize:'16px'}}
          onClick={()=>setCur(new Date(y,m+1,1))}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',textAlign:'center'}}>
        {days.map(d=><div key={d} style={{fontSize:'10px',color:'#9ca3af',padding:'3px 0',fontWeight:'600'}}>{d}</div>)}
        {cells.map((c,i)=>{
          const isToday=!c.other&&c.d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
          return (
            <div key={i} style={{
              fontSize:'11px',padding:'5px 2px',borderRadius:'50%',cursor:'pointer',
              background:isToday?'#2563eb':'transparent',
              color:isToday?'white':c.other?'#d1d5db':'#374151',
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
  if (average>=60) return `You have demonstrated a consistent and satisfactory academic performance with an average of ${average}%. ${weakest?`Consider dedicating more time to ${weakest.label}.`:''}`;
  if (average > 0) return `Your current average is ${average}%. There is room for significant improvement. ${weakest?`Focus especially on ${weakest.label}`:'Review your study habits'} and seek additional support from your lecturers.`;
  return `Your graded submissions show a score of 0%. Please review your work and resubmit, or speak to your lecturer for guidance.`;
}

const COLORS    = ['#2563eb','#60a5fa','#f59e0b','#22c55e','#a855f7','#ef4444'];
const BG_COLORS = ['#fef9c3','#dcfce7','#dbeafe','#fce7f3','#ede9fe','#fee2e2'];
const TC_COLORS = ['#854d0e','#166534','#1e40af','#9d174d','#5b21b6','#991b1b'];

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

  // ── Build subject bars from graded submissions ───────────────
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
    color: COLORS[i % COLORS.length],
  }));

  // ── Calculate average — include zero scores ──────────────────
  const hasGraded   = gradedSubs.length > 0;
  const realAverage = hasGraded
    ? Math.round(gradedSubs.reduce((a, s) => a + (Number(s.score) || 0), 0) / gradedSubs.length)
    : 0;

  // use stats from backend if available, otherwise use local calculation
  const displayAvg   = stats !== null ? (stats.average ?? realAverage) : realAverage;
  const displayGrade = getGrade(displayAvg);
  const feedbackText = generateFeedback(displayAvg, bars, hasGraded);

  // ── Performance tags ─────────────────────────────────────────
  const sorted   = [...bars].sort((a, b) => b.val - a.val);
  const perfTags = bars.length >= 2 ? [
    { bg: '#dcfce7', tc: '#166534', label: 'Very good at:',    val: sorted[0]?.label },
    { bg: '#dbeafe', tc: '#1e40af', label: 'Good at:',         val: sorted[1]?.label },
    { bg: '#fef3c7', tc: '#92400e', label: 'Need to improve:', val: sorted[sorted.length - 1]?.label },
  ] : [];

  // ── Recent submissions ───────────────────────────────────────
  const recentSubs = submissions
    .filter(s => s.status === 'Graded' || s.status === 'Pending')
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 3);

  // ── Upcoming assignments not yet submitted ───────────────────
  const submittedNames  = new Set(submissions.map(s => s.assignmentName));
  const submittedIds    = new Set(submissions.map(s => s.assignment?._id || s.assignment));
  const displayUpcoming = assignments
    .filter(a => !submittedIds.has(a._id) && !submittedNames.has(a.title))
    .sort((a, b) => new Date(a.deadline || a.dueDate) - new Date(b.deadline || b.dueDate))
    .slice(0, 3);

  // ── Navigate to submission history tab ───────────────────────
  const goToHistory = () => navigate('/student/submissions', { state: { tab: 'history' } });

  return (
    <StudentLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Dashboard</h1>
          <p>{new Date().toLocaleDateString('en-US',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
        </div>
        <div className="topbar-right">
          <div className="search-bar">
            <input placeholder="Search"/>
            <span style={{color:'#9ca3af'}}>🔍</span>
          </div>
          <button className="notif-btn" onClick={()=>navigate('/student/notifications')}>🔔</button>
        </div>
      </div>

      <div className="page-content">
        <div style={{display:'grid',gridTemplateColumns:'1fr 285px',gap:'20px'}}>

          {/* LEFT COLUMN */}
          <div style={{display:'flex',flexDirection:'column',gap:'18px',minWidth:0}}>

            {/* Performance card */}
            <div className="card" style={{padding:'22px'}}>
              <div style={{display:'grid',gridTemplateColumns:'190px 1fr',gap:'18px',marginBottom:'18px'}}>

                {/* Academic Average */}
                <div style={{background:'#eff6ff',borderRadius:'12px',padding:'18px'}}>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'10px'}}>Academic Average</div>
                  <div style={{fontSize:'54px',fontWeight:'800',color:'#1f2937',lineHeight:'1',marginBottom:'12px'}}>
                    {loading ? '...' : `${displayAvg}%`}
                  </div>
                  <div style={{background:'#2563eb',color:'white',padding:'5px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',display:'inline-block'}}>
                    Grade: {loading ? '...' : displayGrade}
                  </div>
                </div>

                {/* Bar chart */}
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'10px'}}>Subject performance</div>
                  {bars.length === 0 ? (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'95px',color:'#9ca3af',fontSize:'12px',flexDirection:'column',gap:'6px'}}>
                      <span style={{fontSize:'24px'}}>📊</span>
                      No graded subjects yet
                    </div>
                  ) : (
                    <div style={{display:'flex',alignItems:'flex-end'}}>
                      <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',height:'95px',paddingRight:'8px',flexShrink:0,paddingBottom:'18px'}}>
                        {[70,60,50,40].map(v=><span key={v} style={{fontSize:'10px',color:'#9ca3af'}}>{v}</span>)}
                      </div>
                      <div style={{display:'flex',alignItems:'flex-end',gap:'10px',flex:1,height:'95px'}}>
                        {bars.map(b=>(
                          <div key={b.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',flex:1}}>
                            <span style={{fontSize:'10px',fontWeight:'600',color:'#374151'}}>{b.val}</span>
                            <div style={{width:'100%',borderRadius:'4px 4px 0 0',background:b.color,height:`${Math.max(4,((b.val-40)/45)*65)}px`,minWidth:'24px',transition:'height .5s'}}/>
                            <span style={{fontSize:'11px',color:'#9ca3af'}}>{b.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance tags */}
              {perfTags.length > 0 ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'}}>
                  {perfTags.map(t=>(
                    <div key={t.val} style={{background:t.bg,borderRadius:'10px',padding:'13px',textAlign:'center'}}>
                      <div style={{fontSize:'11px',color:t.tc}}>{t.label}</div>
                      <div style={{fontSize:'14px',fontWeight:'700',color:t.tc}}>{t.val}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{background:'#f9fafb',borderRadius:'10px',padding:'13px',textAlign:'center',color:'#9ca3af',fontSize:'12px'}}>
                  Performance tags will appear once assignments are graded
                </div>
              )}
            </div>

            {/* Bottom row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>

              {/* Feedback Summary */}
              <div className="card">
                <div className="card-title">Feed-back Summary</div>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>Overall Feedback</div>
                <div style={{fontSize:'12px',color:'#6b7280',lineHeight:'1.8'}}>{feedbackText}</div>
                {gradedSubs.length > 0 && (
                  <div style={{marginTop:'10px',paddingTop:'8px',borderTop:'1px solid #f3f4f6'}}>
                    {gradedSubs.slice(0,2).map(s=>(
                      s.feedback && (
                        <div key={s._id} style={{marginBottom:'6px'}}>
                          <div style={{fontSize:'11px',fontWeight:'600',color:'#374151'}}>{s.assignmentName}</div>
                          <div style={{fontSize:'11px',color:'#6b7280',lineHeight:'1.6',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{s.feedback}</div>
                        </div>
                      )
                    ))}
                    <span style={{fontSize:'11px',color:'#2563eb',cursor:'pointer',fontWeight:'600'}}
                      onClick={()=>navigate('/student/reports')}>View full feedback →</span>
                  </div>
                )}
              </div>

              {/* Submitted assignments */}
              <div className="card">
                <div className="card-title">Submitted assignments</div>
                {recentSubs.length === 0 ? (
                  <div style={{textAlign:'center',padding:'20px 0',color:'#9ca3af',fontSize:'12px',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
                    <span style={{fontSize:'24px'}}>📄</span>
                    No submissions yet
                  </div>
                ) : (
                  <>
                    {recentSubs.map((a,i)=>(
                      <div key={a._id} style={{
                        display:'flex',alignItems:'center',justifyContent:'space-between',
                        padding:'9px 12px',borderRadius:'8px',marginBottom:'6px',
                        background:BG_COLORS[i%BG_COLORS.length],cursor:'pointer',
                      }} onClick={goToHistory}>
                        <span style={{fontSize:'12px',fontWeight:'500',color:TC_COLORS[i%TC_COLORS.length]}}>{a.assignmentName}</span>
                        <span style={{fontSize:'11px',fontWeight:'600',color:TC_COLORS[i%TC_COLORS.length]}}>View</span>
                      </div>
                    ))}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#2563eb',fontSize:'12px',fontWeight:'600',cursor:'pointer',marginTop:'8px'}}
                      onClick={goToHistory}>
                      View More →
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div style={{textAlign:'center',paddingTop:'6px',cursor:'pointer'}} onClick={()=>navigate('/student/profile')}>
              <div style={{width:'58px',height:'58px',borderRadius:'50%',background:'#e5e7eb',margin:'0 auto 8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px'}}>👤</div>
              <div style={{fontSize:'13px',fontWeight:'600',color:'#374151'}}>{user?.username||'Student'}</div>
            </div>
            <div className="card" style={{padding:'14px'}}><Calendar/></div>
            <div>
              <div style={{fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'10px'}}>Upcoming Submissions</div>
              {displayUpcoming.length === 0 ? (
                <div style={{textAlign:'center',padding:'16px',color:'#9ca3af',fontSize:'12px',border:'1px dashed #e5e7eb',borderRadius:'10px',marginBottom:'9px'}}>
                  No upcoming submissions
                </div>
              ) : (
                displayUpcoming.map(item=>(
                  <div key={item._id} style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'11px 14px',border:'1px solid #e5e7eb',borderRadius:'10px',
                    marginBottom:'9px',fontSize:'13px',color:'#374151',cursor:'pointer',background:'white',
                    transition:'border-color .15s,box-shadow .15s',
                  }}
                    onClick={()=>navigate(`/student/submissions?assignment=${item._id}`)}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.boxShadow='0 0 0 2px #dbeafe';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.boxShadow='none';}}>
                    <span>{item.title||item.name}</span>
                    <span style={{color:'#9ca3af',fontSize:'16px'}}>›</span>
                  </div>
                ))
              )}
              <button style={{
                width:'100%',padding:'12px',borderRadius:'10px',border:'none',
                background:'#2563eb',color:'white',fontSize:'13px',fontWeight:'600',
                fontFamily:'Poppins,sans-serif',cursor:'pointer',
              }} onClick={()=>navigate('/student/submissions')}>
                See all →
              </button>
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}