const jwt    = require('jsonwebtoken');
const Admin  = require('../models/Admin');
const User   = require('../models/User');

// ─── Auth ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin._id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        id:           admin._id,
        username:     admin.username,
        name:         admin.name,
        email:        admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Stats ───────────────────────────────────────────────────────────────────

let statsCache = null;
let statsCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

exports.getStats = async (req, res) => {
  try {
    const now = Date.now();
    if (statsCache && now - statsCacheTime < CACHE_TTL)
      return res.json({ stats: statsCache, cached: true });

    const [totalUsers, students, lecturers, admins, newThisWeek] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'lecturer' }),
      Admin.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    // subscription breakdown (students only)
    const [freeSubs, proSubs, institutionSubs] = await Promise.all([
      User.countDocuments({ role: 'student', 'subscription.plan': { $in: ['free', null, undefined] } }),
      User.countDocuments({ role: 'student', 'subscription.plan': 'pro' }),
      User.countDocuments({ role: 'student', 'subscription.plan': 'institution' }),
    ]);

    // try to get submission stats if model exists
    let submissionStats = { total: 0, graded: 0, pending: 0, pendingApprovals: 0 };
    let assignmentStats = { total: 0 };
    let performanceStats = { avgScore: 0 };
    try {
      const Submission = require('../models/Submission');
      const [totalSubs, gradedSubs, pendingSubs] = await Promise.all([
        Submission.countDocuments(),
        Submission.countDocuments({ status: 'graded' }),
        Submission.countDocuments({ status: 'pending' }),
      ]);
      submissionStats = { total: totalSubs, graded: gradedSubs, pending: pendingSubs, pendingApprovals: 0 };

      const graded = await Submission.find({ score: { $exists: true, $ne: null } }).select('score');
      if (graded.length > 0) {
        const avg = graded.reduce((sum, s) => sum + (s.score || 0), 0) / graded.length;
        performanceStats.avgScore = Math.round(avg);
      }
    } catch (_) {}

    try {
      const Assignment = require('../models/Assignment');
      assignmentStats.total = await Assignment.countDocuments();
    } catch (_) {}

    statsCache = {
      users:         { total: totalUsers, students, lecturers, admins, newThisWeek },
      subscriptions: { free: freeSubs, pro: proSubs, institution: institutionSubs },
      submissions:   submissionStats,
      assignments:   assignmentStats,
      performance:   performanceStats,
    };
    statsCacheTime = now;

    res.json({ stats: statsCache, cached: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.refreshStats = async (req, res) => {
  statsCache = null;
  statsCacheTime = 0;
  res.json({ message: 'Cache cleared' });
};

// ─── Users ───────────────────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 15 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan }   = req.body;

    if (!['free', 'pro', 'institution'].includes(plan))
      return res.status(400).json({ message: 'Invalid plan' });

    await User.findByIdAndUpdate(userId, { 'subscription.plan': plan });
    res.json({ message: 'Subscription updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Lecturers ───────────────────────────────────────────────────────────────

exports.getLecturers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 15 } = req.query;
    const query = { role: 'lecturer' };
    if (search) query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];

    const [lecturers, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ lecturers, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteLecturer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.lecturerId);
    res.json({ message: 'Lecturer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

exports.getSubscriptions = async (req, res) => {
  try {
    const { plan = '', search = '', page = 1, limit = 15 } = req.query;
    const query = { role: 'student' };
    if (plan) query['subscription.plan'] = plan;
    if (search) query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Admin Management ────────────────────────────────────────────────────────

exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, name, isSuperAdmin } = req.body;
    if (!username || !email || !password || !name)
      return res.status(400).json({ message: 'All fields required' });

    const exists = await Admin.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: 'Username or email already taken' });

    const admin = await Admin.create({
      username, email, password, name,
      isSuperAdmin: isSuperAdmin || false,
      createdBy: req.admin._id,
    });

    res.status(201).json({ message: 'Admin created', admin: { id: admin._id, username: admin.username, name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (adminId === req.admin._id.toString())
      return res.status(400).json({ message: 'Cannot delete yourself' });

    await Admin.findByIdAndDelete(adminId);
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};