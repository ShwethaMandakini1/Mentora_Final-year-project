const Submission = require('../models/Submission');

// GET /submissions/all  — lecturer sees all graded submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ lecturer: req.user._id })
      .populate('student', 'username email')
      .sort({ gradedAt: -1 });

    res.json({ submissions });
  } catch (err) {
    console.error('getAllSubmissions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /analytics  — summary stats for the lecturer
exports.getAnalytics = async (req, res) => {
  try {
    const graded = await Submission.find({
      lecturer: req.user._id,
      status: 'Graded',
    }).populate('student', 'username email');

    const total   = graded.length;
    const avg     = total > 0
      ? Math.round(graded.reduce((a, s) => a + (s.score || 0), 0) / total)
      : 0;
    const highest = total > 0 ? Math.max(...graded.map(s => s.score || 0)) : 0;

    res.json({ total, avg, highest, submissions: graded });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};