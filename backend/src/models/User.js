const db = require('../config/db');

class User {
  // Find user by email
  static async findByEmail(email) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { email, password, role = 'employee' } = userData;
      const [result] = await db.query(
        'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
        [email, password, role]
      );
      return { id: result.insertId, email, role };
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, userData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(userData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.query(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(id) {
    try {
      await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async findAll() {
    try {
      const [rows] = await db.query('SELECT id, email, role, is_active, created_at FROM users');
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;