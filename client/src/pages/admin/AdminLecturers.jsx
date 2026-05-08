import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from "../../api/adminAPI";

export default function AdminLecturers() {
  const navigate = useNavigate();
  const [lecturers, setLecturers] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [msg, setMsg]             = useState('');
  const [msgType, setMsgType]     = useState('success');
  const [deleting, setDeleting]   = useState('');

  useEffect(() => { fetchLecturers(); }, [search, page]);

  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/lecturers', { params: { search, page, limit: 15 } });
      setLecturers(res.data.lecturers);
      setTotal(res.data.total);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete lecturer "${username}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminAPI.delete(`/admin/lecturers/${id}`);
      showMsg(`✅ Lecturer "${username}" deleted`, 'success');
      fetchLecturers();
    } catch {
      showMsg('❌ Failed to delete lecturer', 'error');
    } finally {
      setDeleting('');
    }
  };

  const showMsg = (text, type) => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3500);
  };

  const pages = Math.ceil(total / 15);

  return (
    <AdminLayout>
      <div style={{ padding: '30px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
            👨‍🏫 Lecturer Management
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{total} total lecturers</p>
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

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            placeholder="🔍 Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%', maxWidth: 420,
              padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div> Loading...
            </div>
          ) : lecturers.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍🏫</div>
              No lecturers found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Lecturer', 'Email', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l, i) => (
                  <tr key={l._id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: '#f5f3ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>👨‍🏫</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{l.username}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{l.name || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13 }}>{l.email}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                      {new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleDelete(l._id, l.username)}
                        disabled={deleting === l._id}
                        style={{
                          background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fecaca', borderRadius: 8,
                          padding: '6px 14px', fontSize: 12, fontWeight: 600,
                          cursor: deleting === l._id ? 'not-allowed' : 'pointer',
                        }}>
                        {deleting === l._id ? '...' : '🗑 Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{
                width: 36, height: 36, borderRadius: 8,
                background: page === p ? '#2563eb' : '#fff',
                color: page === p ? '#fff' : '#374151',
                fontWeight: page === p ? 700 : 400,
                border: page === p ? 'none' : '1px solid #e5e7eb',
                cursor: 'pointer', fontSize: 14,
              }}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}