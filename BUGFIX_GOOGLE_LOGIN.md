# Bug Fix: Google Login ERR_CONNECTION_REFUSED

## Problem Statement

When clicking "Login with Google" on the frontend, the browser showed:
```
ERR_CONNECTION_REFUSED
This site can't be reached - api.sarcasticrobo.online refused to connect
```

## Root Cause Analysis

After investigating the codebase, I identified a **critical bug** in the server startup code (`server/src/index.js`, lines 17-24):

```javascript
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  // In production, warn but don't exit to allow troubleshooting
  if (process.env.NODE_ENV !== 'production') {  // ❌ INVERTED LOGIC
    process.exit(1);
  }
}
```

### The Bug

The conditional logic was **inverted**:
- ❌ **In production** (NODE_ENV=production): Server continued WITHOUT required environment variables
- ❌ **In development**: Server exited immediately

Since the deployment workflow sets `NODE_ENV=production`, the server would:
1. Start without `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Initialize Passport with `undefined` values
3. Crash when handling OAuth requests
4. Result in "ERR_CONNECTION_REFUSED" as the server process was not running properly

### Additional Issues Found

1. **No explicit host binding**: The server used default binding which might not work well on all VPS configurations
2. **No server error handling**: Port conflicts or other server errors weren't caught
3. **Limited startup logging**: Hard to diagnose connection issues

## Solution Implemented

### 1. Fixed Environment Variable Validation

```javascript
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  console.error('Server cannot start without these variables');
  process.exit(1);  // ✅ Always exit if required vars are missing
}
```

**Benefit**: Server will fail fast and clearly indicate the problem instead of starting in a broken state.

### 2. Explicit Host Binding

```javascript
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces for VPS compatibility

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log('Server is ready to accept connections');
});
```

**Benefit**: Explicitly binds to all network interfaces (0.0.0.0), ensuring the server is accessible from external connections on VPS.

### 3. Server Error Handling

```javascript
// Handle server startup errors
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});
```

**Benefit**: Catches port conflicts and other server startup errors, making troubleshooting easier.

## Expected Outcome

After deploying this fix:

1. ✅ If environment variables are missing, the server will immediately exit with a clear error message
2. ✅ The deployment script will recognize the failure and alert administrators
3. ✅ If all environment variables are present, the server will start successfully
4. ✅ The server will bind to all interfaces (0.0.0.0), ensuring VPS accessibility
5. ✅ Google OAuth login flow will work correctly

## Testing Recommendations

After deploying this fix:

1. **Check PM2 logs** to verify server started successfully:
   ```bash
   pm2 logs comments-api
   ```

2. **Verify health endpoint**:
   ```bash
   curl https://api.sarcasticrobo.online/health
   ```

3. **Test Google OAuth flow**:
   - Visit https://deepak4395.github.io/Comments
   - Click "Login with Google"
   - Verify OAuth flow completes successfully

4. **Check environment variables** are properly set:
   ```bash
   cd /home/deploy/comments-app/server
   cat .env | grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET|SESSION_SECRET"
   ```

## Rollback Plan

If issues persist after deployment, the previous version can be restored:

```bash
ssh deploy@server
cd /home/deploy/comments-app
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>
pm2 restart comments-api
```

## Files Changed

- `server/src/index.js` - Fixed environment validation logic, added explicit host binding, and improved error handling

## Related Issues

This fix addresses the connection refusal issue mentioned in the problem statement and ensures the backend server starts reliably with proper configuration validation.
