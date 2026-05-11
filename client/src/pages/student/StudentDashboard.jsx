import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getMySubmissions, getAssignments } from '../../api/api';
import './dashboard.css';

function Calendar({ upcomingDates = [] }) {
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

  const hasDeadline = (day) => upcomingDates.some(date => {
    const d = new Date(date);
    return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
  });

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'16px'}} onClick={()=>setCur(new Date(y,m-1,1))}>‹</button>
        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
          <select value={months[m]} onChange={e=>setCur(new Date(y,months.indexOf(e.target.value),1))} style={{border:'1px solid var(--border)',borderRadius:'6px',padding:'2px 6px',fontSize:'11px',fontFamily:'var(--font)',color:'var(--text-sec)',cursor:'pointer',background:'white',outline:'none'}}>
            {months.map(mn=><option key={mn}>{mn}</option>)}
          </select>
          <select value={y} onChange={e=>setCur(new Date(Number(e.target.value),m,1))} style={{border:'1px solid var(--border)',borderRadius:'6px',padding:'2px 6px',fontSize:'11px',fontFamily:'var(--font)',color:'var(--text-sec)',cursor:'pointer',background:'white',outline:'none'}}>
            {[2024,2025,2026,2027].map(yr=><option key={yr}>{yr}</option>)}
          </select>
        </div>
        <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'16px'}} onClick={()=>setCur(new Date(y,m+1,1))}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',textAlign:'center'}}>
        {days.map(d=><div key={d} style={{fontSize:'10px',color:'var(--text-muted)',padding:'3px 0',fontWeight:'600'}}>{d}</div>)}
        {cells.map((c,i)=>{
          const isToday=!c.other&&c.d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
          const deadline=!c.other&&hasDeadline(c.d);
          return (
            <div key={i} style={{fontSize:'11px',padding:'5px 2px',borderRadius:'50%',cursor:'pointer',position:'relative',background:isToday?'var(--sky)':deadline?'#fef3c7':'transparent',color:isToday?'white':deadline?'#92400e':c.other?'var(--border)':'var(--text-sec)',fontWeight:isToday||deadline?'700':'400',aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',border:deadline&&!isToday?'1px solid #fbbf24':'none'}}>
              {c.d}
              {deadline && <span style={{position:'absolute',bottom:2,width:4,height:4,borderRadius:'50%',background:isToday?'white':'#f59e0b'}} />}
            </div>
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

function daysLeft(date) {
  if (!date) return null;
  const today = new Date();
  const due = new Date(date);
  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function fmtDate(date) {
  if (!date) return 'No deadline';
  return new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function shortText(text, limit = 90) {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

const OCEAN_BARS = ['#0077B6','#0096C7','#00B4D8','#48CAE4','#90E0EF','#ADE8F4'];
const BG_COLORS  = ['#E0F2FE','#DCFCE7','#F0F9FF','#FDF4FF','#FEF3C7','#FFE4E6'];
const TC_COLORS  = ['#0369A1','#166534','#0C4A6E','#6B21A8','#92400E','#9F1239'];

const SearchIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

function MiniStat({ icon, label, value, hint, bg, color, onClick }) {
  return (
    <div onClick={onClick} style={{background:bg,border:'1px solid rgba(0,0,0,0.05)',borderRadius:'16px',padding:'16px',cursor:onClick?'pointer':'default',minHeight:105,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{width:38,height:38,borderRadius:12,background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{icon}</div>
        <div style={{fontSize:26,fontWeight:800,color,lineHeight:1}}>{value}</div>
      </div>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:'#374151'}}>{label}</div>
        <div style={{fontSize:10,color:'#94a3b8',marginTop:3}}>{hint}</div>
      </div>
    </div>
  );
}

function EmptySmall({ text }) {
  return <div style={{textAlign:'center',padding:'18px',color:'var(--text-muted)',fontSize:'12px',border:'1px dashed var(--border)',borderRadius:'var(--radius-md)',background:'white'}}>{text}</div>;
}

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
  const pendingSubs = submissions.filter(s => s.status === 'Pending');
  const regradePending = submissions.filter(s => s.regrade?.status === 'pending');
  const approvedDrafts = submissions.filter(s => s.approvalStatus === 'approved');
  const rejectedDrafts = submissions.filter(s => s.approvalStatus === 'rejected');
  const pendingReviews = submissions.filter(s => s.approvalStatus === 'pending_review');

  const moduleMap  = {};
  gradedSubs.forEach(s => {
    const mod = s.moduleName || s.moduleCode || s.module || 'Other';
    if (!moduleMap[mod]) moduleMap[mod] = [];
    moduleMap[mod].push(Number(s.score) || 0);
  });

  const bars = Object.entries(moduleMap).map(([label, scores], i) => ({
    label,
    val: Math.round(scores.reduce((a, v) => a + v, 0) / scores.length),
    color: OCEAN_BARS[i % OCEAN_BARS.length],
  }));

  const hasGraded   = gradedSubs.length > 0;
  const realAverage = hasGraded ? Math.round(gradedSubs.reduce((a, s) => a + (Number(s.score) || 0), 0) / gradedSubs.length) : 0;
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
    .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt))
    .slice(0, 4);

  const latestFeedbacks = gradedSubs
    .filter(s => s.feedback)
    .sort((a, b) => new Date(b.gradedAt || b.updatedAt) - new Date(a.gradedAt || a.updatedAt))
    .slice(0, 3);

  const submittedNames = new Set(submissions.map(s => s.assignmentName));
  const submittedIds   = new Set(submissions.map(s => s.assignment?._id || s.assignment));

  const displayUpcoming = assignments
    .filter(a => !submittedIds.has(a._id) && !submittedNames.has(a.title))
    .sort((a, b) => new Date(a.deadline || a.dueDate || 0) - new Date(b.deadline || b.dueDate || 0))
    .slice(0, 4);

  const completedCount = submissions.filter(s => s.status === 'Graded' || s.status === 'Pending' || s.approvalStatus === 'approved').length;
  const totalAssignmentCount = Math.max(assignments.length, completedCount);
  const completionRate = totalAssignmentCount > 0 ? Math.round((completedCount / totalAssignmentCount) * 100) : 0;

  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const recentActivity = [
    ...gradedSubs.slice(0, 2).map(s => ({icon:'✅',title:`${s.assignmentName} graded`,desc:`Score ${s.score || 0}% ${s.grade ? `(${s.grade})` : ''}`,date:s.gradedAt || s.updatedAt || s.submittedAt,color:'#16a34a',bg:'#f0fdf4'})),
    ...regradePending.slice(0, 1).map(s => ({icon:'🔄',title:'Re-grade requested',desc:s.assignmentName,date:s.regrade?.requestedAt || s.updatedAt,color:'#d97706',bg:'#fffbeb'})),
    ...pendingReviews.slice(0, 1).map(s => ({icon:'⏳',title:'Draft awaiting review',desc:s.assignmentName,date:s.submittedAt || s.createdAt,color:'#2563eb',bg:'#eff6ff'})),
    ...rejectedDrafts.slice(0, 1).map(s => ({icon:'❌',title:'Draft needs revision',desc:s.assignmentName,date:s.rejectedAt || s.updatedAt,color:'#dc2626',bg:'#fef2f2'})),
  ].sort((a,b)=>new Date(b.date || 0)-new Date(a.date || 0)).slice(0,4);

  const upcomingDates = displayUpcoming.map(a => a.deadline || a.dueDate).filter(Boolean);
  const goToHistory = () => navigate('/student/submissions', { state: { tab: 'history' } });
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <StudentLayout>
      <div className="topbar">
        <div className="topbar-left"><h1>Dashboard</h1><p>{dateStr}</p></div>
        <div className="topbar-right">
          <div className="search-bar"><SearchIcon /><input placeholder="Search…" /></div>
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'S'}</div>
        </div>
      </div>

      <div className="page-content">
        <div style={{background:'linear-gradient(135deg,#0d1f4c,#0077B6)',borderRadius:'20px',padding:'24px 26px',color:'white',marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'20px',flexWrap:'wrap',boxShadow:'0 12px 30px rgba(13,31,76,.18)'}}>
          <div>
            <style>{`
@keyframes waveHand {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
`}</style>

<div style={{display:'flex',alignItems:'center',gap:'12px'}}>
  
  <span
    style={{
      fontSize:'34px',
      display:'inline-block',
      animation:'waveHand 2s infinite',
      transformOrigin:'70% 70%',
    }}
  >
    👋
  </span>

  <div>
    <div style={{fontSize:'13px',opacity:.8,marginBottom:6}}>
      Welcome back
    </div>

    <h2 style={{fontSize:'26px',fontWeight:800,margin:0}}>
      {user?.username || 'Student'}
    </h2>
  </div>

</div>
            <p style={{fontSize:'13px',opacity:.78,margin:'8px 0 0',maxWidth:600,lineHeight:1.6}}>Track your submissions, grades, deadlines, feedback, and academic progress from one place.</p>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'16px',marginBottom:'20px'}}>
          <MiniStat icon="📊" label="Academic Average" value={loading ? '...' : `${displayAvg}%`} hint={`Grade: ${loading ? '...' : displayGrade}`} bg="#E0F2FE" color="#0369A1" onClick={()=>navigate('/student/reports')} />
          <MiniStat icon="📄" label="Total Submissions" value={submissions.length} hint={`${gradedSubs.length} graded · ${pendingSubs.length} pending`} bg="#DCFCE7" color="#166534" onClick={goToHistory} />
          <MiniStat icon="⏳" label="Review Queue" value={pendingReviews.length} hint={`${approvedDrafts.length} approved · ${rejectedDrafts.length} rejected`} bg="#FEF3C7" color="#92400E" onClick={()=>navigate('/student/submissions', { state:{ tab:'pre-approval' } })} />
          <MiniStat icon="🎯" label="Completion Rate" value={`${completionRate}%`} hint={`${completedCount}/${totalAssignmentCount || 0} assignments handled`} bg="#FDF4FF" color="#6B21A8" onClick={()=>navigate('/student/submissions')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 285px', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
            <div className="card" style={{padding:'22px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,marginBottom:18}}>
                <div><div className="card-title" style={{marginBottom:4}}>Academic Performance</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Subject-wise score overview</div></div>
                <div style={{background:'#f8fafc',border:'1px solid var(--border)',borderRadius:12,padding:'8px 12px',fontSize:12,color:'var(--text-sec)',fontWeight:600}}>Overall: <span style={{color:'var(--sky)',fontWeight:800}}>{displayAvg}%</span></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '18px', marginBottom: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--foam), rgba(0,150,199,0.08))', borderRadius: 'var(--radius-md)', padding: '18px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '10px' }}>Academic Average</div>
                  <div style={{ fontSize: '52px', fontWeight: '800', color: 'var(--navy)', lineHeight: '1', marginBottom: '12px', letterSpacing: '-2px' }}>{loading ? '...' : `${displayAvg}%`}</div>
                  <div style={{ background: 'var(--sky)', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-block', letterSpacing: '0.2px' }}>Grade: {loading ? '...' : displayGrade}</div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '10px' }}>Subject Performance</div>
                  {bars.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px', color: 'var(--text-muted)', fontSize: '12px', flexDirection: 'column', gap: '6px', border:'1px dashed var(--border)', borderRadius:12 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      No graded subjects yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '110px', paddingRight: '8px', flexShrink: 0, paddingBottom: '20px' }}>{[100,75,50,25].map(v=><span key={v} style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{v}</span>)}</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flex: 1, height: '110px' }}>{bars.map(b=><div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}><span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--navy)' }}>{b.val}</span><div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: b.color, height: `${Math.max(8, (b.val / 100) * 80)}px`, minWidth: '20px', transition: 'height .5s' }}/><span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign:'center' }}>{b.label.substring(0, 8)}</span></div>)}</div>
                    </div>
                  )}
                </div>
              </div>

              {perfTags.length > 0 ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>{perfTags.map(t=><div key={t.label} style={{ background: t.bg, borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}><div style={{ fontSize: '11px', color: t.tc }}>{t.label}</div><div style={{ fontSize: '13px', fontWeight: '700', color: t.tc, marginTop: 2 }}>{t.val}</div></div>)}</div> : <div style={{ background: 'rgba(0,150,199,0.04)', borderRadius: 'var(--radius-md)', padding: '13px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border)' }}>Performance tags will appear once assignments are graded</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <div className="card">
                <div className="card-title">Feedback Summary</div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-sec)', marginBottom: '6px' }}>Overall Feedback</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>{feedbackText}</div>
                {latestFeedbacks.length > 0 ? <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>{latestFeedbacks.map(s => <div key={s._id} style={{ marginBottom: '10px', background:'#f8fafc',borderRadius:10,padding:10 }}><div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-sec)' }}>{s.assignmentName}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6', marginTop:4 }}>{shortText(s.feedback, 100)}</div></div>)}<span style={{ fontSize: '11px', color: 'var(--sky)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/student/reports')}>View full feedback →</span></div> : <div style={{marginTop:12}}><EmptySmall text="No lecturer feedback yet" /></div>}
              </div>

              <div className="card">
                <div className="card-title">Recent Activity</div>
                {recentActivity.length === 0 ? <EmptySmall text="No recent activity yet" /> : <div style={{display:'flex',flexDirection:'column',gap:10}}>{recentActivity.map((a,i)=><div key={`${a.title}-${i}`} style={{display:'flex',gap:10,background:a.bg,borderRadius:12,padding:12,border:'1px solid rgba(0,0,0,0.04)'}}><div style={{width:34,height:34,borderRadius:10,background:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{a.icon}</div><div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:a.color}}>{a.title}</div><div style={{fontSize:11,color:'var(--text-muted)',marginTop:3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.desc}</div><div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{fmtDate(a.date)}</div></div></div>)}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <div className="card">
                <div className="card-title">Submitted Assignments</div>
                {recentSubs.length === 0 ? <EmptySmall text="No submissions yet" /> : <>{recentSubs.map((a, i) => <div key={a._id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:'var(--radius-md)',marginBottom:'8px',background:BG_COLORS[i % BG_COLORS.length],cursor:'pointer',border:'1px solid rgba(0,0,0,0.04)'}} onClick={goToHistory}><div><div style={{ fontSize: '12px', fontWeight: '700', color: TC_COLORS[i % TC_COLORS.length] }}>{a.assignmentName}</div><div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:2 }}>{a.status} · {fmtDate(a.submittedAt)}</div></div><span style={{ fontSize: '11px', fontWeight: '600', color: TC_COLORS[i % TC_COLORS.length] }}>View →</span></div>)}<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sky)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }} onClick={goToHistory}>View More →</div></>}
              </div>

              <div className="card">
                <div className="card-title">Quick Actions</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[{label:'Submit Work',icon:'📤',path:'/student/submissions'},{label:'View Reports',icon:'📊',path:'/student/reports'},{label:'Analytics',icon:'📈',path:'/student/analytics'},{label:'Leaderboard',icon:'🏆',path:'/student/leaderboard'}].map(a=><button key={a.label} onClick={()=>navigate(a.path)} style={{border:'1px solid var(--border)',background:'#f8fafc',borderRadius:12,padding:'14px 10px',cursor:'pointer',fontFamily:'var(--font)',color:'var(--text-sec)',fontWeight:700,fontSize:12}}><div style={{fontSize:20,marginBottom:6}}>{a.icon}</div>{a.label}</button>)}</div>
                <div style={{marginTop:12,background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:12,padding:12,fontSize:11,color:'#1d4ed8',lineHeight:1.6}}>💡 Tip: Check reports after every grading update to review rubric marks and feedback.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding:'18px 12px', cursor: 'pointer', background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,.05)' }} onClick={() => navigate('/student/profile')}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--sky), var(--cyan))', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'white', fontWeight: '800' }}>{user?.username?.[0]?.toUpperCase() || 'S'}</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-sec)' }}>{user?.username || 'Student'}</div>
              <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:3 }}>Student Profile</div>
            </div>

            <div className="card" style={{ padding: '14px' }}><Calendar upcomingDates={upcomingDates} />{upcomingDates.length > 0 && <div style={{fontSize:10,color:'#92400e',marginTop:10,textAlign:'center'}}>Yellow dates indicate upcoming deadlines</div>}</div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-sec)', marginBottom: '10px', letterSpacing: '0.2px' }}>Upcoming Submissions</div>
              {displayUpcoming.length === 0 ? <EmptySmall text="No upcoming submissions" /> : displayUpcoming.map(item => { const left = daysLeft(item.deadline || item.dueDate); const urgent = left !== null && left <= 3; return <div key={item._id} style={{padding:'12px 14px',border:urgent?'1px solid #fca5a5':'1px solid var(--border)',borderRadius:'var(--radius-md)',marginBottom:'9px',fontSize:'13px',color:'var(--text-sec)',cursor:'pointer',background:urgent?'#fef2f2':'white',transition:'border-color .15s, box-shadow .15s'}} onClick={() => navigate('/student/submissions')} onMouseEnter={e => { e.currentTarget.style.borderColor = urgent ? '#ef4444' : 'var(--sky)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--foam)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = urgent ? '#fca5a5' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span style={{ fontSize: 12, fontWeight:700 }}>{item.title || item.name}</span><span style={{ color: urgent ? '#dc2626' : 'var(--sky)' }}>›</span></div><div style={{fontSize:10,color:urgent?'#dc2626':'var(--text-muted)',marginTop:5}}>{left === null ? 'No deadline' : left < 0 ? 'Overdue' : left === 0 ? 'Due today' : `Due in ${left} day${left === 1 ? '' : 's'}`}</div></div>; })}
              <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop:9 }} onClick={() => navigate('/student/submissions')}>See all →</button>
            </div>

            <div className="card">
              <div className="card-title">Achievements</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{background:'#fefce8',border:'1px solid #fde68a',borderRadius:12,padding:12}}><div style={{fontSize:18}}>🏆</div><div style={{fontSize:12,fontWeight:800,color:'#92400e',marginTop:4}}>{hasGraded && displayAvg >= 65 ? 'Good Performer' : 'Keep Going'}</div><div style={{fontSize:10,color:'#a16207',marginTop:3}}>{hasGraded && displayAvg >= 65 ? `Average above 65%` : 'Submit more work to unlock badges'}</div></div>
                <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:12}}><div style={{fontSize:18}}>✅</div><div style={{fontSize:12,fontWeight:800,color:'#166534',marginTop:4}}>{completedCount} Completed</div><div style={{fontSize:10,color:'#15803d',marginTop:3}}>Assignment progress tracked</div></div>
              </div>
            </div>

            {(strongest || weakest) && <div className="card"><div className="card-title">Study Focus</div>{strongest && <div style={{fontSize:12,color:'#166534',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:10,marginBottom:8}}>Strongest: <strong>{strongest.label}</strong> ({strongest.val}%)</div>}{weakest && <div style={{fontSize:12,color:'#92400e',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:10}}>Focus more on: <strong>{weakest.label}</strong> ({weakest.val}%)</div>}</div>}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
