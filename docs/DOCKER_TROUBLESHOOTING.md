# 🔧 Docker Build Troubleshooting - MyHome

## ❌ Error: Prisma Schema Not Found

### Problem
```
Error: Could not find Prisma Schema that is required for this command.
```

### Root Cause
Prisma `postinstall` script runs `prisma generate` saat `npm ci`, tetapi file `schema.prisma` belum di-copy ke container.

### ✅ Solutions

#### Solution 1: Fixed Dockerfile (Recommended)
Dockerfile sudah diperbaiki dengan:
```dockerfile
# Copy Prisma schema before npm ci
COPY prisma ./prisma
# Install dependencies without running postinstall scripts first
RUN npm ci --ignore-scripts
# Then generate Prisma client explicitly
RUN npx prisma generate
```

#### Solution 2: Simple Dockerfile (Alternative)
Jika masih error, gunakan `Dockerfile.simple`:
```bash
# Rename current Dockerfile
mv Dockerfile Dockerfile.backup

# Use simple version
mv Dockerfile.simple Dockerfile

# Build again
docker build -t myhome .
```

#### Solution 3: Disable Postinstall Temporarily
Edit `package.json` untuk disable postinstall:
```json
{
  "scripts": {
    "postinstall": "echo 'Skipping prisma generate in Docker'"
  }
}
```

### 🧪 Testing Locally

#### Test 1: Check Prisma Schema
```bash
# Verify schema exists
ls -la prisma/schema.prisma

# Test Prisma generate locally
npx prisma generate
```

#### Test 2: Test Docker Build Steps
```bash
# Test dependencies installation
docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "
  apk add --no-cache libc6-compat openssl &&
  npm ci --ignore-scripts &&
  npx prisma generate
"

# Test full build
docker build -t myhome-test .
```

#### Test 3: Test with Docker Compose
```bash
# Build with docker-compose
docker-compose build

# Check logs
docker-compose logs web
```

## 🚀 Dockploy Deployment Solutions

### Option 1: Use Fixed Dockerfile
1. Push updated Dockerfile ke GitHub
2. Redeploy di Dockploy
3. Monitor build logs

### Option 2: Environment Variables
Set di Dockploy:
```
SKIP_ENV_VALIDATION=true
PRISMA_GENERATE_SKIP_AUTOINSTALL=true
```

### Option 3: Custom Build Commands
Di Dockploy settings:
```bash
# Pre-build command
npx prisma generate

# Build command
npm run build

# Start command
npm run start
```

## 🔍 Debug Commands

### Check Container State
```bash
# Run container interactively
docker run -it --rm myhome sh

# Check files in container
ls -la /app/
ls -la /app/prisma/
ls -la /app/node_modules/.prisma/
```

### Check Prisma Client
```bash
# Inside container
node -e "console.log(require('@prisma/client'))"

# Check generated client
ls -la node_modules/.prisma/client/
```

### Check Environment
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check Prisma version
npx prisma --version
```

## 📋 Checklist Before Deploy

- [ ] `prisma/schema.prisma` exists
- [ ] `package.json` has correct scripts
- [ ] `.env.example` has all required variables
- [ ] Dockerfile copies prisma folder before npm ci
- [ ] `npm ci --ignore-scripts` used in Dockerfile
- [ ] `npx prisma generate` runs explicitly
- [ ] Build tested locally (if possible)

## 🆘 Emergency Fixes

### Quick Fix 1: Remove Postinstall
```bash
# Temporarily remove postinstall
npm pkg delete scripts.postinstall

# Commit and push
git add package.json
git commit -m "fix: remove postinstall for Docker build"
git push
```

### Quick Fix 2: Use Simple Build
```bash
# Use simple Dockerfile
cp Dockerfile.simple Dockerfile

# Commit and push
git add Dockerfile
git commit -m "fix: use simple Dockerfile"
git push
```

### Quick Fix 3: Manual Prisma Generate
Add to Dockerfile before build:
```dockerfile
RUN npx prisma generate --schema=./prisma/schema.prisma
```

## 📞 Support

Jika masih error:
1. Check Dockploy build logs
2. Verify all files committed to GitHub
3. Test dengan Dockerfile.simple
4. Contact Dockploy support dengan error logs
