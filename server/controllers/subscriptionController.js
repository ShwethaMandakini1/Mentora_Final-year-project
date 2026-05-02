const User = require('../models/User');

// ── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = {
  free: {
    name:             'Free',
    price:            0,
    submissionsLimit: 10,
    features: [
      '10 submissions per month',
      'Standard AI feedback',
      'Assignment viewing',
      'Grade reports',
      'Basic analytics',
      'Email notifications',
    ],
    notAllowed: [
      'Pre-approval workflow',
      'Priority lecturer review',
      'Deadline reminders',
      'Plagiarism checker',
      'Leaderboard & badges',
    ],
  },
  pro: {
    name:             'Pro',
    price:            4.99,
    submissionsLimit: 999,
    features: [
      'Unlimited submissions',
      'Advanced AI feedback & analysis',
      'Pre-approval workflow',
      'Priority lecturer review',
      'Deadline reminders via email',
      'Detailed grade analytics',
      'Plagiarism checker',
      'Full reports history',
    ],
    notAllowed: [
      'Institution leaderboard',
      'Badges & gamification',
    ],
  },
  institution: {
    name:             'Institution',
    price:            9.99,
    submissionsLimit: 999,
    features: [
      'Everything in Pro',
      'Institution leaderboard',
      'Badges & gamification',
      'Advanced analytics dashboard',
      'Batch submission support',
      'Priority support',
      'Custom branding',
    ],
    notAllowed: [],
  },
};

// ── GET current subscription ──────────────────────────────────────────────────
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription email username');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const plan = user.subscription?.plan || 'free';
    const planInfo = PLANS[plan];

    res.json({
      success: true,
      subscription: {
        ...user.subscription.toObject(),
        planInfo,
        allPlans: PLANS,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPGRADE / CHANGE plan ─────────────────────────────────────────────────────
exports.upgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'pro', 'institution'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const planInfo = PLANS[plan];
    const endDate  = plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'subscription.plan':             plan,
        'subscription.status':           'active',
        'subscription.startDate':        new Date(),
        'subscription.endDate':          endDate,
        'subscription.submissionsLimit': planInfo.submissionsLimit,
        'subscription.submissionsUsed':  0,
      },
      { new: true }
    ).select('subscription username email');

    res.json({
      success: true,
      message: `Successfully upgraded to ${planInfo.name} plan!`,
      subscription: user.subscription,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CANCEL subscription ───────────────────────────────────────────────────────
exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'subscription.plan':             'free',
        'subscription.status':           'active',
        'subscription.endDate':          null,
        'subscription.submissionsLimit': 10,
        'subscription.submissionsUsed':  0,
      },
      { new: true }
    ).select('subscription');

    res.json({
      success: true,
      message: 'Subscription cancelled. You are now on the Free plan.',
      subscription: user.subscription,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET all plans (public) ────────────────────────────────────────────────────
exports.getPlans = async (req, res) => {
  res.json({ success: true, plans: PLANS });
};