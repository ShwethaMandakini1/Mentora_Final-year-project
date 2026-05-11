import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../api/api';
import './sidebar.css';

export default function LecturerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res   = await getNotifications();
        const count = (res.data.notifications || []).filter(n => !n.read).length;
        setUnreadCount(count);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      label: 'Dashboard',
      path:  '/lecturer/dashboard',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
          <rect x="3"  y="3"  width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <rect x="12" y="3"  width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3"  y="12" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <rect x="12" y="12" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      ),
    },
    {
      label: 'Submissions',
      path:  '/lecturer/submissions',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
          <path d="M14 3v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 3H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7.5L14.5 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 13h6M8 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      // FIX: renamed from "Regarding Request" → "Pre-Approvals"
      label: 'Pre-Approvals',
      path:  '/lecturer/requests',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
          <path d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="8" y="2" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 10h8M7 14h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Report & Analytics',
      path:  '/lecturer/analytics',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
          <path d="M4 18h14M6 14v4M11 8v10M16 11v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Marking & Feedback',
      path:  '/lecturer/marking',
      icon: (
        <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Notifications',
      path:  '/lecturer/notifications',
      badge: unreadCount,
      icon: (
        <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
          <path d="M18 15h-1.2a2 2 0 01-1.9-1.4l-1-3.1A4.2 4.2 0 0010 7v0a4.2 4.2 0 00-3.9 3.5l-1 3.1a2 2 0 01-1.9 1.4H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 19a2 2 0 01-4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="ios-layout-wrapper">
      <aside className="ios-sidebar">

        <div
          className="ios-sidebar-header ios-sidebar-header--clickable"
          onClick={() => navigate('/lecturer/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <img
            src="/assets/logo-cropped.png"
            alt="Mentora"
            className="ios-logo-image"
            style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }}
          />
          <div className="ios-logo-text-wrap">
            <div className="ios-logo-text">Mentora</div>
          </div>
        </div>

        <nav className="ios-sidebar-nav">
          <p className="ios-nav-group-label">Main Menu</p>

          {navItems.map(item => (
            <div
              key={item.path}
              className={`ios-sidebar-link ${location.pathname === item.path ? 'ios-sidebar-link--active' : ''}`}
              onClick={() => navigate(item.path)}
              style={{ cursor: 'pointer' }}
            >
              {item.icon}
              <span className="ios-sidebar-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="ios-nav-badge">{item.badge}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="ios-sidebar-footer">
          <div
            className={`ios-sidebar-link ${location.pathname === '/lecturer/profile' ? 'ios-sidebar-link--active' : ''}`}
            onClick={() => navigate('/lecturer/profile')}
            style={{ marginBottom: '8px', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
              <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 19c0-3.314 2.686-6 6-6h2c3.314 0 6 2.686 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="ios-sidebar-label">Profile</span>
          </div>

          <button
            className="ios-sidebar-logout"
            onClick={() => { logout(); window.location.href = '/signin?role=lecturer'; }}
          >
            <svg viewBox="0 0 22 22" fill="none" className="ios-sidebar-icon">
              <path d="M8 11h9M13 7l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 4H6a2 2 0 00-2 2v10a2 2 0 002 2h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="ios-sidebar-label">Log Out</span>
          </button>
        </div>
      </aside>

      <main className="ios-main-content">
        {children}
      </main>
    </div>
  );
}