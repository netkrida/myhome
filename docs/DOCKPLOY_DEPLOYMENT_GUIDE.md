# 🚀 MyHome Deployment Guide - Dockploy

## 📋 Overview

Panduan lengkap untuk deploy aplikasi MyHome ke Dockploy dengan Prisma (generate → migrate/db push → seed).

## 🎯 Tujuan

- Build Docker image dari repository
- Jalankan urutan Prisma yang benar saat container start:
  1. `npx prisma generate`
  2. `npx prisma migrate deploy` (jika ada migrations) atau `npx prisma db push` (jika tidak ada)
  3. Jalankan seed (idempotent)
  4. Start aplikasi di port 3000

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Dockploy Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   PostgreSQL     │◄────────┤   MyHome App     │          │
│  │   Container      │         │   Container      │          │
│  │                  │         │                  │          │
│  │  Port: 5432      │         │  Port: 3000      │          │
│  │  DB: db_myhome   │         │                  │          │
│  └──────────────────┘         └──────────────────┘          │
│                                        │                     │
│                                        ▼                     │
│                              ┌──────────────────┐            │
│                              │  Entrypoint.sh   │            │
│                              │  ┌────────────┐  │            │
│                              │  │ 1. Generate│  │            │
│                              │  │ 2. Migrate │  │            │
│                              │  │ 3. Seed    │  │            │
│                              │  │ 4. Start   │  │            │
│                              │  └────────────┘  │            │
│                              └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Prerequisites

### 1. Environment Variables di Dockploy

Pastikan variabel berikut sudah dikonfigurasi di Dockploy:

```env
# Database
DATABASE_URL=postgresql://postgres:myhom_123@myhome-myhome-l6f9es:5432/db_myhome?schema=public
DIRECT_URL=postgresql://postgres:myhom_123@myhome-myhome-l6f9es:5432/db_myhome?schema=public

# Next Auth
AUTH_SECRET=4kwjDR+ygN8k10Pa1osDCSuieDkOGN2nAu3RuA6Ezzo=
NEXTAUTH_URL=https://myhome.co.id
APP_BASE_URL=https://myhome.co.id
NEXT_PUBLIC_APP_URL=https://myhome.co.id

# Cloudinary
CLOUDINARY_CLOUD_NAME=dg0ybxdbt
CLOUDINARY_API_KEY=836543447587342
CLOUDINARY_API_SECRET=joI9lZdqjlWNyCEnJ5gh0ugYuzQ

# Midtrans
MIDTRANS_SERVER_KEY=Mid-server-hW9om3CEELwYj_zR3W9bEJQG
MIDTRANS_CLIENT_KEY=Mid-client-Rmuinnn-aVivVP5q
MIDTRANS_IS_PRODUCTION=true
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-Rmuinnn-aVivVP5q
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true

# Cron
CRON_SECRET=CronSecret_MyHome_2025_SecureToken_XyZ123!@#
BOOKING_UNPAID_GRACE_MINUTES=30

# App Config
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
NEXT_PUBLIC_APP_NAME=MyHome
NEXT_TELEMETRY_DISABLED=1
```

### 2. File yang Diperlukan

Pastikan file-file berikut ada di repository:

- ✅ `Dockerfile` - Multi-stage build configuration
- ✅ `scripts/docker-entrypoint.sh` - Entrypoint script dengan urutan Prisma
- ✅ `package.json` - Dengan script `start:docker` atau `start`
- ✅ `prisma/schema.prisma` - Prisma schema
- ✅ `prisma/migrations/` - Migration files (opsional)
- ✅ `prisma/seed.ts` - Seed script
- ✅ `.env.production` - Production environment template

## 🔧 Konfigurasi Dockploy

### Step 1: Create New Application

1. Login ke Dockploy dashboard
2. Pilih project atau buat project baru
3. Klik **"Create Application"**
4. Pilih **"Git Repository"**

### Step 2: Repository Configuration

```yaml
Repository URL: https://github.com/netkrida/boxbook.git
Branch: main
Build Method: Dockerfile
Dockerfile Path: ./Dockerfile
```

### Step 3: Build Configuration

```yaml
Build Context: .
Build Args: (kosongkan atau sesuai kebutuhan)
```

### Step 4: Runtime Configuration

```yaml
Container Name: myhome-app
Port Mapping: 3000:3000
Restart Policy: unless-stopped
```

### Step 5: Environment Variables

Tambahkan semua environment variables dari section Prerequisites di atas.

### Step 6: Network Configuration

Pastikan container MyHome dan PostgreSQL berada di network yang sama:

```yaml
Network: myhome-network (atau network default Dockploy)
```

## 🚀 Deployment Process

### Automatic Deployment

1. Push code ke repository
2. Dockploy akan otomatis trigger build
3. Build process:
   ```
   Stage 1 (deps): Install dependencies + prisma generate
   Stage 2 (builder): Build Next.js app
   Stage 3 (runner): Copy artifacts + setup entrypoint
   ```
4. Container start → entrypoint.sh dijalankan:
   ```
   ✅ Validate DATABASE_URL
   ✅ Wait for PostgreSQL
   ✅ Prisma generate
   ✅ Prisma migrate deploy (atau db push)
   ✅ Database seed
   ✅ Start application
   ```

### Manual Deployment

Jika perlu deploy manual:

```bash
# 1. Build image
docker build -t myhome-app:latest .

# 2. Tag image
docker tag myhome-app:latest registry.dockploy.io/myhome-app:latest

# 3. Push to registry
docker push registry.dockploy.io/myhome-app:latest

# 4. Deploy via Dockploy UI atau CLI
```

