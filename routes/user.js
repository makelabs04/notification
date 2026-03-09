const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const Subscription = require('../models/Subscription');

// GET /user/dashboard
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const hasSubscription = await Subscription.hasSubscription(req.session.user.id);
    res.render('user/dashboard', {
      title: 'My Dashboard',
      user: req.session.user,
      hasSubscription,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('User dashboard error:', err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/auth/login');
  }
});

// POST /user/subscribe
router.post('/subscribe', requireLogin, async (req, res) => {
  try {
    const { subscription, browser } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data.' });
    }
    await Subscription.save(req.session.user.id, subscription, browser || '');
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to save subscription.' });
  }
});

// POST /user/unsubscribe
router.post('/unsubscribe', requireLogin, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await Subscription.remove(req.session.user.id, endpoint);
    } else {
      await Subscription.removeAll(req.session.user.id);
    }
    res.json({ success: true, message: 'Unsubscribed successfully.' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe.' });
  }
});

// GET /user/subscription-status
router.get('/subscription-status', requireLogin, async (req, res) => {
  try {
    const subs = await Subscription.getByUserId(req.session.user.id);
    res.json({ subscribed: subs.length > 0, count: subs.length });
  } catch (err) {
    res.status(500).json({ subscribed: false });
  }
});

module.exports = router;