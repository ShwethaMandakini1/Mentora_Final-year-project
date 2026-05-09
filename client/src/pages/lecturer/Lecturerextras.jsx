import React, { useState, useEffect, useRef } from 'react';
// Assuming these paths based on the error logs provided
import LecturerLayout from './Lecturerlayout'; 
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, updatePassword } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

const BASE = 'import.meta.env.VITE_API_URL';

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
    { key: 'email',      label: 'Email Address' },
    { key: 'staffId',    label: 'Staff Identification ID' },
    { key: 'department', label: 'Faculty / Department' },
  ];

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <LecturerLayout>
      <div className="ios-topbar">
        <div className="ios-topbar-left">
          <h1 className="ios-page-title">Lecturer Profile</h1>
          <p className="ios-page-date">Personal settings · {dateStr}</p>
        </div>
      </div>

      <div className="ios-page-content">
        <div className="ios-profile-enhanced-container">
          
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Enhanced Hero Card based on UI reference */}
          <div className="ios-card ios-profile-hero">
            <div className="ios-hero-avatar-section">
              <div className="ios-avatar-main-ring">
                {uploading && (
                  <div className="ios-avatar-upload-overlay">
                    <div className="ios-avatar-spinner" />
                  </div>
                )}
                {avatar ? (
                  <img src={avatar} alt="Profile" className="ios-avatar-img" onError={() => setAvatar(null)} />
                ) : (
                  <div className="ios-avatar-placeholder-text">{user?.username?.charAt(0) || 'H'}</div>
                )}
              </div>
              <div className="ios-hero-text-section">
                <h2 className="ios-hero-name">{user?.username || 'Himaya'}</h2>
                <p className="ios-hero-role">Senior Lecturer · {form.department || 'Academic Department'}</p>
                <div className="ios-hero-actions">
                  <button 
                    className={`ios-hero-btn primary ${uploading ? 'loading' : ''}`}
                    onClick={() => !uploading && fileRef.current?.click()}
                  >
                    {uploading ? 'Uploading...' : 'Update Photo'}
                  </button>
                  {avatar && (
                    <button className="ios-hero-btn secondary" onClick={handleRemovePicture}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {msg && <div className="ios-toast ios-toast-success">{msg}</div>}
          {err && <div className="ios-toast ios-toast-error">{err}</div>}

          <div className="ios-profile-grid">
            {/* Account Details Section */}
            <div className="ios-card settings-card">
              <div className="ios-section-header">
                <h3 className="ios-section-title">Account Details</h3>
                <span className="ios-section-tag">PUBLIC INFORMATION</span>
              </div>
              
              <div className="ios-profile-list">
                {fields.map(f => (
                  <div key={f.key} className="ios-list-item">
                    <div className="ios-item-content">
                      <label className="ios-item-label">{f.label}</label>
                      {editing === f.key ? (
                        <div className="ios-edit-inline-wrap">
                          <input
                            className="ios-edit-input"
                            value={form[f.key]}
                            onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                            autoFocus
                          />
                          <div className="ios-edit-controls">
                            <button className="ios-mini-save" onClick={saveProfile}>Save</button>
                            <button className="ios-mini-cancel" onClick={() => setEditing('')}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div className="ios-item-value">{form[f.key] || 'Not specified'}</div>
                      )}
                    </div>
                    {editing !== f.key && (
                      <button className="ios-item-edit-trigger" onClick={() => setEditing(f.key)}>
                        Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Security Section */}
            <div className="ios-card settings-card">
              <div className="ios-section-header">
                <h3 className="ios-section-title">Security & Access</h3>
                <span className="ios-section-tag">PRIVATE</span>
              </div>

              <div className="ios-list-item no-border">
                <div className="ios-item-content">
                  <label className="ios-item-label">PASSWORD</label>
                  {editing === 'password' ? (
                    <div className="ios-password-column">
                      <input
                        className="ios-edit-input"
                        type="password"
                        placeholder="Current password"
                        value={pwForm.currentPassword}
                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        style={{ marginBottom: '8px' }}
                      />
                      <input
                        className="ios-edit-input"
                        type="password"
                        placeholder="New password"
                        value={pwForm.newPassword}
                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      />
                      <div className="ios-edit-controls mt-2">
                        <button className="ios-mini-save" onClick={savePassword}>Update Password</button>
                        <button className="ios-mini-cancel" onClick={() => setEditing('')}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ios-item-value">••••••••••••</div>
                  )}
                </div>
                {editing !== 'password' && (
                  <button className="ios-item-edit-trigger" onClick={() => setEditing('password')}>
                    Change
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ios-profile-enhanced-container {
          max-width: 720px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* Hero Card */
        .ios-profile-hero {
          background: linear-gradient(135deg, #023E8A 0%, #0077B6 100%);
          color: white;
          padding: 32px 40px;
          border-radius: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(2, 62, 138, 0.15);
        }

        .ios-hero-avatar-section {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .ios-avatar-main-ring {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #03045E;
          border: 2px solid rgba(255, 255, 255, 0.3);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .ios-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ios-avatar-placeholder-text {
          font-size: 36px;
          font-weight: 800;
          color: white;
        }

        .ios-hero-text-section {
          flex: 1;
        }

        .ios-hero-name {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .ios-hero-role {
          font-size: 14px;
          opacity: 0.9;
          margin: 6px 0 16px 0;
          font-weight: 400;
        }

        .ios-hero-actions {
          display: flex;
          gap: 12px;
        }

        .ios-hero-btn {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .ios-hero-btn.primary { background: white; color: #023E8A; }
        .ios-hero-btn.secondary { background: rgba(255,255,255,0.15); color: white; }
        .ios-hero-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        /* Toasts */
        .ios-toast {
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } }
        .ios-toast-success { background: #E3FCEF; color: #006644; border-left: 4px solid #36B37E; }
        .ios-toast-error { background: #FFEBE6; color: #BF2600; border-left: 4px solid #FF5630; }

        /* Detail Cards */
        .ios-profile-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        
        .settings-card {
          background: white;
          border-radius: 20px;
          padding: 24px 32px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          border: none;
        }

        .ios-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F0F2F5;
        }

        .ios-section-title { font-size: 16px; font-weight: 700; color: #03045E; margin: 0; }
        .ios-section-tag {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0077B6;
        }

        .ios-profile-list { display: flex; flex-direction: column; }
        .ios-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid #F0F2F5;
        }
        .ios-list-item:last-child, .ios-list-item.no-border { border-bottom: none; }
        
        .ios-item-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #8FA5BC;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ios-item-value { font-size: 15px; font-weight: 500; color: #1D1D1F; }
        
        .ios-item-edit-trigger {
          background: none;
          border: none;
          color: #0077B6;
          font-size: 13px;
          font-weight: 600;
          padding: 0;
          cursor: pointer;
          transition: 0.2s;
        }
        .ios-item-edit-trigger:hover { opacity: 0.8; }

        .ios-edit-inline-wrap { display: flex; flex-direction: column; gap: 8px; width: 100%; min-width: 250px; }
        .ios-edit-input {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 14px;
          width: 100%;
        }
        .ios-edit-input:focus { border-color: #0077B6; outline: none; }
        
        .ios-edit-controls { display: flex; gap: 8px; margin-top: 4px; }
        .ios-mini-save { background: #0077B6; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .ios-mini-cancel { background: #F1F5F9; color: #64748B; border: none; padding: 6px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;}

        .ios-avatar-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: ios-spin 0.6s linear infinite;
        }
        @keyframes ios-spin { to { transform: rotate(360deg); } }
      `}} />
    </LecturerLayout>
  );
}