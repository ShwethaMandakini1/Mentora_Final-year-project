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

  useEffect(() => { fetchAll(); }, []);

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const myEntry = leaderboard.find(s => s.username === user?.username);

  const rankMedal = (rank) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `#${rank}`;
  };

  const rankColor = (rank) => {
    if (rank === 1) return { color: '#d97706', bg: 'rgba(217,119,6,0.10)' };
    if (rank === 2) return { color: '#6b7280', bg: 'rgba(107,114,128,0.10)' };
    if (rank === 3) return { color: '#b45309', bg: 'rgba(180,83,9,0.08)' };
    return { color: 'var(--text-sec)', bg: 'transparent' };
  };

  return (
    <StudentLayout>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>Leaderboard &amp; Badges</h1>
          <p>See how you rank among your peers and earn badges for your achievements</p>
        </div>
      </div>

      <div className="page-content">

        {/* My rank banner */}
        {myRank && (
          <div style={{
            background: 'linear-gradient(135deg, var(--navy), var(--ocean))',
            borderRadius: 'var(--radius-xl)', padding: '20px 28px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800,
              }}>
                #{myRank}
              </div>
              <div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 2 }}>Your Current Rank</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>
                  #{myRank} <span style={{ fontSize: 14, opacity: 0.75 }}>of {totalRanked} students</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { val: `${myEntry?.average || 0}%`, label: 'Average Score' },
                { val: badges.earned.length, label: 'Badges Earned' },
                { val: myEntry?.submissions || 0, label: 'Submissions' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{s.val}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tab-bar">
          {[['leaderboard', 'Leaderboard'], ['badges', 'My Badges']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`tab${tab === t ? ' active' : ''}`}
              style={{ background: 'none', border: 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 28, height: 28, border: '3px solid rgba(0,150,199,0.15)', borderTopColor: 'var(--sky)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Loading leaderboard…
          </div>
        ) : (

          tab === 'leaderboard' ? (

            /* ── LEADERBOARD TAB ── */
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Top 3 podium */}
              {leaderboard.length >= 3 && (
                <div style={{
                  background: 'linear-gradient(135deg, var(--foam), rgba(0,150,199,0.06))',
                  padding: '32px 24px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16,
                }}>
                  {/* 2nd place */}
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: 160 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>2nd</div>
                    <div style={{
                      background: 'white', borderRadius: 'var(--radius-md)', padding: '16px 12px',
                      border: '1.5px solid var(--border)', marginBottom: 8,
                      height: 90, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(107,114,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-sec)' }}>
                        {leaderboard[1]?.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-sec)' }}>{leaderboard[1]?.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{leaderboard[1]?.score} pts</div>
                  </div>

                  {/* 1st place */}
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>1st</div>
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      borderRadius: 'var(--radius-md)', padding: '16px 12px',
                      border: '2px solid #f59e0b', marginBottom: 8,
                      height: 110, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16 }}>
                        {leaderboard[0]?.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>{leaderboard[0]?.username}</div>
                    <div style={{ fontSize: 13, color: '#d97706', fontWeight: 700 }}>{leaderboard[0]?.score} pts</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{leaderboard[0]?.average}% avg</div>
                  </div>

                  {/* 3rd place */}
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: 160 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginBottom: 6 }}>3rd</div>
                    <div style={{
                      background: 'white', borderRadius: 'var(--radius-md)', padding: '16px 12px',
                      border: '1.5px solid var(--border)', marginBottom: 8,
                      height: 80, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(180,83,9,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#b45309' }}>
                        {leaderboard[2]?.username?.[0]?.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-sec)' }}>{leaderboard[2]?.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{leaderboard[2]?.score} pts</div>
                  </div>
                </div>
              )}

              {/* Full table */}
              {leaderboard.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)' }}>No rankings yet</div>
                  <div style={{ fontSize: 13 }}>Submit and get graded assignments to appear on the leaderboard!</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Rank</th><th>Student</th><th>Score</th><th>Average</th><th>Submissions</th><th>Badges</th></tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((s, i) => {
                      const isMe = s.username === user?.username;
                      const rc   = rankColor(s.rank);
                      return (
                        <tr key={s._id} style={{ background: isMe ? 'rgba(0,150,199,0.04)' : 'transparent' }}>
                          <td>
                            <span style={{
                              background: rc.bg, color: rc.color,
                              borderRadius: 8, padding: '3px 10px',
                              fontWeight: 700, fontSize: 12,
                            }}>
                              {rankMedal(s.rank)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: isMe ? 'var(--sky)' : 'rgba(0,150,199,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700,
                                color: isMe ? '#fff' : 'var(--ocean)',
                              }}>
                                {s.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: isMe ? 700 : 500, color: 'var(--navy)', fontSize: 13 }}>
                                  {s.username} {isMe && <span style={{ fontSize: 11, color: 'var(--sky)', fontWeight: 700 }}>(You)</span>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: 'var(--sky)', fontSize: 14 }}>{s.score}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>pts</span>
                          </td>
                          <td>
                            <span style={{
                              fontWeight: 700,
                              color: s.average >= 80 ? '#16a34a' : s.average >= 60 ? '#d97706' : '#dc2626',
                            }}>
                              {s.average}%
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-sec)' }}>{s.submissions}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {s.badges.slice(0, 4).map(b => (
                                <span key={b.id} title={b.name}
                                  style={{ fontSize: 14, cursor: 'default', opacity: 0.85 }}>
                                  {b.icon}
                                </span>
                              ))}
                              {s.badges.length > 4 && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
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
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Badge Progress</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {badges.earned.length} / {badges.earned.length + badges.locked.length} earned
                    </span>
                  </div>
                  <div className="prog-wrap" style={{ height: 10 }}>
                    <div className="prog-fill" style={{
                      width: `${badges.earned.length + badges.locked.length > 0
                        ? (badges.earned.length / (badges.earned.length + badges.locked.length)) * 100
                        : 0}%`,
                    }} />
                  </div>
                </div>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--foam), rgba(0,150,199,0.12))',
                  border: '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 800, color: 'var(--sky)',
                }}>
                  {badges.earned.length}
                </div>
              </div>

              {/* Earned badges */}
              {badges.earned.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 14, marginTop: 16 }}>
                    Earned Badges ({badges.earned.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {badges.earned.map(b => (
                      <div key={b.id} style={{
                        background: b.bg, border: `1.5px solid ${b.color}30`,
                        borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center',
                        boxShadow: `0 4px 12px ${b.color}18`,
                        transition: 'transform 0.2s', cursor: 'default',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{b.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: b.color, marginBottom: 4 }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{b.description}</div>
                        <div style={{
                          marginTop: 8, fontSize: 10, fontWeight: 700, color: b.color,
                          background: `${b.color}15`, borderRadius: 20, padding: '2px 8px', display: 'inline-block',
                        }}>
                          EARNED
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked badges */}
              {badges.locked.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 14 }}>
                    Locked Badges ({badges.locked.length})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {badges.locked.map(b => (
                      <div key={b.id} style={{
                        background: 'white', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-lg)', padding: '20px 16px', textAlign: 'center',
                        opacity: 0.6,
                      }}>
                        <div style={{ fontSize: 32, marginBottom: 8, filter: 'grayscale(1)' }}>{b.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{b.description}</div>
                        <div style={{
                          marginTop: 8, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
                          background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '2px 8px', display: 'inline-block',
                        }}>
                          LOCKED
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {badges.earned.length === 0 && badges.locked.length === 0 && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)' }}>No badges yet</div>
                  <div style={{ fontSize: 13 }}>Submit assignments to start earning badges!</div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </StudentLayout>
  );
}