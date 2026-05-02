const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSubscription,
  upgradePlan,
  cancelSubscription,
  getPlans,
} = require('../controllers/subscriptionController');

router.get('/plans',   getPlans);
router.get('/',        protect, getSubscription);
router.post('/upgrade', protect, upgradePlan);
router.post('/cancel',  protect, cancelSubscription);

module.exports = router;