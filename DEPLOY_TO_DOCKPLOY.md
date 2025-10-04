# 🚀 Deploy MyHome ke Dockploy (myhome.co.id)

Panduan singkat dan mudah untuk deploy MyHome ke VPS menggunakan Dockploy.

## ✅ Pre-requisites

- [x] VPS dengan Dockploy terinstall
- [x] Domain `myhome.co.id` sudah diarahkan ke VPS
- [x] Repository GitHub: `https://github.com/netkrida/boxbook.git`
- [x] Database PostgreSQL sudah siap

## 🎯 Step 1: Validasi Setup

Jalankan script validasi untuk memastikan semua file siap:

```bash
# Windows PowerShell
.\scripts\check-deployment.ps1

# Linux/Mac/Git Bash
bash scripts/deploy-dockploy.sh
```

Pastikan semua ✅ hijau sebelum lanjut ke step berikutnya.

## 🎯 Step 2: Create Application di Dockploy

1. **Login** ke Dockploy dashboard
2. **Click** "Create Application"
3. **Pilih** "Docker" atau "Dockerfile"
4. **Isi** konfigurasi:
   ```
   Application Name: myhome
   Repository URL: https://github.com/netkrida/boxbook.git
   Branch: main
   Build Context: /
   Dockerfile Path: Dockerfile
   ```

## 🎯 Step 3: Set Environment Variables

Copy-paste environment variables berikut ke Dockploy (Environment tab):

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
AUTH_SECRET=4kwjDR+ygN8k10Pa1osDCSuieDkOGN2nAu3RuA6Ezzo=
NEXTAUTH_URL=https://myhome.co.id
DATABASE_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public
DIRECT_URL=postgresql://postgres:myhome123@myhome-myhome-4liigw:5432/db_myhome?schema=public
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ
NEXT_PUBLIC_APP_NAME=MyHome
NEXT_TELEMETRY_DISABLED=1
```

**Optional** (jika diperlukan):
```bash
MIDTRANS_SERVER_KEY=[YOUR-MIDTRANS-SERVER-KEY]
MIDTRANS_CLIENT_KEY=[YOUR-MIDTRANS-CLIENT-KEY]
MIDTRANS_IS_PRODUCTION=false
AUTH_DISCORD_ID=your_discord_client_id_here
AUTH_DISCORD_SECRET=your_discord_client_secret_here
```

## 🎯 Step 4: Configure Domain

1. **Go to** "Domains" tab
2. **Add domain**: `myhome.co.id`
3. **Enable SSL** (Let's Encrypt)
4. **Enable** Force HTTPS
5. **Click** "Save"

## 🎯 Step 5: Configure Health Check

1. **Go to** "Settings" atau "Health Check" tab
2. **Set**:
   ```
   Health Check Path: /api/health
   Health Check Interval: 30s
   Health Check Timeout: 10s
   Health Check Retries: 3
   ```

## 🎯 Step 6: Deploy!

1. **Go to** "Deployments" tab
2. **Click** "Deploy"
3. **Monitor** build logs
4. **Wait** for deployment completion (3-5 minutes)

## 🧪 Step 7: Test Deployment

### Health Check
```bash
curl https://myhome.co.id/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "checks": {
    "environment": "production",
    "deployment": "OK",
    "database": "OK",
    "auth_secret": "OK",
    "nextauth_url": "OK"
  }
}
```

### Application Access
- **Homepage**: https://myhome.co.id
- **Login**: https://myhome.co.id/login
- **Admin Dashboard**: https://myhome.co.id/dashboard

## 🔍 Troubleshooting

### ❌ Build Fails
**Check:**
- Environment variables are set correctly
- Repository access permissions
- Build logs for specific errors

**Fix:**
```bash
# Re-run validation
.\scripts\check-deployment.ps1

# Check specific error in Dockploy build logs
```

### ❌ Application Won't Start
**Check:**
- All required environment variables are set
- AUTH_SECRET length (minimum 32 characters)
- DATABASE_URL format is correct

**Fix:**
```bash
# Verify environment variables in Dockploy
# Check application logs in Dockploy dashboard
```

### ❌ Health Check Fails
**Check:**
- Application is running on port 3000
- Database connectivity
- Environment validation passes

**Fix:**
```bash
# Test health endpoint manually
curl https://myhome.co.id/api/health

# Check application logs for startup errors
```

### ❌ Domain Not Accessible
**Check:**
- DNS settings point to Dockploy server IP
- SSL certificate status
- Domain configuration in Dockploy

**Fix:**
```bash
# Test DNS resolution
nslookup myhome.co.id

# Test SSL certificate
openssl s_client -connect myhome.co.id:443
```

## 🔄 Updates

### Code Updates
1. Push changes to GitHub
2. Go to Dockploy → Deployments
3. Click "Redeploy"
4. Monitor logs
5. Test functionality

### Environment Updates
1. Go to Dockploy → Environment
2. Update variables
3. Save changes
4. Restart application
5. Test via health check

## 📊 Monitoring

### Real-time Monitoring
- **Application Logs**: Dockploy → Logs tab
- **Performance**: Dockploy → Metrics tab
- **Health Status**: https://myhome.co.id/api/health

### Setup Alerts
- Health check failures
- High resource usage
- SSL certificate expiry
- Application downtime

## 🆘 Emergency

### Quick Rollback
1. Dockploy → Deployments
2. Find previous successful deployment
3. Click "Rollback"
4. Monitor progress

### Emergency Access
```bash
# Skip environment validation (emergency only)
SKIP_ENV_VALIDATION=true
```

## ✅ Success Checklist

- [ ] ✅ Build completes without errors
- [ ] ✅ Container starts successfully  
- [ ] ✅ Health check returns 200 OK
- [ ] ✅ Domain accessible via HTTPS
- [ ] ✅ Environment validation passes
- [ ] ✅ Database connectivity confirmed
- [ ] ✅ Image uploads working (Cloudinary)
- [ ] ✅ Authentication working
- [ ] ✅ All pages loading correctly

## 📞 Quick Reference

### Important URLs
- **Production**: https://myhome.co.id
- **Health Check**: https://myhome.co.id/api/health
- **Admin**: https://myhome.co.id/dashboard

### Important Commands
```bash
# Validate setup
.\scripts\check-deployment.ps1

# Test health
curl https://myhome.co.id/api/health

# Test SSL
curl -I https://myhome.co.id
```

### Support Files
- `dockploy-config.md` - Detailed configuration
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DOCKER_SETUP_SUMMARY.md` - Technical summary

---

**🎉 MyHome siap production di https://myhome.co.id!**

**💡 Tip**: Bookmark halaman health check untuk monitoring cepat: https://myhome.co.id/api/health
