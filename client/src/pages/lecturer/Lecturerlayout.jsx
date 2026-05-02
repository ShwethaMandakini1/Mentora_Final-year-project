import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../api/api';
import './dashboard.css';

export default function LecturerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread notifications every 30s
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getNotifications();
        const count = (res.data.notifications || []).filter(n => !n.read).length;
        setUnreadCount(count);
      } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { label: 'Dashboard',          path: '/lecturer/dashboard',      icon: '⊞' },
    { label: 'Submissions',        path: '/lecturer/submissions',     icon: '📄' },
    { label: 'Regarding Request',  path: '/lecturer/requests',        icon: '📋' },
    { label: 'Report & Analytics', path: '/lecturer/analytics',       icon: '📊' },
    { label: 'Marking & Feedback', path: '/lecturer/marking',         icon: '✏️' },
    { label: 'Notifications',      path: '/lecturer/notifications',   icon: '🔔', badge: unreadCount },
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
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{item.icon}</span> {item.label}
              </span>
              {item.badge > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', borderRadius: 20,
                  padding: '1px 7px', fontSize: 10, fontWeight: 700, minWidth: 18,
                  textAlign: 'center',
                }}>
                  {item.badge}
                </span>
              )}
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