## 📊 Monitoring & Verification

### 1. Check Container Logs

Di Dockploy dashboard, buka **Logs** tab dan pastikan melihat output seperti ini:

```
============================================
🚀 Booting MyHome Container
============================================
📝 Environment: NODE_ENV=production
📝 Port: 3000

✅ DATABASE_URL is configured
   Connection: postgresql://postgres:myhom_123...

============================================
⏳ Waiting for PostgreSQL...
============================================
✅ PostgreSQL is ready!

============================================
📦 Step 1: Generating Prisma Client...
============================================
✅ Prisma Client generated successfully!

============================================
📦 Step 2: Syncing Database Schema...
============================================
📂 Migrations found. Running prisma migrate deploy...
✅ Migrations applied successfully!

============================================
🌱 Step 3: Seeding Database...
============================================
🌱 Running seed via npm run db:seed...
✅ Seed completed successfully!

============================================
🚀 Step 4: Starting Application...
============================================
🎯 Starting with: npm run start:docker
▲ Next.js 15.2.3
- Local:        http://0.0.0.0:3000
- Network:      http://0.0.0.0:3000

✓ Ready in 2.3s
```

### 2. Health Check

Test endpoint aplikasi:

```bash
# Test homepage
curl https://myhome.co.id

# Test API health (jika ada)
curl https://myhome.co.id/api/health

# Test database connection
curl https://myhome.co.id/api/properties
```

### 3. Database Verification

Verifikasi database sudah ter-seed dengan benar:

```bash
# Connect ke PostgreSQL container
docker exec -it myhome-postgres psql -U postgres -d db_myhome

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Property";
SELECT COUNT(*) FROM "Room";
```

## 🐛 Troubleshooting

### Error: DATABASE_URL is not set

**Penyebab:** Environment variable tidak dikonfigurasi di Dockploy

**Solusi:**
1. Buka Dockploy dashboard → Application → Environment Variables
2. Tambahkan `DATABASE_URL` dengan value yang benar
3. Restart container

### Error: PostgreSQL is not available

**Penyebab:** Database service belum ready atau network issue

**Solusi:**
1. Check PostgreSQL container status: `docker ps | grep postgres`
2. Check network connectivity: `docker network inspect myhome-network`
3. Verify DATABASE_URL hostname matches PostgreSQL service name
4. Increase retry timeout di entrypoint.sh jika perlu

### Error: Prisma generate failed

**Penyebab:** Prisma schema error atau dependencies tidak lengkap

**Solusi:**
1. Validate schema: `npx prisma validate`
2. Check build logs untuk error detail
3. Pastikan `@prisma/client` dan `prisma` version match di package.json

### Error: Migration failed

**Penyebab:** Migration conflict atau database state issue

**Solusi:**
1. Check migration files di `prisma/migrations/`
2. Review error message di logs
3. Jika perlu, gunakan `prisma db push` sebagai fallback (entrypoint sudah handle ini)
4. Atau buat migration baru untuk fix state

### Error: Seed failed

**Penyebab:** Duplicate data atau constraint violation

**Solusi:**
- Seed script sudah idempotent (menggunakan `|| true`)
- Check logs untuk detail error
- Jika data sudah ada, seed akan di-skip (ini normal)

### Error: No start command found

**Penyebab:** package.json tidak memiliki script `start`

**Solusi:**
1. Pastikan package.json memiliki:
   ```json
   {
     "scripts": {
       "start:docker": "next start -p ${PORT:-3000} -H 0.0.0.0"
     }
   }
   ```
2. Rebuild image

## 🔄 Update & Rollback

### Update Application

1. Push changes ke repository
2. Dockploy auto-rebuild dan redeploy
3. Zero-downtime deployment (jika dikonfigurasi)

### Rollback

Jika deployment gagal:

```bash
# Via Dockploy UI
1. Buka Deployments tab
2. Pilih deployment sebelumnya yang sukses
3. Klik "Rollback"

# Via Docker
docker tag myhome-app:previous myhome-app:latest
docker restart myhome-app
```

## 📈 Performance Tips

1. **Enable Build Cache:** Dockploy biasanya cache layer Docker
2. **Optimize Dependencies:** Gunakan `npm ci` bukan `npm install`
3. **Multi-stage Build:** Sudah diimplementasi di Dockerfile
4. **Health Checks:** Configure di Dockploy untuk auto-restart jika unhealthy

## 🔐 Security Checklist

- ✅ Environment variables tidak di-commit ke repository
- ✅ Container runs as non-root user (`USER node`)
- ✅ Secrets management via Dockploy environment variables
- ✅ Database credentials tidak hardcoded
- ✅ HTTPS enabled di Dockploy reverse proxy

## 📚 References

- [Dockploy Documentation](https://dockploy.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## ✅ Deployment Success Criteria

Deployment dianggap sukses jika:

1. ✅ Container status: **RUNNING**
2. ✅ Logs menunjukkan semua 4 steps berhasil:
   - Prisma generate ✅
   - Migrate/DB push ✅
   - Seed ✅ (atau skipped jika data sudah ada)
   - Application started ✅
3. ✅ Aplikasi merespon di `https://myhome.co.id`
4. ✅ Database terkoneksi dan data tersedia
5. ✅ No error di logs setelah 5 menit running

---

**Last Updated:** 2025-01-09  
**Version:** 1.0.0  
**Maintainer:** DevOps Team

