# 🚀 MyHome - Panduan Deployment Dockploy

Panduan lengkap untuk deploy aplikasi MyHome di VPS menggunakan Dockploy dengan environment production.

## 📋 Prerequisites

- VPS dengan Dockploy terinstall
- Domain yang sudah diarahkan ke VPS
- Repository GitHub yang dapat diakses
- Database PostgreSQL (bisa dari Dockploy atau external)

## 🏗️ Struktur File Deployment

```
├── Dockerfile                    # Multi-stage build optimized
├── docker-compose.yml            # Production dengan database
├── docker-compose.dockploy.yml   # Simplified untuk Dockploy
├── .dockerignore                 # Optimized build context
├── .env.production               # Environment variables
├── .env.dockploy.example         # Template environment
└── scripts/
    ├── deploy-dockploy.sh        # Deployment helper
    ├── test-docker-build.sh      # Build testing
    └── init-db.sql               # Database initialization
```

## ⚙️ Environment Variables

### 🔐 Required Variables

Copy dari `.env.production` dan set di Dockploy:

```bash
# Core Configuration
NODE_ENV=production
AUTH_SECRET=4kwjDR+ygN8k10Pa1osDCSuieDkOGN2nAu3RuA6Ezzo=
NEXTAUTH_URL=https://myhome.co.id

# Database
DATABASE_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public
DIRECT_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ
```

### 🎛️ Optional Variables

```bash
# Payment Gateway
MIDTRANS_SERVER_KEY=[YOUR-MIDTRANS-SERVER-KEY]
MIDTRANS_CLIENT_KEY=[YOUR-MIDTRANS-CLIENT-KEY]
MIDTRANS_IS_PRODUCTION=false

# Application
NEXT_PUBLIC_APP_NAME=MyHome
PORT=3000
```

## 🚀 Deployment Steps

### 1. Persiapan Repository

Pastikan semua file deployment sudah ada:

```bash
# Jalankan helper script
chmod +x scripts/deploy-dockploy.sh
./scripts/deploy-dockploy.sh
```

### 2. Setup di Dockploy

#### A. Create New Application
- **Name**: myhome
- **Type**: Docker Compose / Dockerfile
- **Repository**: `https://github.com/netkrida/boxbook.git`
- **Branch**: `main`
- **Build Context**: `/`
- **Dockerfile Path**: `Dockerfile`

#### B. Environment Variables
Set di Dockploy dashboard (Environment tab):

```
NODE_ENV=production
AUTH_SECRET=4kwjDR+ygN8k10Pa1osDCSuieDkOGN2nAu3RuA6Ezzo=
NEXTAUTH_URL=https://myhome.co.id
DATABASE_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
```

#### C. Domain Configuration
- **Domain**: `myhome.co.id`
- **SSL**: Enable (Let's Encrypt)
- **Port**: `3000`
- **Health Check Path**: `/api/health`

### 3. Deploy

1. Click **Deploy** button di Dockploy
2. Monitor build logs
3. Wait for deployment completion
4. Test: `https://myhome.co.id/api/health`

## 🧪 Testing

### Local Testing

```bash
# Test Docker build
chmod +x scripts/test-docker-build.sh
./scripts/test-docker-build.sh

# Manual build test
docker build -t myhome-test .
docker run -p 3000:3000 --env-file .env.production myhome-test
```

### Production Testing

```bash
# Health check
curl https://myhome.co.id/api/health

# Expected response
{
  "status": "OK",
  "checks": {
    "timestamp": "2024-10-04T...",
    "environment": "production",
    "deployment": "OK",
    "database": "OK",
    "auth_secret": "OK",
    "nextauth_url": "OK"
  }
}
```

## 🔍 Troubleshooting

### Build Fails

```bash
# Check Dockploy build logs
# Common issues:
# 1. Missing environment variables
# 2. Prisma schema issues
# 3. Node.js version compatibility
```

### Application Won't Start

```bash
# Check environment variables in Dockploy
# Required: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL
# Check application logs in Dockploy dashboard
```

### Database Connection Issues

```bash
# Verify DATABASE_URL format:
# postgresql://username:password@host:port/database?schema=public

# Test connection from container:
# docker exec -it container_name npx prisma db push
```

### Health Check Fails

```bash
# Check if application is running on port 3000
# Check if /api/health endpoint is accessible
# Check environment validation errors in logs
```

## 📊 Monitoring

### Health Checks
- **URL**: `https://myhome.co.id/api/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

### Performance Metrics
- **Build Time**: 3-5 minutes
- **Startup Time**: 10-30 seconds
- **Memory Usage**: ~200-500MB
- **Response Time**: <100ms for API endpoints

## 🔄 Updates & Maintenance

### Code Updates
1. Push changes to GitHub
2. Trigger redeploy in Dockploy
3. Monitor deployment progress
4. Test application functionality

### Environment Updates
1. Update variables in Dockploy dashboard
2. Restart application
3. Verify changes via health check

### Database Migrations
1. Migrations run automatically during deployment
2. Check logs for migration status
3. Verify database schema changes

## 🆘 Emergency Procedures

### Quick Rollback
1. Go to Dockploy dashboard
2. Select previous successful deployment
3. Click "Rollback"
4. Monitor rollback progress

### Skip Environment Validation (Emergency)
```bash
# Add to Dockploy environment variables:
SKIP_ENV_VALIDATION=true
# This should only be used for emergency debugging
```

## 🎯 Success Indicators

### ✅ Deployment Successful
- Build completes without errors
- Container starts successfully
- Health check returns 200 OK
- Domain accessible via HTTPS
- Environment validation passes

### ✅ Application Working
- Homepage loads: `https://myhome.co.id`
- API health check: `https://myhome.co.id/api/health`
- Authentication working
- Database connectivity confirmed
- Image uploads working (Cloudinary)

## 📞 Support

### Quick Commands
```bash
# Check deployment status
./scripts/deploy-dockploy.sh

# Test build locally
./scripts/test-docker-build.sh

# Health check
curl https://myhome.co.id/api/health
```

### Documentation
- `docs/DOCKPLOY_DEPLOYMENT.md` - Detailed Dockploy guide
- `docs/DOCKER_BUILD_GUIDE.md` - Docker build troubleshooting
- `docs/DOCKER_DEPLOYMENT.md` - General Docker deployment

**🎉 Deployment siap untuk production di Dockploy!**
