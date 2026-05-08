import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from '../../api/adminAPI';
import './admin.css';

const EMPTY_FORM = { username: '', email: '', password: '', name: '', isSuperAdmin: false };

const Ico = ({ n, s = 18 }) => {
  const icons = {
    shield: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    plus:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    trash:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    x:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[n] || null;
};

export default function AdminManagement() {
  const navigate = useNavigate();
  const [admins,   setAdmins]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [msg,      setMsg]      = useState({ text: '', type: '' });
  const [formErr,  setFormErr]  = useState('');
  const me = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/admins');
      setAdmins(res.data.admins);
    } catch (err) { if (err.response?.status === 401) navigate('/signin'); }
    finally       { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setFormErr('');
    if (!form.username || !form.email || !form.password || !form.name)
      return setFormErr('All fields are required.');
    if (form.password.length < 6) return setFormErr('Password must be at least 6 characters.');
    setCreating(true);
    try {
      await adminAPI.post('/admin/admins', form);
      showMsg('Admin created successfully', 'success');
      setForm(EMPTY_FORM); setShowForm(false); fetchAdmins();
    } catch (err) { setFormErr(err.response?.data?.message || 'Failed to create admin'); }
    finally       { setCreating(false); }
  };

  const handleDelete = async (id, username) => {
    if (id === me.id) return showMsg('You cannot delete yourself', 'error');
    if (!window.confirm(`Delete admin "${username}"?`)) return;
    setDeleting(id);
    try {
      await adminAPI.delete(`/admin/admins/${id}`);
      showMsg(`Admin "${username}" deleted`, 'success'); fetchAdmins();
    } catch { showMsg('Failed to delete admin', 'error'); }
    finally  { setDeleting(''); }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <AdminLayout>
      <div className="adm-topbar" style={{ marginBottom: 20 }}>
        <div className="adm-topbar-left">
          <h1 className="adm-page-title">Admin Management</h1>
          <p className="adm-page-sub">{admins.length} admin accounts</p>
        </div>
        <button
          className={`adm-btn ${showForm ? 'adm-btn--ghost' : 'adm-btn--primary'}`}
          onClick={() => { setShowForm(!showForm); setFormErr(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          {showForm ? <><Ico n="x" s={14} /> Cancel</> : <><Ico n="plus" s={14} /> New Admin</>}
        </button>
      </div>

      <div className="adm-content" style={{ paddingTop: 0 }}>
        {msg.text && <div className={`adm-alert adm-alert--${msg.type}`}>{msg.text}</div>}

        {/* Create Form */}
        {showForm && (
          <div className="adm-card">
            <div className="adm-card-header"><span className="adm-card-title">Create New Admin</span></div>
            <div className="adm-card-body">
              {formErr && <div className="adm-alert adm-alert--error">{formErr}</div>}
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
                    { label: 'Username',  key: 'username', type: 'text', placeholder: 'johndoe' },
                    { label: 'Email',     key: 'email', type: 'email', placeholder: 'admin@mentora.com' },
                    { label: 'Password',  key: 'password', type: 'password', placeholder: 'Min 6 characters' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="adm-label">{f.label}</label>
                      <input
                        className="adm-input" type={f.type} placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <input type="checkbox" id="superAdmin" checked={form.isSuperAdmin}
                    onChange={e => setForm({ ...form, isSuperAdmin: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="superAdmin" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Super Admin (full permissions)
                  </label>
                </div>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={creating}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px' }}>
                  <Ico n="shield" s={14} />{creating ? 'Creating…' : 'Create Admin'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Admin table */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">Admin Accounts</span>
            <span className="adm-count-pill">{admins.length}</span>
          </div>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading admins…</span></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Admin</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-avatar" style={{ background: a.isSuperAdmin ? 'linear-gradient(135deg, var(--navy), var(--ocean))' : undefined }}>
                            {a.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="adm-user-name">
                              {a.name}
                              {a._id === me.id && (
                                <span className="adm-badge adm-badge--active" style={{ marginLeft: 8, fontSize: 10 }}>You</span>
                              )}
                            </div>
                            <div className="adm-user-sub">@{a.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.email}</td>
                      <td>
                        <span className={`adm-badge ${a.isSuperAdmin ? 'adm-badge--admin' : 'adm-badge--free'}`}>
                          {a.isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmt(a.createdAt)}</td>
                      <td>
                        {a._id !== me.id ? (
                          <button className="adm-btn adm-btn--danger"
                            onClick={() => handleDelete(a._id, a.username)}
                            disabled={deleting === a._id}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Ico n="trash" s={13} />{deleting === a._id ? 'Deleting…' : 'Delete'}
                            </span>
                          </button>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}