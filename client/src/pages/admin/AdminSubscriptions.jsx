import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from "../../api/adminAPI";

const PLAN_STYLE = {
  free:        { bg: '#f3f4f6', color: '#6b7280', label: 'Free' },
  pro:         { bg: '#eff6ff', color: '#2563eb', label: 'Pro' },
  institution: { bg: '#f5f3ff', color: '#7c3aed', label: 'Institution' },
};

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [msg, setMsg]           = useState('');
  const [msgType, setMsgType]   = useState('success');
  const [updating, setUpdating] = useState('');

  // summary counts
  const [summary, setSummary] = useState({ free: 0, pro: 0, institution: 0 });

  useEffect(() => { fetchSubs(); }, [search, planFilter, page]);
  useEffect(() => { fetchSummary(); }, []);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/admin/subscriptions', {
        params: { search, plan: planFilter, page, limit: 15 },
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      if (err.response?.status === 401) navigate('/admin');
    } finally {
      setLoading(false);
    }
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
      showMsg(`✅ Plan updated to ${plan}`, 'success');
      fetchSubs();
      fetchSummary();
    } catch {
      showMsg('❌ Failed to update plan', 'error');
    } finally {
      setUpdating('');
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
            💳 Subscription Management
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Manage student subscription plans</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {Object.entries(PLAN_STYLE).map(([key, s]) => (
            <div key={key} style={{
              background: s.bg, borderRadius: 14, padding: '20px 24px',
              border: `1px solid ${s.color}22`, cursor: 'pointer',
              outline: planFilter === key ? `2px solid ${s.color}` : 'none',
              transition: 'all 0.15s',
            }} onClick={() => { setPlanFilter(planFilter === key ? '' : key); setPage(1); }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{s.label} Plan</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{summary[key]}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>students</div>
            </div>
          ))}
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
          <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }} style={{
            padding: '10px 14px', borderRadius: 10, border: '1.5px solid #d1d5db',
            fontSize: 14, background: '#fff', cursor: 'pointer', outline: 'none',
          }}>
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="institution">Institution</option>
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
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              No subscriptions found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Student', 'Email', 'Current Plan', 'Joined', 'Change Plan'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const plan = u.subscription?.plan || 'free';
                  const ps = PLAN_STYLE[plan] || PLAN_STYLE.free;
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#eff6ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                          }}>🎓</div>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{u.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: ps.bg, color: ps.color,
                          borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                        }}>
                          {ps.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={plan}
                          onChange={e => handleUpdateSub(u._id, e.target.value)}
                          disabled={updating === u._id}
                          style={{
                            background: ps.bg, color: ps.color,
                            border: 'none', borderRadius: 8, padding: '5px 10px',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
                          }}>
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
          )}
        </div>

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