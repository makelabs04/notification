const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
        (SELECT COUNT(*) FROM push_subscriptions ps WHERE ps.user_id = u.id) as has_subscription
       FROM users u ORDER BY u.created_at DESC`
    );
    return rows;
  }

  static async getAllUsers() {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.email, u.is_active,
        (SELECT COUNT(*) FROM push_subscriptions ps WHERE ps.user_id = u.id) as has_subscription
       FROM users u WHERE u.role = 'user' AND u.is_active = 1 ORDER BY u.name ASC`
    );
    return rows;
  }

  static async create(name, email, password, role = 'user') {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );
    return result.insertId;
  }

  static async verifyPassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }

  static async toggleStatus(id) {
    await db.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
  }

  static async delete(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }
}

module.exports = User;