# Testing Guide for Google Login Fix

## Quick Test After Deployment

### 1. Check Server Status

SSH into your server and run:

```bash
# Check if server is running
pm2 status comments-api

# Check recent logs
pm2 logs comments-api --lines 50
```

**Expected output in logs:**
```
Server running on 0.0.0.0:3000
Environment: production
Frontend URL: https://deepak4395.github.io/Comments
Server is ready to accept connections
Database connection verified at: [timestamp]
```

### 2. Test Health Endpoint

From your local machine:

```bash
# Test health endpoint
curl https://api.sarcasticrobo.online/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}
```

### 3. Test Google OAuth Login Flow

1. Open https://deepak4395.github.io/Comments in your browser
2. Open browser DevTools (F12) → Console tab
3. Click "Login with Google" button
4. Observe the flow:
   - Should redirect to Google login page
   - After Google authentication, should redirect back to your site with a token
   - Should show your user info and "Logout" button

**If successful:**
- ✅ You'll see your Google profile name and avatar
- ✅ The comment form will be visible
- ✅ No errors in browser console

**If it fails:**
- ❌ Check browser console for errors
- ❌ Check server logs: `pm2 logs comments-api --err`

### 4. Common Issues to Check

#### Issue: Server shows "Missing required environment variables"

**Solution:**
```bash
cd /home/deploy/comments-app/server
cat .env | grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET|SESSION_SECRET"
```

Ensure all four variables are set and not empty.

#### Issue: "Database connection error"

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep comments_db

# Initialize database if needed
cd /home/deploy/comments-app/server
sudo -u postgres psql -d comments_db -f scripts/init-db.sql
```

#### Issue: "Port 3000 is already in use"

**Solution:**
```bash
# Find what's using port 3000
sudo lsof -i :3000

# If it's an old instance, kill it
pm2 delete comments-api
pm2 start src/index.js --name comments-api
```

## Verification Checklist

- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Google OAuth login redirects correctly
- [ ] User can see their profile after login
- [ ] User can submit comments
- [ ] Comments appear in the list

## Rollback Procedure

If the fix doesn't work:

```bash
ssh deploy@your-server
cd /home/deploy/comments-app
git log --oneline -5
git reset --hard <previous-commit-hash>
pm2 restart comments-api
```

## Getting Help

If issues persist:

1. Collect logs:
   ```bash
   pm2 logs comments-api --lines 100 > /tmp/server-logs.txt
   sudo cat /var/log/nginx/comments-api-error.log > /tmp/nginx-logs.txt
   ```

2. Create a GitHub issue with:
   - Description of the problem
   - Browser console errors
   - Server logs
   - Nginx logs

## Security Notes

- Ensure `.env` file is not world-readable: `chmod 600 .env`
- Ensure secrets are properly set in GitHub repository
- Check SSL certificate is valid: `sudo certbot certificates`
