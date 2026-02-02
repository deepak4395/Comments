const pool = require('../config/database');

class Comment {
  static async create(userId, content, siteSection = 'general') {
    const result = await pool.query(
      `INSERT INTO comments (user_id, content, site_section, status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING *`,
      [userId, content, siteSection]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT c.*, u.display_name, u.email, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, aiSuggestedRating = null, rejectionReason = null) {
    const result = await pool.query(
      `UPDATE comments 
       SET status = $1, ai_suggested_rating = $2, rejection_reason = $3 
       WHERE id = $4 
       RETURNING *`,
      [status, aiSuggestedRating, rejectionReason, id]
    );
    return result.rows[0];
  }

  static async updateFinalRating(id, finalRating) {
    const result = await pool.query(
      `UPDATE comments 
       SET final_rating = $1 
       WHERE id = $2 
       RETURNING *`,
      [finalRating, id]
    );
    return result.rows[0];
  }

  static async findBySiteSection(siteSection, status = 'approved', limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT c.*, u.display_name, u.email, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.site_section = $1 AND c.status = $2 
       ORDER BY c.created_at DESC 
       LIMIT $3 OFFSET $4`,
      [siteSection, status, limit, offset]
    );
    return result.rows;
  }

  static async findByUser(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT c.*, u.display_name, u.email, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.user_id = $1 
       ORDER BY c.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async delete(id, userId) {
    const result = await pool.query(
      `DELETE FROM comments 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }

  static async getStats(siteSection = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        AVG(final_rating) as avg_rating
      FROM comments
    `;
    
    const params = [];
    if (siteSection) {
      query += ' WHERE site_section = $1';
      params.push(siteSection);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

module.exports = Comment;
