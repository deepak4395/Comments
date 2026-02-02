const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:id/profile', userController.getUserProfile);
router.get('/:id/ratings', userController.getUserRatings);
router.get('/:id/comments', userController.getUserComments);

// Protected routes (require authentication)
router.post('/:id/ratings', authMiddleware, userController.rateUser);
router.get('/:id/my-rating', authMiddleware, userController.getMyRatingForUser);
router.delete('/:id/ratings', authMiddleware, userController.deleteRating);

module.exports = router;
