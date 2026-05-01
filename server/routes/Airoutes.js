const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getAIInsights, generateMarkingFeedback } = require('../controllers/Aicontroller');

router.post('/insights',          protect, getAIInsights);
router.post('/marking-feedback',  protect, generateMarkingFeedback);  // ← NEW

module.exports = router;