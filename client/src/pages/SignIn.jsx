import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function SignIn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role] = useState(params.get('role') || 'student');
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
      const res = await loginUser({ ...form, role });
      login(res.data.token, res.data.user);
      navigate(role === 'student' ? '/student/dashboard' : '/lecturer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-left">
          <img src="/assets/Mentora.png" alt="Mentora" className="auth-left-logo" />
          <div className="auth-left-title">Welcome to Mentora Grading System</div>
          <div className="auth-left-sub">From Submission to Insight.</div>
        </div>
        <div className="auth-right">
          <h2>{role === 'student' ? 'Student Sign in' : 'Lecturer Sign in'}</h2>
          {error && <div className="err-msg">{error}</div>}
          <input className="auth-input" name="username" placeholder="Username"
            value={form.username} onChange={handle} onKeyDown={handleKey} />
          <input className="auth-input" name="password" placeholder="Password" type="password"
            value={form.password} onChange={handle} onKeyDown={handleKey} />
          {/* ← pass role so forgot password flow knows where to return */}
          <span className="forgot-link" onClick={() => navigate(`/forgot-password?role=${role}`)}>Forgot Password?</span>
          <button className="auth-btn" onClick={submit} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="auth-link-row">
            Don't have an account?{' '}
            <span className="auth-link" onClick={() => navigate('/signup')}>Sign Up!</span>
          </div>
        </div>
      </div>
    </div>
  );
}