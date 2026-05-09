const Notification = require('../models/Notification');
const User         = require('../models/User');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/all
exports.deleteAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/notifications/:id
exports.deleteOne = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN: POST /api/notifications/admin/broadcast
// Body: { title, message, targetRole }
//   targetRole: 'all' | 'lecturer' | 'student'  (default: 'all')
exports.adminBroadcast = async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });

    const { title, message, targetRole = 'all' } = req.body;
    if (!title || !message)
      return res.status(400).json({ success: false, message: 'title and message are required' });

    const query = targetRole === 'all' ? {} : { role: targetRole };
    const users = await User.find(query).select('_id');

    const docs = users.map(u => ({
      userId:  u._id,
      type:    'admin_message',
      title,
      message,
      read:    false,
      meta:    { sentBy: req.user._id, targetRole },
    }));

    await Notification.insertMany(docs);
    res.json({ success: true, sent: docs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};