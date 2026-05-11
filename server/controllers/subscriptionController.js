const User       = require('../models/User');
const Submission = require('../models/Submission');

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

// ── Helper: check if subscription period has reset (monthly) ──────────────────
// If startDate was last month, reset submissionsUsed to 0 automatically
const resetIfNewPeriod = async (user) => {
  try {
    const sub       = user.subscription;
    if (!sub?.startDate) return;

    const start     = new Date(sub.startDate);
    const now       = new Date();
    const monthDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

    // If we're in a new monthly period, reset usage
    if (monthDiff >= 1 && sub.plan === 'free') {
      await User.findByIdAndUpdate(user._id, {
        'subscription.submissionsUsed': 0,
        'subscription.startDate':       new Date(),
      });
    }
  } catch (err) {
    console.error('⚠️ resetIfNewPeriod error:', err.message);
  }
};

// ── GET current subscription ──────────────────────────────────────────────────
exports.getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription email username');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Auto-reset monthly usage for free plan
    await resetIfNewPeriod(user);

    // Re-fetch after potential reset
    const freshUser = await User.findById(req.user._id).select('subscription email username');
    const plan      = freshUser.subscription?.plan || 'free';
    const planInfo  = PLANS[plan];

    // Check if paid subscription expired — downgrade to free automatically
    const endDate = freshUser.subscription?.endDate;
    if (endDate && new Date(endDate) < new Date() && plan !== 'free') {
      await User.findByIdAndUpdate(req.user._id, {
        'subscription.plan':             'free',
        'subscription.status':           'expired',
        'subscription.submissionsLimit': 10,
      });
      const expiredUser = await User.findById(req.user._id).select('subscription email username');
      return res.json({
        success: true,
        subscription: {
          ...expiredUser.subscription.toObject(),
          planInfo:  PLANS['free'],
          allPlans:  PLANS,
          expired:   true,
        },
      });
    }

    res.json({
      success: true,
      subscription: {
        ...freshUser.subscription.toObject(),
        planInfo,
        allPlans: PLANS,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── CHECK submission limit (used by frontend before uploading) ────────────────
exports.checkLimit = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await resetIfNewPeriod(user);
    const freshUser = await User.findById(req.user._id).select('subscription');

    const plan   = freshUser.subscription?.plan   || 'free';
    const limit  = freshUser.subscription?.submissionsLimit ?? 10;
    const used   = freshUser.subscription?.submissionsUsed  ?? 0;
    const endDate = freshUser.subscription?.endDate;

    // Check expiry
    if (endDate && new Date(endDate) < new Date() && plan !== 'free') {
      return res.json({
        success:  true,
        allowed:  false,
        message:  'Your subscription has expired. Please renew to continue submitting.',
        used,
        limit,
        plan,
      });
    }

    // Unlimited
    if (limit >= 999) {
      return res.json({ success: true, allowed: true, used, limit, plan });
    }

    if (used >= limit) {
      return res.json({
        success:  true,
        allowed:  false,
        message:  `You have used ${used}/${limit} submissions on the ${plan} plan. Please upgrade to submit more.`,
        used,
        limit,
        plan,
      });
    }

    res.json({
      success:   true,
      allowed:   true,
      used,
      limit,
      remaining: limit - used,
      plan,
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
        'subscription.submissionsUsed':  0,  // Reset usage on plan change
      },
      { new: true }
    ).select('subscription username email');

    res.json({
      success: true,
      message: `Successfully upgraded to ${planInfo.name} plan!`,
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
        'subscription.startDate':        new Date(),
      },
      { new: true }
    ).select('subscription');

    res.json({
      success: true,
      message: 'Subscription cancelled. You are now on the Free plan.',
      subscription: {
        ...user.subscription.toObject(),
        planInfo: PLANS['free'],
        allPlans: PLANS,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET all plans (public) ────────────────────────────────────────────────────
exports.getPlans = async (req, res) => {
  res.json({ success: true, plans: PLANS });
};