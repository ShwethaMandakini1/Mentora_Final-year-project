const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    {
    type: String,
    enum: ['new_assignment', 'marks_received', 'regrade_accepted', 'deadline_reminder'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  meta:    { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);