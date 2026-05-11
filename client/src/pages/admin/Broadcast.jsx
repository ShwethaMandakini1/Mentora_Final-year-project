/**
 * Broadcast.jsx - Admin Broadcast Messaging Page
 * Redesigned for a clean, spacious, polished admin portal layout.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import adminAPI from '../../api/adminAPI';
import './admin.css';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, fill = 'none', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const Icons = {
  Megaphone: ({ size = 18 }) => (
    <Icon size={size} d={<><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>} />
  ),
  Users: ({ size = 18 }) => (
    <Icon size={size} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />
  ),
  Student: ({ size = 18 }) => (
    <Icon size={size} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />
  ),
  Lecturer: ({ size = 18 }) => (
    <Icon size={size} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></>} />
  ),
  Send: ({ size = 18 }) => (
    <Icon size={size} d={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>} />
  ),
  Check: ({ size = 18 }) => (
    <Icon size={size} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />
  ),
  Eye: ({ size = 18 }) => (
    <Icon size={size} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>} />
  ),
  ArrowLeft: ({ size = 18 }) => (
    <Icon size={size} d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />
  ),
  Bell: ({ size = 18 }) => (
    <Icon size={size} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>} />
  ),
};

export default function Broadcast() {
  const navigate = useNavigate();

  const [recipient, setRecipient] = useState('all');
  const [title,     setTitle]     = useState('');
  const [message,   setMessage]   = useState('');
  const [stats,     setStats]     = useState(null);
  const [sending,   setSending]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    adminAPI.get('/admin/stats')
      .then(res => setStats(res.data.stats))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!title.trim())   { setError('Please enter a message title.');   return; }
    if (!message.trim()) { setError('Please enter a message content.'); return; }
    setSending(true); setError(''); setSuccess(false);
    try {
      await adminAPI.post('/admin/broadcast', { recipient, title, message });
      setSuccess(true);
      setTitle(''); setMessage(''); setRecipient('all');
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send broadcast. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getCount = () => {
    if (!stats) return 0;
    if (recipient === 'students')  return stats.users.students  || 0;
    if (recipient === 'lecturers') return stats.users.lecturers || 0;
    return stats.users.total || 0;
  };

  const recipientCount = getCount();

  const recipientOptions = [
    {
      key:   'all',
      label: 'All Users',
      sub:   'Everyone on the platform',
      Icon:  Icons.Users,
      count: stats?.users.total     || 0,
      color: '#3b5bdb',
      light: '#eef2ff',
      accent:'#4c6ef5',
    },
    {
      key:   'students',
      label: 'Students Only',
      sub:   'Enrolled students',
      Icon:  Icons.Student,
      count: stats?.users.students  || 0,
      color: '#0ca678',
      light: '#e6fcf5',
      accent:'#12b886',
    },
    {
      key:   'lecturers',
      label: 'Lecturers Only',
      sub:   'Teaching staff',
      Icon:  Icons.Lecturer,
      count: stats?.users.lecturers || 0,
      color: '#0891b2',
      light: '#e0f2fe',
      accent:'#06b6d4',
    },
  ];

  const canSend = title.trim() && message.trim() && !sending;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: '28px 36px 0',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--text-muted)', fontWeight: 500,
                padding: '4px 0', marginBottom: 10,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Icons.ArrowLeft size={13} />
              Back to Dashboard
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #3b5bdb, #4c6ef5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 14px rgba(59,91,219,0.30)',
              }}>
                <Icons.Megaphone size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.3px' }}>
                  Broadcast Message
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Send in-app notifications to students, lecturers, or everyone
                </p>
              </div>
            </div>
          </div>

          {/* Right: live recipient count pill */}
          <div style={{
            alignSelf: 'flex-end',
            background: 'var(--foam)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Icons.Bell size={15} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Will reach{' '}
              <strong style={{ color: 'var(--navy)', fontSize: 15 }}>{recipientCount}</strong>
              {' '}user{recipientCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Page body ────────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 36px 40px', flex: 1 }}>

          {/* Success */}
          {success && (
            <div style={{
              background: '#dcfce7', border: '1px solid #86efac',
              borderRadius: 12, padding: '14px 20px', marginBottom: 22,
              display: 'flex', alignItems: 'center', gap: 10,
              color: '#166534', fontWeight: 600, fontSize: 14,
              animation: 'fadeIn 0.25s ease',
            }}>
              <Icons.Check size={16} />
              Broadcast sent successfully to <strong>{recipientCount}</strong> user{recipientCount !== 1 ? 's' : ''}!
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: 12, padding: '14px 20px', marginBottom: 22,
              color: '#dc2626', fontWeight: 600, fontSize: 14,
            }}>
              {error}
            </div>
          )}

          {/* ── Two-column layout ──────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: 24,
            alignItems: 'start',
          }}>

            {/* ═══ LEFT: Compose form ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Recipient picker */}
              <div className="adm-card" style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                  Step 1 — Select Recipients
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {recipientOptions.map(opt => {
                    const active = recipient === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setRecipient(opt.key)}
                        style={{
                          padding: '20px 16px', borderRadius: 14, textAlign: 'left',
                          border: `2px solid ${active ? opt.color : 'var(--border)'}`,
                          background: active ? opt.light : '#fff',
                          cursor: 'pointer', transition: 'all 0.18s',
                          boxShadow: active ? `0 4px 16px ${opt.color}22` : 'none',
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {/* Accent stripe at top */}
                        {active && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            height: 3, background: opt.color, borderRadius: '14px 14px 0 0',
                          }} />
                        )}
                        {/* Icon circle */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, marginBottom: 12,
                          background: active ? opt.color : 'var(--foam)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: active ? '#fff' : 'var(--text-muted)',
                          transition: 'all 0.18s',
                        }}>
                          <opt.Icon size={18} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700,
                                      color: active ? opt.color : 'var(--navy)', marginBottom: 2 }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                          {opt.sub}
                        </div>
                        <div style={{
                          fontSize: 26, fontWeight: 800, lineHeight: 1,
                          color: active ? opt.color : 'var(--text-muted)',
                        }}>
                          {stats ? opt.count : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {opt.count === 1 ? 'user' : 'users'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message composer */}
              <div className="adm-card" style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20 }}>
                  Step 2 — Compose Message
                </div>

                {/* Title field */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
                                  color: 'var(--navy)', marginBottom: 8 }}>
                    Notification Title
                    <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="adm-input"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setError(''); }}
                    placeholder="e.g., Important System Update"
                    maxLength={100}
                    style={{ fontSize: 14, padding: '12px 16px', width: '100%',
                             boxSizing: 'border-box', borderRadius: 10 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Appears as the notification header</span>
                    <span style={{ color: title.length > 80 ? '#d97706' : 'var(--text-muted)' }}>
                      {title.length} / 100
                    </span>
                  </div>
                </div>

                {/* Message body */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600,
                                  color: 'var(--navy)', marginBottom: 8 }}>
                    Message Content
                    <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
                  </label>
                  <textarea
                    className="adm-textarea"
                    value={message}
                    onChange={e => { setMessage(e.target.value); setError(''); }}
                    placeholder="Write the full message body here. Keep it clear and concise."
                    rows={7}
                    maxLength={500}
                    style={{ fontSize: 14, lineHeight: 1.7, padding: '14px 16px',
                             width: '100%', boxSizing: 'border-box',
                             resize: 'vertical', borderRadius: 10 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Shown in each user's notification panel</span>
                    <span style={{ color: message.length > 400 ? '#d97706' : 'var(--text-muted)' }}>
                      {message.length} / 500
                    </span>
                  </div>
                </div>
              </div>

              {/* Send button row */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'flex-end', gap: 12,
              }}>
                <button
                  onClick={() => setShowPreview(p => !p)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
                    background: '#fff', border: '1.5px solid var(--border)',
                    fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icons.Eye size={15} />
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px', borderRadius: 10, border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: canSend ? 'pointer' : 'not-allowed',
                    background: canSend
                      ? 'linear-gradient(135deg, #3b5bdb, #4c6ef5)'
                      : 'var(--border)',
                    color: canSend ? '#fff' : 'var(--text-muted)',
                    boxShadow: canSend ? '0 4px 16px rgba(59,91,219,0.30)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {sending
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)',
                                      borderTopColor: '#fff', borderRadius: '50%',
                                      animation: 'spin 0.7s linear infinite' }} />Sending…</>
                    : <><Icons.Send size={15} />Send to {recipientCount} user{recipientCount !== 1 ? 's' : ''}</>
                  }
                </button>
              </div>
            </div>

            {/* ═══ RIGHT: Info panel + preview ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* How it works */}
              <div className="adm-card" style={{ padding: '22px 24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)',
                              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.Bell size={14} />
                  How Broadcasts Work
                </div>
                {[
                  { step: '1', text: 'Choose your recipient group from the left panel.' },
                  { step: '2', text: 'Write a title and message body.' },
                  { step: '3', text: 'Hit Send — each user gets the notification instantly.' },
                  { step: '4', text: 'Users see it in their Notifications page on next visit.' },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 12,
                                               alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #3b5bdb, #4c6ef5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff',
                    }}>
                      {item.step}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)',
                                margin: 0, lineHeight: 1.5, paddingTop: 3 }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Live preview — shown when toggle active or text is filled */}
              {(showPreview || (title.trim() && message.trim())) && (
                <div className="adm-card" style={{ padding: '22px 24px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                    Notification Preview
                  </div>

                  {/* Mock notification card */}
                  <div style={{
                    background: '#f8fafc', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '16px 18px',
                    borderLeft: '4px solid #4c6ef5',
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center',
                                  gap: 8, marginBottom: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg, #3b5bdb, #4c6ef5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icons.Megaphone size={13} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#4c6ef5',
                                      textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Broadcast
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Just now</div>
                      </div>
                      <div style={{
                        marginLeft: 'auto', width: 8, height: 8,
                        borderRadius: '50%', background: '#4c6ef5',
                      }} />
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)',
                                  marginBottom: 6, lineHeight: 1.3 }}>
                      {title.trim() || <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontStyle: 'italic' }}>Message title…</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)',
                                  lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {message.trim() || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Message content…</span>}
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, marginBottom: 0 }}>
                    This is how the notification will appear in each user's panel.
                  </p>
                </div>
              )}

              {/* Recipient summary */}
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 12, padding: '16px 20px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8',
                              marginBottom: 8 }}>
                  📊 Current Selection
                </div>
                {recipientOptions.map(opt => (
                  <div key={opt.key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '6px 0',
                    borderBottom: opt.key !== 'lecturers' ? '1px solid #dbeafe' : 'none',
                    opacity: recipient === opt.key ? 1 : 0.5,
                  }}>
                    <span style={{ fontSize: 13, color: '#1e3a5f', fontWeight: recipient === opt.key ? 700 : 400 }}>
                      {recipient === opt.key && '→ '}{opt.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700,
                                   color: recipient === opt.key ? opt.color : '#64748b' }}>
                      {stats ? opt.count : '—'}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </AdminLayout>
  );
}