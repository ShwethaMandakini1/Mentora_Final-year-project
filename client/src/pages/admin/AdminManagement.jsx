import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from "../../api/adminAPI";

const EMPTY_FORM = { username: '', email: '', password: '', name: '', isSuperAdmin: false };

export default function AdminManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState('success');
  const [formErr, setFormErr]   = useState('');

  const me = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/admins');
      setAdmins(res.data.admins);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.username || !form.email || !form.password || !form.name)
      return setFormErr('All fields are required.');
    if (form.password.length < 6)
      return setFormErr('Password must be at least 6 characters.');

    setCreating(true);
    try {
      await adminAPI.post('/admin/admins', form);
      showMsg('✅ Admin created successfully', 'success');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchAdmins();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (id === me.id) return showMsg('❌ You cannot delete yourself', 'error');
    if (!window.confirm(`Delete admin "${username}"?`)) return;
    setDeleting(id);
    try {
      await adminAPI.delete(`/admin/admins/${id}`);
      showMsg(`✅ Admin "${username}" deleted`, 'success');
      fetchAdmins();
    } catch {
      showMsg('❌ Failed to delete admin', 'error');
    } finally {
      setDeleting('');
    }
  };

  const showMsg = (text, type) => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827',
  };

  return (
    <AdminLayout>
      <div style={{ padding: '30px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>🛡️ Admin Management</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{admins.length} admin accounts</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setFormErr(''); }} style={{
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            {showForm ? '✕ Cancel' : '+ New Admin'}
          </button>
        </div>

        {msg && (
          <div style={{
            padding: '12px 18px', borderRadius: 10, marginBottom: 16,
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msgType === 'success' ? '#15803d' : '#dc2626',
            fontSize: 13, fontWeight: 600,
          }}>{msg}</div>
        )}

        {/* Create form */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
            padding: '28px 32px', marginBottom: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              Create New Admin
            </h3>

            {formErr && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600,
              }}>❌ {formErr}</div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full Name</label>
                  <input style={inputStyle} placeholder="John Doe" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Username</label>
                  <input style={inputStyle} placeholder="johndoe" value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email</label>
                  <input style={inputStyle} type="email" placeholder="admin@mentora.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
                  <input style={inputStyle} type="password" placeholder="Min 6 characters" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="superAdmin" checked={form.isSuperAdmin}
                  onChange={e => setForm({ ...form, isSuperAdmin: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="superAdmin" style={{ fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                  Super Admin (full permissions)
                </label>
              </div>

              <button type="submit" disabled={creating} style={{
                background: creating ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #3b82f6)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '11px 28px', fontSize: 14, fontWeight: 700,
                cursor: creating ? 'not-allowed' : 'pointer',
              }}>
                {creating ? '⏳ Creating...' : '🛡️ Create Admin'}
              </button>
            </form>
          </div>
        )}

        {/* Admins list */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div> Loading...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Admin', 'Email', 'Role', 'Created', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((a, i) => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: a.isSuperAdmin ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : '#f5f3ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        }}>🛡️</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {a.name}
                            {a._id === me.id && (
                              <span style={{ marginLeft: 8, fontSize: 11, background: '#dcfce7', color: '#16a34a', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>@{a.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13 }}>{a.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: a.isSuperAdmin ? '#eff6ff' : '#f3f4f6',
                        color: a.isSuperAdmin ? '#1e40af' : '#6b7280',
                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                      }}>
                        {a.isSuperAdmin ? '⭐ Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                      {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {a._id !== me.id ? (
                        <button onClick={() => handleDelete(a._id, a.username)} disabled={deleting === a._id} style={{
                          background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: 8,
                          padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          cursor: deleting === a._id ? 'not-allowed' : 'pointer',
                        }}>
                          {deleting === a._id ? '...' : '🗑 Delete'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}