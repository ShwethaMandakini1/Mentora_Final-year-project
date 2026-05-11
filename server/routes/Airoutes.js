const express     = require('express');
const router      = express.Router();
const aiCtrl      = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// POST /api/ai/insights
router.post('/insights', protect, aiCtrl.getInsights);

module.exports = router;