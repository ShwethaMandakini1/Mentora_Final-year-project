const express = require('express');
const router  = express.Router();
const {
  getNotifications,
  markAllRead,
  markRead,
  deleteAll,
  deleteOne,
  adminBroadcast,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/',                     protect, getNotifications);
router.put('/read-all',             protect, markAllRead);
router.put('/:id/read',             protect, markRead);
router.delete('/all',               protect, deleteAll);
router.delete('/:id',               protect, deleteOne);

// Admin only — POST /api/notifications/admin/broadcast
// Body: { title, message, targetRole: 'all' | 'lecturer' | 'student' }
router.post('/admin/broadcast',     protect, adminBroadcast);

module.exports = router;