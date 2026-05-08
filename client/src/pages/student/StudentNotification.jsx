import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../api/api';
import './dashboard.css';

// ── Poll interval (ms) ────────────────────────────────────────────────────────
const POLL_INTERVAL = 30000; // 30 seconds

// ── Notification type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  new_assignment:      { icon: '·', color: '#0077B6', bg: '#E0F2FE', label: 'New Assignment'  },
  marks_received:      { icon: '·', color: '#16a34a', bg: '#dcfce7', label: 'Marks Released'  },
  regrade_accepted:    { icon: '·', color: '#7c3aed', bg: '#f3e8ff', label: 'Re-grade Update' },
  deadline_reminder:   { icon: '·', color: '#d97706', bg: '#fffbeb', label: 'Deadline'         },
  approval_requested:  { icon: '·', color: '#0096C7', bg: '#CAF0F8', label: 'Under Review'    },
  submission_approved: { icon: '·', color: '#16a34a', bg: '#dcfce7', label: 'Approved'        },
  submission_rejected: { icon: '·', color: '#dc2626', bg: '#fef2f2', label: 'Needs Revision'  },
  default:             { icon: '·', color: '#0077B6', bg: '#E0F2FE', label: 'Notification'     },
};

// ── Time formatter ────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Group by date ─────────────────────────────────────────────────────────────
function groupByDate(notifications) {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const groups    = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };
  notifications.forEach(n => {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    if      (d >= today)     groups['Today'].push(n);
    else if (d >= yesterday) groups['Yesterday'].push(n);
    else if (d >= weekAgo)   groups['This Week'].push(n);
    else                     groups['Earlier'].push(n);
  });
  return groups;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Unread', 'Assignments', 'Marks', 'Deadlines', 'Re-grade', 'Approvals'];
const FILTER_MAP = {
  'All':         () => true,
  'Unread':      n => !n.read,
  'Assignments': n => n.type === 'new_assignment',
  'Marks':       n => n.type === 'marks_received',
  'Deadlines':   n => n.type === 'deadline_reminder',
  'Re-grade':    n => n.type === 'regrade_accepted',
  'Approvals':   n => ['approval_requested', 'submission_approved', 'submission_rejected'].includes(n.type),
};

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '10px 16px', fontSize: 13, background: 'none',
  border: 'none', cursor: 'pointer', color: '#374151',
  borderBottom: '1px solid #f3f4f6',
};

