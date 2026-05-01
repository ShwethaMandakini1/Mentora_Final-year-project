import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, updatePassword } from '../../api/api';
import axios from 'axios';
import './dashboard.css';

// ── Notification type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  new_assignment:    { icon: '📋', color: '#2563eb', bg: '#eff6ff', label: 'New Assignment'  },
  marks_received:    { icon: '🎯', color: '#16a34a', bg: '#dcfce7', label: 'Marks Released'  },
  regrade_accepted:  { icon: '✅', color: '#7c3aed', bg: '#f3e8ff', label: 'Re-grade Update' },
  deadline_reminder: { icon: '⏰', color: '#d97706', bg: '#fffbeb', label: 'Deadline'         },
  default:           { icon: '🔔', color: '#6b7280', bg: '#f9fafb', label: 'Notification'     },
};

// ── Time formatter ─────────────────────────────────────────────────────────────
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

// ── Group by date ──────────────────────────────────────────────────────────────
function groupByDate(notifications) {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const groups    = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] };
  notifications.forEach(n => {
    const d = new Date(n.createdAt); d.setHours(0,0,0,0);
    if      (d >= today)     groups['Today'].push(n);
    else if (d >= yesterday) groups['Yesterday'].push(n);
    else if (d >= weekAgo)   groups['This Week'].push(n);
    else                     groups['Earlier'].push(n);
  });
  return groups;
}

// ── Filter tabs ────────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Unread', 'Assignments', 'Marks', 'Deadlines', 'Re-grade'];
const FILTER_MAP = {
  'All':         () => true,
  'Unread':      n => !n.read,
  'Assignments': n => n.type === 'new_assignment',
  'Marks':       n => n.type === 'marks_received',
  'Deadlines':   n => n.type === 'deadline_reminder',
  'Re-grade':    n => n.type === 'regrade_accepted',
};

const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '10px 16px', fontSize: 13, background: 'none',
  border: 'none', cursor: 'pointer', color: '#374151',
  borderBottom: '1px solid #f3f4f6',
};

