const express     = require('express');
const router      = express.Router();
const aiCtrl      = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// POST /api/ai/insights
router.post('/insights',         protect, aiCtrl.getInsights);

// POST /api/ai/marking-feedback  ← was missing, caused the "not working" bug
router.post('/marking-feedback', protect, aiCtrl.markingFeedback);

module.exports = router;