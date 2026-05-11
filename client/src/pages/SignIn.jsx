import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { adminLogin } from '../api/adminAPI';
import './auth.css';

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ username: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle    = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleKey = e => { if (e.key === 'Enter') submit(); };

 const submit = async () => {
  setError('');

  if (!form.username || !form.password) {
    return setError('Please enter your username and password.');
  }

  setLoading(true);

  try {
    let res;

    // ── ADMIN LOGIN ───────────────────────
    if (
      form.username === 'superadmin' ||
      form.username === 'afmin'
    ) {
      res = await adminLogin(form);
    }

    // ── NORMAL USER LOGIN ─────────────────
    else {
      res = await loginUser(form);
    }

    const { token, user, admin } = res.data;

    const loggedUser = user || admin;

    login(token, loggedUser);

    // ── REDIRECTS ─────────────────────────
    if (
      loggedUser.role === 'admin' ||
      loggedUser.isSuperAdmin
    ) {
      navigate('/admin/dashboard');
    }

    else if (loggedUser.role === 'lecturer') {
      navigate('/lecturer/dashboard');
    }

    else {
      navigate('/student/dashboard');
    }

  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Login failed. Please check your credentials.'
    );
  }

  finally {
    setLoading(false);
  }
};
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .si-bg {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #0b1628;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative; overflow: hidden;
        }
        .si-glow1 {
          position: absolute; width: 800px; height: 800px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 65%);
          top: -300px; left: -250px; pointer-events: none;
        }
        .si-glow2 {
          position: absolute; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%);
          bottom: -200px; right: -150px; pointer-events: none;
        }
        .si-dots {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.04) 1.5px, transparent 1.5px);
          background-size: 30px 30px; pointer-events: none;
        }

        .si-card {
          position: relative; z-index: 1;
          display: flex;
          width: min(820px, calc(100vw - 32px));
          min-height: 500px;
          border-radius: 26px; overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.07), 0 40px 100px rgba(0,0,0,0.6);
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }

        /* ── Right panel enhanced styles ── */
        .si-right {
          flex: 1; background: #fff;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 44px;
        }
        .si-inner {
          width: 100%; max-width: 320px;
          animation: stepIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }

        .si-h { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 4px; }
        .si-p { font-size: 13px; color: #94a3b8; margin-bottom: 28px; }

        .si-err {
          background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px;
          padding: 10px 13px; font-size: 12.5px; color: #e11d48; font-weight: 500;
          margin-bottom: 16px; display: flex; align-items: center; gap: 7px;
        }

        .si-field { margin-bottom: 14px; }
        .si-lbl {
          display: block; font-size: 11px; font-weight: 700; color: #475569;
          letter-spacing: 0.7px; text-transform: uppercase; margin-bottom: 6px;
        }
        .si-iw { position: relative; }
        .si-in {
          width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0;
          border-radius: 11px; font-size: 14px; font-family: inherit;
          color: #0f172a; background: #f8fafc; transition: all 0.18s; outline: none;
        }
        .si-in::placeholder { color: #b0bac6; }
        .si-in:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .si-in.pw { padding-right: 44px; }
        .si-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #94a3b8; display: flex; align-items: center; transition: color 0.15s; padding: 2px;
        }
        .si-eye:hover { color: #2563eb; }

        .si-forgot { display: flex; justify-content: flex-end; margin-top: -6px; margin-bottom: 20px; }
        .si-forgot span { font-size: 12px; font-weight: 600; color: #2563eb; cursor: pointer; transition: opacity 0.15s; }
        .si-forgot span:hover { opacity: 0.7; }

        .si-btn {
          width: 100%; padding: 13px; border: none; border-radius: 11px;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: #fff; font-size: 15px; font-weight: 700; font-family: inherit;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
        }
        .si-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(37,99,235,0.45); }
        .si-btn:active:not(:disabled) { transform: none; }
        .si-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .si-btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .si-spin {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .si-foot { text-align: center; margin-top: 20px; font-size: 13px; color: #94a3b8; }
        .si-foot-lnk { color: #2563eb; font-weight: 700; cursor: pointer; }
        .si-foot-lnk:hover { opacity: 0.75; }

        @media (max-width: 600px) {
          .auth-left { display: none; }
          .si-right  { padding: 36px 28px; }
          .si-card   { border-radius: 20px; }
        }
      `}</style>

      <div className="si-bg">
        <div className="si-glow1" /><div className="si-glow2" /><div className="si-dots" />

        <div className="si-card">

          {/* ── Left panel — unchanged, uses your original auth.css ── */}
          <div className="auth-left">
            <img src="/assets/Mentora.png" alt="Mentora" className="auth-left-logo" />
            <div className="auth-left-title">Mentora Grading System</div>
            <div className="auth-left-sub">From Submission to Insight.</div>
          </div>

          {/* ── Right panel — enhanced ── */}
          <div className="si-right">
            <div className="si-inner">
              <div className="si-h">Sign In</div>
              <div className="si-p">Access your personalized dashboard</div>

              {error && <div className="si-err"><span>⚠</span>{error}</div>}

              <div className="si-field">
                <label className="si-lbl">Username</label>
                <div className="si-iw">
                  <input className="si-in" name="username" placeholder="Enter your username"
                    value={form.username} onChange={handle} onKeyDown={handleKey}
                    autoFocus autoComplete="username" />
                </div>
              </div>

              <div className="si-field">
                <label className="si-lbl">Password</label>
                <div className="si-iw">
                  <input className="si-in pw" name="password" placeholder="Enter your password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={handle} onKeyDown={handleKey}
                    autoComplete="current-password" />
                  <button className="si-eye" type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                    {showPw ? <EyeClosed /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              <div className="si-forgot">
                <span onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
              </div>

              <button className="si-btn" onClick={submit} disabled={loading}>
                {loading
                  ? <div className="si-btn-inner"><div className="si-spin" />Signing in…</div>
                  : 'Sign In'}
              </button>

              <div className="si-foot">
                Don't have an account?{' '}
                <span className="si-foot-lnk" onClick={() => navigate('/signup')}>Sign Up!</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}