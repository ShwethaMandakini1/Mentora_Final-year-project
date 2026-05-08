import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LecturerLayout from './Lecturerlayout';
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

// ─────────────────────────────────────────────────────────────────────────────
// Icons (SVG replacements for emojis)
// ─────────────────────────────────────────────────────────────────────────────
const Icons = {
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
  Document: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Target: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Sync: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  XCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="20 6 9 17 4 12" /></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  More: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>,
};

const TYPE_CONFIG = {
  approval_requested: { icon: <Icons.Clipboard />, color: 'rgba(0,119,182,0.12)', text: 'var(--ocean)', label: 'Review Request' },
  new_assignment: { icon: <Icons.Document />, color: 'rgba(0,150,199,0.10)', text: 'var(--sky)', label: 'Assignment' },
  marks_received: { icon: <Icons.Target />, color: 'rgba(22,163,74,0.10)', text: '#16a34a', label: 'Marks' },
  regrade_accepted: { icon: <Icons.Sync />, color: 'rgba(0,119,182,0.08)', text: 'var(--ocean)', label: 'Re-grade' },
  deadline_reminder: { icon: <Icons.Clock />, color: 'rgba(0,180,216,0.12)', text: 'var(--cyan)', label: 'Deadline' },
  submission_approved: { icon: <Icons.CheckCircle />, color: 'rgba(22,163,74,0.10)', text: '#16a34a', label: 'Approved' },
  submission_rejected: { icon: <Icons.XCircle />, color: 'rgba(220,38,38,0.08)', text: '#dc2626', label: 'Rejected' },
  default: { icon: <Icons.Bell />, color: 'rgba(0,119,182,0.06)', text: 'var(--ocean)', label: 'Notification' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(notifications) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const groups = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };
  notifications.forEach(n => {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    if (d >= today) groups['Today'].push(n);
    else if (d >= yesterday) groups['Yesterday'].push(n);
    else if (d >= weekAgo) groups['This Week'].push(n);
    else groups['Earlier'].push(n);
  });
  return groups;
}

const FILTERS = ['All', 'Unread', 'Review Requests', 'Assignments', 'Deadlines'];
const FILTER_MAP = {
  'All': () => true,
  'Unread': n => !n.read,
  'Review Requests': n => n.type === 'approval_requested',
  'Assignments': n => n.type === 'new_assignment',
  'Deadlines': n => n.type === 'deadline_reminder',
};

