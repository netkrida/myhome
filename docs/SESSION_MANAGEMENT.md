# Session Management System

This document describes the comprehensive session management system implemented to handle NextAuth session validation, cleanup, and synchronization with the database.

## Problem Solved

The application was experiencing persistent session issues where:
- NextAuth was creating sessions with user IDs that didn't exist in the database
- Invalid sessions caused infinite redirect loops
- Sessions weren't being validated against the database
- No automatic cleanup mechanism for corrupted sessions

## Solution Overview

The implemented solution provides:

1. **Automatic Session Validation** - Sessions are validated against the database every 5 minutes
2. **Database Synchronization** - Sessions are automatically invalidated if the user doesn't exist or is inactive
3. **Comprehensive Session Cleanup** - Multiple levels of session cleanup from gentle to nuclear
4. **Automatic Expiration Handling** - Invalid sessions trigger automatic redirects to login
5. **Enhanced Middleware** - Middleware validates sessions on every request
6. **Client-Side Monitoring** - React hooks monitor session health in real-time

## Components

### 1. Enhanced NextAuth Configuration (`src/server/auth/config.ts`)

**Key Features:**
- JWT callback validates users against database every 5 minutes
- Session callback returns null for invalid tokens
- Automatic token invalidation for non-existent or inactive users
- Role mismatch detection and handling

**How it works:**
```typescript
// JWT callback validates user every 5 minutes
jwt: async ({ token, user }) => {
  // Validate existing token against database
  if (token.id && (now - lastValidated > validationInterval)) {
    const dbUser = await UserRepository.findById(token.id);
    if (!dbUser || !dbUser.isActive) {
      return {}; // Invalidate token
    }
  }
}
```

### 2. Session Validation APIs

#### `/api/auth/validate-session` (GET/POST)
- **GET**: Validates current session against database
- **POST**: Force validation with automatic cleanup if invalid
- Returns detailed validation results and user information

#### `/api/auth/clear-session` (POST)
- Comprehensive cookie clearing (60+ possible auth cookies)
- Server-side and client-side cleanup
- Multiple path and domain variations

#### `/api/auth/emergency-reset` (POST)
- Nuclear option for complete session reset
- Clears ALL possible authentication cookies
- Includes security headers and cache control

### 3. Enhanced Middleware (`src/middleware.ts`)

**Features:**
- Validates every session against database on each request
- Automatic session invalidation and redirect for invalid users
- Comprehensive cookie clearing on invalid sessions
- Detailed logging for debugging

**Flow:**
1. Get session from NextAuth
2. Validate user exists and is active in database
3. Check for role mismatches
4. Clear session and redirect if invalid
5. Allow request to proceed if valid

### 4. Client-Side Utilities (`src/lib/auth-utils.ts`)

**Functions:**
- `validateSession()` - Check session validity
- `forceValidateAndCleanup()` - Force validation with cleanup
- `clearInvalidSession()` - Clear session and redirect
- `checkSessionHealth()` - Periodic health checks
- `handleSessionExpiration()` - Handle expired sessions

### 5. Session Health Monitoring (`src/hooks/useSessionHealth.ts`)

**Features:**
- Automatic session validation every 5 minutes
- Validation on route changes and window focus
- Configurable intervals and behaviors
- Automatic cleanup and redirect on invalid sessions

**Usage:**
```typescript
const { checkHealth, isChecking } = useSessionHealth({
  checkInterval: 5 * 60 * 1000, // 5 minutes
  checkOnRouteChange: true,
  autoRedirect: true
});
```

### 6. Session Cleanup Utilities

**Client-side (`src/lib/client-session-cleanup.ts`):**
- `ClientSessionCleanup` - Browser storage and cookie clearing
- Works only in browser environment
- Handles localStorage, sessionStorage, IndexedDB, caches

**Server-side (`src/lib/server-session-cleanup.ts`):**
- `ServerSessionCleanup` - Server-side cookie clearing
- Uses Next.js `cookies()` function
- Handles comprehensive cookie clearing

**Features:**
- Clears 60+ possible authentication cookies
- Browser storage cleanup (localStorage, sessionStorage)
- Cache clearing (Service Worker, IndexedDB)
- Emergency cleanup for corrupted sessions

### 7. UI Components

