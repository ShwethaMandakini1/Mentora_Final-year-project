import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from '../../api/adminAPI';
import './admin.css';

const SvgIcon = ({ name, size = 18 }) => {
  const icons = {
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    students: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    lecturers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    new: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  };
  return icons[name] || null;
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users,    setUsers]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [role,     setRole]     = useState('');
  const [page,     setPage]     = useState(1);
  const [msg,      setMsg]      = useState({ text: '', type: '' });
  const [deleting, setDeleting] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => { fetchUsers(); }, [search, role, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/users', { params: { search, role, page, limit: 15 } });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) { if (err.response?.status === 401) navigate('/signin'); }
    finally      { setLoading(false); }
  };

  const handleUpdateSub = async (userId, plan) => {
    setUpdating(userId);
    try {
      await adminAPI.put(`/admin/users/${userId}/subscription`, { plan });
      showMsg(`Subscription updated to ${plan}`, 'success');
      fetchUsers();
    } catch { showMsg('Failed to update subscription', 'error'); }
    finally  { setUpdating(''); }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete "${username}"? This cannot be undone.`)) return;
    setDeleting(userId);
    try {
      await adminAPI.delete(`/admin/users/${userId}`);
      showMsg(`User "${username}" deleted`, 'success');
      fetchUsers();
    } catch { showMsg('Failed to delete user', 'error'); }
    finally  { setDeleting(''); }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  const planBadge = (plan) => ({
    free:        'adm-badge--free',
    pro:         'adm-badge--pro',
    institution: 'adm-badge--inst',
  }[plan] || 'adm-badge--free');

  const pages = Math.ceil(total / 15);
  const fmt   = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <AdminLayout>
      <div className="adm-topbar" style={{ marginBottom: 20 }}>
        <div className="adm-topbar-left">
          <h1 className="adm-page-title">User Management</h1>
          <p className="adm-page-sub">{total} registered users across all roles</p>
        </div>
      </div>

      <div className="adm-content" style={{ paddingTop: 0 }}>

        {/* Stat cards */}
        <div className="adm-stats-grid adm-stats-grid-4">
          {[
            { label: 'Total Users',   icon: 'users',    cls: 'adm-stat-blue',   val: total },
            { label: 'Students',      icon: 'students', cls: 'adm-stat-cyan',   val: users.filter(u => u.role === 'student').length },
            { label: 'Lecturers',     icon: 'lecturers',cls: 'adm-stat-ocean',  val: users.filter(u => u.role === 'lecturer').length },
            { label: 'This Page',     icon: 'new',      cls: 'adm-stat-green',  val: users.length },
          ].map(s => (
            <div key={s.label} className={`adm-stat-card ${s.cls}`}>
              <div className="adm-stat-icon"><SvgIcon name={s.icon} /></div>
              <div className="adm-stat-num">{s.val}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alert */}
        {msg.text && <div className={`adm-alert adm-alert--${msg.type}`}>{msg.text}</div>}

        {/* Filters + table card */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">All Users</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="adm-search-bar">
                <span className="adm-search-icon"><SvgIcon name="search" size={15} /></span>
                <input
                  placeholder="Search name or email…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select
                value={role}
                onChange={e => { setRole(e.target.value); setPage(1); }}
                style={{ padding: '7px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, fontFamily: 'var(--font)', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading users…</span></div>
          ) : users.length === 0 ? (
            <div className="adm-empty">
              <svg className="adm-empty-icon" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><path d="M13 20h14M20 13v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
              <p>No users found</p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>User</th><th>Role</th><th>Student ID</th>
                    <th>Subscription</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-avatar">{u.username?.[0]?.toUpperCase() || 'U'}</div>
                          <div>
                            <div className="adm-user-name">{u.username}</div>
                            <div className="adm-user-sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-badge ${u.role === 'lecturer' ? 'adm-badge--admin' : 'adm-badge--active'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.studentId || '—'}</td>
                      <td>
                        {u.role === 'student' ? (
                          <select
                            value={u.subscription?.plan || 'free'}
                            onChange={e => handleUpdateSub(u._id, e.target.value)}
                            disabled={updating === u._id}
                            className={`adm-badge ${planBadge(u.subscription?.plan)}`}
                            style={{ border: 'none', cursor: 'pointer', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontWeight: 700 }}
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="institution">Institution</option>
                          </select>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>N/A</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(u.createdAt)}</td>
                      <td>
                        <button
                          className="adm-btn adm-btn--danger"
                          onClick={() => handleDelete(u._id, u.username)}
                          disabled={deleting === u._id}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <SvgIcon name="trash" size={13} />
                            {deleting === u._id ? 'Deleting…' : 'Delete'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`adm-btn ${page === p ? 'adm-btn--primary' : 'adm-btn--outline'}`}
                style={{ width: 36, height: 36, padding: 0, borderRadius: 8, fontSize: 13 }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}