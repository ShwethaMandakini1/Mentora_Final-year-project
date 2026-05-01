import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './dashboard.css';

export default function StudentLayout({ children }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();
  const path       = location.pathname;

  const navItems = [
    { label: 'Dashboard',   route: '/student/dashboard' },
    { label: 'Submissions', route: '/student/submissions' },
    { label: 'Reports',     route: '/student/reports' },
    { label: 'Analytics',   route: '/student/analytics' },
  ];

  const icons = {
    Dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    Submissions: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    Reports: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    Analytics: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
  };

  const sidebarStyle = {
    width: 220,
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0f1f3d 0%, #1a3560 60%, #0f2847 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    zIndex: 100,
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
  };

  return (
    <div className="dash-layout">

      {/* SIDEBAR */}
      <div style={sidebarStyle}>

        {/* Brand */}
        <div
          onClick={() => navigate('/student/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '22px 16px 18px 3px',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            marginBottom: 8,
          }}>
          <img
            src="/assets/Mentora.png"
            alt="Mentora"
            style={{
              width: 90, height: 70,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{
              fontSize: 16, fontWeight: 800, color: '#ffffff',
              letterSpacing: 0.4, lineHeight: 1.2,
            }}>
              Mentora
            </div>
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.4, marginTop: 2,
            }}>
              From Submission to Insight.
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(n => {
            const active = path.startsWith(n.route);
            return (
              <div
                key={n.route}
                onClick={() => navigate(n.route)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.62)',
                  background: active
                    ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                    : 'transparent',
                  boxShadow: active ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}>
                <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  {icons[n.label]}
                </span>
                {n.label}
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{
          padding: '10px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {/* Profile */}
          <div
            onClick={() => navigate('/student/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
              fontSize: 14, transition: 'all 0.18s ease',
              color: path === '/student/profile' ? '#fff' : 'rgba(255,255,255,0.62)',
              background: path === '/student/profile'
                ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'transparent',
            }}
            onMouseEnter={e => {
              if (path !== '/student/profile') e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              if (path !== '/student/profile') e.currentTarget.style.background = 'transparent';
            }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            Profile
          </div>

          {/* Logout */}
          <div
            onClick={() => { logout(); window.location.href = '/signin?role=student'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
              fontSize: 14, color: 'rgba(255,255,255,0.62)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
              e.currentTarget.style.color = '#fca5a5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.62)';
            }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            Log out
          </div>
        </div>

      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 220, minHeight: '100vh', background: '#f5f6fa', flex: 1 }}>
        {children}
      </div>

    </div>
  );
}