import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from '../../api/adminAPI';
import './admin.css';

const PLAN_STYLE = {
  free:        { cls: 'adm-badge--free', label: 'Free',        color: 'var(--text-muted)' },
  pro:         { cls: 'adm-badge--pro',  label: 'Pro',         color: 'var(--ocean)'      },
  institution: { cls: 'adm-badge--inst', label: 'Institution', color: '#7c3aed'           },
};

const Ico = ({ n, s = 18 }) => {
  const icons = {
    search: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    card:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    free:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  };
  return icons[n] || null;
};

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [msg,        setMsg]        = useState({ text: '', type: '' });
  const [updating,   setUpdating]   = useState('');
  const [summary,    setSummary]    = useState({ free: 0, pro: 0, institution: 0 });

  useEffect(() => { fetchSubs(); }, [search, planFilter, page]);
  useEffect(() => { fetchSummary(); }, []);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/subscriptions', { params: { search, plan: planFilter, page, limit: 15 } });
      setUsers(res.data.users); setTotal(res.data.total);
    } catch (err) { if (err.response?.status === 401) navigate('/admin'); }
    finally       { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const res = await adminAPI.get('/admin/stats');
      const s = res.data.stats?.subscriptions;
      if (s) setSummary({ free: s.free, pro: s.pro, institution: s.institution });
    } catch (_) {}
  };

  const handleUpdateSub = async (userId, plan) => {
    setUpdating(userId);
    try {
      await adminAPI.put(`/admin/users/${userId}/subscription`, { plan });
      showMsg(`Plan updated to ${plan}`, 'success');
      fetchSubs(); fetchSummary();
    } catch { showMsg('Failed to update plan', 'error'); }
    finally  { setUpdating(''); }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  const pages = Math.ceil(total / 15);
  const fmt   = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const subTotal = summary.free + summary.pro + summary.institution;

  return (
    <AdminLayout>
      <div className="adm-topbar" style={{ marginBottom: 20 }}>
        <div className="adm-topbar-left">
          <h1 className="adm-page-title">Subscription Management</h1>
          <p className="adm-page-sub">Manage student subscription plans · {total} total students</p>
        </div>
      </div>

      <div className="adm-content" style={{ paddingTop: 0 }}>
        {/* Plan summary cards — clickable filters */}
        <div className="adm-stats-grid adm-stats-grid-3">
          {Object.entries(PLAN_STYLE).map(([key, s]) => (
            <div
              key={key}
              className={`adm-stat-card ${key === 'free' ? 'adm-stat-ocean' : key === 'pro' ? 'adm-stat-blue' : 'adm-stat-purple'}`}
              style={{ cursor: 'pointer', outline: planFilter === key ? '2px solid var(--sky)' : 'none' }}
              onClick={() => { setPlanFilter(planFilter === key ? '' : key); setPage(1); }}
            >
              <div className="adm-stat-icon"><Ico n="card" /></div>
              <div className="adm-stat-num">{summary[key]}</div>
              <div className="adm-stat-label">{s.label} Plan</div>
            </div>
          ))}
        </div>

        {msg.text && <div className={`adm-alert adm-alert--${msg.type}`}>{msg.text}</div>}

        {/* Table card */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              {planFilter ? `${PLAN_STYLE[planFilter].label} Subscribers` : 'All Subscribers'}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="adm-search-bar">
                <span className="adm-search-icon"><Ico n="search" s={15} /></span>
                <input placeholder="Search name or email…" value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font)', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}>
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="institution">Institution</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading subscriptions…</span></div>
          ) : users.length === 0 ? (
            <div className="adm-empty">
              <svg className="adm-empty-icon" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/></svg>
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Student</th><th>Email</th><th>Current Plan</th><th>Joined</th><th>Change Plan</th></tr></thead>
                <tbody>
                  {users.map(u => {
                    const plan = u.subscription?.plan || 'free';
                    const ps   = PLAN_STYLE[plan] || PLAN_STYLE.free;
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="adm-user-cell">
                            <div className="adm-avatar">{u.username?.[0]?.toUpperCase() || 'S'}</div>
                            <span className="adm-user-name">{u.username}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>
                        <td><span className={`adm-badge ${ps.cls}`}>{ps.label}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(u.createdAt)}</td>
                        <td>
                          <select
                            value={plan}
                            onChange={e => handleUpdateSub(u._id, e.target.value)}
                            disabled={updating === u._id}
                            className={`adm-badge ${ps.cls}`}
                            style={{ border: 'none', cursor: 'pointer', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontWeight: 700 }}
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="institution">Institution</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Breakdown bar */}
        {subTotal > 0 && (
          <div className="adm-card">
            <div className="adm-card-header"><span className="adm-card-title">Plan Distribution</span></div>
            <div className="adm-card-body">
              {Object.entries(PLAN_STYLE).map(([key, s]) => {
                const pct = subTotal > 0 ? Math.round((summary[key] / subTotal) * 100) : 0;
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{s.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{summary[key]} ({pct}%)</span>
                    </div>
                    <div className="adm-progress-wrap">
                      <div className="adm-progress-fill" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`adm-btn ${page === p ? 'adm-btn--primary' : 'adm-btn--outline'}`}
                style={{ width: 36, height: 36, padding: 0, borderRadius: 8, fontSize: 13 }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}