import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await API.post('/admin/login', form);
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser',  JSON.stringify(res.data.admin));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3560 60%, #0f2847 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 44px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
          }}>
            🛡️
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
            Mentora Administration Panel
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: '#dc2626', fontWeight: 600,
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter admin username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box', color: '#111827',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1.5px solid #d1d5db', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box', color: '#111827',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            }}>
            {loading ? '⏳ Signing in...' : '🛡️ Sign In as Admin'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          This portal is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}