const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getLeaderboard, getMyBadges } = require('../controllers/leaderboardController');

router.get('/',       protect, getLeaderboard);
router.get('/badges', protect, getMyBadges);

module.exports = router;