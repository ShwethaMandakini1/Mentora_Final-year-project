import React from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="welcome-container">
      <div className="glow-1" /><div className="glow-2" />
      <div className="welcome-content">
        <img src="/assets/Mentora.png" alt="Mentora" className="welcome-logo-img" />
        <h1 className="welcome-title">Mentora</h1>
        <p className="welcome-sub">From Submission to Insight.</p>
        <button className="welcome-btn" onClick={() => navigate('/signup')}>
          Lets Get Started <span className="btn-circle">→</span>
        </button>
      </div>
    </div>
  );
}