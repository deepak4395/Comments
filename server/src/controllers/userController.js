const User = require('../models/user');
const UserRating = require('../models/userRating');
const Comment = require('../models/comment');

const userController = {
  // Get user profile with ratings and stats
  getUserProfile: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Get user profile with stats
      const profile = await User.getProfileWithStats(userId);

      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get rating statistics
      const ratingStats = await UserRating.getStats(userId);

      res.json({
        profile: {
          id: profile.id,
          displayName: profile.display_name,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          avgRating: profile.avg_rating ? parseFloat(profile.avg_rating) : null,
          totalRatings: parseInt(profile.total_ratings) || 0,
          totalComments: parseInt(profile.total_comments) || 0,
          approvedComments: parseInt(profile.approved_comments) || 0,
          createdAt: profile.created_at,
        },
        ratingStats: {
          totalRatings: parseInt(ratingStats.total_ratings) || 0,
          avgRating: ratingStats.avg_rating ? parseFloat(ratingStats.avg_rating) : null,
          fiveStars: parseInt(ratingStats.five_stars) || 0,
          fourStars: parseInt(ratingStats.four_stars) || 0,
          threeStars: parseInt(ratingStats.three_stars) || 0,
          twoStars: parseInt(ratingStats.two_stars) || 0,
          oneStar: parseInt(ratingStats.one_star) || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  // Rate a user
  rateUser: async (req, res) => {
    try {
      const ratedUserId = parseInt(req.params.id);
      const raterId = req.user.id;
      const { rating } = req.body;

      if (isNaN(ratedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Validate rating
      if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      }

      // Check if user is trying to rate themselves
      if (raterId === ratedUserId) {
        return res.status(400).json({ error: 'You cannot rate yourself' });
      }

      // Check if rated user exists
      const ratedUser = await User.findById(ratedUserId);
      if (!ratedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create or update rating
      const userRating = await UserRating.createOrUpdate(raterId, ratedUserId, rating);

      // Get updated profile
      const updatedProfile = await User.getProfile(ratedUserId);

      res.json({
        message: 'User rated successfully',
        rating: {
          id: userRating.id,
          rating: userRating.rating,
          createdAt: userRating.created_at,
          updatedAt: userRating.updated_at,
        },
        updatedProfile: {
          avgRating: updatedProfile.avg_rating ? parseFloat(updatedProfile.avg_rating) : null,
          totalRatings: parseInt(updatedProfile.total_ratings) || 0,
        },
      });
    } catch (error) {
      console.error('Error rating user:', error);
      res.status(500).json({ error: 'Failed to rate user' });
    }
  },

  // Get ratings for a user (ratings they received)
  getUserRatings: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;

      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const ratings = await UserRating.findByRatedUser(userId, limit, offset);

      res.json({
        userId,
        ratings: ratings.map(r => ({
          id: r.id,
          rating: r.rating,
          rater: {
            id: r.rater_id,
            name: r.rater_name,
            email: r.rater_email,
            avatarUrl: r.rater_avatar,
          },
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        pagination: {
          limit,
          offset,
          hasMore: ratings.length === limit,
        },
      });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      res.status(500).json({ error: 'Failed to fetch user ratings' });
    }
  },

  // Get current user's rating for a specific user
  getMyRatingForUser: async (req, res) => {
    try {
      const ratedUserId = parseInt(req.params.id);
      const raterId = req.user.id;

      if (isNaN(ratedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const rating = await UserRating.findRating(raterId, ratedUserId);

      if (!rating) {
        return res.json({ hasRated: false, rating: null });
      }

      res.json({
        hasRated: true,
        rating: {
          id: rating.id,
          rating: rating.rating,
          createdAt: rating.created_at,
          updatedAt: rating.updated_at,
        },
      });
    } catch (error) {
      console.error('Error fetching rating:', error);
      res.status(500).json({ error: 'Failed to fetch rating' });
    }
  },

  // Delete a rating
  deleteRating: async (req, res) => {
    try {
      const ratedUserId = parseInt(req.params.id);
      const raterId = req.user.id;

      if (isNaN(ratedUserId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const deleted = await UserRating.delete(raterId, ratedUserId);

      if (!deleted) {
        return res.status(404).json({ error: 'Rating not found' });
      }

      res.json({ message: 'Rating deleted successfully' });
    } catch (error) {
      console.error('Error deleting rating:', error);
      res.status(500).json({ error: 'Failed to delete rating' });
    }
  },

  // Get user's comments for their profile page
  getUserComments: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = parseInt(req.query.offset) || 0;

      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const comments = await Comment.findByUser(userId, limit, offset);

      res.json({
        userId,
        comments: comments.map(c => ({
          id: c.id,
          content: c.content,
          siteSection: c.site_section,
          status: c.status,
          aiSuggestedRating: c.ai_suggested_rating,
          finalRating: c.final_rating,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
        pagination: {
          limit,
          offset,
          hasMore: comments.length === limit,
        },
      });
    } catch (error) {
      console.error('Error fetching user comments:', error);
      res.status(500).json({ error: 'Failed to fetch user comments' });
    }
  },
};

module.exports = userController;
