const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware, validateUserIdParam } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/:id/profile', validateUserIdParam, userController.getUserProfile);
router.get('/:id/ratings', validateUserIdParam, userController.getUserRatings);
router.get('/:id/comments', validateUserIdParam, userController.getUserComments);

// Protected routes (require authentication)
router.post('/:id/ratings', authMiddleware, validateUserIdParam, userController.rateUser);
router.get('/:id/my-rating', authMiddleware, validateUserIdParam, userController.getMyRatingForUser);
router.delete('/:id/ratings', authMiddleware, validateUserIdParam, userController.deleteRating);

module.exports = router;
