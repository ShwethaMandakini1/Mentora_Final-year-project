const Notification = require('../models/Notification');

/**
 * Create a notification for a user.
 * Silently swallows errors so it never breaks the main flow.
 */
const createNotification = async ({ userId, type, title, message, meta = {} }) => {
  try {
    await Notification.create({ userId, type, title, message, meta });
  } catch (err) {
    console.error('⚠️  Failed to create notification:', err.message);
  }
};

module.exports = { createNotification };