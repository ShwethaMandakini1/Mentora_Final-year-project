import React, { useState, useEffect, useRef } from 'react';
import LecturerLayout from './LecturerLayout';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, updatePassword } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

const BASE = 'http://localhost:5000';

export function LecturerProfile() {
  const { user, setUser } = useAuth();
  const [editing,   setEditing]   = useState('');
  const [form,      setForm]      = useState({ username: '', email: '', staffId: '', department: '' });
  const [pwForm,    setPwForm]    = useState({ currentPassword: '', newPassword: '' });
  const [msg,       setMsg]       = useState('');
  const [err,       setErr]       = useState('');
  const [avatar,    setAvatar]    = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    getProfile().then(r => {
      const u = r.data.user;
      setForm({ username: u.username || '', email: u.email || '', staffId: u.staffId || '', department: u.department || '' });
      const pic = u.profilePicture || u.avatar || u.profilePic || null;
      if (pic) setAvatar(pic.startsWith('http') ? pic : `${BASE}/${pic.replace(/^\//, '')}`);
    }).catch(() => {});
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setErr('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) return setErr('Image must be under 5MB.');
    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);
    setUploading(true);
    setMsg(''); setErr('');
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const res = await API.post('/auth/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = res.data.user || res.data;
      const pic = updatedUser.profilePicture || updatedUser.avatar || updatedUser.profilePic;
      if (pic) {
        const fullUrl = pic.startsWith('http') ? pic : `${BASE}/${pic.replace(/^\//, '')}`;
        setAvatar(fullUrl);
      }
      if (setUser) setUser(updatedUser);
      setMsg('Profile picture updated!');
    } catch (e) {
      setErr(e.response?.data?.message || 'Upload failed. Please try again.');
      setAvatar(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    setMsg(''); setErr('');
    try {
      await API.post('/auth/remove-profile-picture');
      setAvatar(null);
      if (setUser) setUser(prev => ({ ...prev, profilePicture: null, avatar: null }));
      setMsg('Profile picture removed.');
    } catch {
      setAvatar(null);
      setMsg('Profile picture removed.');
    }
  };

  const saveProfile = async () => {
    setMsg(''); setErr('');
    try {
      const res = await updateProfile(form);
      setUser(res.data.user);
      setMsg('Profile updated successfully!');
      setEditing('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    }
  };

  const savePassword = async () => {
    setMsg(''); setErr('');
    if (!pwForm.currentPassword || !pwForm.newPassword) return setErr('Both fields are required');
    try {
      await updatePassword(pwForm);
      setMsg('Password updated successfully!');
      setEditing('');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    }
  };

  const fields = [
    { key: 'username',   label: 'Name' },
    { key: 'email',      label: 'Email' },
    { key: 'staffId',    label: 'Staff ID' },
    { key: 'department', label: 'Department' },
  ];

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <LecturerLayout>
      <div className="ios-topbar">
        <div className="ios-topbar-left">
          <h1 className="ios-page-title">Profile</h1>
          <p className="ios-page-date">Manage your account settings · {dateStr}</p>
        </div>
      </div>

      <div className="ios-page-content">
        <div className="ios-profile-wrap">

          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Avatar card */}
          <div className="ios-card" style={{ padding: '28px 24px', textAlign: 'center', marginBottom: 16 }}>
            <div className="ios-profile-avatar-wrap">
              {uploading && (
                <div className="ios-avatar-upload-overlay">
                  <div className="ios-avatar-spinner" />
                </div>
              )}
              {avatar ? (
                <img src={avatar} alt="Profile" onError={() => setAvatar(null)} />
              ) : (
                <span className="ios-profile-avatar-placeholder">👨‍🏫</span>
              )}
            </div>

            <div className="ios-profile-name">{user?.username}</div>
            <div className="ios-profile-role">Lecturer · {form.department || 'Computing'}</div>

            <div className="ios-avatar-actions">
              <span
                className={`ios-avatar-upload-link${uploading ? ' ios-avatar-upload-link--disabled' : ''}`}
                onClick={() => !uploading && fileRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Upload new picture'}
              </span>
              {avatar && (
                <span className="ios-avatar-remove-link" onClick={handleRemovePicture}>
                  Remove
                </span>
              )}
            </div>
          </div>

          {/* Alerts */}
          {msg && <div className="ios-alert ios-alert--success">{msg}</div>}
          {err && <div className="ios-alert ios-alert--error">{err}</div>}

          {/* Account settings card */}
          <div className="ios-card" style={{ padding: '20px 24px' }}>
            <div className="ios-profile-section-title">Account Settings</div>
            <div className="ios-profile-section-sub">Basic Information</div>

            {fields.map(f => (
              <div key={f.key} className="ios-profile-field">
                <div className="ios-profile-field-body">
                  <div className="ios-profile-field-label">{f.label}</div>
                  {editing === f.key ? (
                    <input
                      className="ios-input"
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      style={{ marginTop: 6 }}
                    />
                  ) : (
                    <div className="ios-profile-field-value">{form[f.key] || '—'}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {editing === f.key ? (
                    <>
                      <button className="ios-action-btn ios-action-btn--primary" style={{ fontSize: 11 }} onClick={saveProfile}>Save</button>
                      <button className="ios-action-btn ios-action-btn--ghost"   style={{ fontSize: 11 }} onClick={() => setEditing('')}>Cancel</button>
                    </>
                  ) : (
                    <svg
                      className="ios-profile-edit-chevron"
                      viewBox="0 0 8 12" fill="none"
                      onClick={() => setEditing(f.key)}
                    >
                      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))}

            {/* Password field */}
            <div className="ios-profile-field">
              <div className="ios-profile-field-body">
                <div className="ios-profile-field-label">Password</div>
                {editing === 'password' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                    <input
                      className="ios-input"
                      type="password"
                      placeholder="Current password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    />
                    <input
                      className="ios-input"
                      type="password"
                      placeholder="New password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="ios-profile-field-value ios-profile-field-value--dots">••••••••</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {editing === 'password' ? (
                  <>
                    <button className="ios-action-btn ios-action-btn--primary" style={{ fontSize: 11 }} onClick={savePassword}>Save</button>
                    <button className="ios-action-btn ios-action-btn--ghost"   style={{ fontSize: 11 }} onClick={() => setEditing('')}>Cancel</button>
                  </>
                ) : (
                  <svg
                    className="ios-profile-edit-chevron"
                    viewBox="0 0 8 12" fill="none"
                    onClick={() => setEditing('password')}
                  >
                    <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </LecturerLayout>
  );
}