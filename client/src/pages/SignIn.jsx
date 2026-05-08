import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleKey = e => { if (e.key === 'Enter') submit(); };

  const submit = async () => {
    setError('');
    if (!form.username || !form.password) return setError('Please enter username and password');
    setLoading(true);
    try {
      // Use the unified login helper
      const res = await loginUser(form);
      const { token, user } = res.data;
      
      // Save to AuthContext
      login(token, user);

      // Automatic Redirection based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'lecturer') {
        navigate('/lecturer/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-left">
          <img src="/assets/Mentora.png" alt="Mentora" className="auth-left-logo" />
          <div className="auth-left-title">Mentora Grading System</div>
          <div className="auth-left-sub">From Submission to Insight.</div>
        </div>
        <div className="auth-right">
          <h2>Sign In</h2>
          <p style={{ fontSize: '13px', color: '#8FA5BC', marginBottom: '24px', marginTop: '-12px' }}>
            Access your personalized dashboard
          </p>

          {error && <div className="err-msg" style={{ marginBottom: '16px' }}>{error}</div>}
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A6080', display: 'block', marginBottom: '6px' }}>USERNAME</label>
            <input 
              className="auth-input" 
              name="username" 
              placeholder="Enter your username"
              value={form.username} 
              onChange={handle} 
              onKeyDown={handleKey} 
              style={{ margin: 0 }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4A6080', display: 'block', marginBottom: '6px' }}>PASSWORD</label>
            <input 
              className="auth-input" 
              name="password" 
              placeholder="Enter your password" 
              type="password"
              value={form.password} 
              onChange={handle} 
              onKeyDown={handleKey}
              style={{ margin: 0 }}
            />
          </div>

          <span className="forgot-link" onClick={() => navigate('/forgot-password')} style={{ marginBottom: '24px', display: 'block' }}>
            Forgot Password?
          </span>

          <button className="auth-btn" onClick={submit} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="auth-link-row" style={{ marginTop: '24px' }}>
            Don't have an account?{' '}
            <span className="auth-link" onClick={() => navigate('/signup')}>Sign Up!</span>
          </div>
        </div>
      </div>
    </div>
  );
}