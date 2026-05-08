import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from "../../api/adminAPI";

export default function AdminDashboard() {
  const navigate          = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [cached, setCached]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/stats');
      setStats(res.data.stats);
      setCached(res.data.cached);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await adminAPI.post('/admin/stats/refresh');
      await fetchStats();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        Loading dashboard...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div style={{ padding: '30px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>
              📊 Admin Dashboard
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
              Platform overview {cached && <span style={{ color: '#d97706', fontSize: 12 }}>· Cached (refreshes every 10 min)</span>}
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} style={{
            background: '#fff', border: '1px solid #d1d5db', borderRadius: 10,
            padding: '9px 18px', fontSize: 13, fontWeight: 600,
            cursor: refreshing ? 'not-allowed' : 'pointer', color: '#374151',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Stats'}
          </button>
        </div>

        {/* User Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Users',  value: stats.users.total,     icon: '👥', color: '#2563eb', bg: '#eff6ff' },
            { label: 'Students',     value: stats.users.students,   icon: '🎓', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Lecturers',    value: stats.users.lecturers,  icon: '👨‍🏫', color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'New This Week',value: stats.users.newThisWeek,icon: '🆕', color: '#d97706', bg: '#fef3c7' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 14, padding: '20px 22px',
              border: `1px solid ${s.color}20`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Submission Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Submissions',  value: stats.submissions.total,           icon: '📄', color: '#2563eb', bg: '#eff6ff' },
            { label: 'Graded',             value: stats.submissions.graded,           icon: '✅', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Pending',            value: stats.submissions.pending,          icon: '⏳', color: '#d97706', bg: '#fef3c7' },
            { label: 'Pending Approvals',  value: stats.submissions.pendingApprovals, icon: '📋', color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 14, padding: '20px 22px',
              border: `1px solid ${s.color}20`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Subscription breakdown */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              💳 Subscription Breakdown
            </h3>
            {[
              { label: 'Free',        value: stats.subscriptions.free,        color: '#6b7280', bg: '#f3f4f6' },
              { label: 'Pro',         value: stats.subscriptions.pro,         color: '#2563eb', bg: '#eff6ff' },
              { label: 'Institution', value: stats.subscriptions.institution, color: '#7c3aed', bg: '#f5f3ff' },
            ].map(s => {
              const total = stats.subscriptions.free + stats.subscriptions.pro + stats.subscriptions.institution;
              const pct   = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{s.label}</span>
                    <span style={{ color: '#6b7280' }}>{s.value} users ({pct}%)</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 8, height: 8 }}>
                    <div style={{ width: `${pct}%`, background: s.color, borderRadius: 8, height: 8, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              ⚡ Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Manage Users',         icon: '👥', route: '/admin/users'         },
                { label: 'Manage Admins',         icon: '🛡️', route: '/admin/admins'        },
                { label: 'Subscription Overview', icon: '💳', route: '/admin/subscriptions' },
                { label: 'Broadcast Message',     icon: '📢', route: '/admin/broadcast'     },
              ].map(a => (
                <button key={a.label} onClick={() => navigate(a.route)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e7eb',
                  background: '#f9fafb', cursor: 'pointer', fontSize: 14,
                  fontWeight: 500, color: '#374151', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  {a.label}
                  <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
          {[
            { label: 'Total Assignments', value: stats.assignments.total,       icon: '📋', color: '#2563eb' },
            { label: 'Average Score',     value: `${stats.performance.avgScore}%`, icon: '🎯', color: '#16a34a' },
            { label: 'Total Admins',      value: stats.users.admins,            icon: '🛡️', color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 14, padding: '20px 24px',
              border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
}