const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// GET /admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const users = await User.getAllUsers();
    const notifications = await Notification.getAll();
    const stats = await Notification.getStats();
    const subscriptions = await Subscription.getAllSubscribed();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      users,
      notifications: notifications.slice(0, 5),
      stats: {
        totalUsers: users.length,
        subscribedUsers: [...new Set(subscriptions.map(s => s.user_id))].length,
        totalNotifications: stats.total_notifications || 0,
        totalSent: stats.total_sent || 0
      },
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.flash('error', 'Failed to load dashboard.');
    res.redirect('/');
  }
});

// GET /admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.getAll();
    res.render('admin/users', {
      title: 'Manage Users',
      user: req.session.user,
      users,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Users list error:', err);
    req.flash('error', 'Failed to load users.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/send-notification
router.get('/send-notification', requireAdmin, async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.render('admin/send-notification', {
      title: 'Send Notification',
      user: req.session.user,
      users,
      query_type: req.query.type || 'all',
      query_user_id: req.query.user_id || '',
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Send notification page error:', err);
    req.flash('error', 'Failed to load page.');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/send-notification
router.post('/send-notification', requireAdmin, async (req, res) => {
  try {
    const { title, body, url, send_type, user_ids } = req.body;

    if (!title || !body) {
      req.flash('error', 'Title and message are required.');
      return res.redirect('/admin/send-notification');
    }

    let subscriptions = [];
    let targetUserIds = [];

    if (send_type === 'all') {
      subscriptions = await Subscription.getAllSubscribed();
      targetUserIds = [...new Set(subscriptions.map(s => s.user_id))];
    } else if (send_type === 'individual' || send_type === 'selected') {
      const ids = Array.isArray(user_ids) ? user_ids : [user_ids];
      targetUserIds = ids.map(Number).filter(Boolean);
      subscriptions = await Subscription.getByUserIds(targetUserIds);
    }

    if (!subscriptions.length) {
      req.flash('error', 'No subscribed users found for the selected target.');
      return res.redirect('/admin/send-notification');
    }

    // Create notification record
    const notificationId = await Notification.create(
      title, body, '/images/icon.png', url || '/',
      req.session.user.id, send_type
    );

    // Add all recipients
    for (const uid of targetUserIds) {
      await Notification.addRecipient(notificationId, uid);
    }

    // Send push notifications
    const payload = JSON.stringify({ title, body, icon: '/images/icon.png', url: url || '/' });
    let sentCount = 0, failedCount = 0;

    for (const sub of subscriptions) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      try {
        await webpush.sendNotification(pushSub, payload);
        await Notification.updateRecipientStatus(notificationId, sub.user_id, 'sent');
        sentCount++;
      } catch (pushErr) {
        console.error(`Push failed for user ${sub.user_id}:`, pushErr.message);
        await Notification.updateRecipientStatus(notificationId, sub.user_id, 'failed', pushErr.message);
        if (pushErr.statusCode === 410) {
          await Subscription.remove(sub.user_id, sub.endpoint);
        }
        failedCount++;
      }
    }

    req.flash('success', `Notification sent! ✅ ${sentCount} delivered, ${failedCount} failed.`);
    res.redirect('/admin/notifications');
  } catch (err) {
    console.error('Send notification error:', err);
    req.flash('error', 'Failed to send notification.');
    res.redirect('/admin/send-notification');
  }
});

// GET /admin/notifications
router.get('/notifications', requireAdmin, async (req, res) => {
  try {
    const notifications = await Notification.getAll();
    res.render('admin/notifications', {
      title: 'Notification History',
      user: req.session.user,
      notifications,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (err) {
    console.error('Notifications list error:', err);
    req.flash('error', 'Failed to load notifications.');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/users/toggle/:id
router.post('/users/toggle/:id', requireAdmin, async (req, res) => {
  try {
    await User.toggleStatus(req.params.id);
    req.flash('success', 'User status updated.');
  } catch (err) {
    req.flash('error', 'Failed to update user status.');
  }
  res.redirect('/admin/users');
});

module.exports = router;