export default function StudentNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState('All');
  const [menuOpen, setMenuOpen]           = useState(null);
  const [newCount, setNewCount]           = useState(0);
  const menuRef   = useRef(null);
  const pollRef   = useRef(null);
  const latestIds = useRef(new Set());

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      const res  = await getNotifications();
      const data = res.data.notifications || [];

      if (silent) {
        const incoming = new Set(data.map(n => n._id));
        const added    = [...incoming].filter(id => !latestIds.current.has(id));
        if (added.length > 0) {
          setNewCount(prev => prev + added.length);
          setNotifications(data);
          latestIds.current = incoming;
        }
      } else {
        setNotifications(data);
        latestIds.current = new Set(data.map(n => n._id));
        setLoading(false);
      }
    } catch {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(false); }, [fetchNotifications]);

  useEffect(() => {
    pollRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(pollRef.current);
      } else {
        fetchNotifications(true);
        pollRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setMenuOpen(null);
    await markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markAllNotificationsRead().catch(() => {});
  };

  const deleteOne = async (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n._id !== id);
      latestIds.current = new Set(updated.map(n => n._id));
      return updated;
    });
    setMenuOpen(null);
    await deleteNotification(id).catch(() => {});
  };

  const deleteAll = async () => {
    setNotifications([]);
    latestIds.current = new Set();
    await deleteAllNotifications().catch(() => {});
  };

  const dismissNewBanner = () => setNewCount(0);

  // ── Navigate on "View" click ──────────────────────────────────────────────
  const handleView = async (n) => {
    await markRead(n._id);
    if (n.type === 'marks_received' || n.type === 'regrade_accepted') {
      navigate('/student/reports');
    } else if (n.type === 'new_assignment' || n.type === 'deadline_reminder') {
      navigate('/student/submissions');
    } else if (n.type === 'submission_approved' || n.type === 'submission_rejected') {
      navigate('/student/submissions', { state: { tab: 'pre-approval' } });
    }
  };

  const isViewable = (n) =>
    ['marks_received', 'regrade_accepted', 'new_assignment', 'deadline_reminder',
     'submission_approved', 'submission_rejected'].includes(n.type);

  // ── Filtered + grouped ────────────────────────────────────────────────────
  const filtered = notifications.filter(FILTER_MAP[activeFilter] || (() => true));
  const grouped  = groupByDate(filtered);

  return (
    <StudentLayout>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {notifications.length > 0 && (
          <div className="topbar-right" style={{ gap: 10 }}>
            {unreadCount > 0 && (
              <button className="btn-outline" style={{ fontSize: 12, padding: '6px 14px' }} onClick={markAllRead}>
                Mark all read
              </button>
            )}
            <button onClick={deleteAll} style={{
              fontSize: 12, padding: '6px 14px', background: 'none',
              border: '1.5px solid #fecaca', borderRadius: 8,
              color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font)',
            }}>
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="page-content">

        {/* Profile banner */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 16px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0096C7, #00B4D8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8,
            border: '3px solid #CAF0F8',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'S'}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>
            {user?.username || 'Student'}
          </div>
        </div>

        {/* New notifications banner */}
        {newCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--foam)', border: '1px solid rgba(0,150,199,0.2)', borderRadius: 12,
            padding: '10px 16px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 13, color: 'var(--ocean)', fontWeight: 600 }}>
              {newCount} new notification{newCount > 1 ? 's' : ''} arrived
            </span>
            <button onClick={dismissNewBanner} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 6,
              background: 'var(--sky)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              Dismiss
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count =
              f === 'Unread' ? unreadCount :
              f === 'All'    ? notifications.length :
              notifications.filter(FILTER_MAP[f]).length;
            return (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font)',
                background: activeFilter === f ? 'var(--sky)' : 'white',
                color:      activeFilter === f ? '#fff'    : 'var(--text-muted)',
                border:     activeFilter === f ? '1.5px solid var(--sky)' : '1.5px solid var(--border)',
              }}>
                {f}
                {count > 0 && (
                  <span style={{
                    marginLeft: 4, borderRadius: 10, padding: '1px 6px', fontSize: 10,
                    background: activeFilter === f ? 'rgba(255,255,255,0.25)' : 'var(--foam)',
                    color:      activeFilter === f ? '#fff' : 'var(--ocean)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(0,150,199,0.15)', borderTopColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Loading notifications…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.4 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-sec)' }}>No notifications here</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {activeFilter !== 'All' ? `No ${activeFilter.toLowerCase()} notifications.` : "You're all caught up!"}
              </div>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <div style={{
                    padding: '10px 20px', fontSize: 11, fontWeight: 700,
                    color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
                    borderTop: '1px solid #f3f4f6',
                  }}>
                    {group}
                  </div>

                  {items.map((n, idx) => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                    return (
                      <div key={n._id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '14px 20px',
                        background: n.read ? '#fff' : '#f0f7ff',
                        borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                        position: 'relative', transition: 'background 0.2s',
                      }}>

                        {!n.read && (
                          <div style={{
                            position: 'absolute', left: 8, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 6, height: 6, borderRadius: '50%', background: '#2563eb',
                          }} />
                        )}

                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                          background: cfg.color, opacity: 0.85,
                        }}/>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 7px',
                              borderRadius: 20, background: cfg.bg, color: cfg.color,
                            }}>
                              {cfg.label}
                            </span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(n.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: '#111827', marginBottom: 2 }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                            {n.message}
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {isViewable(n) && (
                              <button onClick={() => handleView(n)} style={{
                                fontSize: 11, fontWeight: 600, padding: '4px 12px',
                                background: cfg.color, color: '#fff',
                                border: 'none', borderRadius: 6, cursor: 'pointer',
                              }}>
                                View →
                              </button>
                            )}
                            {!n.read && (
                              <button onClick={() => markRead(n._id)} style={{
                                fontSize: 11, fontWeight: 600, padding: '4px 12px',
                                background: 'none', color: '#6b7280',
                                border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer',
                              }}>
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ position: 'relative' }} ref={menuOpen === n._id ? menuRef : null}>
                          <button
                            onClick={() => setMenuOpen(menuOpen === n._id ? null : n._id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 18, color: '#9ca3af', padding: '4px 6px',
                              borderRadius: 6, lineHeight: 1,
                            }}
                          >
                            ···
                          </button>
                          {menuOpen === n._id && (
                            <div style={{
                              position: 'absolute', right: 0, top: 28, zIndex: 50,
                              background: '#fff', border: '1px solid #e5e7eb',
                              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                              minWidth: 150, overflow: 'hidden',
                            }}>
                              {!n.read && (
                                <button onClick={() => markRead(n._id)} style={menuItemStyle}>
                                  Mark as read
                                </button>
                              )}
                              {isViewable(n) && (
                                <button onClick={() => handleView(n)} style={menuItemStyle}>
                                  View
                                </button>
                              )}
                              <button
                                onClick={() => deleteOne(n._id)}
                                style={{ ...menuItemStyle, color: '#dc2626', borderBottom: 'none' }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#d1d5db' }}>
          Auto-refreshes every 30 seconds
        </div>

      </div>
    </StudentLayout>
  );
}