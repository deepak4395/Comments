const pool = require('../config/database');

class User {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByGoogleId(googleId) {
    const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return result.rows[0];
  }

  static async create(googleId, email, displayName, avatarUrl) {
    const result = await pool.query(
      `INSERT INTO users (google_id, email, display_name, avatar_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [googleId, email, displayName, avatarUrl]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }
}

module.exports = User;
