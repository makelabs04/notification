const db = require('../config/database');

class Notification {
  static async create(title, body, icon, url, sentBy, sendType) {
    const [result] = await db.execute(
      'INSERT INTO notifications (title, body, icon, url, sent_by, send_type) VALUES (?, ?, ?, ?, ?, ?)',
      [title, body, icon || '/images/icon.png', url || '/', sentBy, sendType]
    );
    return result.insertId;
  }

  static async addRecipient(notificationId, userId) {
    await db.execute(
      'INSERT INTO notification_recipients (notification_id, user_id) VALUES (?, ?)',
      [notificationId, userId]
    );
  }

  static async updateRecipientStatus(notificationId, userId, status, errorMessage = null) {
    await db.execute(
      'UPDATE notification_recipients SET status = ?, sent_at = NOW(), error_message = ? WHERE notification_id = ? AND user_id = ?',
      [status, errorMessage, notificationId, userId]
    );
  }

  static async getAll() {
    const [rows] = await db.execute(
      `SELECT n.*, u.name as sent_by_name,
        COUNT(nr.id) as total_recipients,
        SUM(CASE WHEN nr.status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN nr.status = 'failed' THEN 1 ELSE 0 END) as failed_count
       FROM notifications n
       LEFT JOIN users u ON n.sent_by = u.id
       LEFT JOIN notification_recipients nr ON n.id = nr.notification_id
       GROUP BY n.id ORDER BY n.created_at DESC`
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.execute(
      `SELECT n.*, u.name as sent_by_name FROM notifications n
       LEFT JOIN users u ON n.sent_by = u.id WHERE n.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async getRecipients(notificationId) {
    const [rows] = await db.execute(
      `SELECT nr.*, u.name, u.email FROM notification_recipients nr
       JOIN users u ON nr.user_id = u.id WHERE nr.notification_id = ?`,
      [notificationId]
    );
    return rows;
  }

  static async getStats() {
    const [rows] = await db.execute(
      `SELECT 
        COUNT(DISTINCT n.id) as total_notifications,
        SUM(CASE WHEN nr.status = 'sent' THEN 1 ELSE 0 END) as total_sent,
        SUM(CASE WHEN nr.status = 'failed' THEN 1 ELSE 0 END) as total_failed
       FROM notifications n
       LEFT JOIN notification_recipients nr ON n.id = nr.notification_id`
    );
    return rows[0];
  }
}

module.exports = Notification;
