const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: process.env.FRONTEND_URL + '?error=auth_failed',
    session: false 
  }),
  authController.googleCallback
);

// Get current user (protected)
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
