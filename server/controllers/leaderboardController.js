const Submission = require('../models/Submission');
const User       = require('../models/User');

// ── Badge definitions ─────────────────────────────────────────────────────────
const BADGE_DEFINITIONS = [
  {
    id:          'first_submission',
    name:        'First Step',
    icon:        '🎯',
    description: 'Submit your first assignment',
    color:       '#0096C7',
    bg:          '#E0F2FE',
    check:       (stats) => stats.totalSubmissions >= 1,
  },
  {
    id:          'five_submissions',
    name:        'Getting Started',
    icon:        '📚',
    description: 'Submit 5 assignments',
    color:       '#7c3aed',
    bg:          '#f3e8ff',
    check:       (stats) => stats.totalSubmissions >= 5,
  },
  {
    id:          'ten_submissions',
    name:        'Dedicated',
    icon:        '🏆',
    description: 'Submit 10 assignments',
    color:       '#d97706',
    bg:          '#fef3c7',
    check:       (stats) => stats.totalSubmissions >= 10,
  },
  {
    id:          'high_achiever',
    name:        'High Achiever',
    icon:        '⭐',
    description: 'Achieve an average score of 80% or above',
    color:       '#16a34a',
    bg:          '#dcfce7',
    check:       (stats) => stats.average >= 80 && stats.gradedCount >= 1,
  },
  {
    id:          'perfect_score',
    name:        'Perfectionist',
    icon:        '💯',
    description: 'Score 100% on any assignment',
    color:       '#dc2626',
    bg:          '#fee2e2',
    check:       (stats) => stats.maxScore >= 100,
  },
  {
    id:          'consistent',
    name:        'Consistent',
    icon:        '🎖️',
    description: 'Score above 70% on 3 or more assignments',
    color:       '#0369a1',
    bg:          '#e0f2fe',
    check:       (stats) => stats.above70Count >= 3,
  },
  {
    id:          'top_10',
    name:        'Top 10',
    icon:        '🥇',
    description: 'Reach the top 10 on the leaderboard',
    color:       '#d97706',
    bg:          '#fef3c7',
    check:       (stats) => stats.rank > 0 && stats.rank <= 10,
  },
  {
    id:          'top_3',
    name:        'Podium',
    icon:        '🏅',
    description: 'Reach the top 3 on the leaderboard',
    color:       '#b45309',
    bg:          '#fef9c3',
    check:       (stats) => stats.rank > 0 && stats.rank <= 3,
  },
];

// ── Build leaderboard entry for a student ────────────────────────────────────
const buildStudentStats = (userId, username, studentId, submissions) => {
  const graded = submissions.filter(s =>
    s.student?.toString() === userId?.toString() &&
    s.status === 'Graded' &&
    s.published === true
  );

  const totalSubmissions = submissions.filter(
    s => s.student?.toString() === userId?.toString()
  ).length;

  const scores    = graded.map(s => Number(s.score) || 0);
  const average   = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const maxScore  = scores.length > 0 ? Math.max(...scores) : 0;

  // Score = weighted: 60% average + 40% total graded (capped at 20 subs → 100)
  const submissionBonus = Math.min(graded.length * 5, 40);
  const score           = Math.round(average * 0.6 + submissionBonus);

  const above70Count = scores.filter(s => s >= 70).length;

  return {
    userId,
    username,
    studentId,
    submissions:  totalSubmissions,
    gradedCount:  graded.length,
    average,
    score,
    maxScore,
    above70Count,
    rank: 0,   // filled in after sorting
  };
};

// ── GET leaderboard ───────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    // Get all students
    const students    = await User.find({ role: 'student' }).select('username studentId _id');
    // Get all graded+published submissions
    const submissions = await Submission.find({ status: 'Graded', published: true }).lean();

    const entries = students
      .map(s => buildStudentStats(s._id, s.username, s.studentId, submissions))
      .filter(e => e.gradedCount > 0)   // Only students with at least 1 graded submission
      .sort((a, b) => b.score - a.score || b.average - a.average);

    // Assign ranks
    entries.forEach((e, i) => { e.rank = i + 1; });

    // Attach badges (top-level icons only for the table)
    const leaderboard = entries.map(e => ({
      _id:         e.userId,
      username:    e.username,
      studentId:   e.studentId,
      rank:        e.rank,
      score:       e.score,
      average:     e.average,
      submissions: e.submissions,
      badges:      BADGE_DEFINITIONS
        .filter(b => b.check(e))
        .map(b => ({ id: b.id, name: b.name, icon: b.icon })),
    }));

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('LEADERBOARD ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET my badges ─────────────────────────────────────────────────────────────
exports.getMyBadges = async (req, res) => {
  try {
    const submissions = await Submission.find({ status: 'Graded', published: true }).lean();
    const allStudents = await User.find({ role: 'student' }).select('username studentId _id');
    const me          = allStudents.find(s => s._id.toString() === req.user._id.toString());

    if (!me) return res.status(404).json({ success: false, message: 'Student not found' });

    // Build all entries to determine rank
    const entries = allStudents
      .map(s => buildStudentStats(s._id, s.username, s.studentId, submissions))
      .filter(e => e.gradedCount > 0)
      .sort((a, b) => b.score - a.score || b.average - a.average);
    entries.forEach((e, i) => { e.rank = i + 1; });

    const myStats = entries.find(e => e.userId.toString() === req.user._id.toString())
      || buildStudentStats(me._id, me.username, me.studentId, []);

    const earned = BADGE_DEFINITIONS.filter(b => b.check(myStats));
    const locked = BADGE_DEFINITIONS.filter(b => !b.check(myStats));

    res.json({
      success:     true,
      earned:      earned.map(b => ({ id: b.id, name: b.name, icon: b.icon, description: b.description, color: b.color, bg: b.bg })),
      locked:      locked.map(b => ({ id: b.id, name: b.name, icon: b.icon, description: b.description, color: b.color, bg: b.bg })),
      myRank:      myStats.rank || null,
      totalRanked: entries.length,
    });
  } catch (err) {
    console.error('BADGES ERROR:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};