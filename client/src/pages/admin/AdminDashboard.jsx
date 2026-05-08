import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from '../../api/adminAPI';
import './admin.css';

const SvgIcon = ({ name, size = 18 }) => {
  const icons = {
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    student: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    doc: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    card: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    assign: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trend: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  };
  return icons[name] || null;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [cached,     setCached]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/stats');
      setStats(res.data.stats);
      setCached(res.data.cached);
    } catch (err) { if (err.response?.status === 401) navigate('/admin'); }
    finally       { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await adminAPI.post('/admin/stats/refresh'); await fetchStats(); }
    finally { setRefreshing(false); }
  };

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  if (loading) return (
    <AdminLayout>
      <div className="adm-loading" style={{ paddingTop: 120 }}>
        <div className="adm-spinner" />
        <span>Loading dashboard…</span>
      </div>
    </AdminLayout>
  );

  const userCards = [
    { label: 'Total Users',   icon: 'users',   cls: 'adm-stat-blue',   val: stats.users.total },
    { label: 'Students',      icon: 'student', cls: 'adm-stat-green',  val: stats.users.students },
    { label: 'Lecturers',     icon: 'doc',     cls: 'adm-stat-cyan',   val: stats.users.lecturers },
    { label: 'New This Week', icon: 'trend',   cls: 'adm-stat-ocean',  val: stats.users.newThisWeek },
  ];
  const subCards = [
    { label: 'Total Submissions', icon: 'doc',    cls: 'adm-stat-blue',   val: stats.submissions.total },
    { label: 'Graded',            icon: 'check',  cls: 'adm-stat-green',  val: stats.submissions.graded },
    { label: 'Pending',           icon: 'clock',  cls: 'adm-stat-cyan',   val: stats.submissions.pending },
    { label: 'Pending Approvals', icon: 'assign', cls: 'adm-stat-ocean',  val: stats.submissions.pendingApprovals },
  ];

  const subTotal = stats.subscriptions.free + stats.subscriptions.pro + stats.subscriptions.institution;
  const subBreakdown = [
    { key: 'free',        label: 'Free',        val: stats.subscriptions.free,        cls: 'adm-badge--free', color: 'var(--text-muted)' },
    { key: 'pro',         label: 'Pro',         val: stats.subscriptions.pro,         cls: 'adm-badge--pro',  color: 'var(--ocean)' },
    { key: 'institution', label: 'Institution', val: stats.subscriptions.institution, cls: 'adm-badge--inst', color: '#7c3aed' },
  ];
  const quickActions = [
    { label: 'Manage Users',         icon: 'users',  route: '/admin/users'         },
    { label: 'Manage Admins',        icon: 'shield', route: '/admin/admins'        },
    { label: 'Subscription Overview',icon: 'card',   route: '/admin/subscriptions' },
    { label: 'Broadcast Message',    icon: 'trend',  route: '/admin/broadcast'     },
  ];

  return (
    <AdminLayout>
      <div className="adm-topbar" style={{ marginBottom: 20 }}>
        <div className="adm-topbar-left">
          <h1 className="adm-page-title">Admin Dashboard</h1>
          <p className="adm-page-sub">
            Platform overview · {dateStr}
            {cached && <span style={{ color: '#d97706', marginLeft: 8 }}>· Cached (refreshes every 10 min)</span>}
          </p>
        </div>
        <button className="adm-btn adm-btn--outline" onClick={handleRefresh} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <SvgIcon name="refresh" size={14} />
          {refreshing ? 'Refreshing…' : 'Refresh Stats'}
        </button>
      </div>

      <div className="adm-content" style={{ paddingTop: 0 }}>

        {/* User stats */}
        <div className="adm-stats-grid adm-stats-grid-4">
          {userCards.map(s => (
            <div key={s.label} className={`adm-stat-card ${s.cls}`}>
              <div className="adm-stat-icon"><SvgIcon name={s.icon} /></div>
              <div className="adm-stat-num">{s.val}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Submission stats */}
        <div className="adm-stats-grid adm-stats-grid-4">
          {subCards.map(s => (
            <div key={s.label} className={`adm-stat-card ${s.cls}`}>
              <div className="adm-stat-icon"><SvgIcon name={s.icon} /></div>
              <div className="adm-stat-num">{s.val}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Subscription breakdown */}
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">Subscription Breakdown</span>
              <span className="adm-count-pill">{subTotal} total</span>
            </div>
            <div className="adm-card-body">
              {subBreakdown.map(s => {
                const pct = subTotal > 0 ? Math.round((s.val / subTotal) * 100) : 0;
                return (
                  <div key={s.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{s.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{s.val} users ({pct}%)</span>
                    </div>
                    <div className="adm-progress-wrap">
                      <div className="adm-progress-fill" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">Quick Actions</span>
            </div>
            <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map(a => (
                <button
                  key={a.label}
                  className="adm-btn adm-btn--outline"
                  onClick={() => navigate(a.route)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', textAlign: 'left', fontSize: 13, width: '100%', justifyContent: 'flex-start' }}
                >
                  <span style={{ color: 'var(--sky)' }}><SvgIcon name={a.icon} size={16} /></span>
                  {a.label}
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}><SvgIcon name="arrow" size={14} /></span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform stats */}
        <div className="adm-stats-grid adm-stats-grid-3">
          {[
            { label: 'Total Assignments', icon: 'assign', cls: 'adm-stat-blue',   val: stats.assignments.total },
            { label: 'Average Score',     icon: 'trend',  cls: 'adm-stat-green',  val: `${stats.performance.avgScore}%` },
            { label: 'Total Admins',      icon: 'shield', cls: 'adm-stat-ocean',  val: stats.users.admins },
          ].map(s => (
            <div key={s.label} className={`adm-stat-card ${s.cls}`}>
              <div className="adm-stat-icon"><SvgIcon name={s.icon} /></div>
              <div className="adm-stat-num">{s.val}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}