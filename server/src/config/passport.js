const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://api.sarcasticrobo.online/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );

        if (existingUser.rows.length > 0) {
          // User exists, return it
          return done(null, existingUser.rows[0]);
        }

        // Create new user
        const newUser = await pool.query(
          `INSERT INTO users (google_id, email, display_name, avatar_url) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [
            profile.id,
            profile.emails[0].value,
            profile.displayName,
            profile.photos[0]?.value || null,
          ]
        );

        done(null, newUser.rows[0]);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
