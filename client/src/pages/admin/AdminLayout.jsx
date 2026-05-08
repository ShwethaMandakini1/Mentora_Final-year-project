import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    admins: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    subscriptions: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    broadcast: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  };
  return icons[name] || null;
};

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useAuth();
  const admin = user || JSON.parse(localStorage.getItem('adminUser') || '{}');

  const navItems = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Users', route: '/admin/users', icon: 'users' },
    { label: 'Admins', route: '/admin/admins', icon: 'admins' },
    { label: 'Subscriptions', route: '/admin/subscriptions', icon: 'subscriptions' },
    { label: 'Broadcast', route: '/admin/broadcast', icon: 'broadcast' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const sidebarStyle = {
    width: 240,
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
    padding: '11px 16px', borderRadius: 10, cursor: 'pointer',
    fontSize: 13.5, fontWeight: active ? 600 : 400,
    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
    background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
    transition: 'all 0.18s ease',
    marginBottom: 2,
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={sidebarStyle}>

        {/* Brand */}
        <div onClick={() => navigate('/admin/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '22px 18px 18px', cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: 10,
        }}>
          <img src="/assets/logo-cropped.png" alt="Mentora"
            style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: 0.3 }}>Mentora</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Admin Portal</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '6px 12px', display: 'flex', flexDirection: 'column' }}>
          {navItems.map(n => {
            const active = path === n.route || path.startsWith(n.route + '/');
            return (
              <div
                key={n.route}
                style={navItemStyle(active)}
                onClick={() => navigate(n.route)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
                  <Icon name={n.icon} />
                </span>
                {n.label}
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{admin.name || admin.username}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{admin.email}</div>
          </div>
          <div
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.65)', transition: 'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          >
            <span style={{ color: 'rgba(255,255,255,0.5)' }}><Icon name="logout" /></span>
            Log out
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, background: '#EEF4FA', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}