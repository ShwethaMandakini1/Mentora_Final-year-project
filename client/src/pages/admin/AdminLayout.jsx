import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path     = location.pathname;
  const admin    = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const navItems = [
    { label: 'Dashboard',    route: '/admin/dashboard',     icon: '📊' },
    { label: 'Users',        route: '/admin/users',          icon: '👥' },
    { label: 'Admins',       route: '/admin/admins',         icon: '🛡️' },
    { label: 'Subscriptions',route: '/admin/subscriptions',  icon: '💳' },
    { label: 'Broadcast',    route: '/admin/broadcast',      icon: '📢' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* Sidebar */}
      <div style={{
        width: 240, minHeight: '100vh', position: 'fixed',
        top: 0, left: 0, bottom: 0, zIndex: 100,
        background: 'linear-gradient(180deg, #0f1f3d 0%, #1a3560 60%, #0f2847 100%)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Brand */}
        <div style={{
          padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)',
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              🛡️
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Mentora</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Admin Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(n => {
            const active = path === n.route;
            return (
              <div key={n.route} onClick={() => navigate(n.route)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                background: active ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                boxShadow: active ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
                transition: 'all 0.18s ease',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <span>{n.icon}</span>
                {n.label}
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 10,
            padding: '12px 14px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {admin.name || admin.username}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {admin.email}
            </div>
          </div>
          <div onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, color: 'rgba(255,255,255,0.65)', transition: 'all 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
            <span>🚪</span> Log out
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, background: '#f5f6fa', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}