#### `SessionHealthMonitor` (`src/components/auth/session-health-monitor.tsx`)
- Visual session health indicators
- Manual refresh buttons
- Error alerts and status displays
- Debug information panels

#### `ForceLogout` (`src/components/auth/force-logout.tsx`)
- Debug tools for session issues
- Force clear session button
- Emergency reset (nuclear option)
- Enhanced with loading states and better UX

### 8. Enhanced Login Page (`src/app/(public-pages)/login/page.tsx`)

**Features:**
- Session expiration detection from URL params
- Force cleanup button for stuck sessions
- Clear error messages and instructions
- Integration with session cleanup utilities

## Usage Guide

### For Developers

1. **Add Session Health Monitoring to Pages:**
```typescript
import { useSessionGuard } from "@/hooks/useSessionHealth";

export default function DashboardPage() {
  useSessionGuard(); // Automatic session monitoring
  // ... rest of component
}
```

2. **Add Session Health Indicator to UI:**
```typescript
import { SessionHealthIndicator } from "@/components/auth/session-health-monitor";

<SessionHealthIndicator className="ml-auto" />
```

3. **Manual Session Validation:**
```typescript
import { validateSession } from "@/lib/auth-utils";

const validation = await validateSession();
if (!validation.valid) {
  // Handle invalid session
}
```

4. **Client-side Session Cleanup:**
```typescript
import { ClientSessionCleanup } from "@/lib/client-session-cleanup";

// Clear browser storage and cookies
ClientSessionCleanup.performFullCleanup();

// Emergency cleanup (includes IndexedDB, caches)
await ClientSessionCleanup.emergencyCleanup();
```

### For Users Experiencing Issues

1. **Stuck in Login Loop:**
   - Click "Force Clear Session" on login page
   - If that doesn't work, use "Emergency Reset"
   - Close all browser windows and reopen

2. **Session Expired Messages:**
   - Normal behavior when session becomes invalid
   - Simply log in again with valid credentials

3. **Persistent Issues:**
   - Use the debug tools in the bottom-right corner
   - Try incognito/private browsing mode
   - Clear browser data manually if needed

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/validate-session` | GET | Check session validity |
| `/api/auth/validate-session` | POST | Force validation + cleanup |
| `/api/auth/clear-session` | POST | Clear session cookies |
| `/api/auth/emergency-reset` | POST | Nuclear session reset |
| `/api/auth/emergency-reset` | GET | Get reset status |

## Configuration

### Environment Variables
- `NEXTAUTH_SECRET` - Required for JWT signing
- `NEXTAUTH_URL` - Used for cookie domain in production
- `NODE_ENV` - Affects cookie security settings

### Session Settings
```typescript
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours
  updateAge: 60 * 60, // 1 hour
}
```

### Validation Intervals
- JWT validation: Every 5 minutes
- Session health check: Every 5 minutes (configurable)
- Route change validation: On every route change
- Window focus validation: When window gains focus

## Troubleshooting

### Common Issues

1. **"User not found in database"**
   - Session has invalid user ID
   - Automatic cleanup will trigger
   - User needs to log in again

2. **"Role mismatch"**
   - User's role changed in database
   - Session will be invalidated
   - User needs to log in again

3. **Infinite redirect loops**
   - Use Force Clear Session or Emergency Reset
   - Check browser console for detailed logs
   - Ensure database connection is working

### Debug Information

Enable detailed logging by checking browser console:
- `🔍` - Information/debug messages
- `✅` - Success messages  
- `❌` - Error messages
- `🧹` - Cleanup operations
- `🚨` - Emergency operations

### Manual Cleanup Steps

If automatic cleanup fails:

1. **Browser Console:**
```javascript
// Clear all cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

// Clear storage
localStorage.clear();
sessionStorage.clear();
```

2. **Browser Settings:**
   - Clear browsing data for the site
   - Disable and re-enable cookies
   - Try incognito/private mode

## Security Considerations

- All session tokens are HTTP-only cookies
- Secure flag enabled in production
- SameSite=Lax for CSRF protection
- Regular validation prevents stale sessions
- Emergency reset includes security headers
- No sensitive data stored in client-side storage

## Performance Impact

- JWT validation: Minimal (cached for 5 minutes)
- Database queries: One per validation interval per user
- Client-side monitoring: Lightweight event listeners
- Cookie operations: Fast, browser-native
- Overall impact: Negligible for normal usage
