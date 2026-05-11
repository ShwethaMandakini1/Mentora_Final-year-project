const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// AUTH: Admin login
// Returns JWT token if credentials are valid
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await admin.comparePassword(password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, type: 'admin', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS: Get platform dashboard statistics
// Cached for 10 minutes to reduce database load
// Shows: user counts, subscriptions, submissions, assignments, performance
// ─────────────────────────────────────────────────────────────────────────────
let statsCache = null;
let statsCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;  // 10 minutes

exports.getStats = async (req, res) => {
  try {
    const now = Date.now();

    // Return cached stats if less than 10 minutes old
    if (statsCache && now - statsCacheTime < CACHE_TTL) {
      return res.json({ stats: statsCache, cached: true });
    }

    // Fetch fresh user counts
    const [totalUsers, students, lecturers, admins, newThisWeek] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'lecturer' }),
      Admin.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Fetch subscription breakdown (Free/Pro/Institution)
    const [freeSubs, proSubs, institutionSubs] = await Promise.all([
      User.countDocuments({
        role: 'student',
        'subscription.plan': { $in: ['free', null, undefined] },
      }),
      User.countDocuments({ role: 'student', 'subscription.plan': 'pro' }),
      User.countDocuments({ role: 'student', 'subscription.plan': 'institution' }),
    ]);

    // Submission stats (optional — only fetched if Submission model exists)
    let submissionStats = {
      total: 0,
      graded: 0,
      pending: 0,
      pendingApprovals: 0,
    };

    let assignmentStats = { total: 0 };
    let performanceStats = { avgScore: 0 };

    try {
      const Submission = require('../models/Submission');

      const [totalSubs, gradedSubs, pendingSubs] = await Promise.all([
        Submission.countDocuments(),
        Submission.countDocuments({ status: 'graded' }),
        Submission.countDocuments({ status: 'pending' }),
      ]);

      submissionStats = {
        total: totalSubs,
        graded: gradedSubs,
        pending: pendingSubs,
        pendingApprovals: 0,  // Not used in admin dashboard anymore
      };

      // Compute average score across all graded submissions
      const graded = await Submission.find({
        score: { $exists: true, $ne: null },
      }).select('score');

      if (graded.length > 0) {
        const avg = graded.reduce((sum, s) => sum + (s.score || 0), 0) / graded.length;
        performanceStats.avgScore = Math.round(avg);
      }
    } catch (_) {
      // Submission model doesn't exist — skip
    }

    // Assignment count (optional — only fetched if Assignment model exists)
    try {
      const Assignment = require('../models/Assignment');
      assignmentStats.total = await Assignment.countDocuments();
    } catch (_) {
      // Assignment model doesn't exist — skip
    }

    // Build and cache the stats object
    statsCache = {
      users: {
        total: totalUsers,
        students,
        lecturers,
        admins,
        newThisWeek,
      },
      subscriptions: {
        free: freeSubs,
        pro: proSubs,
        institution: institutionSubs,
      },
      submissions: submissionStats,
      assignments: assignmentStats,
      performance: performanceStats,
    };

    statsCacheTime = now;

    res.json({ stats: statsCache, cached: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS: Force refresh (clear cache)
// POST /admin/stats/refresh
// ─────────────────────────────────────────────────────────────────────────────
exports.refreshStats = async (req, res) => {
  statsCache = null;
  statsCacheTime = 0;
  res.json({ message: 'Cache cleared' });
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS: Get all users with search/filter/pagination
// Supports filtering by role (student/lecturer) and search by username/email
// ─────────────────────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 15 } = req.query;

    const query = {};

    if (role) query.role = role;

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// USERS: Update a user's subscription plan
// PUT /admin/users/:userId/subscription
// Body: { plan: 'free' | 'pro' | 'institution' }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    if (!['free', 'pro', 'institution'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    await User.findByIdAndUpdate(userId, {
      'subscription.plan': plan,
    });

    res.json({ message: 'Subscription updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS: Delete a user
// DELETE /admin/users/:userId
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURERS: Get all lecturers with search/pagination
// GET /admin/lecturers
// ─────────────────────────────────────────────────────────────────────────────
exports.getLecturers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 15 } = req.query;

    const query = { role: 'lecturer' };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [lecturers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({ lecturers, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURERS: Delete a lecturer
// DELETE /admin/lecturers/:lecturerId
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteLecturer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.lecturerId);
    res.json({ message: 'Lecturer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS: Get users by subscription plan with search/pagination
// GET /admin/subscriptions?plan=pro&search=john
// ─────────────────────────────────────────────────────────────────────────────
exports.getSubscriptions = async (req, res) => {
  try {
    const { plan = '', search = '', page = 1, limit = 15 } = req.query;

    const query = { role: 'student' };

    if (plan) query['subscription.plan'] = plan;

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT: Get all admins
// GET /admin/admins
// ─────────────────────────────────────────────────────────────────────────────
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT: Create a new admin
// POST /admin/admins
// Body: { username, email, password, name, isSuperAdmin }
// ─────────────────────────────────────────────────────────────────────────────
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, name, isSuperAdmin } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const exists = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    if (exists) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }

    const admin = await Admin.create({
      username,
      email,
      password,
      name,
      isSuperAdmin: isSuperAdmin || false,
      createdBy: req.admin?._id,
    });

    res.status(201).json({
      message: 'Admin created',
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT: Delete an admin
// DELETE /admin/admins/:adminId
// Guards against self-deletion
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (adminId === req.admin._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await Admin.findByIdAndDelete(adminId);

    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BROADCAST: Send a notification to selected user group
//
// POST /admin/broadcast
// Body: {
//   recipient: 'all' | 'students' | 'lecturers',
//   title: string,
//   message: string
// }
//
// Creates a notification for each user in the selected group
// ─────────────────────────────────────────────────────────────────────────────
exports.sendBroadcast = async (req, res) => {
  try {
    const { recipient, title, message } = req.body;

    // Validate inputs
    if (!['all', 'students', 'lecturers'].includes(recipient)) {
      return res.status(400).json({ message: 'Invalid recipient type. Must be "all", "students", or "lecturers".' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    // Build query to fetch the target users
    const query = {};
    if (recipient === 'students')  query.role = 'student';
    if (recipient === 'lecturers') query.role = 'lecturer';
    // If recipient === 'all', query stays empty (all users)

    // Fetch all users matching the query
    const users = await User.find(query).select('_id');

    if (users.length === 0) {
      return res.status(400).json({ message: 'No users found in the selected group.' });
    }

    // Create a notification for each user
    const notificationPromises = users.map(user =>
      createNotification({
        userId:  user._id,
        type:    'admin_broadcast',
        title:   title.trim(),
        message: message.trim(),
        meta:    { sentBy: req.admin?.username || 'Admin', sentAt: new Date() },
      })
    );

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: `Broadcast sent to ${users.length} user${users.length !== 1 ? 's' : ''}.`,
      count: users.length,
    });
  } catch (err) {
    console.error('BROADCAST ERROR:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};