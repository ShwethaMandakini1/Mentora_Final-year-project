import React from 'react';
import LecturerLayout from './LecturerLayout';
import './dashboard.css';

export default function LecturerRequests() {
  return (
    <LecturerLayout>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Regarding Request</h1>
        </div>
      </div>
      <div className="page-content">
        <div className="card" style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#111827', marginBottom: 8 }}>
            No requests yet
          </div>
          <div style={{ color: '#9ca3af', fontSize: 14 }}>
            Student requests and appeals will appear here.
          </div>
        </div>
      </div>
    </LecturerLayout>
  );
}