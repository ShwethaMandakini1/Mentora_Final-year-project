import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LecturerLayout from './LecturerLayout';
import { useAuth } from '../../context/AuthContext';
import { getAllSubmissions, getAllStudents } from '../../api/api';
import './dashboard.css';

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.allSettled([
      getAllSubmissions().then(r => setSubmissions(r.data.submissions)).catch(() => {}),
      getAllStudents().then(r => setStudents(r.data.students)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const mockRecent = [
    { _id: '1', student: { username: 'Kavindi K' }, assignmentName: 'HCI Final Report', moduleName: 'HCI', status: 'Pending', submittedAt: '2026-02-09' },
    { _id: '2', student: { username: 'Amal P' }, assignmentName: 'SE Proposal', moduleName: 'SE', status: 'Graded', submittedAt: '2026-02-13', score: 82 },
    { _id: '3', student: { username: 'Nimal S' }, assignmentName: 'AI Research', moduleName: 'AI', status: 'Pending', submittedAt: '2026-01-10' },
    { _id: '4', student: { username: 'Saman W' }, assignmentName: 'DBMS Research', moduleName: 'DBMS', status: 'Graded', submittedAt: '2026-01-10', score: 75 },
    { _id: '5', student: { username: 'Priya R' }, assignmentName: 'ML Paper', moduleName: 'AI', status: 'Pending', submittedAt: '2026-01-21' },
  ];
  const mockStudents = [
    { _id: '1', username: 'Kavindi Kinkini', studentId: '10934567' },
    { _id: '2', username: 'Amal Perera', studentId: '10934568' },
    { _id: '3', username: 'Nimal Silva', studentId: '10934569' },
    { _id: '4', username: 'Saman Wickrama', studentId: '10934570' },
  ];

  const srcSubs = loading ? [] : (submissions.length > 0 ? submissions : mockRecent);
  const srcStudents = loading ? [] : (students.length > 0 ? students : mockStudents);

  const q = searchQuery.trim().toLowerCase();

  const filteredRecent = q
    ? srcSubs.filter(s =>
        s.student?.username?.toLowerCase().includes(q) ||
        s.assignmentName?.toLowerCase().includes(q) ||
        s.moduleName?.toLowerCase().includes(q) ||
        s.status?.toLowerCase().includes(q)
      )
    : srcSubs.slice(0, 5);

  const filteredStudents = q
    ? srcStudents.filter(s =>
        s.username?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q)
      )
    : srcStudents;

  const total = loading ? '—' : srcSubs.length;
  const graded = loading ? '—' : srcSubs.filter(s => s.status === 'Graded').length;
  const pending = loading ? '—' : srcSubs.filter(s => s.status === 'Pending').length;
  const gradedSubs = srcSubs.filter(s => s.score);
  const avgScore = loading
    ? '—'
    : gradedSubs.length > 0
      ? `${Math.round(gradedSubs.reduce((a, s) => a + s.score, 0) / gradedSubs.length)}%`
      : '—';

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const stats = [
    { label: 'Total Submissions', val: total, icon: 'icon-submissions', colorClass: 'stat-blue' },
    { label: 'Graded', val: graded, icon: 'icon-graded', colorClass: 'stat-green' },
    { label: 'Pending', val: pending, icon: 'icon-pending', colorClass: 'stat-cyan' },
    { label: 'Average Score', val: avgScore, icon: 'icon-avg', colorClass: 'stat-ocean' },
  ];

  const topbar = (
    <div className="ios-topbar">
      <div className="ios-topbar-left">
        <h1 className="ios-page-title">Dashboard</h1>
        <p className="ios-page-date">{dateStr}</p>
      </div>
      <div className="ios-topbar-right">
        <div className={`ios-search-bar${searchQuery ? ' has-value' : ''}`}>
          <svg className="ios-search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search students or assignments…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ios-clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.25" />
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        <div
          className="ios-user-chip"
          onClick={() => navigate('/lecturer/profile')}
          role="button"
          tabIndex={0}
        >
          <div className="ios-user-avatar">
            {user?.username?.[0]?.toUpperCase() || 'L'}
          </div>
          <span className="ios-username">{user?.username || 'Lecturer'}</span>
          <svg className="ios-chevron" viewBox="0 0 8 12" fill="none">
            <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <LecturerLayout>
      {topbar}
      <div className="ios-page-content">
        <div className="ios-loading-state">
          <div className="ios-spinner" />
          <p>Loading dashboard…</p>
        </div>
      </div>
    </LecturerLayout>
  );

  return (
    <LecturerLayout>
      {topbar}

      <div className="ios-page-content">

        {/* Stats Row */}
        <div className="ios-stats-grid">
          {stats.map(s => (
            <div key={s.label} className={`ios-stat-card ${s.colorClass}`}>
              <div className="ios-stat-icon-wrap">
                <StatIcon name={s.icon} />
              </div>
              <div className="ios-stat-num">{s.val}</div>
              <div className="ios-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="ios-content-grid">

          {/* Submissions Card */}
          <div className="ios-card">
            <div className="ios-card-header">
              <span className="ios-card-title">
                {q ? `Results · ${filteredRecent.length}` : 'Recent Submissions'}
              </span>
              <button
                className="ios-view-all-btn"
                onClick={() => navigate('/lecturer/submissions')}
              >
                View All
              </button>
            </div>

            {filteredRecent.length === 0 ? (
              <div className="ios-empty-state">
                <svg viewBox="0 0 40 40" fill="none" className="ios-empty-icon">
                  <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                  <path d="M13 20h14M20 13v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                </svg>
                <p>No submissions match "<strong>{searchQuery}</strong>"</p>
              </div>
            ) : (
              <div className="ios-table-wrap">
                <table className="ios-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Assignment</th>
                      <th>Module</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecent.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div className="ios-student-cell">
                            <div className="ios-table-avatar">
                              {s.student?.username?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <span className="ios-student-name">
                              {s.student?.username || 'Student'}
                            </span>
                          </div>
                        </td>
                        <td className="ios-assignment-cell">{s.assignmentName}</td>
                        <td>
                          <span className="ios-module-tag">{s.moduleName}</span>
                        </td>
                        <td>
                          <span className={`ios-badge ios-badge--${s.status?.toLowerCase()}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="ios-date-cell">
                          {new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td>
                          <button
                            className={`ios-action-btn ios-action-btn--${s.status === 'Pending' ? 'primary' : 'ghost'}`}
                            onClick={() => navigate('/lecturer/submissions')}
                          >
                            {s.status === 'Pending' ? 'Mark' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Students Card */}
          <div className="ios-card ios-card--students">
            <div className="ios-card-header">
              <span className="ios-card-title">Students</span>
              <span className="ios-count-pill">{filteredStudents.length}</span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="ios-empty-state">
                <p>No students match "<strong>{searchQuery}</strong>"</p>
              </div>
            ) : (
              <div className="ios-students-list">
                {filteredStudents.map((s, i) => (
                  <div key={s._id} className="ios-student-row">
                    <div
                      className="ios-stu-avatar"
                      style={{ '--hue': (i * 47 + 200) % 360 }}
                    >
                      {s.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="ios-stu-info">
                      <div className="ios-stu-name">{s.username}</div>
                      <div className="ios-stu-id">ID · {s.studentId || '—'}</div>
                    </div>
                    <svg className="ios-stu-chevron" viewBox="0 0 6 10" fill="none">
                      <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </LecturerLayout>
  );
}

/* ── Inline SVG icon helper ─────────────────────────────────────── */
function StatIcon({ name }) {
  const icons = {
    'icon-submissions': (
      <svg viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 8h8M7 11h8M7 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    'icon-graded': (
      <svg viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.5 11l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    'icon-pending': (
      <svg viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 7v4.5l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
    'icon-avg': (
      <svg viewBox="0 0 22 22" fill="none">
        <path d="M3 16l5-5 4 4 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
  return icons[name] || null;
}