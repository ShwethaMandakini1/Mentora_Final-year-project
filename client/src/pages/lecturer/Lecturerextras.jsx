import React, { useState, useEffect, useRef } from 'react';
import LecturerLayout from './LecturerLayout';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, updatePassword } from '../../api/api';
import API from '../../api/api';
import './dashboard.css';

const BASE = 'http://localhost:5000';

export function LecturerProfile() {
  const { user, setUser } = useAuth();
  const [editing,  setEditing]  = useState('');
  const [form,     setForm]     = useState({ username:'', email:'', staffId:'', department:'' });
  const [pwForm,   setPwForm]   = useState({ currentPassword:'', newPassword:'' });
  const [msg,      setMsg]      = useState('');
  const [err,      setErr]      = useState('');
  const [avatar,   setAvatar]   = useState(null);   // current displayed avatar URL
  const [uploading,setUploading]= useState(false);
  const fileRef = useRef();

  useEffect(() => {
    getProfile().then(r => {
      const u = r.data.user;
      setForm({ username: u.username||'', email: u.email||'', staffId: u.staffId||'', department: u.department||'' });
      // Support profilePicture or avatar field from backend
      const pic = u.profilePicture || u.avatar || u.profilePic || null;
      if (pic) setAvatar(pic.startsWith('http') ? pic : `${BASE}/${pic.replace(/^\//, '')}`);
    }).catch(() => {});
  }, []);

  // ── Profile picture upload ──────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 5MB)
    if (!file.type.startsWith('image/')) return setErr('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) return setErr('Image must be under 5MB.');

    // Show preview immediately
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
      // Revert preview on error
      setAvatar(null);
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
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
      // If no remove endpoint, just clear locally
      setAvatar(null);
      setMsg('Profile picture removed.');
    }
  };

  // ── Save profile fields ─────────────────────────────────────────────────────
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
      setPwForm({ currentPassword:'', newPassword:'' });
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    }
  };

  const fields = [
    { key:'username',   label:'Name' },
    { key:'email',      label:'Email' },
    { key:'staffId',    label:'Staff ID' },
    { key:'department', label:'Department' },
  ];

  return (
    <LecturerLayout>
      <div className="topbar">
        <div className="topbar-left"><h1>Profile</h1><p>Manage your account settings</p></div>
      </div>
      <div className="page-content">
        <div className="profile-wrap">

          {/* ── Avatar card ── */}
          <div className="card" style={{ textAlign:'center', marginBottom:16 }}>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display:'none' }}
              onChange={handleFileChange}
            />

            {/* Avatar display */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              margin: '0 auto 12px',
              background: '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
              border: '3px solid #e5e7eb',
            }}>
              {uploading && (
                <div style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,0.4)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius:'50%', zIndex:2,
                }}>
                  <div style={{
                    width:20, height:20, border:'3px solid #fff',
                    borderTop:'3px solid transparent', borderRadius:'50%',
                    animation:'spin 0.8s linear infinite',
                  }}/>
                </div>
              )}
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={() => setAvatar(null)}
                />
              ) : (
                <span style={{ fontSize:36 }}>👨‍🏫</span>
              )}
            </div>

            <div style={{ fontSize:16, fontWeight:600, color:'#1f2937', marginBottom:4 }}>
              {user?.username}
            </div>
            <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>
              Lecturer • {form.department || 'Computing'}
            </div>

            {/* Upload / Remove buttons */}
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <span
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  color: uploading ? '#9ca3af' : '#2563eb',
                  fontSize:12, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight:500,
                }}>
                {uploading ? 'Uploading...' : 'Upload new picture'}
              </span>
              {avatar && (
                <span
                  onClick={handleRemovePicture}
                  style={{ color:'#ef4444', fontSize:12, cursor:'pointer', fontWeight:500 }}>
                  Remove
                </span>
              )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {msg && (
            <div style={{ marginBottom:10, padding:'9px 14px', borderRadius:8, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', fontSize:13 }}>
              {msg}
            </div>
          )}
          {err && (
            <div style={{ marginBottom:10, padding:'9px 14px', borderRadius:8, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', fontSize:13 }}>
              {err}
            </div>
          )}

          {/* ── Account settings ── */}
          <div className="card">
            <div style={{ fontSize:14, fontWeight:700, color:'#1f2937', marginBottom:4 }}>Account Settings</div>
            <div style={{ fontSize:12, color:'#9ca3af', marginBottom:18 }}>Basic Information</div>

            {fields.map(f => (
              <div key={f.key} className="profile-field">
                <div style={{ flex:1 }}>
                  <div className="field-label">{f.label}</div>
                  {editing === f.key
                    ? <input
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={{ border:'1.5px solid #2563eb', borderRadius:8, padding:'6px 10px', fontSize:13, fontFamily:'Poppins,sans-serif', marginTop:4, outline:'none', width:'100%', maxWidth:300 }}
                      />
                    : <div className="field-value">{form[f.key] || '—'}</div>
                  }
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {editing === f.key
                    ? <>
                        <button className="btn-primary" style={{ padding:'5px 14px', fontSize:12 }} onClick={saveProfile}>Save</button>
                        <button className="btn-outline"  style={{ padding:'5px 14px', fontSize:12 }} onClick={() => setEditing('')}>Cancel</button>
                      </>
                    : <span style={{ cursor:'pointer', color:'#9ca3af', fontSize:18 }} onClick={() => setEditing(f.key)}>›</span>
                  }
                </div>
              </div>
            ))}

            {/* Password field */}
            <div className="profile-field">
              <div style={{ flex:1 }}>
                <div className="field-label">Password</div>
                {editing === 'password'
                  ? <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
                      <input
                        placeholder="Current password" type="password"
                        value={pwForm.currentPassword}
                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        style={{ border:'1.5px solid #2563eb', borderRadius:8, padding:'6px 10px', fontSize:13, fontFamily:'Poppins,sans-serif', outline:'none', width:'100%', maxWidth:300 }}
                      />
                      <input
                        placeholder="New password" type="password"
                        value={pwForm.newPassword}
                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        style={{ border:'1.5px solid #2563eb', borderRadius:8, padding:'6px 10px', fontSize:13, fontFamily:'Poppins,sans-serif', outline:'none', width:'100%', maxWidth:300 }}
                      />
                    </div>
                  : <div className="field-value">••••••••</div>
                }
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {editing === 'password'
                  ? <>
                      <button className="btn-primary" style={{ padding:'5px 14px', fontSize:12 }} onClick={savePassword}>Save</button>
                      <button className="btn-outline"  style={{ padding:'5px 14px', fontSize:12 }} onClick={() => setEditing('')}>Cancel</button>
                    </>
                  : <span style={{ cursor:'pointer', color:'#9ca3af', fontSize:18 }} onClick={() => setEditing('password')}>›</span>
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    </LecturerLayout>
  );
}