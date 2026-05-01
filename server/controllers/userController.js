const User = require('../models/User');
const path = require('path');
const fs   = require('fs');

// GET profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['username', 'email', 'studentId', 'dateOfBirth', 'degree', 'department', 'staffId'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all students (lecturer only)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPLOAD profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Delete old picture if exists
    const existingUser = await User.findById(req.user._id);
    if (existingUser.profilePicture) {
      const oldPath = path.join(__dirname, '..', existingUser.profilePicture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const profilePicture = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true }
    ).select('-password');

    res.json({ success: true, profilePicture: user.profilePicture, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REMOVE profile picture
exports.removeProfilePicture = async (req, res) => {
  try {
    const existingUser = await User.findById(req.user._id);
    if (existingUser.profilePicture) {
      const oldPath = path.join(__dirname, '..', existingUser.profilePicture);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: null },
      { new: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};