# 🕐 Cron Deployment Guide - Multi Environment

Panduan setup cron cleanup untuk **Vercel** dan **VPS (Docker)**.

---

## 🎯 Overview

Aplikasi ini memiliki **2 environment deployment**:

| Environment | Cron Method | File Config |
|-------------|-------------|-------------|
| **Vercel** | Vercel Cron Jobs | `vercel.json` |
| **VPS (Docker)** | Docker Cron Container | `docker-compose.yml` + `docker/cron/` |

**Route Handler** (`src/app/api/cron/cleanup-expired/route.ts`) **mendukung kedua environment** secara otomatis.

---

## 🚀 Setup untuk Vercel

### 1. Konfigurasi File

File `vercel.json` sudah dikonfigurasi:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "*/5 * * * *"
    }
  ],
  "env": {
    "DEPLOYMENT_ENV": "vercel"
  }
}
```

### 2. Set Environment Variables

Buka **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

```env
# Required - Generate dengan: openssl rand -base64 32
CRON_SECRET=your-generated-secret-here

# Optional - Grace period dalam menit (default: 30)
BOOKING_UNPAID_GRACE_MINUTES=30
```

### 3. Generate CRON_SECRET

```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Linux/Mac/WSL
openssl rand -base64 32
```

### 4. Deploy

```bash
git add vercel.json
git commit -m "feat: add Vercel cron configuration"
git push origin main
```

### 5. Verifikasi

**Di Vercel Dashboard:**
- Go to **Settings** → **Cron Jobs**
- Pastikan muncul: `/api/cron/cleanup-expired` (Every 5 minutes)

**Test Manual:**
```bash
curl -X GET "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Monitor Logs:**
```bash
vercel logs --follow | grep "Cron Cleanup"
```

---

## 🐳 Setup untuk VPS (Docker)

### 1. Konfigurasi File

**File `docker-compose.yml` sudah dikonfigurasi** dengan service `cron`:

```yaml
services:
  app:
    container_name: myhome-app
    environment:
      CRON_SECRET: ${CRON_SECRET}
      BOOKING_UNPAID_GRACE_MINUTES: ${BOOKING_UNPAID_GRACE_MINUTES:-30}
    # ... other config

  cron:
    container_name: myhome-cron
    build:
      context: ./docker/cron
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      CRON_SECRET: ${CRON_SECRET}
      APP_URL: http://app:3000
      TZ: ${TZ:-UTC}
    depends_on:
      app:
        condition: service_healthy
    networks:
      - myhome
```

### 2. Set Environment Variables

Edit file `.env.production` di VPS:

```env
# Cron Configuration
CRON_SECRET=your-generated-secret-here
BOOKING_UNPAID_GRACE_MINUTES=30
TZ=Asia/Jakarta
```

### 3. Deploy ke VPS

```bash
# SSH ke VPS
ssh user@your-vps-ip

# Navigate ke project directory
cd /path/to/myhomeapp

# Pull latest code
git pull origin main

# Rebuild dan restart services
docker-compose down
docker-compose up -d --build

# Verify cron service running
docker ps | grep myhome-cron
```

### 4. Verifikasi

**Check Cron Container:**
```bash
# Check if cron container running
docker ps -a | grep myhome-cron

# View cron logs
docker logs -f myhome-cron
```

