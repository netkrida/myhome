# 🐳 Docker Build Guide - MyHome

Panduan lengkap untuk Docker build yang dapat berhasil dengan environment validation yang tepat.

## 🎯 Konsep Utama

### Build Time vs Runtime Environment Validation

**❌ Masalah Sebelumnya:**
- Environment validation dilakukan saat build
- Build gagal karena environment variables tidak tersedia
- Tidak fleksibel untuk deployment yang berbeda

**✅ Solusi Sekarang:**
- Environment validation **DILEWATI** saat build (`SKIP_ENV_VALIDATION=1`)
- Environment validation dilakukan saat **RUNTIME**
- Build berhasil dengan placeholder values
- Aplikasi memvalidasi environment saat startup

## 🏗️ Arsitektur Docker Build

### 1. Build Stage
```dockerfile
# Placeholder environment untuk build
ENV SKIP_ENV_VALIDATION=1 \
    NODE_ENV=production \
    DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder" \
    AUTH_SECRET="placeholder-secret-for-build-only" \
    NEXTAUTH_URL="http://placeholder.com"
```

### 2. Runtime Stage
```dockerfile
# Environment validation akan dilakukan di sini
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3000
# SKIP_ENV_VALIDATION tidak di-set, jadi validation aktif
```

### 3. Startup Process
```
Container Start → Environment Validation → Next.js Application
```

## 📁 File Structure

```
scripts/
├── validate-env.js      # Environment validation script
├── start-app.js         # Application startup script
├── test-docker-build.sh # Docker build testing
└── deploy-production.sh # Production deployment
```

## 🔧 Environment Validation

### Required Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
AUTH_SECRET=your-32-character-secret-minimum
NEXTAUTH_URL=https://myhome.co.id
```

### Optional Variables
```bash
# OAuth
AUTH_DISCORD_ID=your_discord_client_id
AUTH_DISCORD_SECRET=your_discord_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=your_secret

# Midtrans
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false

# Database (for docker-compose)
POSTGRES_DB=db_myhome
POSTGRES_USER=myhome
POSTGRES_PASSWORD=@myhome_123
```

## 🚀 Build & Deploy Commands

### 1. Test Build Locally
```bash
# Test Docker build process
./scripts/test-docker-build.sh

# Manual build test
docker build -t myhome-test .
```

### 2. Production Build
```bash
# Full production deployment
./scripts/deploy-production.sh

# Manual production build
docker-compose build --no-cache
docker-compose up -d
```

### 3. Quick Deploy
```bash
# Quick update deployment
./scripts/quick-deploy.sh
```

## 🧪 Testing

### Build Test
```bash
# Comprehensive build testing
./scripts/test-docker-build.sh

# Test with no cleanup (for debugging)
./scripts/test-docker-build.sh --no-cleanup
```

### Environment Validation Test
```bash
# Test validation script directly
node scripts/validate-env.js

# Test in Docker container
docker run --rm \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
  -e AUTH_SECRET=test-secret-32-characters-long \
  -e NEXTAUTH_URL=https://test.example.com \
  myhome-test \
  node scripts/validate-env.js
```

## 🔍 Troubleshooting

### Build Fails
```bash
# Check build logs
docker build -t myhome-debug . --progress=plain

# Test individual stages
docker build --target deps -t myhome-deps .
docker build --target builder -t myhome-builder .
```

### Environment Issues
```bash
# Check environment validation
docker run --rm myhome-test node scripts/validate-env.js

# Check with your actual environment
docker run --rm --env-file .env myhome-test node scripts/validate-env.js
```

### Runtime Issues
```bash
# Check container logs
docker-compose logs web

# Check startup process
docker run -it --env-file .env myhome-test sh
```

## 📊 Validation Features

### ✅ What Gets Validated

**Required Environment:**
- `DATABASE_URL` - Valid PostgreSQL URL
- `AUTH_SECRET` - Minimum 32 characters
- `NEXTAUTH_URL` - Valid HTTPS URL (production)
- `NODE_ENV` - development/test/production

**Security Checks:**
- AUTH_SECRET length (warns if < 64 chars in production)
- HTTPS requirement for NEXTAUTH_URL in production
- Placeholder value detection
- Bracket placeholder detection

**Optional Services:**
- Cloudinary configuration
- Midtrans payment gateway
- Discord OAuth
- Database credentials

### 🎨 Validation Output

```
==================================================
ℹ️  Environment Validation Results
==================================================
✅ Environment validation passed!

⚠️  WARNING: AUTH_SECRET should be at least 64 characters for production

Environment Summary:
  • NODE_ENV: production
  • PORT: 3000
  • HOST: 0.0.0.0
  • NEXTAUTH_URL: https://myhome.co.id
  • DATABASE_URL: set
  • AUTH_SECRET: set
  • Optional services: Cloudinary, Midtrans
==================================================

✅ Environment is ready for MyHome application!
```

## 🔄 Deployment Workflow

### Development
```bash
# Local development (no validation)
SKIP_ENV_VALIDATION=true npm run dev
```

### Staging
```bash
# Build with staging environment
docker build -t myhome-staging .
docker run --env-file .env.staging myhome-staging
```

### Production
```bash
# Production deployment
./scripts/deploy-production.sh

# Or manual
docker-compose -f docker-compose.prod.yml up -d
```

## 🛡️ Security Features

### Build Security
- No real secrets in build layers
- Placeholder values only
- Multi-stage build isolation

### Runtime Security
- Non-root user execution
- Environment validation before startup
- Secure defaults
- Health checks

### Environment Security
- Required secret validation
- HTTPS enforcement in production
- Strong secret requirements
- Placeholder detection

## 📈 Performance

### Build Optimization
- Multi-stage build
- Dependency caching
- Standalone output
- Minimal runtime image

### Runtime Optimization
- Fast startup validation
- Graceful shutdown handling
- Health check monitoring
- Resource-efficient containers

## 🆘 Emergency Procedures

### Skip Validation (Emergency Only)
```bash
# Skip validation for emergency deployment
docker run -e SKIP_ENV_VALIDATION=true myhome-image

# Or in docker-compose
environment:
  - SKIP_ENV_VALIDATION=true
```

### Debug Mode
```bash
# Run with debug output
docker run -it --env-file .env myhome-test sh

# Check validation manually
node scripts/validate-env.js
```

### Rollback
```bash
# Quick rollback to previous image
docker-compose down
docker-compose up -d --scale web=0
docker-compose up -d
```

## 📞 Support

Jika mengalami masalah:

1. **Build Issues**: Jalankan `./scripts/test-docker-build.sh`
2. **Environment Issues**: Jalankan `node scripts/validate-env.js`
3. **Runtime Issues**: Check `docker-compose logs web`
4. **Emergency**: Set `SKIP_ENV_VALIDATION=true` (temporary only)

**🎉 Docker build sekarang dapat berhasil dengan environment validation yang tepat!**
