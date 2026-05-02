import React, { useState, useEffect } from 'react';
import StudentLayout from './StudentLayout';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/api';
import './dashboard.css';

export default function StudentLeaderboard() {
  const { user }                        = useAuth();
  const [tab, setTab]                   = useState('leaderboard');
  const [leaderboard, setLeaderboard]   = useState([]);
  const [badges, setBadges]             = useState({ earned: [], locked: [] });
  const [myRank, setMyRank]             = useState(null);
  const [totalRanked, setTotalRanked]   = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lbRes, badgeRes] = await Promise.all([
        API.get('/leaderboard'),
        API.get('/leaderboard/badges'),
      ]);
      setLeaderboard(lbRes.data.leaderboard || []);
      setBadges({ earned: badgeRes.data.earned || [], locked: badgeRes.data.locked || [] });
      setMyRank(badgeRes.data.myRank);
      setTotalRanked(badgeRes.data.totalRanked || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const myEntry = leaderboard.find(s => s.username === user?.username);

  const rankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const rankColor = (rank) => {
    if (rank === 1) return { color: '#d97706', bg: '#fef3c7' };
    if (rank === 2) return { color: '#6b7280', bg: '#f3f4f6' };
    if (rank === 3) return { color: '#b45309', bg: '#fef3c7' };
    return { color: '#374151', bg: '#fff' };
  };

  return (
    <StudentLayout>
      <div style={{ padding: '30px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>
            🏆 Leaderboard & Badges
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>
            See how you rank among your peers and earn badges for your achievements
          </p>
        </div>

        {/* My rank banner */}
        {myRank && (
          <div style={{
            background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
            borderRadius: 16, padding: '20px 28px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800,
              }}>
                {rankMedal(myRank)}
              </div>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>Your Current Rank</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>
                  #{myRank} <span style={{ fontSize: 14, opacity: 0.75 }}>of {totalRanked} students</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{myEntry?.average || 0}%</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Average Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{badges.earned.length}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Badges Earned</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{myEntry?.submissions || 0}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Submissions</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
          {[['leaderboard', '🏆 Leaderboard'], ['badges', '🎖️ My Badges']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', padding: '10px 24px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              color: tab === t ? '#2563eb' : '#6b7280',
              borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Loading...
          </div>
        ) : (

          /* ── LEADERBOARD TAB ── */
          tab === 'leaderboard' ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>

              {/* Top 3 podium */}
              {leaderboard.length >= 3 && (
                <div style={{
                  background: 'linear-gradient(135deg, #f9fafb, #eff6ff)',
                  padding: '32px 24px', borderBottom: '1px solid #e5e7eb',
                  display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16,
                }}>
                  {/* 2nd place */}
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: 160 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🥈</div>
                    <div style={{
                      background: '#fff', borderRadius: 12, padding: '16px 12px',
                      border: '2px solid #e5e7eb', marginBottom: 8,
                      height: 100, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 36 }}>👤</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
                      {leaderboard[1]?.username}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{leaderboard[1]?.score} pts</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{leaderboard[1]?.average}% avg</div>
                  </div>

                  {/* 1st place */}
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: 180 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🥇</div>
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      borderRadius: 12, padding: '16px 12px',
                      border: '2px solid #f59e0b', marginBottom: 8,
                      height: 120, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 44 }}>👑</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>
                      {leaderboard[0]?.username}
                    </div>
                    <div style={{ fontSize: 13, color: '#d97706', fontWeight: 700 }}>
                      {leaderboard[0]?.score} pts
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{leaderboard[0]?.average}% avg</div>
                  </div>

                  {/* 3rd place */}
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: 160 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🥉</div>
                    <div style={{
                      background: '#fff', borderRadius: 12, padding: '16px 12px',
                      border: '2px solid #e5e7eb', marginBottom: 8,
                      height: 90, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 32 }}>👤</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
                      {leaderboard[2]?.username}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{leaderboard[2]?.score} pts</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{leaderboard[2]?.average}% avg</div>
                  </div>
                </div>
              )}

              {/* Full table */}
              {leaderboard.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No rankings yet</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    Submit and get graded assignments to appear on the leaderboard!
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      {['Rank', 'Student', 'Score', 'Average', 'Submissions', 'Badges'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((s, i) => {
                      const isMe = s.username === user?.username;
                      const rc   = rankColor(s.rank);
                      return (
                        <tr key={s._id} style={{
                          borderBottom: '1px solid #f3f4f6',
                          background: isMe ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                        }}>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              background: rc.bg, color: rc.color,
                              borderRadius: 8, padding: '3px 10px',
                              fontWeight: 700, fontSize: 13,
                            }}>
                              {rankMedal(s.rank)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: isMe ? '#2563eb' : '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700,
                                color: isMe ? '#fff' : '#374151',
                              }}>
                                {s.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: isMe ? 700 : 500, color: '#111827' }}>
                                  {s.username} {isMe && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>(You)</span>}
                                </div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 15 }}>
                              {s.score}
                            </span>
                            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>pts</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              fontWeight: 700,
                              color: s.average >= 80 ? '#16a34a' : s.average >= 60 ? '#d97706' : '#dc2626',
                            }}>
                              {s.average}%
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#374151' }}>
                            {s.submissions}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {s.badges.slice(0, 4).map(b => (
                                <span key={b.id} title={b.name} style={{ fontSize: 18, cursor: 'default' }}>
                                  {b.icon}
                                </span>
                              ))}
                              {s.badges.length > 4 && (
                                <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
                                  +{s.badges.length - 4}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          ) : (

            /* ── BADGES TAB ── */
            <div>
              {/* Progress */}
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '20px 24px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      Badge Progress
                    </span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                      {badges.earned.length} / {badges.earned.length + badges.locked.length} earned
                    </span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: 8, height: 10 }}>
                    <div style={{
                      width: `${badges.earned.length + badges.locked.length > 0
                        ? (badges.earned.length / (badges.earned.length + badges.locked.length)) * 100
                        : 0}%`,
                      background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                      borderRadius: 8, height: 10, transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
                  border: '2px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: '#2563eb',
                }}>
                  {badges.earned.length}
                </div>
              </div>

              {/* Earned badges */}
              {badges.earned.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
                    🎖️ Earned Badges ({badges.earned.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {badges.earned.map(b => (
                      <div key={b.id} style={{
                        background: b.bg, border: `2px solid ${b.color}30`,
                        borderRadius: 12, padding: '20px 16px', textAlign: 'center',
                        boxShadow: `0 4px 12px ${b.color}20`,
                        transition: 'transform 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{b.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: b.color, marginBottom: 4 }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                          {b.description}
                        </div>
                        <div style={{
                          marginTop: 8, fontSize: 10, fontWeight: 700,
                          color: b.color, background: `${b.color}15`,
                          borderRadius: 20, padding: '2px 8px', display: 'inline-block',
                        }}>
                          ✓ EARNED
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked badges */}
              {badges.locked.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
                    🔒 Locked Badges ({badges.locked.length})
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {badges.locked.map(b => (
                      <div key={b.id} style={{
                        background: '#f9fafb', border: '2px solid #e5e7eb',
                        borderRadius: 12, padding: '20px 16px', textAlign: 'center',
                        opacity: 0.7,
                      }}>
                        <div style={{ fontSize: 36, marginBottom: 8, filter: 'grayscale(1)' }}>
                          {b.icon}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                          {b.description}
                        </div>
                        <div style={{
                          marginTop: 8, fontSize: 10, fontWeight: 700,
                          color: '#9ca3af', background: '#e5e7eb',
                          borderRadius: 20, padding: '2px 8px', display: 'inline-block',
                        }}>
                          🔒 LOCKED
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {badges.earned.length === 0 && badges.locked.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎖️</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No badges yet</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    Submit assignments to start earning badges!
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </StudentLayout>
  );
}