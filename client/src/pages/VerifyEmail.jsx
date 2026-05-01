import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyOTP, forgotPassword } from '../api/api';
import './auth.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const role  = params.get('role')  || 'student';

  const [otp, setOtp] = useState(['','','','','']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(229);
  const ref0 = useRef(); const ref1 = useRef(); const ref2 = useRef();
  const ref3 = useRef(); const ref4 = useRef();
  const refs = [ref0, ref1, ref2, ref3, ref4];

  useEffect(() => {
    const t = setInterval(() => setTimer(p => p > 0 ? p-1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleOtp = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 4) refs[i+1].current.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i-1].current.focus();
  };

  const submit = async () => {
    setError('');
    const code = otp.join('');
    if (code.length < 5) return setError('Enter all 5 digits');
    setLoading(true);
    try {
      await verifyOTP({ email, otp: code });
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${code}&role=${role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try { await forgotPassword({ email }); setTimer(229); setError(''); }
    catch { setError('Failed to resend'); }
  };

  const masked = email.replace(/(.{1})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  return (
    <div className="centered-card-bg">
      <div className="centered-card">
        <h2>Verify Email</h2>
        <p>Verify your email address here to proceed<br/>
          Enter the 5 digits code that send to your email address</p>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>{masked}</p>
        {error && <div className="err-msg">{error}</div>}
        <div className="otp-boxes">
          {otp.map((v,i) => (
            <input key={i} ref={refs[i]} className="otp-box" maxLength={1} value={v}
              onChange={e => handleOtp(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)} />
          ))}
        </div>
        <div className="otp-timer">code Expires in : <span>{fmt(timer)}</span></div>
        <div className="otp-resend">
          Didn't get code?{' '}
          <button onClick={resend} disabled={timer > 0}>Resend code</button>
        </div>
        <button className="auth-btn" onClick={submit} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify email address'}
        </button>
        <div className="auth-link-row" style={{marginTop:'12px'}}>
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate(`/signin?role=${role}`)}>Log in</span>
        </div>
      </div>
    </div>
  );
}