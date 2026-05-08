import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from '../../api/adminAPI';
import './admin.css';

const Ico = ({ n, s = 18 }) => {
  const icons = {
    search: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    trash:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    board:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    total:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };
  return icons[n] || null;
};

export default function AdminLecturers() {
  const navigate = useNavigate();
  const [lecturers, setLecturers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [msg,       setMsg]       = useState({ text: '', type: '' });
  const [deleting,  setDeleting]  = useState('');

  useEffect(() => { fetchLecturers(); }, [search, page]);

  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/lecturers', { params: { search, page, limit: 15 } });
      setLecturers(res.data.lecturers);
      setTotal(res.data.total);
    } catch (err) { if (err.response?.status === 401) navigate('/admin'); }
    finally       { setLoading(false); }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete lecturer "${username}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminAPI.delete(`/admin/lecturers/${id}`);
      showMsg(`Lecturer "${username}" deleted`, 'success');
      fetchLecturers();
    } catch { showMsg('Failed to delete lecturer', 'error'); }
    finally  { setDeleting(''); }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  const pages = Math.ceil(total / 15);
  const fmt   = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <AdminLayout>
      <div className="adm-topbar" style={{ marginBottom: 20 }}>
        <div className="adm-topbar-left">
          <h1 className="adm-page-title">Lecturer Management</h1>
          <p className="adm-page-sub">{total} registered lecturers</p>
        </div>
      </div>

      <div className="adm-content" style={{ paddingTop: 0 }}>
        {/* Stat card */}
        <div className="adm-stats-grid adm-stats-grid-3">
          <div className="adm-stat-card adm-stat-blue">
            <div className="adm-stat-icon"><Ico n="total" /></div>
            <div className="adm-stat-num">{total}</div>
            <div className="adm-stat-label">Total Lecturers</div>
          </div>
          <div className="adm-stat-card adm-stat-cyan">
            <div className="adm-stat-icon"><Ico n="board" /></div>
            <div className="adm-stat-num">{lecturers.length}</div>
            <div className="adm-stat-label">This Page</div>
          </div>
          <div className="adm-stat-card adm-stat-green">
            <div className="adm-stat-icon"><Ico n="board" /></div>
            <div className="adm-stat-num">{lecturers.filter(l => l.isActive !== false).length}</div>
            <div className="adm-stat-label">Active</div>
          </div>
        </div>

        {msg.text && <div className={`adm-alert adm-alert--${msg.type}`}>{msg.text}</div>}

        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">All Lecturers</span>
            <div className="adm-search-bar">
              <span className="adm-search-icon"><Ico n="search" s={15} /></span>
              <input placeholder="Search by name or email…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading lecturers…</span></div>
          ) : lecturers.length === 0 ? (
            <div className="adm-empty">
              <svg className="adm-empty-icon" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/><path d="M13 20h14M20 13v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/></svg>
              <p>No lecturers found</p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Lecturer</th><th>Email</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {lecturers.map(l => (
                    <tr key={l._id}>
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-avatar">{l.username?.[0]?.toUpperCase() || 'L'}</div>
                          <div>
                            <div className="adm-user-name">{l.username}</div>
                            <div className="adm-user-sub">{l.name || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{l.email}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(l.createdAt)}</td>
                      <td>
                        <button className="adm-btn adm-btn--danger"
                          onClick={() => handleDelete(l._id, l.username)}
                          disabled={deleting === l._id}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Ico n="trash" s={13} />{deleting === l._id ? 'Deleting…' : 'Delete'}
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