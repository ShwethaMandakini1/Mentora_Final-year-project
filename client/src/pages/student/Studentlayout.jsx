import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNotifications } from '../../api/api';
import './dashboard.css';

const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    submissions: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    reports: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    analytics: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    leaderboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21V7l4-4 4 4v14"/><path d="M3 21h18"/><path d="M10 21v-5h4v5"/>
      </svg>
    ),
    subscription: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    bell: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    profile: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

export default function StudentLayout({ children }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuth();
  const path       = location.pathname;
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
    { label: 'Dashboard',    route: '/student/dashboard',    icon: 'dashboard'    },
    { label: 'Submissions',  route: '/student/submissions',  icon: 'submissions'  },
    { label: 'Reports',      route: '/student/reports',      icon: 'reports'      },
    { label: 'Analytics',    route: '/student/analytics',    icon: 'analytics'    },
    { label: 'Leaderboard',  route: '/student/leaderboard',  icon: 'leaderboard'  },
    { label: 'Subscription', route: '/student/subscription', icon: 'subscription' },
  ];

  const sidebarStyle = {
    width: 220,
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #03045E 0%, #023E8A 60%, #0077B6 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    zIndex: 100,
    boxShadow: '4px 0 24px rgba(3,4,94,0.25)',
  };

  const navItemStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
    fontSize: 13.5, fontWeight: active ? 600 : 400,
    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
    background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
    transition: 'all 0.18s ease',
    marginBottom: 2,
  });

  return (
    <div className="dash-layout">
      <div style={sidebarStyle}>

        {/* Brand */}
        <div onClick={() => navigate('/student/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '22px 16px 18px', cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: 10,
        }}>
          <img src="/assets/Mentora.png" alt="Mentora"
            style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: 0.3, lineHeight: 1.2 }}>Mentora</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginTop: 2 }}>From Submission to Insight.</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column' }}>
          {navItems.map(n => {
            const active = path.startsWith(n.route);
            return (
              <div
                key={n.route}
                style={navItemStyle(active)}
                onClick={() => navigate(n.route)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                  <Icon name={n.icon} />
                </span>
                {n.label}
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Notifications */}
          <div
            style={{ ...navItemStyle(path === '/student/notifications'), justifyContent: 'space-between' }}
            onClick={() => navigate('/student/notifications')}
            onMouseEnter={e => { if (path !== '/student/notifications') e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { if (path !== '/student/notifications') e.currentTarget.style.background = path === '/student/notifications' ? 'rgba(255,255,255,0.16)' : 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}><Icon name="bell" /></span>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </div>

          {/* Profile */}
          <div
            style={navItemStyle(path === '/student/profile')}
            onClick={() => navigate('/student/profile')}
            onMouseEnter={e => { if (path !== '/student/profile') e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { if (path !== '/student/profile') e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}><Icon name="profile" /></span>
            Profile
          </div>

          {/* Logout */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, color: 'rgba(255,255,255,0.65)', transition: 'all 0.18s ease' }}
            onClick={() => { logout(); window.location.href = '/signin?role=student'; }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          >
            <span style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}><Icon name="logout" /></span>
            Log out
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 220, minHeight: '100vh', background: '#EEF4FA', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}