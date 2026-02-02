# Troubleshooting Guide

This guide helps resolve common issues with the Comments & Feedback System.

## Table of Contents
- [Backend Deployment Issues](#backend-deployment-issues)
- [Frontend Issues](#frontend-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [SSL Certificate Issues](#ssl-certificate-issues)
- [Common Errors](#common-errors)

## Backend Deployment Issues

### GitHub Actions Deployment Failing

**Symptom**: GitHub Actions workflow fails during backend deployment step.

**Common Causes & Solutions**:

1. **SSH Connection Failed**
   - Verify `SERVER_SSH_KEY` secret is correctly set
   - Check that the SSH key has proper permissions on the server
   - Ensure `SERVER_HOST` and `SERVER_USER` secrets are correct
   - Test SSH connection manually:
     ```bash
     ssh -i /path/to/key deploy@your-server-ip
     ```

2. **Environment Variables Not Interpolated**
   - This has been fixed in the latest version
   - Ensure you're using the latest deploy.yml workflow
   - The script now passes environment variables as arguments

3. **Permission Denied Errors**
   - Ensure deploy user has sudo privileges
   - Check that application directory is owned by deploy user:
     ```bash
     sudo chown -R deploy:deploy /home/deploy/comments-app
     ```

### Backend Server Won't Start

**Symptom**: PM2 shows app as "errored" or continuously restarting.

**Diagnosis Steps**:

1. Check PM2 logs:
   ```bash
   pm2 logs comments-api
   pm2 logs comments-api --err
   ```

2. Check for missing environment variables:
   ```bash
   cd /home/deploy/comments-app/server
   cat .env
   ```

3. Test database connection:
   ```bash
   node -e "const pool = require('./src/config/database'); pool.query('SELECT NOW()', (err, res) => { console.log(err ? 'ERROR: ' + err : 'OK: ' + res.rows[0].now); pool.end(); });"
   ```

4. Check Node.js version:
   ```bash
   node --version  # Should be 18.x or higher
   ```

**Common Fixes**:

- Ensure all required environment variables are set in `.env`
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check port 3000 is not in use: `sudo lsof -i :3000`
- Restart the application: `pm2 restart comments-api`

### Backend API Returns 502 Bad Gateway

**Symptom**: Nginx returns 502 error when accessing API endpoints.

**Diagnosis Steps**:

1. Check if backend is running:
   ```bash
   pm2 status comments-api
   curl http://localhost:3000/health
   ```

2. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/comments-api-error.log
   ```

3. Test Nginx configuration:
   ```bash
   sudo nginx -t
   ```

**Common Fixes**:

- Restart PM2: `pm2 restart comments-api`
- Restart Nginx: `sudo systemctl restart nginx`
- Check Nginx configuration: `cat /etc/nginx/sites-available/comments-api.conf`
- Ensure rate limiting zone is defined correctly

## Frontend Issues

### Frontend Can't Connect to Backend

**Symptom**: CORS errors in browser console or 404 errors when calling API.

**Diagnosis Steps**:

1. Open browser console and check for errors
2. Verify API URL in `public/js/auth.js`:
   ```javascript
   const API_URL = 'https://api.sarcasticrobo.online';
   ```

3. Test backend health endpoint:
   ```bash
   curl https://api.sarcasticrobo.online/health
   ```

**Common Fixes**:

- Ensure backend is running and accessible
- Check CORS configuration in `server/src/index.js`
- Verify frontend domain is in allowed origins list
- Check browser console for specific error messages

### OAuth Authentication Fails

**Symptom**: After clicking login, authentication fails or redirects with error.

**Diagnosis Steps**:

1. Check URL for error parameters: `?error=auth_failed`
2. Check backend logs: `pm2 logs comments-api | grep -i error`
3. Verify Google OAuth configuration

**Common Fixes**:

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Check Google Cloud Console OAuth 2.0 configuration:
  - Authorized JavaScript origins: `https://deepak4395.github.io`
  - Authorized redirect URIs: `https://api.sarcasticrobo.online/auth/google/callback`
- Ensure `FRONTEND_URL` is correctly set in `.env`
- Clear browser cache and localStorage

## Database Issues

### Database Connection Failed

**Symptom**: Backend logs show "Database connection error" or "connection refused".

**Diagnosis Steps**:

1. Check PostgreSQL status:
   ```bash
   sudo systemctl status postgresql
   ```

2. Test connection:
   ```bash
   psql -U postgres -d comments_db -h localhost
   ```

3. Check database credentials in `.env`

**Common Fixes**:

- Start PostgreSQL: `sudo systemctl start postgresql`
- Reset PostgreSQL password:
  ```bash
  sudo -u postgres psql
  ALTER USER postgres PASSWORD 'your_password';
  ```
- Verify database exists:
  ```bash
  sudo -u postgres psql -l | grep comments_db
  ```
- Re-initialize database if needed:
  ```bash
  sudo -u postgres psql -d comments_db -f /home/deploy/comments-app/server/scripts/init-db.sql
  ```

### Database Tables Don't Exist

**Symptom**: Errors like "relation 'users' does not exist" or "relation 'comments' does not exist".

**Solution**:
```bash
cd /home/deploy/comments-app/server
sudo -u postgres psql -d comments_db -f scripts/init-db.sql
```

## Authentication Issues

### JWT Token Invalid or Expired

**Symptom**: API returns 401 Unauthorized with "Invalid token" or "Token expired".

**Common Fixes**:

- Clear localStorage in browser and login again
- Ensure `JWT_SECRET` is set in backend `.env`
- Check that JWT_SECRET hasn't changed (would invalidate all tokens)
- Verify token expiration is reasonable (currently 7 days)

### Session Issues

**Symptom**: User gets logged out unexpectedly or session not persisting.

**Common Fixes**:

- Ensure `SESSION_SECRET` is set in `.env`
- Check cookie settings in browser (allow third-party cookies if needed)
- Verify `credentials: true` in CORS configuration
- Check that HTTPS is being used (required for secure cookies)

## SSL Certificate Issues

### SSL Certificate Not Found

**Symptom**: Nginx fails to start or returns SSL error.

**Solution**:
```bash
# Obtain new certificate
sudo certbot --nginx -d api.sarcasticrobo.online --agree-tos --email admin@sarcasticrobo.online

# Or renew existing
sudo certbot renew
```

### Certificate Expired

**Symptom**: Browser shows certificate expired error.

**Solution**:
```bash
# Renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

**Prevention**: Certbot should auto-renew via cron/systemd timer. Verify:
```bash
sudo systemctl status certbot.timer
```

## Common Errors

### Error: "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" in .env

**Cause**: Environment variables not properly interpolated.

**Solution**: This has been fixed in the latest version. Update to the latest deploy.yml workflow.

### Error: "rate_limit_zone not defined"

**Cause**: Nginx rate limiting zone defined in wrong location.

**Solution**: This has been fixed. Update to the latest nginx configuration.

### Error: "Cannot find module"

**Cause**: Node modules not installed.

**Solution**:
```bash
cd /home/deploy/comments-app/server
npm install --production
pm2 restart comments-api
```

### PM2 Process Not Found

**Cause**: PM2 not set up to start on boot.

**Solution**:
```bash
pm2 save
pm2 startup systemd
# Follow the command PM2 outputs
```

## Getting Help

If you're still experiencing issues:

1. **Check Logs**:
   ```bash
   # Backend logs
   pm2 logs comments-api
   
   # Nginx logs
   sudo tail -f /var/log/nginx/comments-api-error.log
   
   # PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

2. **Check System Resources**:
   ```bash
   # Disk space
   df -h
   
   # Memory
   free -h
   
   # CPU
   top
   ```

3. **GitHub Actions Logs**:
   - Go to Actions tab in GitHub repository
   - Click on latest deployment workflow
   - Review job logs for errors

4. **Create an Issue**:
   - Open an issue on GitHub with:
     - Description of the problem
     - Steps to reproduce
     - Relevant log excerpts
     - System information

## Quick Reference Commands

```bash
# Backend Status
pm2 status
pm2 logs comments-api --lines 50

# Restart Services
pm2 restart comments-api
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Test Endpoints
curl http://localhost:3000/health
curl https://api.sarcasticrobo.online/health

# Database
sudo -u postgres psql -d comments_db
# In psql: \dt (list tables), \d users (describe table)

# Nginx
sudo nginx -t
sudo systemctl status nginx

# View Configuration
cat /home/deploy/comments-app/server/.env
cat /etc/nginx/sites-available/comments-api.conf
```

## Security Notes

- Never commit `.env` files to version control
- Regularly update SSL certificates
- Keep Node.js and system packages updated
- Monitor logs for suspicious activity
- Use strong passwords for database
- Regularly backup database and configuration files
