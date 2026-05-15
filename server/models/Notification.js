const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    {
    type: String,
    enum: [
      // ── Student-facing ──────────────────────────────
      'marks_received',       // lecturer published marks
      'regrade_accepted',     // lecturer accepted regrade
      'submission_approved',  // lecturer approved submission
      'submission_rejected',  // lecturer rejected submission
      'new_assignment',       // new assignment posted

      // ── Lecturer-facing ─────────────────────────────
      'approval_requested',   // student submitted for review
      'regrade_requested',    // student requested a regrade

      // ── Both (admin → anyone) ───────────────────────
      'admin_message',        // admin broadcast / targeted message
    ],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  meta:    { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);