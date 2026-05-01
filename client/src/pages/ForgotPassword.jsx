import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { forgotPassword } from '../api/api';
import './auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get('role') || 'student';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setSuccess('');
    if (!email) return setError('Please enter your email');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSuccess('OTP sent to your email!');
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(email)}&role=${role}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="centered-card-bg">
      <div className="centered-card">
        <div className="centered-card-icon">🔑</div>
        <h2>Forgot password?</h2>
        <p>Enter your registered email address to receive a password reset OTP.</p>
        {error && <div className="err-msg">{error}</div>}
        {success && <div className="ok-msg">{success}</div>}
        <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',textAlign:'left',marginBottom:'6px'}}>Email</label>
        <input className="auth-input" placeholder="Enter your Email" value={email}
          onChange={e => setEmail(e.target.value)} type="email" />
        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? 'Sending...' : 'Reset Password'}
        </button>
        <button className="cancel-btn" onClick={() => navigate(`/signin?role=${role}`)}>Cancel</button>
      </div>
    </div>
  );
}