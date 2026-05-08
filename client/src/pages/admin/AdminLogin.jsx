import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

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

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid rgba(0,119,182,0.15)', fontSize: 14, outline: 'none',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: 'border-box', color: '#03045E', background: '#fff',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '40px 44px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(3,4,94,0.35)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #03045E, #0096C7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,150,199,0.35)',
          }}>
            <ShieldIcon />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#03045E', margin: 0, letterSpacing: '-0.5px' }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: '#8FA5BC', marginTop: 6 }}>
            Mentora Administration Panel
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: 13, color: '#dc2626', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6080', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Username
            </label>
            <input
              type="text" placeholder="Enter admin username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0096C7'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,119,182,0.15)'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4A6080', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <input
              type="password" placeholder="Enter admin password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#0096C7'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,119,182,0.15)'}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: loading ? 'rgba(0,150,199,0.5)' : 'linear-gradient(135deg, #03045E, #0096C7)',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit', letterSpacing: '0.2px',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(0,150,199,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Signing in…
              </>
            ) : (
              <>
                <ShieldIcon />
                Sign In as Admin
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#8FA5BC', marginTop: 24 }}>
          This portal is restricted to authorized administrators only.
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}