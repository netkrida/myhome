# 🚀 Konfigurasi Dockploy untuk MyHome (myhome.co.id)

Panduan step-by-step untuk deploy MyHome di Dockploy dengan domain `myhome.co.id`.

## 📋 Environment Variables untuk Dockploy

Copy dan paste environment variables berikut ke Dockploy dashboard:

### 🔐 Required Variables (WAJIB)

```bash
# Core Configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Authentication & Security
AUTH_SECRET=4kwjDR+ygN8k10Pa1osDCSuieDkOGN2nAu3RuA6Ezzo=
NEXTAUTH_URL=https://myhome.co.id

# Database
DATABASE_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public
DIRECT_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ

# Application
NEXT_PUBLIC_APP_NAME=MyHome
NEXT_TELEMETRY_DISABLED=1
```

### 🎛️ Optional Variables (OPSIONAL)

```bash
# Payment Gateway (Midtrans)
MIDTRANS_SERVER_KEY=[YOUR-MIDTRANS-SERVER-KEY]
MIDTRANS_CLIENT_KEY=[YOUR-MIDTRANS-CLIENT-KEY]
MIDTRANS_IS_PRODUCTION=false

# OAuth (Discord - Optional)
AUTH_DISCORD_ID=your_discord_client_id_here
AUTH_DISCORD_SECRET=your_discord_client_secret_here
```

## 🔧 Konfigurasi Dockploy

### 1. Application Settings

```
Application Name: myhome
Repository URL: https://github.com/netkrida/boxbook.git
Branch: main
Build Context: /
Dockerfile Path: Dockerfile
```

### 2. Build Settings

```
Build Command: (automatic from Dockerfile)
Start Command: (automatic from Dockerfile)
Port: 3000
```

### 3. Domain & SSL

```
Domain: myhome.co.id
SSL: Enable (Let's Encrypt)
Force HTTPS: Yes
```

### 4. Health Check

```
Health Check Path: /api/health
Health Check Interval: 30s
Health Check Timeout: 10s
Health Check Retries: 3
```

## 🚀 Step-by-Step Deployment

### Step 1: Create Application di Dockploy

1. Login ke Dockploy dashboard
2. Click **"Create Application"**
3. Pilih **"Docker"** atau **"Dockerfile"**
4. Masukkan nama: `myhome`

### Step 2: Connect Repository

1. Pilih **"GitHub"** sebagai source
2. Repository URL: `https://github.com/netkrida/boxbook.git`
3. Branch: `main`
4. Build Context: `/`
5. Dockerfile Path: `Dockerfile`

### Step 3: Set Environment Variables

1. Go to **"Environment"** tab
2. Copy-paste semua environment variables dari section "Required Variables" di atas
3. Tambahkan optional variables jika diperlukan
4. Click **"Save"**

### Step 4: Configure Domain

1. Go to **"Domains"** tab
2. Add domain: `myhome.co.id`
3. Enable SSL (Let's Encrypt)
4. Enable Force HTTPS
5. Click **"Save"**

### Step 5: Deploy

1. Go to **"Deployments"** tab
2. Click **"Deploy"**
3. Monitor build logs
4. Wait for deployment to complete

## 🧪 Testing Deployment

### 1. Health Check

```bash
curl https://myhome.co.id/api/health
```

Expected response:
```json
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

### 2. Application Access

- **Homepage**: https://myhome.co.id
- **Login**: https://myhome.co.id/login
- **API Health**: https://myhome.co.id/api/health

### 3. Database Connection

Health check akan otomatis test koneksi database. Jika ada masalah, check:
- DATABASE_URL format
- Database server accessibility
- Credentials validity

## 🔍 Troubleshooting

### Build Fails

**Symptoms**: Build process stops with error
**Solutions**:
1. Check environment variables are set correctly
2. Verify Dockerfile syntax
3. Check repository access permissions
4. Review build logs for specific errors

### Application Won't Start

**Symptoms**: Build succeeds but container doesn't start
**Solutions**:
1. Verify all required environment variables are set
2. Check AUTH_SECRET length (minimum 32 characters)
3. Verify DATABASE_URL format
4. Check application logs in Dockploy

### Health Check Fails

**Symptoms**: Health endpoint returns error or timeout
**Solutions**:
1. Check if application is running on port 3000
2. Verify environment validation passes
3. Test database connectivity
4. Check application logs for startup errors

### Domain Not Accessible

**Symptoms**: Domain doesn't resolve or shows error
**Solutions**:
1. Verify DNS settings point to Dockploy server
2. Check SSL certificate status
3. Verify domain configuration in Dockploy
4. Check Traefik routing logs

## 📊 Monitoring

### Application Logs

Access logs melalui Dockploy dashboard:
1. Go to application
2. Click **"Logs"** tab
3. Monitor real-time logs
4. Filter by log level if needed

### Performance Metrics

Monitor melalui Dockploy dashboard:
- CPU usage
- Memory usage
- Network traffic
- Response times

### Health Monitoring

Setup monitoring untuk:
- Health endpoint: `https://myhome.co.id/api/health`
- Application uptime
- Database connectivity
- SSL certificate expiry

## 🔄 Updates & Maintenance

### Code Updates

1. Push changes ke GitHub repository
2. Go to Dockploy dashboard
3. Click **"Redeploy"**
4. Monitor deployment progress
5. Test application functionality

### Environment Updates

1. Go to **"Environment"** tab di Dockploy
2. Update environment variables
3. Click **"Save"**
4. Restart application
5. Verify changes via health check

### Database Migrations

Migrations akan otomatis berjalan saat deployment. Monitor logs untuk:
- Migration status
- Schema changes
- Data integrity

## 🆘 Emergency Procedures

### Quick Rollback

1. Go to **"Deployments"** tab
2. Find previous successful deployment
3. Click **"Rollback"**
4. Monitor rollback progress
5. Test application functionality

### Emergency Access

Jika aplikasi tidak accessible:
1. Check Dockploy server status
2. Verify DNS settings
3. Check SSL certificate
4. Contact Dockploy support if needed

### Skip Environment Validation

Hanya untuk emergency debugging:
```bash
# Add to environment variables:
SKIP_ENV_VALIDATION=true
```

**⚠️ Warning**: Hanya gunakan untuk debugging, jangan untuk production normal.

## ✅ Success Checklist

- [ ] Build completes without errors
- [ ] Container starts successfully
- [ ] Health check returns 200 OK
- [ ] Domain accessible via HTTPS
- [ ] Environment validation passes
- [ ] Database connectivity confirmed
- [ ] Image uploads working (Cloudinary)
- [ ] Authentication working
- [ ] All API endpoints responding

## 📞 Support

### Quick Commands untuk Testing

```bash
# Health check
curl https://myhome.co.id/api/health

# Test HTTPS redirect
curl -I http://myhome.co.id

# Test SSL certificate
openssl s_client -connect myhome.co.id:443 -servername myhome.co.id
```

### Documentation Links

- [Dockploy Documentation](https://dockploy.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

**🎉 MyHome siap untuk production di myhome.co.id!**
