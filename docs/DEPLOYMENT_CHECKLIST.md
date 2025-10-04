# 🚀 Deployment Checklist for Next.js MultiKost App

## 📋 Required Environment Variables

### **Critical Variables (Must Have)**
```bash
# Authentication Secret (REQUIRED)
AUTH_SECRET="your-super-secret-key-here"

# Database Connection (REQUIRED)
DATABASE_URL="postgresql://username:password@host:port/database"

# Production URL (REQUIRED for production)
NEXTAUTH_URL="https://yourdomain.com"

# Node Environment
NODE_ENV="production"
```

### **Generate AUTH_SECRET**
```bash
# Method 1: Using NextAuth CLI
npx auth secret

# Method 2: Using OpenSSL
openssl rand -base64 32

# Method 3: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🔧 Platform-Specific Setup

### **Vercel**
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable with appropriate environment (Production/Preview/Development)

### **Netlify**
1. Site settings → Environment variables
2. Add each variable

### **Railway/Render/DigitalOcean**
1. Environment section in your service settings
2. Add each variable

### **Docker/Self-hosted**
```dockerfile
# In your Dockerfile or docker-compose.yml
ENV AUTH_SECRET="your-secret"
ENV DATABASE_URL="your-db-url"
ENV NEXTAUTH_URL="https://yourdomain.com"
```

## 🧪 Testing Your Deployment

### **1. Health Check**
Visit: `https://yourdomain.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "checks": {
    "database": "OK",
    "auth_secret": "OK",
    "nextauth_url": "OK",
    "api_routes": {
      "auth_providers": "OK",
      "auth_signin": "OK",
      "auth_callback": "OK"
    }
  }
}
```

### **2. Auth Endpoints Test**
- `https://yourdomain.com/api/auth/providers` - Should return providers
- `https://yourdomain.com/api/auth/signin` - Should return signin page
- `https://yourdomain.com/api/auth/session` - Should return session info

### **3. Database Test**
Visit: `https://yourdomain.com/api/test-db`

## 🐛 Common Issues & Solutions

### **404 on /api/auth/***
- ❌ Missing `AUTH_SECRET`
- ❌ Missing `NEXTAUTH_URL` in production
- ❌ API routes not deployed properly
- ✅ Check build output includes `/api/auth/[...nextauth]/route.js`

### **Database Connection Errors**
- ❌ Wrong `DATABASE_URL` format
- ❌ Database not accessible from deployment platform
- ❌ Missing database migrations
- ✅ Run `npm run db:migrate` in production

### **Authentication Loops/Redirects**
- ❌ Wrong `NEXTAUTH_URL` (must match your domain)
- ❌ Middleware configuration issues
- ❌ Missing session configuration

## 🔄 Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migrations
npx prisma migrate deploy

# 4. Build the application
npm run build

# 5. Start production server
npm start
```

## 📊 Build Verification

After `npm run build`, verify these files exist:
- `.next/server/app/api/auth/[...nextauth]/route.js`
- `.next/server/app/api/test-db/route.js`
- `.next/server/app/api/health/route.js`
