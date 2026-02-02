# Deployment Guide

This guide walks through the complete deployment process for the Comments & Feedback System.

## Prerequisites

### Server Requirements
- Ubuntu 20.04 or higher
- At least 2GB RAM
- 20GB disk space
- Root or sudo access

### Domain Configuration
- Domain: `api.sarcasticrobo.online`
- DNS A Record pointing to server IP: `72.61.249.37`

### Required Secrets in GitHub
1. `SERVER_SSH_KEY` - SSH private key for deploy user
2. `SERVER_HOST` - 72.61.249.37
3. `SERVER_USER` - deploy
4. `GOOGLE_CLIENT_ID` - OAuth client ID
5. `GOOGLE_CLIENT_SECRET` - OAuth client secret
6. `GEMINI_API_KEY` - Google AI Studio API key

### Optional Variables in GitHub
1. `FRONTEND_URL` - Frontend URL (defaults to `https://deepak4395.github.io/Comments`)
   - Set this as a repository variable if you need a different frontend URL

## Manual Deployment Steps

### 1. Server Initial Setup

```bash
# SSH into server
ssh deploy@72.61.249.37

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE comments_db;
CREATE USER comments_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE comments_db TO comments_user;
\q

# Initialize database schema
cd /home/deploy/comments-app/server
sudo -u postgres psql -d comments_db -f scripts/init-db.sql
```

### 3. Clone and Configure Application

```bash
# Clone repository
cd /home/deploy
git clone https://github.com/deepak4395/Comments.git comments-app
cd comments-app

# Install backend dependencies
cd server
npm install --production

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=comments_db
DB_USER=comments_user
DB_PASSWORD=your_secure_password
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://api.sarcasticrobo.online/auth/google/callback
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=https://deepak4395.github.io/Comments
EOF

# Set proper permissions
chmod 600 .env
```

### 4. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /home/deploy/comments-app/nginx/comments-api.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/comments-api.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Setup SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.sarcasticrobo.online --agree-tos --email admin@sarcasticrobo.online

# Auto-renewal is configured automatically by certbot
```

### 6. Start Application with PM2

```bash
cd /home/deploy/comments-app/server
pm2 start src/index.js --name comments-api --env production
pm2 save
pm2 startup systemd
```

### 7. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Frontend Deployment

The frontend is automatically deployed to GitHub Pages when you push to main branch.

### Manual Frontend Deployment

```bash
# From your local machine
git checkout main
git pull origin main

# The GitHub Actions workflow will automatically deploy
# Or manually:
git subtree push --prefix public origin gh-pages
```

## Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Name**: Comments System
   - **Authorized JavaScript origins**:
     - `https://deepak4395.github.io`
     - `https://comments.sarcasticrobo.online`
   - **Authorized redirect URIs**:
     - `https://api.sarcasticrobo.online/auth/google/callback`

5. Copy Client ID and Client Secret to GitHub Secrets

## Google Gemini API Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Add to GitHub Secrets as `GEMINI_API_KEY`

## Automatic Deployment via GitHub Actions

Once setup is complete, any push to `main` branch will:

1. Deploy frontend to GitHub Pages
2. SSH to server and update backend
3. Restart PM2 process

## Monitoring and Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs comments-api
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/comments-api-access.log
sudo tail -f /var/log/nginx/comments-api-error.log
```

### Check Database
```bash
sudo -u postgres psql -d comments_db -c "SELECT COUNT(*) FROM comments;"
```

### Restart Application
```bash
pm2 restart comments-api
```

### Update Application
```bash
cd /home/deploy/comments-app
git pull origin main
cd server
npm install --production
pm2 restart comments-api
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs comments-api

# Check environment variables
cd /home/deploy/comments-app/server
cat .env

# Test database connection
node -e "const pool = require('./src/config/database'); pool.query('SELECT NOW()', (err, res) => { console.log(err, res.rows); pool.end(); });"
```

### OAuth Not Working
- Verify redirect URI in Google Console
- Check CORS settings
- Verify FRONTEND_URL in .env

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U comments_user -d comments_db -h localhost
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate
sudo certbot certificates
```

## Backup and Recovery

### Backup Database
```bash
# Create backup
pg_dump -U comments_user comments_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U comments_user -d comments_db < backup_20240101.sql
```

### Backup Application
```bash
cd /home/deploy
tar -czf comments-app-backup-$(date +%Y%m%d).tar.gz comments-app/
```

## Performance Optimization

### Enable Nginx Caching
Add to nginx configuration:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;
proxy_cache api_cache;
proxy_cache_valid 200 5m;
```

### Enable PostgreSQL Connection Pooling
Already configured in `config/database.js`

### Monitor with PM2
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Security Checklist

- [x] HTTPS enabled with valid SSL certificate
- [x] JWT secret is randomly generated
- [x] Database password is strong
- [x] Firewall configured
- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] Security headers added (Helmet.js)
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (input sanitization)

## Support

For issues:
- GitHub Issues: https://github.com/deepak4395/Comments/issues
- Email: support@sarcasticrobo.online
