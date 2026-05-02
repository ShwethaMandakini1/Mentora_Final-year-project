import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LecturerLayout from './LecturerLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../api/api';
import './dashboard.css';

const POLL_INTERVAL = 30000;

const TYPE_CONFIG = {
  approval_requested:  { icon: '📋', color: '#d97706', bg: '#fef3c7', label: 'Review Request'  },
  new_assignment:      { icon: '📝', color: '#2563eb', bg: '#eff6ff', label: 'Assignment'       },
  marks_received:      { icon: '🎯', color: '#16a34a', bg: '#dcfce7', label: 'Marks'            },
  regrade_accepted:    { icon: '✅', color: '#7c3aed', bg: '#f3e8ff', label: 'Re-grade'         },
  deadline_reminder:   { icon: '⏰', color: '#d97706', bg: '#fffbeb', label: 'Deadline'         },
  submission_approved: { icon: '✅', color: '#16a34a', bg: '#dcfce7', label: 'Approved'         },
  submission_rejected: { icon: '❌', color: '#dc2626', bg: '#fef2f2', label: 'Rejected'         },
  default:             { icon: '🔔', color: '#6b7280', bg: '#f9fafb', label: 'Notification'     },
};

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

const FILTERS = ['All', 'Unread', 'Review Requests', 'Assignments', 'Deadlines'];
const FILTER_MAP = {
  'All':             () => true,
  'Unread':          n => !n.read,
  'Review Requests': n => n.type === 'approval_requested',
  'Assignments':     n => n.type === 'new_assignment',
  'Deadlines':       n => n.type === 'deadline_reminder',
};

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '10px 16px', fontSize: 13, background: 'none',
  border: 'none', cursor: 'pointer', color: '#374151',
  borderBottom: '1px solid #f3f4f6',
};

export default function LecturerNotifications() {
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

  const handleView = async (n) => {
    await markRead(n._id);
    if (n.type === 'approval_requested') {
      navigate('/lecturer/requests');
    } else if (n.type === 'new_assignment') {
      navigate('/lecturer/submissions');
    }
  };

  const isViewable = (n) =>
    ['approval_requested', 'new_assignment'].includes(n.type);

  const filtered = notifications.filter(FILTER_MAP[activeFilter] || (() => true));
  const grouped  = groupByDate(filtered);

  return (
    <LecturerLayout>

      <div className="topbar">
        <div className="topbar-left">
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        {notifications.length > 0 && (
          <div className="topbar-right" style={{ gap: 10 }}>
            {unreadCount > 0 && (
              <button className="btn-outline" style={{ fontSize: 12, padding: '6px 14px' }} onClick={markAllRead}>
                ✓ Mark all read
              </button>
            )}
            <button onClick={deleteAll} style={{
              fontSize: 12, padding: '6px 14px', background: 'none',
              border: '1.5px solid #fecaca', borderRadius: 8,
              color: '#dc2626', cursor: 'pointer', fontWeight: 600,
            }}>
              🗑 Clear all
            </button>
          </div>
        )}
      </div>

      <div className="page-content">

        {/* Profile banner */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 16px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: '#92400e', marginBottom: 8,
            border: '3px solid #fde68a',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'L'}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>
            {user?.username || 'Lecturer'}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Lecturer</div>
        </div>

        {/* New notifications banner */}
        {newCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10,
            padding: '10px 16px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              🔔 {newCount} new notification{newCount > 1 ? 's' : ''} arrived
            </span>
            <button onClick={() => setNewCount(0)} style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 6,
              background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer',
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
                cursor: 'pointer', transition: 'all 0.15s',
                background: activeFilter === f ? '#d97706' : '#f3f4f6',
                color:      activeFilter === f ? '#fff'    : '#6b7280',
                border:     activeFilter === f ? '1.5px solid #d97706' : '1.5px solid #e5e7eb',
              }}>
                {f}
                {count > 0 && (
                  <span style={{
                    marginLeft: 4, borderRadius: 10, padding: '1px 6px', fontSize: 10,
                    background: activeFilter === f ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                    color:      activeFilter === f ? '#fff' : '#374151',
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
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              <div style={{ marginBottom: 8, fontSize: 20 }}>⏳</div>
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px 0', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>No notifications here</div>
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
                        background: n.read ? '#fff' : '#fffbeb',
                        borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                        position: 'relative', transition: 'background 0.2s',
                      }}>

                        {!n.read && (
                          <div style={{
                            position: 'absolute', left: 8, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 6, height: 6, borderRadius: '50%', background: '#d97706',
                          }} />
                        )}

                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: cfg.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 18,
                        }}>
                          {cfg.icon}
                        </div>

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
                                  ✓ &nbsp;Mark as read
                                </button>
                              )}
                              {isViewable(n) && (
                                <button onClick={() => handleView(n)} style={menuItemStyle}>
                                  👁 &nbsp;View
                                </button>
                              )}
                              <button
                                onClick={() => deleteOne(n._id)}
                                style={{ ...menuItemStyle, color: '#dc2626', borderBottom: 'none' }}
                              >
                                🗑 &nbsp;Delete
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
    </LecturerLayout>
  );
}