const express = require('express');
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', commentController.getComments);
router.get('/stats', commentController.getStats);

// Protected routes (require authentication)
router.post('/', authMiddleware, commentController.submitComment);
router.put('/:id/rating', authMiddleware, commentController.updateRating);
router.get('/my-comments', authMiddleware, commentController.getMyComments);
router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;