**Test Manual dari dalam VPS:**
```bash
# Exec into app container
docker exec -it myhome-app bash

# Test cleanup endpoint
curl -X GET "http://localhost:3000/api/cron/cleanup-expired" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Monitor Cleanup Logs:**
```bash
# Real-time logs from both containers
docker logs -f myhome-cron
docker logs -f myhome-app | grep "Cron Cleanup"
```

---

## 🔍 How It Works

### Route Handler Auto-Detection

File `src/app/api/cron/cleanup-expired/route.ts` **automatically detects** environment:

```typescript
export async function GET(request: NextRequest) {
  // Check if request is from Vercel Cron
  const isVercelCron = request.headers.get("x-vercel-cron") === "true";
  
  if (!isVercelCron) {
    // Manual call or Docker cron - require Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }
  
  // Execute cleanup...
}
```

**Detection Logic:**

| Source | Header | Auth Method |
|--------|--------|-------------|
| Vercel Cron | `x-vercel-cron: true` | No Bearer token needed |
| Docker Cron | No special header | Requires `Authorization: Bearer <secret>` |
| Manual Test | No special header | Requires `Authorization: Bearer <secret>` |

---

## 🧪 Testing

### Test Cleanup Logic

```sql
-- Create test expired payment
INSERT INTO "Payment" (id, "bookingId", amount, status, "expiryTime", "createdAt", "updatedAt")
VALUES (
  'test-pay-' || gen_random_uuid(),
  'existing-booking-id',
  500000,
  'PENDING',
  NOW() - INTERVAL '1 hour',
  NOW(),
  NOW()
);

-- Wait for cron to run (max 5 minutes)

-- Check if payment expired
SELECT id, status, "expiryTime", "updatedAt"
FROM "Payment"
WHERE id LIKE 'test-pay-%'
ORDER BY "updatedAt" DESC;
```

### Test Manual Trigger

**Vercel:**
```bash
curl -X GET "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**VPS (from outside):**
```bash
curl -X GET "https://yourdomain.com/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**VPS (from inside container):**
```bash
docker exec -it myhome-app curl -X GET "http://localhost:3000/api/cron/cleanup-expired" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 📊 Monitoring

### Vercel

```bash
# Real-time logs
vercel logs --follow

# Filter cron logs
vercel logs --follow | grep "Cron Cleanup"

# View last 1 hour
vercel logs --since 1h
```

### VPS (Docker)

```bash
# View cron container logs
docker logs -f myhome-cron

# View app container logs (cleanup execution)
docker logs -f myhome-app | grep "Cron Cleanup"

# View both in parallel
docker-compose logs -f app cron
```

### Database Verification

```sql
-- Check expired payments in last hour
SELECT 
  COUNT(*) FILTER (WHERE status = 'EXPIRED' AND "updatedAt" > NOW() - INTERVAL '1 hour') as recent_expired,
  COUNT(*) FILTER (WHERE status = 'PENDING' AND "expiryTime" < NOW()) as should_expire
FROM "Payment";

-- Check recent cleanup activity
SELECT 
  DATE_TRUNC('minute', "updatedAt") as cleanup_time,
  COUNT(*) as expired_count
FROM "Payment"
WHERE status = 'EXPIRED'
  AND "updatedAt" > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', "updatedAt")
ORDER BY cleanup_time DESC;
```

---

## 🆘 Troubleshooting

### Vercel: Cron Not Running

```bash
# 1. Check vercel.json deployed
curl https://yourdomain.vercel.app/vercel.json

# 2. Check Vercel Dashboard
# Settings → Cron Jobs → Should show the job

# 3. Check environment variables
# Settings → Environment Variables → CRON_SECRET should exist

# 4. Redeploy
vercel --prod
```

### VPS: Cron Container Not Running

```bash
# 1. Check container status
docker ps -a | grep myhome-cron

# 2. Check container logs
docker logs myhome-cron

# 3. Restart container
docker-compose restart cron

# 4. Rebuild if needed
docker-compose up -d --build cron

# 5. Check if app service is healthy
docker ps | grep myhome-app
curl http://localhost:3000/api/health
```

### 401 Unauthorized Error

```bash
# 1. Verify CRON_SECRET in environment
# Vercel:
vercel env ls

# VPS:
docker exec myhome-app env | grep CRON_SECRET

# 2. Test with correct secret
# Make sure no extra spaces or newlines in CRON_SECRET

# 3. Regenerate secret if needed
openssl rand -base64 32
```

### No Data Cleaned

```sql
-- 1. Check if there's expired data
SELECT 
  COUNT(*) FILTER (WHERE status = 'PENDING' AND "expiryTime" < NOW()) as pending_expired,
  COUNT(*) FILTER (WHERE status = 'UNPAID') as unpaid_bookings
FROM "Payment" 
LEFT JOIN "Booking" ON "Payment"."bookingId" = "Booking".id;

-- 2. Check grace period
-- If BOOKING_UNPAID_GRACE_MINUTES=30, bookings must be >30 minutes old
SELECT id, status, "createdAt", NOW() - "createdAt" as age
FROM "Booking"
WHERE status = 'UNPAID'
  AND NOW() - "createdAt" > INTERVAL '30 minutes';
```

---

## 🔐 Security Best Practices

### 1. CRON_SECRET Management

- **Generate strong secrets:** `openssl rand -base64 32`
- **Never commit to git:** Add to `.gitignore`
- **Rotate periodically:** Every 3-6 months
- **Different secrets per environment:** Vercel vs VPS should use different secrets

### 2. Network Security (VPS)

```yaml
# docker-compose.yml
services:
  cron:
    # Cron container only needs internal network access
    networks:
      - myhome  # Internal network only, no exposed ports
```

### 3. Monitoring & Alerts

```bash
# Setup alerts for failed cleanups
# Option 1: Log monitoring (e.g., Grafana Loki)
# Option 2: External monitoring (e.g., UptimeRobot, Pingdom)
# Option 3: Custom webhook to Slack/Discord

# Example: Alert if cleanup fails 3 times in a row
# Implement in route handler to send webhook on consecutive failures
```

---

## 📚 Related Documentation

- [`docs/API-CRON-CLEANUP.md`](./API-CRON-CLEANUP.md) - API specification
- [`docs/CRON-CLEANUP-IMPLEMENTATION.md`](./CRON-CLEANUP-IMPLEMENTATION.md) - Implementation details
- [`docs/CRON-QUICKSTART.md`](./CRON-QUICKSTART.md) - Quick reference
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Docker Cron Setup](https://docs.docker.com/config/containers/resource_constraints/)

---

## ✅ Quick Checklist

### Vercel Setup
- [ ] `vercel.json` created with cron config
- [ ] `CRON_SECRET` set in Vercel env variables
- [ ] Deploy triggered
- [ ] Cron job visible in Vercel Dashboard
- [ ] Manual test successful
- [ ] Logs showing cleanup execution

### VPS Setup
- [ ] `docker-compose.yml` has cron service
- [ ] `.env.production` has `CRON_SECRET`
- [ ] Docker containers rebuilt
- [ ] Cron container running (`docker ps`)
- [ ] Manual test successful
- [ ] Logs showing cleanup execution

---

**🎉 Both environments are now configured!** Cron cleanup will run automatically every 5 minutes in both Vercel and VPS.