export default function LecturerNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [menuOpen, setMenuOpen] = useState(null);
  const [newCount, setNewCount] = useState(0);
  const menuRef = useRef(null);
  const pollRef = useRef(null);
  const latestIds = useRef(new Set());

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      const res = await getNotifications();
      const data = res.data.notifications || [];
      if (silent) {
        const incoming = new Set(data.map(n => n._id));
        const added = [...incoming].filter(id => !latestIds.current.has(id));
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
    await markNotificationRead(id).catch(() => { });
  };
  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markAllNotificationsRead().catch(() => { });
  };
  const deleteOne = async (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n._id !== id);
      latestIds.current = new Set(updated.map(n => n._id));
      return updated;
    });
    setMenuOpen(null);
    await deleteNotification(id).catch(() => { });
  };
  const deleteAll = async () => {
    setNotifications([]);
    latestIds.current = new Set();
    await deleteAllNotifications().catch(() => { });
  };
  const handleView = async (n) => {
    await markRead(n._id);
    if (n.type === 'approval_requested') navigate('/lecturer/requests');
    else if (n.type === 'new_assignment') navigate('/lecturer/submissions');
  };
  const isViewable = (n) => ['approval_requested', 'new_assignment'].includes(n.type);

  const filtered = notifications.filter(FILTER_MAP[activeFilter] || (() => true));
  const grouped = groupByDate(filtered);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <LecturerLayout>

      {/* ── Top Bar ── */}
      <div className="ios-topbar">
        <div className="ios-topbar-left">
          <h1 className="ios-page-title">Notifications</h1>
          <p className="ios-page-date">
            {unreadCount > 0 ? `${unreadCount} unread · ` : 'All caught up · '}{dateStr}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="ios-topbar-right" style={{ gap: '12px', display: 'flex' }}>
            {unreadCount > 0 && (
              <button className="ios-topbar-btn" onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Check /> Mark all read
              </button>
            )}
            <button className="ios-topbar-btn ios-topbar-btn--danger" onClick={deleteAll} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Trash /> Clear all
            </button>
          </div>
        )}
      </div>

      <div className="ios-page-content">

        {/* Profile banner */}
        <div className="ios-profile-banner">
          <div className="ios-profile-banner-avatar">
            {user?.username?.[0]?.toUpperCase() || 'L'}
          </div>
          <div className="ios-profile-banner-name">{user?.username || 'Lecturer'}</div>
          <div className="ios-profile-banner-role">Lecturer</div>
        </div>

        {/* New notifications banner */}
        {newCount > 0 && (
          <div className="ios-new-notif-banner">
            <span className="ios-new-notif-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Bell /> {newCount} new notification{newCount > 1 ? 's' : ''} arrived
            </span>
            <button className="ios-new-notif-dismiss" onClick={() => setNewCount(0)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Filter pills */}
        <div className="ios-filter-row">
          {FILTERS.map(f => {
            const count =
              f === 'Unread' ? unreadCount :
                f === 'All' ? notifications.length :
                  notifications.filter(FILTER_MAP[f]).length;
            return (
              <button
                key={f}
                className={`ios-filter-pill${activeFilter === f ? ' ios-filter-pill--active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
                {count > 0 && <span className="ios-pill-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="ios-card" style={{ padding: '0', overflow: 'visible' }}>
          {loading ? (
            <div className="ios-loading-state" style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Loading notifications…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ios-empty-state" style={{ padding: '60px 20px' }}>
              <div style={{ opacity: 0.3, marginBottom: 12 }}><Icons.Bell /></div>
              <p>
                {activeFilter !== 'All'
                  ? `No ${activeFilter.toLowerCase()} notifications`
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <div className="ios-notif-group-label">{group}</div>
                  <div className="ios-notif-list">
                    {items.map((n) => {
                      const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                      return (
                        <div
                          key={n._id}
                          className={`ios-notif-item${!n.read ? ' ios-notif-item--unread' : ''}`}
                        >
                          <div
                            className="ios-notif-icon"
                            style={{ background: cfg.color, color: cfg.text }}
                          >
                            {cfg.icon}
                          </div>

                          <div className="ios-notif-body">
                            <div className="ios-notif-meta">
                              <span
                                className="ios-notif-type-badge"
                                style={{ background: cfg.color, color: cfg.text }}
                              >
                                {cfg.label}
                              </span>
                              <span className="ios-notif-time">{timeAgo(n.createdAt)}</span>
                            </div>
                            <div className={`ios-notif-title${!n.read ? ' ios-notif-title--unread' : ''}`}>
                              {n.title}
                            </div>
                            <div className="ios-notif-message">{n.message}</div>
                            <div className="ios-notif-actions">
                              {isViewable(n) && (
                                <button className="ios-notif-btn ios-notif-btn--primary" onClick={() => handleView(n)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Icons.Eye /> View
                                </button>
                              )}
                              {!n.read && (
                                <button className="ios-notif-btn ios-notif-btn--ghost" onClick={() => markRead(n._id)}>
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ position: 'relative' }} ref={menuOpen === n._id ? menuRef : null}>
                            <button
                              className="ios-notif-menu-btn"
                              onClick={() => setMenuOpen(menuOpen === n._id ? null : n._id)}
                              aria-label="Options"
                            >
                              <Icons.More />
                            </button>
                            {menuOpen === n._id && (
                              <div className="ios-dropdown-menu">
                                {!n.read && (
                                  <button className="ios-dropdown-item" onClick={() => markRead(n._id)}>
                                    <Icons.Check /> Mark as read
                                  </button>
                                )}
                                {isViewable(n) && (
                                  <button className="ios-dropdown-item" onClick={() => handleView(n)}>
                                    <Icons.Eye /> View details
                                  </button>
                                )}
                                <button
                                  className="ios-dropdown-item ios-dropdown-item--danger"
                                  onClick={() => deleteOne(n._id)}
                                >
                                  <Icons.Trash /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
          Auto-refreshes every 30 seconds
        </p>

      </div>
    </LecturerLayout>
  );
}