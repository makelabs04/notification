const db = require('../config/database');

class Subscription {
  static async save(userId, subscription, browser = '') {
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    await db.execute(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, browser)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), browser = VALUES(browser)`,
      [userId, endpoint, p256dh, auth, browser]
    );
  }

  static async remove(userId, endpoint) {
    await db.execute(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint]
    );
  }

  static async removeAll(userId) {
    await db.execute('DELETE FROM push_subscriptions WHERE user_id = ?', [userId]);
  }

  static async getByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );
    return rows;
  }

  static async getAllSubscribed() {
    const [rows] = await db.execute(
      `SELECT ps.*, u.name, u.email FROM push_subscriptions ps
       JOIN users u ON ps.user_id = u.id
       WHERE u.is_active = 1`
    );
    return rows;
  }

  static async getByUserIds(userIds) {
    if (!userIds.length) return [];
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT ps.*, u.name, u.email FROM push_subscriptions ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.user_id IN (${placeholders}) AND u.is_active = 1`,
      userIds
    );
    return rows;
  }

  static async hasSubscription(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );
    return rows[0].count > 0;
  }
}

module.exports = Subscription;
