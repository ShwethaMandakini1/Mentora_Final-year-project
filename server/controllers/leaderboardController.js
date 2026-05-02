const Submission = require('../models/Submission');
const User       = require('../models/User');

// ── Badge definitions ─────────────────────────────────────────────────────────
const BADGES = [
  {
    id:          'first_submission',
    name:        'First Step',
    description: 'Submitted your first assignment',
    icon:        '🎯',
    color:       '#2563eb',
    bg:          '#eff6ff',
    check:       (subs) => subs.length >= 1,
  },
  {
    id:          'high_achiever',
    name:        'High Achiever',
    description: 'Scored 90% or above on an assignment',
    icon:        '⭐',
    color:       '#d97706',
    bg:          '#fef3c7',
    check:       (subs) => subs.some(s => (s.score || 0) >= 90),
  },
  {
    id:          'perfect_score',
    name:        'Perfect Score',
    description: 'Achieved 100% on an assignment',
    icon:        '💎',
    color:       '#7c3aed',
    bg:          '#f5f3ff',
    check:       (subs) => subs.some(s => (s.score || 0) >= 100),
  },
  {
    id:          'consistent_learner',
    name:        'Consistent Learner',
    description: 'Submitted 5 or more assignments',
    icon:        '📚',
    color:       '#16a34a',
    bg:          '#dcfce7',
    check:       (subs) => subs.length >= 5,
  },
  {
    id:          'dedicated_student',
    name:        'Dedicated Student',
    description: 'Submitted 10 or more assignments',
    icon:        '🏆',
    color:       '#dc2626',
    bg:          '#fef2f2',
    check:       (subs) => subs.length >= 10,
  },
  {
    id:          'above_average',
    name:        'Above Average',
    description: 'Maintained an average score above 75%',
    icon:        '📈',
    color:       '#0891b2',
    bg:          '#ecfeff',
    check:       (subs) => {
      const graded = subs.filter(s => s.status === 'Graded');
      if (graded.length < 2) return false;
      const avg = graded.reduce((a, s) => a + (s.score || 0), 0) / graded.length;
      return avg >= 75;
    },
  },
  {
    id:          'multi_module',
    name:        'Well Rounded',
    description: 'Submitted assignments in 3 or more modules',
    icon:        '🌟',
    color:       '#be185d',
    bg:          '#fdf2f8',
    check:       (subs) => new Set(subs.map(s => s.moduleCode).filter(Boolean)).size >= 3,
  },
  {
    id:          'approved_master',
    name:        'Approved Master',
    description: 'Got 3 or more pre-approvals accepted',
    icon:        '✅',
    color:       '#16a34a',
    bg:          '#dcfce7',
    check:       (subs) => subs.filter(s => s.approvalStatus === 'approved').length >= 3,
  },
];

// ── Helper: calculate score for leaderboard ranking ───────────────────────────
const calcScore = (subs) => {
  const graded = subs.filter(s => s.status === 'Graded');
  if (graded.length === 0) return 0;
  const avg      = graded.reduce((a, s) => a + (s.score || 0), 0) / graded.length;
  const bonus    = subs.length * 2; // bonus points for number of submissions
  return Math.round(avg + bonus);
};

// ── GET leaderboard ───────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    // Get all students
    const students = await User.find({ role: 'student' }).select('username studentId degree');

    // Get all graded submissions
    const allSubs = await Submission.find({ status: 'Graded' })
      .select('student score grade moduleCode assignmentName status approvalStatus submittedAt');

    // Group by student
    const studentMap = {};
    students.forEach(s => {
      studentMap[s._id.toString()] = {
        _id:       s._id,
        username:  s.username,
        studentId: s.studentId || '—',
        degree:    s.degree    || '—',
        subs:      [],
      };
    });

    allSubs.forEach(sub => {
      const id = sub.student?.toString();
      if (studentMap[id]) studentMap[id].subs.push(sub);
    });

    // Build leaderboard
    const leaderboard = Object.values(studentMap)
      .map(s => {
        const graded = s.subs.filter(sub => sub.status === 'Graded');
        const avg    = graded.length > 0
          ? Math.round(graded.reduce((a, sub) => a + (sub.score || 0), 0) / graded.length)
          : 0;
        const badges = BADGES.filter(b => b.check(s.subs)).map(b => ({
          id: b.id, name: b.name, icon: b.icon, color: b.color, bg: b.bg,
        }));
        return {
          _id:         s._id,
          username:    s.username,
          studentId:   s.studentId,
          degree:      s.degree,
          score:       calcScore(s.subs),
          average:     avg,
          submissions: s.subs.length,
          graded:      graded.length,
          badges,
          badgeCount:  badges.length,
        };
      })
      .filter(s => s.submissions > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // top 20

    // Add rank
    leaderboard.forEach((s, i) => { s.rank = i + 1; });

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('LEADERBOARD ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET my badges ─────────────────────────────────────────────────────────────
exports.getMyBadges = async (req, res) => {
  try {
    const subs = await Submission.find({ student: req.user._id });

    const earned = BADGES.filter(b => b.check(subs)).map(b => ({
      id: b.id, name: b.name, description: b.description,
      icon: b.icon, color: b.color, bg: b.bg, earned: true,
    }));

    const locked = BADGES.filter(b => !b.check(subs)).map(b => ({
      id: b.id, name: b.name, description: b.description,
      icon: b.icon, color: '#9ca3af', bg: '#f3f4f6', earned: false,
    }));

    // My rank
    const students  = await User.find({ role: 'student' }).select('_id');
    const allSubs   = await Submission.find({ status: 'Graded' }).select('student score status');
    const scoreMap  = {};
    students.forEach(s => { scoreMap[s._id.toString()] = []; });
    allSubs.forEach(sub => {
      const id = sub.student?.toString();
      if (scoreMap[id] !== undefined) scoreMap[id].push(sub);
    });

    const scores = Object.entries(scoreMap)
      .map(([id, s]) => ({ id, score: calcScore(s) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    const myRank = scores.findIndex(s => s.id === req.user._id.toString()) + 1;

    res.json({
      success: true,
      earned,
      locked,
      myRank:      myRank || null,
      totalRanked: scores.length,
      totalBadges: BADGES.length,
    });
  } catch (err) {
    console.error('BADGES ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};