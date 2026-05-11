const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSubscription,
  upgradePlan,
  cancelSubscription,
  getPlans,
  checkLimit,
} = require('../controllers/subscriptionController');

router.get('/plans',        getPlans);
router.get('/',             protect, getSubscription);
router.get('/check-limit',  protect, checkLimit);
router.post('/upgrade',     protect, upgradePlan);
router.post('/cancel',      protect, cancelSubscription);

module.exports = router;