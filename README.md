# 💬 Comments & Feedback System

A complete comment and feedback system with Gmail OAuth authentication and AI-powered moderation using Google Gemini.

## 🌟 Features

- **Gmail-Only Authentication**: Secure OAuth 2.0 login via Google
- **AI Moderation**: Intelligent content filtering using Google Gemini
- **Smart Rating System**: AI suggests ratings, users can adjust
- **User Profile Ratings**: Rate other users based on their contributions
- **Multi-Section Support**: Organize comments by site sections (blog, profile, etc.)
- **Real-time Stats**: View approval rates and average ratings
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

```
Frontend (GitHub Pages)          Backend (VPS Server)
https://deepak4395.github.io/Comments    https://api.sarcasticrobo.online
        │                                        │
        └──────── API Calls ─────────────────────┘
                                                 │
                                    ┌────────────┴────────────┐
                                    │                         │
                              PostgreSQL              Google Gemini
                              (Database)              (AI Moderation)
```

## 📋 Requirements

### System Requirements
- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- Nginx (for reverse proxy)
- Ubuntu/Debian server (recommended)

### API Keys & Credentials
- Google OAuth 2.0 credentials
- Google Gemini API key
- SSL certificate (Let's Encrypt)

## 🚀 Quick Start

### Frontend (GitHub Pages)

The frontend is automatically deployed to GitHub Pages from the `public/` directory.

**Live URL**: https://deepak4395.github.io/Comments

### Backend (VPS Server)

1. **Clone Repository**
   ```bash
   git clone https://github.com/deepak4395/Comments.git
   cd Comments/server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Setup Database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE comments_db;
   \q
   
   psql -d comments_db -f scripts/init-db.sql
   ```

5. **Start Server**
   ```bash
   npm start
   # Or with PM2
   pm2 start src/index.js --name comments-api
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=comments_db
DB_USER=postgres
DB_PASSWORD=your_password

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://api.sarcasticrobo.online/auth/google/callback

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Frontend
FRONTEND_URL=https://deepak4395.github.io/Comments
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Configure authorized origins:
   - `https://deepak4395.github.io`
   - `https://comments.sarcasticrobo.online`
6. Configure redirect URI:
   - `https://api.sarcasticrobo.online/auth/google/callback`

### Google Gemini API

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to your `.env` file

### Nginx Configuration

Copy the nginx configuration:

```bash
sudo cp nginx/comments-api.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/comments-api.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate

```bash
sudo certbot --nginx -d api.sarcasticrobo.online
```

## 📚 API Documentation

### Authentication Endpoints

#### `GET /auth/google`
Initiates Google OAuth flow.

#### `GET /auth/google/callback`
OAuth callback endpoint.

#### `GET /auth/me`
Get current user information.
- **Auth**: Required (Bearer token)

#### `POST /auth/logout`
Logout current user.

### Comment Endpoints

#### `GET /api/comments`
Get public comments.
- **Query Params**: 
  - `siteSection` (default: "general")
  - `limit` (default: 50)
  - `offset` (default: 0)

#### `POST /api/comments`
Submit a new comment.
- **Auth**: Required
- **Body**:
  ```json
  {
    "content": "Comment text",
    "siteSection": "general"
  }
  ```

#### `PUT /api/comments/:id/rating`
Update comment rating.
- **Auth**: Required
- **Body**:
  ```json
  {
    "rating": 5
  }
  ```

#### `GET /api/comments/my-comments`
Get current user's comments.
- **Auth**: Required

#### `DELETE /api/comments/:id`
Delete a comment.
- **Auth**: Required

#### `GET /api/comments/stats`
Get comment statistics.
- **Query Params**: 
  - `siteSection` (optional)

### User Profile & Rating Endpoints

#### `GET /api/users/:id/profile`
Get user profile with rating information.

#### `POST /api/users/:id/ratings`
Rate a user (1-5 stars).
- **Auth**: Required
- **Body**:
  ```json
  {
    "rating": 5
  }
  ```

#### `GET /api/users/:id/ratings`
Get ratings received by a user.

#### `GET /api/users/:id/my-rating`
Get your rating for a specific user.
- **Auth**: Required

#### `DELETE /api/users/:id/ratings`
Delete your rating for a user.
- **Auth**: Required

#### `GET /api/users/:id/comments`
Get comments by a specific user.

For detailed documentation on the user rating feature, see [USER_RATING_FEATURE.md](USER_RATING_FEATURE.md).

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### API Testing
```bash
# Health check
curl https://api.sarcasticrobo.online/health

# Get comments
curl https://api.sarcasticrobo.online/api/comments?siteSection=general
```

## 📦 Deployment

### Automated Deployment (GitHub Actions)

Push to main branch triggers automatic deployment:

```bash
git push origin main
```

The workflow:
1. Deploys frontend to GitHub Pages
2. SSHs into VPS server
3. Installs dependencies
4. Sets up database
5. Configures Nginx with SSL
6. Starts application with PM2

### Manual Deployment

#### Frontend
```bash
# Commit changes to public/ folder
git add public/
git commit -m "Update frontend"
git push origin gh-pages
```

#### Backend
```bash
ssh deploy@72.61.249.37
cd /home/deploy/comments-app
git pull origin main
cd server
npm install
pm2 restart comments-api
```

## 🔒 Security Features

- **HTTPS Only**: All traffic encrypted with SSL
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents abuse
- **CORS Protection**: Controlled origin access
- **Helmet.js**: Security headers
- **Input Validation**: Sanitized user input
- **SQL Injection Prevention**: Parameterized queries

## 🎨 Frontend Customization

Edit the following files to customize:

- `public/css/styles.css` - Styling
- `public/js/auth.js` - Authentication logic
- `public/js/comments.js` - Comment functionality
- `public/index.html` - Page structure

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    site_section VARCHAR(100) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'pending',
    ai_suggested_rating INTEGER,
    final_rating INTEGER,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🤖 AI Moderation

The system uses Google Gemini to moderate comments based on:

- Offensive or discriminatory language
- Profanity or vulgar content
- Personal attacks or harassment
- Spam or promotional content
- Respect and constructiveness
- On-topic discussion

### AI Response Format
```json
{
  "approved": true,
  "rating": 4,
  "feedback": "Constructive and respectful comment"
}
```

## 🐛 Troubleshooting

### Common Issues

**OAuth Redirect Error**
- Verify redirect URI in Google Console
- Check CORS settings in backend

**Database Connection Failed**
- Verify PostgreSQL is running
- Check database credentials in `.env`

**AI Moderation Not Working**
- Verify Gemini API key
- Check API quota limits

**PM2 App Not Starting**
- Check logs: `pm2 logs comments-api`
- Verify all environment variables

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 👥 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@sarcasticrobo.online

---

**Built with ❤️ using Node.js, PostgreSQL, and Google Gemini AI**
