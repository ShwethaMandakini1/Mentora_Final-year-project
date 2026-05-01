import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/api';
import './auth.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const otp   = params.get('otp')   || '';
  const role  = params.get('role')  || 'student';

  const [form, setForm] = useState({ newPassword:'', confirm:'' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!form.newPassword || !form.confirm) return setError('All fields are required');
    if (form.newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (form.newPassword !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword: form.newPassword });
      setSuccess('Password reset successful! Redirecting...');
      setTimeout(() => navigate(`/signin?role=${role}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="centered-card-bg">
      <div className="centered-card">
        <div className="centered-card-icon">🔒</div>
        <h2>Reset Password</h2>
        {error   && <div className="err-msg">{error}</div>}
        {success && <div className="ok-msg">{success}</div>}
        <div className="input-icon-wrap">
          <input className="auth-input" placeholder="New Password"
            type={show ? 'text' : 'password'}
            value={form.newPassword}
            onChange={e => setForm({...form, newPassword:e.target.value})} />
          <button className="input-icon-btn" onClick={() => setShow(!show)}>
            {show ? '🙈' : '👁️'}
          </button>
        </div>
        <input className="auth-input" placeholder="Re-enter new password" type="password"
          value={form.confirm}
          onChange={e => setForm({...form, confirm:e.target.value})} />
        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}