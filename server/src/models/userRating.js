const pool = require('../config/database');

class UserRating {
  /**
   * Create or update a user rating
   * @param {number} raterId - ID of user giving the rating
   * @param {number} ratedUserId - ID of user being rated
   * @param {number} rating - Rating value (1-5)
   * @returns {Promise<Object>} The created/updated rating
   */
  static async createOrUpdate(raterId, ratedUserId, rating) {
    const result = await pool.query(
      `INSERT INTO user_ratings (rater_id, rated_user_id, rating) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (rater_id, rated_user_id) 
       DO UPDATE SET rating = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [raterId, ratedUserId, rating]
    );
    return result.rows[0];
  }

  /**
   * Get a specific rating
   * @param {number} raterId - ID of user who gave the rating
   * @param {number} ratedUserId - ID of user who was rated
   * @returns {Promise<Object|null>} The rating or null
   */
  static async findRating(raterId, ratedUserId) {
    const result = await pool.query(
      `SELECT * FROM user_ratings 
       WHERE rater_id = $1 AND rated_user_id = $2`,
      [raterId, ratedUserId]
    );
    return result.rows[0];
  }

  /**
   * Get all ratings for a user (ratings they received)
   * @param {number} userId - ID of user to get ratings for
   * @param {number} limit - Maximum number of ratings to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of ratings with rater info
   */
  static async findByRatedUser(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT ur.*, 
              u.display_name as rater_name, 
              u.email as rater_email, 
              u.avatar_url as rater_avatar
       FROM user_ratings ur
       JOIN users u ON ur.rater_id = u.id
       WHERE ur.rated_user_id = $1
       ORDER BY ur.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get all ratings given by a user
   * @param {number} userId - ID of user who gave ratings
   * @param {number} limit - Maximum number of ratings to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of ratings with rated user info
   */
  static async findByRater(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT ur.*, 
              u.display_name as rated_user_name, 
              u.email as rated_user_email, 
              u.avatar_url as rated_user_avatar
       FROM user_ratings ur
       JOIN users u ON ur.rated_user_id = u.id
       WHERE ur.rater_id = $1
       ORDER BY ur.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Delete a rating
   * @param {number} raterId - ID of user who gave the rating
   * @param {number} ratedUserId - ID of user who was rated
   * @returns {Promise<Object|null>} The deleted rating or null
   */
  static async delete(raterId, ratedUserId) {
    const result = await pool.query(
      `DELETE FROM user_ratings 
       WHERE rater_id = $1 AND rated_user_id = $2 
       RETURNING *`,
      [raterId, ratedUserId]
    );
    return result.rows[0];
  }

  /**
   * Get rating statistics for a user
   * @param {number} userId - ID of user to get stats for
   * @returns {Promise<Object>} Rating statistics
   */
  static async getStats(userId) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_ratings,
         AVG(rating)::DECIMAL(3,2) as avg_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM user_ratings
       WHERE rated_user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = UserRating;
