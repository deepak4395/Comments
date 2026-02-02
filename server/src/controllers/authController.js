const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const authController = {
  // This is called after successful Google OAuth
  googleCallback: (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(process.env.FRONTEND_URL + '?error=auth_failed');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: req.user.id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'https://deepak4395.github.io/Comments';
      res.redirect(`${frontendUrl}?token=${token}`);
    } catch (err) {
      console.error('Auth callback error:', err);
      res.redirect(process.env.FRONTEND_URL + '?error=server_error');
    }
  },

  // Get current user info
  getCurrentUser: (req, res) => {
    try {
      const { id, google_id, email, display_name, avatar_url, created_at } = req.user;
      res.json({
        id,
        google_id,
        email,
        display_name,
        avatar_url,
        created_at,
      });
    } catch (err) {
      console.error('Get current user error:', err);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  },

  // Logout
  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  },
};

module.exports = authController;
