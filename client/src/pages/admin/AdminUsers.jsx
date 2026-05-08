import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from "../../api/adminAPI";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [role, setRole]         = useState('');
  const [page, setPage]         = useState(1);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState('success');
  const [deleting, setDeleting] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => { fetchUsers(); }, [search, role, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/users', { params: { search, role, page, limit: 15 } });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSub = async (userId, plan) => {
    setUpdating(userId);
    try {
      await adminAPI.put(`/admin/users/${userId}/subscription`, { plan });
      showMsg(`✅ Subscription updated to ${plan}`, 'success');
      fetchUsers();
    } catch {
      showMsg('❌ Failed to update subscription', 'error');
    } finally {
      setUpdating('');
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) return;
    setDeleting(userId);
    try {
      await adminAPI.delete(`/admin/users/${userId}`);
      showMsg(`✅ User "${username}" deleted`, 'success');
      fetchUsers();
    } catch {
      showMsg('❌ Failed to delete user', 'error');
    } finally {
      setDeleting('');
    }
  };

  const showMsg = (text, type) => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const planColor = (plan) => {
    if (plan === 'pro')         return { bg: '#eff6ff', color: '#2563eb' };
    if (plan === 'institution') return { bg: '#f5f3ff', color: '#7c3aed' };
    return                             { bg: '#f3f4f6', color: '#6b7280' };
  };

  const pages = Math.ceil(total / 15);

  return (
    <AdminLayout>
      <div style={{ padding: '30px 40px' }}>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>👥 User Management</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} total users</p>
        </div>

        {msg && (
          <div style={{
            padding: '12px 18px', borderRadius: 10, marginBottom: 16,
            background: msgType === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: msgType === 'success' ? '#15803d' : '#dc2626',
            fontSize: 13, fontWeight: 600,
          }}>
            {msg}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <input
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
            }}
          />
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} style={{
            padding: '10px 14px', borderRadius: 10, border: '1.5px solid #d1d5db',
            fontSize: 14, background: '#fff', cursor: 'pointer', outline: 'none',
          }}>
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Lecturers</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div> Loading...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              No users found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['User', 'Role', 'Student ID', 'Subscription', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const pc = planColor(u.subscription?.plan);
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: u.role === 'lecturer' ? '#f5f3ff' : '#eff6ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                          }}>
                            {u.role === 'lecturer' ? '👨‍🏫' : '🎓'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{u.username}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: u.role === 'lecturer' ? '#f5f3ff' : '#eff6ff',
                          color:      u.role === 'lecturer' ? '#7c3aed' : '#2563eb',
                          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13 }}>
                        {u.studentId || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {u.role === 'student' ? (
                          <select
                            value={u.subscription?.plan || 'free'}
                            onChange={e => handleUpdateSub(u._id, e.target.value)}
                            disabled={updating === u._id}
                            style={{
                              background: pc.bg, color: pc.color,
                              border: 'none', borderRadius: 8, padding: '4px 8px',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
                            }}>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="institution">Institution</option>
                          </select>
                        ) : <span style={{ color: '#9ca3af', fontSize: 12 }}>N/A</span>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleDelete(u._id, u.username)}
                          disabled={deleting === u._id}
                          style={{
                            background: '#fef2f2', color: '#dc2626',
                            border: '1px solid #fecaca', borderRadius: 8,
                            padding: '6px 14px', fontSize: 12, fontWeight: 600,
                            cursor: deleting === u._id ? 'not-allowed' : 'pointer',
                          }}>
                          {deleting === u._id ? '...' : '🗑 Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: page === p ? '#2563eb' : '#fff',
                color: page === p ? '#fff' : '#374151',
                fontWeight: page === p ? 700 : 400,
                border: page === p ? 'none' : '1px solid #e5e7eb',
                cursor: 'pointer', fontSize: 14,
              }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}