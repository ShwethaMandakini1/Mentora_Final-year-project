import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';

export default function LecturerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const nav = [
    { label: 'Dashboard',          path: '/lecturer/dashboard',   icon: '⊞' },
    { label: 'Submissions',        path: '/lecturer/submissions',  icon: '📄' },
    { label: 'Regarding request',  path: '/lecturer/requests',     icon: '📋' },
    { label: 'Report & Analytics', path: '/lecturer/analytics',    icon: '📊' },
    { label: 'Marking & Feedback', path: '/lecturer/marking',      icon: '✏️' },
  ];

  return (
    <div className="dash-layout">
      <div className="sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/lecturer/dashboard')}>
          <img src="/assets/Mentora.png" alt="Mentora" className="sidebar-logo" />
          <div>
            <div className="sidebar-name">Mentora</div>
            <div className="sidebar-tagline">From Submission to Insight.</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(item => (
            <div
              key={item.path}
              className={`nav-item${location.pathname === item.path ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-item" onClick={() => navigate('/lecturer/profile')}>
            <span>👤</span> Profile
          </div>
          <div className="nav-item logout" onClick={() => { logout(); window.location.href = '/signin?role=lecturer'; }}>
            <span>🚪</span> Log out
          </div>
        </div>
      </div>

      <div className="dash-main">{children}</div>
    </div>
  );
}