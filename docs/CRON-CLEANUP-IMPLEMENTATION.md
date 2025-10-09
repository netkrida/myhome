# 🔄 Cron Cleanup System - Implementation Summary

## 📦 File yang Dibuat/Dimodifikasi

### 1. Prisma Schema
**File**: `prisma/schema.prisma`

**Perubahan**:
- ✅ Tambah index `@@index([createdAt])` pada model `Booking`
- ✅ Tambah index `@@index([status, expiryTime])` pada model `Payment`
- ✅ Tambah index `@@index([expiryTime])` pada model `Payment`

**Tujuan**: Optimasi query untuk cleanup process

---

### 2. Service Layer (Tier-2)
**File**: `src/server/api/booking/cleanupExpiredBookings.ts`

**Fungsi**:
- Orchestrator untuk cleanup process
- Menggunakan Prisma transaction untuk atomicity
- Expire Payment PENDING yang melewati expiryTime
- Delete Booking UNPAID dengan kriteria:
  - Punya Payment EXPIRED, atau
  - Tidak punya Payment dan melewati grace period
- Update Room.isAvailable = true
- Recalculate Property.availableRooms

**Return**: CleanupReport dengan metrik lengkap

---

### 3. API Route - Cron Endpoint (Tier-1)
**File**: `src/app/api/cron/cleanup-expired/route.ts`

**Method**: GET

**Auth**: Bearer token (CRON_SECRET)

**Fungsi**:
- Validate Authorization header
- Parse grace period dari environment
- Call CleanupExpiredBookingsService
- Return JSON report

**Response**:
```json
{
  "success": true,
  "data": {
    "executedAt": "2025-01-09T10:30:00.000Z",
    "graceMinutes": 30,
    "expiredPaymentsCount": 5,
    "deletedBookingsCount": 3,
    "deletedBookingIds": ["id1", "id2", "id3"]
  }
}
```

---

### 4. Health Check Endpoint
**File**: `src/app/api/health/route.ts`

**Status**: ✅ Sudah ada (tidak perlu modifikasi)

**Fungsi**: Healthcheck untuk Docker container

---

### 5. Docker - Cron Container
**File**: `docker/cron/Dockerfile`

**Base Image**: alpine:3.19

**Dependencies**:
- curl
- bash
- busybox-suid
- tzdata

**CMD**: `crond -f -l 2` (foreground mode)

---

### 6. Cleanup Script
**File**: `docker/cron/cleanup.sh`

**Fungsi**:
- Validate CRON_SECRET environment
- Call internal API: `http://app:3000/api/cron/cleanup-expired`
- Retry logic: --retry 3 --retry-delay 2 --max-time 20
- Log output ke STDOUT

**Executable**: chmod +x

---

### 7. Crontab Configuration
**File**: `docker/cron/crontab`

**Schedule**: `*/5 * * * *` (setiap 5 menit)

**Command**: `/usr/local/bin/cleanup.sh >> /proc/1/fd/1 2>&1`

**Output**: Redirect ke STDOUT untuk Docker logging

---

### 8. Dockerfile App
**File**: `Dockerfile`

**Perubahan**:
- ✅ Tambah `openssl` di deps stage
- ✅ Tambah `RUN npx prisma generate` di deps stage

**Tujuan**: Ensure Prisma Client generated saat build

---

### 9. Docker Compose
**File**: `docker-compose.yml`

**Perubahan**:
- ✅ Tambah environment `CRON_SECRET` dan `BOOKING_UNPAID_GRACE_MINUTES` di app service
- ✅ Tambah service `cron` dengan:
  - Build context: `./docker/cron`
  - Environment: CRON_SECRET, APP_URL, TZ
  - Depends on: app (condition: service_healthy)
  - Network: myhome

**Services**:
1. **app**: Next.js application (port 3000)
2. **cron**: Alpine cron container
3. **postgres**: PostgreSQL database

---

### 10. Environment Variables
**File**: `.env.example`

**Tambahan**:
```env
# Cron Configuration
CRON_SECRET="your-random-secret-token-here"
BOOKING_UNPAID_GRACE_MINUTES="30"
TZ="UTC"
```

**File**: `.env.production`

**Tambahan**:
```env
CRON_SECRET="CronSecret_MyHome_2025_SecureToken_XyZ123!@#"
BOOKING_UNPAID_GRACE_MINUTES="30"
```

---

### 11. Deployment Guide
**File**: `README-CRON-DEPLOYMENT.md`

**Konten**:
- Overview sistem
- Arsitektur 3-tier
- Docker services diagram
- Prasyarat
- Konfigurasi environment
- Deployment via Dockploy (UI & Git)
- Verifikasi & testing
- Monitoring
- Troubleshooting
- Security best practices

