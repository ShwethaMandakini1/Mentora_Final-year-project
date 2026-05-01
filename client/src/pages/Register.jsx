import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { registerUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Register() {
  const [params] = useSearchParams();
  const role = params.get('role') || 'student';
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError('');
    if (!form.username || !form.email || !form.password) return setError('All fields are required');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await registerUser({ ...form, role });
      login(res.data.token, res.data.user);
      navigate(role === 'student' ? '/student/dashboard' : '/lecturer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <h2>{role === 'student' ? 'Student Sign Up' : 'Lecturer Sign Up'}</h2>
          {error && <div className="err-msg">{error}</div>}
          <input className="auth-input" name="username" placeholder="Username"
            value={form.username} onChange={handle} />
          <input className="auth-input" name="email" placeholder="Email" type="email"
            value={form.email} onChange={handle} />
          <input className="auth-input" name="password" placeholder="Password" type="password"
            value={form.password} onChange={handle} />
          <button className="auth-btn" onClick={submit} disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          <div className="auth-link-row">
            Already have an account?{' '}
            <span className="auth-link" onClick={() => navigate(`/signin?role=${role}`)}>Sign In!</span>
          </div>
        </div>
      </div>
    </div>
  );
}