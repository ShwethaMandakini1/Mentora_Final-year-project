const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLeaderboard,
  getMyBadges,
} = require('../controllers/leaderboardController');

// GET /leaderboard         → full ranked leaderboard
// GET /leaderboard/badges  → current user's earned + locked badges
router.get('/',       protect, getLeaderboard);
router.get('/badges', protect, getMyBadges);

module.exports = router;