---

## 🎯 Kriteria Penerimaan

### ✅ Functional Requirements

1. **Auth Protection**
   - ❌ Request tanpa header auth → 401
   - ❌ Request dengan token salah → 401
   - ✅ Request dengan token benar → 200 + report

2. **Payment Expiration**
   - ✅ Payment PENDING dengan expiryTime < now() → status EXPIRED

3. **Booking Deletion**
   - ✅ Booking UNPAID dengan Payment EXPIRED → dihapus
   - ✅ Booking UNPAID tanpa Payment dan createdAt < graceThreshold → dihapus

4. **Room & Property Update**
   - ✅ Room.isAvailable diset true dalam transaction yang sama
   - ✅ Property.availableRooms dihitung ulang dalam transaction yang sama

5. **Response Format**
   - ✅ JSON dengan metrik: executedAt, graceMinutes, expiredPaymentsCount, deletedBookingsCount, deletedBookingIds

### ✅ Technical Requirements

1. **Arsitektur 3-Tier**
   - ✅ Tier-1: API Controller (route.ts)
   - ✅ Tier-2: Application Service (cleanupExpiredBookings.ts)
   - ✅ Tier-3: Data Access (Prisma Client)

2. **Database**
   - ✅ Index untuk performa (Payment, Booking)
   - ✅ Prisma transaction untuk atomicity
   - ✅ No race condition (idempotent)

3. **Docker**
   - ✅ Multi-stage Dockerfile untuk app
   - ✅ Minimal Alpine Dockerfile untuk cron
   - ✅ docker-compose.yml dengan 2 services
   - ✅ Healthcheck pada app service
   - ✅ depends_on dengan condition: service_healthy

4. **Cron**
   - ✅ Jadwal setiap 5 menit
   - ✅ Internal network call (http://app:3000)
   - ✅ Retry logic (--retry 3)
   - ✅ Timeout (--max-time 20)
   - ✅ Logging ke STDOUT

5. **Security**
   - ✅ Bearer token authentication
   - ✅ Internal Docker network (tidak expose ke public)
   - ✅ Environment variable untuk secret

---

## 🚀 Cara Deploy

### 1. Generate CRON_SECRET
```bash
openssl rand -base64 32
```

### 2. Update .env.production
```env
CRON_SECRET="generated-secret-here"
BOOKING_UNPAID_GRACE_MINUTES="30"
```

### 3. Commit & Push
```bash
git add .
git commit -m "feat: add cron cleanup system"
git push origin main
```

### 4. Deploy via Dockploy
- Login ke Dockploy dashboard
- Create/Update application dengan docker-compose.yml
- Set environment variables
- Deploy

### 5. Verifikasi
```bash
# Cek container status
docker ps

# Test health
curl http://localhost:3000/api/health

# Test cron endpoint (manual)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/cron/cleanup-expired

# Monitor cron logs
docker logs -f myhome-cron
```

---

## 📊 Monitoring

### Logs
```bash
# Cron logs
docker logs -f myhome-cron

# App logs (filter cron)
docker logs myhome-app 2>&1 | grep "Cron Cleanup"
```

### Database Queries
```sql
-- Booking UNPAID
SELECT COUNT(*) FROM "Booking" WHERE status = 'UNPAID';

-- Payment PENDING yang akan expire
SELECT COUNT(*) FROM "Payment" 
WHERE status = 'PENDING' AND "expiryTime" < NOW();

-- Room availability accuracy
SELECT 
  p.name,
  p."availableRooms",
  COUNT(r.id) FILTER (WHERE r."isAvailable" = true) as actual
FROM "Property" p
LEFT JOIN "Room" r ON r."propertyId" = p.id
GROUP BY p.id;
```

---

## 🔧 Troubleshooting

### Cron tidak berjalan
```bash
docker logs myhome-cron
docker restart myhome-cron
```

### 401 Unauthorized
```bash
# Cek CRON_SECRET di kedua container
docker exec myhome-cron env | grep CRON_SECRET
docker exec myhome-app env | grep CRON_SECRET
```

### App unhealthy
```bash
docker logs myhome-app
curl http://localhost:3000/api/health
docker restart myhome-app
```

---

## 📝 Catatan

1. **Idempotent**: Aman dijalankan berkali-kali
2. **Transaction**: Semua operasi atomic
3. **No Race Condition**: Database-level locking
4. **Graceful**: Tidak mempengaruhi app utama jika gagal
5. **Monitoring**: Selalu cek logs untuk memastikan normal

---

**Created**: 2025-01-09  
**Version**: 1.0.0  
**Author**: Augment Agent