// ── Mock data — remove once backend /api/notifications is live ─────────────────
const MOCK_NOTIFICATIONS = [
  {
    _id: 'n1', type: 'new_assignment', read: false,
    title: 'New Assignment Posted',
    message: 'Lecturer posted a new assignment: HCI Final Report in HCI module.',
    createdAt: new Date().toISOString(),
    meta: { assignmentName: 'HCI Final Report', moduleName: 'HCI' },
  },
  {
    _id: 'n2', type: 'marks_received', read: false,
    title: 'Marks Received',
    message: 'Your marks for SE Proposal have been released. You scored 82%.',
    createdAt: new Date().toISOString(),
    meta: { submissionId: 'sub_2', assignmentName: 'SE Proposal' },
  },
  {
    _id: 'n3', type: 'regrade_accepted', read: false,
    title: 'Re-grade Request Accepted',
    message: 'Your re-grade request for AI Research has been accepted. New score: 88%.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    meta: { submissionId: 'sub_3', assignmentName: 'AI Research' },
  },
  {
    _id: 'n4', type: 'deadline_reminder', read: true,
    title: 'Deadline Approaching',
    message: 'AI Project Proposal is due in 3 days. Make sure to submit on time.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    meta: { assignmentName: 'AI Project Proposal' },
  },
  {
    _id: 'n5', type: 'marks_received', read: true,
    title: 'Marks Received',
    message: 'Your marks for DBMS Research have been released. You scored 75%.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    meta: { submissionId: 'sub_5', assignmentName: 'DBMS Research' },
  },
];

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
export function StudentNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState('All');
  const [menuOpen, setMenuOpen]           = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    // ── Replace this block with real API call once backend is ready ──
    // import { getNotifications } from '../../api/api';
    // getNotifications().then(r => setNotifications(r.data.notifications || [])).finally(() => setLoading(false));
    setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 400);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Actions ───────────────────────────────────────────────────────────────────
  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setMenuOpen(null);
    // Real: axios.put(`/api/notifications/${id}/read`)
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Real: axios.put('/api/notifications/read-all')
  };

  const deleteOne = (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    setMenuOpen(null);
    // Real: axios.delete(`/api/notifications/${id}`)
  };

  const deleteAll = () => {
    setNotifications([]);
    // Real: axios.delete('/api/notifications/all')
  };

  // ── Navigate on View ──────────────────────────────────────────────────────────
  const handleView = (n) => {
    markRead(n._id);
    if (n.type === 'marks_received' || n.type === 'regrade_accepted') {
      navigate('/student/reports');
    } else if (n.type === 'new_assignment' || n.type === 'deadline_reminder') {
      navigate('/student/submissions');
    }
  };

  const isViewable = (n) =>
    ['marks_received', 'regrade_accepted', 'new_assignment', 'deadline_reminder'].includes(n.type);

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
              <button className="btn-outline" style={{ fontSize: 12, padding: '6px 14px' }}
                onClick={markAllRead}>
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
            width: 64, height: 64, borderRadius: '50%', background: '#e0e7ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: '#3730a3', marginBottom: 8,
            border: '3px solid #c7d2fe',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'S'}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>
            {user?.username || 'Student'}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const count = f === 'Unread' ? unreadCount
                        : f === 'All'    ? notifications.length
                        : notifications.filter(FILTER_MAP[f]).length;
            return (
              <button key={f} onClick={() => setActiveFilter(f)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                background: activeFilter === f ? '#1e40af' : '#f3f4f6',
                color:      activeFilter === f ? '#fff'    : '#6b7280',
                border:     activeFilter === f ? '1.5px solid #1e40af' : '1.5px solid #e5e7eb',
              }}>
                {f}{count > 0 && (
                  <span style={{
                    marginLeft: 4, borderRadius: 10, padding: '1px 6px', fontSize: 10,
                    background: activeFilter === f ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                    color:      activeFilter === f ? '#fff' : '#374151',
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
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
                        background: n.read ? '#fff' : '#f0f7ff',
                        borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                        position: 'relative',
                      }}>

                        {/* Unread dot */}
                        {!n.read && (
                          <div style={{
                            position: 'absolute', left: 8, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 6, height: 6, borderRadius: '50%', background: '#2563eb',
                          }} />
                        )}

                        {/* Icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: cfg.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 18,
                        }}>
                          {cfg.icon}
                        </div>

                        {/* Content */}
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

                          {/* Inline action buttons */}
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

                        {/* ··· dropdown */}
                        <div style={{ position: 'relative' }}
                          ref={menuOpen === n._id ? menuRef : null}>
                          <button onClick={() => setMenuOpen(menuOpen === n._id ? null : n._id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 18, color: '#9ca3af', padding: '4px 6px',
                              borderRadius: 6, lineHeight: 1,
                            }}>
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
                              <button onClick={() => deleteOne(n._id)}
                                style={{ ...menuItemStyle, color: '#dc2626', borderBottom: 'none' }}>
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
      </div>
    </StudentLayout>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
export function StudentProfile() {
  const { user, setUser } = useAuth();
  const [editing, setEditing]   = useState('');
  const [form, setForm]         = useState({ username: '', email: '', studentId: '', dateOfBirth: '', degree: '' });
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState(null);
  const fileInputRef            = useRef(null);

  useEffect(() => {
    getProfile().then(r => {
      const u = r.data.user;
      setForm({ username: u.username || '', email: u.email || '', studentId: u.studentId || '', dateOfBirth: u.dateOfBirth || '', degree: u.degree || '' });
      if (u.profilePicture) setPreview(`http://localhost:5000${u.profilePicture}`);
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setMsg(''); setErr('');
    try {
      const res = await updateProfile({ username: form.username, email: form.email, studentId: form.studentId, dateOfBirth: form.dateOfBirth, degree: form.degree });
      setUser(res.data.user);
      setMsg('Profile updated successfully!'); setEditing('');
    } catch (e) { setErr(e.response?.data?.message || 'Update failed'); }
  };

  const savePassword = async () => {
    setMsg(''); setErr('');
    if (!pwForm.currentPassword || !pwForm.newPassword) return setErr('Both fields are required');
    if (pwForm.newPassword.length < 6) return setErr('New password must be at least 6 characters');
    try {
      await updatePassword(pwForm);
      setMsg('Password updated successfully!');
      setEditing(''); setPwForm({ currentPassword: '', newPassword: '' });
    } catch (e) { setErr(e.response?.data?.message || 'Update failed'); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      setUploading(true);
      setMsg(''); setErr('');
      const res = await axios.put('http://localhost:5000/api/user/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setUser(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
      setPreview(`http://localhost:5000${res.data.profilePicture}`);
      setMsg('Profile picture updated!');
    } catch (e) {
      setErr('Upload failed. Please try again.');
      setPreview(user?.profilePicture ? `http://localhost:5000${user.profilePicture}` : null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setMsg(''); setErr('');
      await axios.delete('http://localhost:5000/api/user/profile/picture', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPreview(null);
      setUser(prev => ({ ...prev, profilePicture: null }));
      setMsg('Profile picture removed.');
    } catch (e) {
      setErr('Remove failed. Please try again.');
    }
  };

  const fields = [
    { key: 'username',    label: 'Name' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'studentId',   label: 'Student ID' },
    { key: 'email',       label: 'Email' },
    { key: 'degree',      label: 'Degree Programme' },
  ];

  return (
    <StudentLayout>
      <div className="topbar"><div className="topbar-left"><h1>Profile</h1><p>Manage your account settings</p></div></div>
      <div className="page-content">
        <div className="profile-wrap">

          <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
            {preview
              ? <img src={preview} alt="Profile"
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', display: 'block' }} />
              : <div className="profile-pic">👤</div>
            }
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>{user?.username}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>Student • {form.degree || 'BSc Computer Science'}</div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <span style={{ color: '#2563eb', fontSize: '12px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                onClick={() => !uploading && fileInputRef.current.click()}>
                {uploading ? 'Uploading...' : 'Upload new picture'}
              </span>
              <span style={{ color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                onClick={handleRemove}>
                Remove
              </span>
            </div>
          </div>

          {msg && <div className="ok-msg" style={{ marginBottom: '10px' }}>{msg}</div>}
          {err && <div className="err-msg" style={{ marginBottom: '10px' }}>{err}</div>}

          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>Account Settings</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '18px' }}>Basic Information</div>

            {fields.map(f => (
              <div key={f.key} className="profile-field">
                <div style={{ flex: 1 }}>
                  <div className="field-label">{f.label}</div>
                  {editing === f.key
                    ? <input value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={{ border: '1.5px solid #2563eb', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontFamily: 'Poppins,sans-serif', marginTop: '4px', outline: 'none', width: '100%', maxWidth: '300px' }} />
                    : <div className="field-value">{form[f.key] || '—'}</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editing === f.key
                    ? <>
                        <button className="btn-primary" style={{ padding: '5px 14px', fontSize: '12px' }} onClick={saveProfile}>Save</button>
                        <button className="btn-outline" style={{ padding: '5px 14px', fontSize: '12px' }} onClick={() => setEditing('')}>Cancel</button>
                      </>
                    : <span style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }} onClick={() => setEditing(f.key)}>›</span>}
                </div>
              </div>
            ))}

            <div className="profile-field">
              <div style={{ flex: 1 }}>
                <div className="field-label">Password</div>
                {editing === 'password'
                  ? <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <input placeholder="Current password" type="password" value={pwForm.currentPassword}
                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        style={{ border: '1.5px solid #2563eb', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontFamily: 'Poppins,sans-serif', outline: 'none', width: '100%', maxWidth: '300px' }} />
                      <input placeholder="New password (min 6 chars)" type="password" value={pwForm.newPassword}
                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        style={{ border: '1.5px solid #2563eb', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontFamily: 'Poppins,sans-serif', outline: 'none', width: '100%', maxWidth: '300px' }} />
                    </div>
                  : <div className="field-value">••••••••</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {editing === 'password'
                  ? <>
                      <button className="btn-primary" style={{ padding: '5px 14px', fontSize: '12px' }} onClick={savePassword}>Save</button>
                      <button className="btn-outline" style={{ padding: '5px 14px', fontSize: '12px' }} onClick={() => setEditing('')}>Cancel</button>
                    </>
                  : <span style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '18px' }} onClick={() => setEditing('password')}>›</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}