import React from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

export default function SignUp() {
  const navigate = useNavigate();
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-left">
          <img src="/assets/Mentora.png" alt="Mentora" className="auth-left-logo" />
          <div className="auth-left-title">Welcome to Mentora Grading System</div>
          <div className="auth-left-sub">From Submission to Insight.</div>
        </div>
        <div className="auth-right">
          <h2>Continue as,</h2>
          <button className="role-btn" onClick={() => navigate('/register?role=student')}>Student</button>
          <button className="role-btn" onClick={() => navigate('/register?role=lecturer')}>Lecturer</button>
          
        </div>
      </div>
    </div>
  );
}