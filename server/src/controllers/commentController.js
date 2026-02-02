const Comment = require('../models/comment');
const { moderateComment } = require('../services/aiModeration');

const commentController = {
  // Submit a new comment for moderation
  submitComment: async (req, res) => {
    try {
      const { content, siteSection } = req.body;
      const userId = req.user.id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      if (content.length > 5000) {
        return res.status(400).json({ error: 'Comment is too long (max 5000 characters)' });
      }

      // Create comment with pending status
      const comment = await Comment.create(userId, content.trim(), siteSection || 'general');

      // Moderate with AI
      const moderation = await moderateComment(content.trim());

      // Update comment based on moderation result
      if (moderation.approved) {
        await Comment.updateStatus(comment.id, 'approved', moderation.rating, null);
        const updatedComment = await Comment.findById(comment.id);
        
        return res.json({
          status: 'approved',
          comment: updatedComment,
          moderation: {
            approved: true,
            suggestedRating: moderation.rating,
            feedback: moderation.feedback,
          },
        });
      } else {
        await Comment.updateStatus(comment.id, 'rejected', null, moderation.reason);
        
        return res.json({
          status: 'rejected',
          commentId: comment.id,
          moderation: {
            approved: false,
            reason: moderation.reason,
            feedback: moderation.feedback,
          },
        });
      }
    } catch (err) {
      console.error('Submit comment error:', err);
      res.status(500).json({ error: 'Failed to submit comment' });
    }
  },

  // Update the final rating (user can adjust AI suggestion)
  updateRating: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const comment = await Comment.findById(id);

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.user_id !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this comment' });
      }

      if (comment.status !== 'approved') {
        return res.status(400).json({ error: 'Can only update rating for approved comments' });
      }

      const updatedComment = await Comment.updateFinalRating(id, rating);
      res.json({ comment: updatedComment });
    } catch (err) {
      console.error('Update rating error:', err);
      res.status(500).json({ error: 'Failed to update rating' });
    }
  },

  // Get comments for a site section (public endpoint)
  getComments: async (req, res) => {
    try {
      const { siteSection = 'general', limit = 50, offset = 0 } = req.query;
      
      const comments = await Comment.findBySiteSection(
        siteSection,
        'approved',
        parseInt(limit),
        parseInt(offset)
      );

      res.json({ comments });
    } catch (err) {
      console.error('Get comments error:', err);
      res.status(500).json({ error: 'Failed to get comments' });
    }
  },

  // Get user's own comments
  getMyComments: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      const comments = await Comment.findByUser(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({ comments });
    } catch (err) {
      console.error('Get my comments error:', err);
      res.status(500).json({ error: 'Failed to get comments' });
    }
  },

  // Delete a comment
  deleteComment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const comment = await Comment.delete(id, userId);

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or not authorized' });
      }

      res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
      console.error('Delete comment error:', err);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  },

  // Get statistics
  getStats: async (req, res) => {
    try {
      const { siteSection } = req.query;
      const stats = await Comment.getStats(siteSection);
      res.json({ stats });
    } catch (err) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },
};

module.exports = commentController;
