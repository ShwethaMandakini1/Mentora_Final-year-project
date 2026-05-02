const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username:  { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['student', 'lecturer'], default: 'student' },
  profilePicture: { type: String, default: null },

  // Student fields
  studentId:   { type: String, default: '' },
  batchYear:   { type: String, default: '' },
  degree:      { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },

  // Lecturer fields
  department: { type: String, default: '' },
  staffId:    { type: String, default: '' },

  // Password reset
  resetPasswordOTP:    { type: String },
  resetPasswordExpire: { type: Date },

  // ── Subscription ───────────────────────────────────────────────────────────
  subscription: {
    plan:        { type: String, enum: ['free', 'pro', 'institution'], default: 'free' },
    status:      { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    startDate:   { type: Date, default: Date.now },
    endDate:     { type: Date, default: null },
    submissionsUsed:  { type: Number, default: 0 },
    submissionsLimit: { type: Number, default: 10 },
  },

}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
UserSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);