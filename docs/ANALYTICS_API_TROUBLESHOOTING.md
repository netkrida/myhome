# Analytics API Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue 1: Getting HTML Login Page Instead of JSON Response

**Symptoms:**
```
GET /login?callbackUrl=%2Fapi%2Fanalytics%2Fvisitors%2Ftotal 200 in 451ms
```

**Root Cause:** Cookie mismatch between NextAuth v4 and v5 formats.

**Solution:**
1. **Clear all authentication cookies**
2. **Login again** to create fresh session
3. **Use correct cookie format** in requests

### Issue 2: 403 Forbidden Error

**Symptoms:**
```json
{
  "error": "Forbidden - SUPERADMIN access required"
}
```

**Root Cause:** User role is not SUPERADMIN or session is invalid.

**Solution:**
1. Ensure you're logged in as SUPERADMIN
2. Check user role in database
3. Verify session token is valid

### Issue 3: Token Not Found in Middleware

**Symptoms:**
```
🔍 Middleware - Token: {
  hasToken: false,
  role: undefined,
  email: undefined
}
```

**Root Cause:** Middleware looking for wrong cookie name.

**Solution:** Updated middleware now handles both NextAuth v4 and v5 formats automatically.

## 🛠️ Quick Fixes

### 1. Clear Authentication Cookies

**Option A: Browser Console**
```javascript
// Copy and paste this in browser console
// (Content from scripts/clear-auth-cookies.js)
```

**Option B: Manual Cookie Deletion**
1. Open Developer Tools → Application → Cookies
2. Delete all cookies starting with:
   - `next-auth.*`
   - `authjs.*`
   - `__Secure-next-auth.*`
   - `__Secure-authjs.*`

### 2. Test with Script

```bash
# Make script executable
chmod +x scripts/test-analytics-api.sh

# Run the test script
./scripts/test-analytics-api.sh
```

### 3. Manual CURL Testing

**Step 1: Login**
```bash
curl -i -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@myhome.co.id",
    "password": "password123"
  }'
```

**Step 2: Extract Session Token**
Look for `Set-Cookie` header with `authjs.session-token=` or `next-auth.session-token=`

**Step 3: Test Analytics Endpoint**
```bash
# With NextAuth v5 format
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=all" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"

# With NextAuth v4 format (fallback)
curl -X GET "http://localhost:3000/api/analytics/visitors/total?period=all" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## 🔧 Configuration Updates Made

### 1. Middleware Enhancement

Updated `src/middleware.ts` to handle both cookie formats:

```typescript
// Try NextAuth v5 format first
let token = await getToken({
  req: request,
  secret: process.env.AUTH_SECRET,
  cookieName: process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"
});

// Fallback to NextAuth v4 format
if (!token) {
  token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
  });
}
```

### 2. NextAuth Configuration

Updated `src/server/auth/config.ts` to use NextAuth v5 cookie names:

```typescript
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === "production"
      ? `__Secure-authjs.session-token`
      : `authjs.session-token`,
    // ... options
  },
  // ... other cookies
}
```

### 3. Analytics API Protection

Added specific protection for analytics endpoints:

```typescript
// Analytics API - only SUPERADMIN can access
if (pathname.startsWith("/api/analytics") && !pathname.startsWith("/api/analytics/track")) {
  if (userRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden - SUPERADMIN access required" }, { status: 403 });
  }
}
```

## 📋 Available Analytics Endpoints

### 1. Total Visitors
```
GET /api/analytics/visitors/total?period={all|today|week|month|year}
```

### 2. Visitor Statistics
```
GET /api/analytics/visitors/stats?period={today|week|month|year}
```

### 3. Analytics Summary
```
GET /api/analytics/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=/&country=ID&device=desktop&browser=chrome
```

### 4. Real-time Analytics
```
GET /api/analytics/realtime
```

### 5. Track Visitor (Public)
```
POST /api/analytics/track
Content-Type: application/json

{
  "sessionId": "unique-session-id",
  "page": "/",
  "title": "Homepage",
  "referrer": "https://google.com"
}
```

## 🚨 Emergency Reset

If all else fails:

1. **Stop the development server**
2. **Clear all cookies** in browser for `localhost:3000`
3. **Clear browser cache** for the domain
4. **Restart development server**
5. **Login again** with fresh session

## 📞 Support

If issues persist:

1. Check server logs for detailed error messages
2. Verify database connection and user data
3. Ensure environment variables are set correctly
4. Check NextAuth configuration matches middleware settings
