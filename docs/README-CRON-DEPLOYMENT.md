# 🔄 Cron Cleanup System - Deployment Guide

Dokumentasi lengkap untuk deployment sistem cron cleanup expired bookings dan payments di VPS menggunakan Dockploy.

## 📋 Daftar Isi

- [Overview](#overview)
- [Arsitektur](#arsitektur)
- [Prasyarat](#prasyarat)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Deployment via Dockploy](#deployment-via-dockploy)
- [Verifikasi](#verifikasi)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Sistem cron cleanup ini secara otomatis:

1. **Expire Payment PENDING** yang melewati `expiryTime`
2. **Hapus Booking UNPAID** yang:
   - Memiliki Payment EXPIRED, atau
   - Tidak memiliki Payment dan sudah melewati grace period (default: 30 menit)
3. **Update Room Availability** - Set `Room.isAvailable = true` untuk room yang terlibat
4. **Recalculate Property Stats** - Hitung ulang `Property.availableRooms`

Semua operasi dilakukan dalam **Prisma transaction** untuk data consistency.

---

## 🏗️ Arsitektur

### Arsitektur 3-Tier

```
┌─────────────────────────────────────────────────────────────┐
│ Tier-1: Presentation Layer (API Controller)                 │
│ ├─ app/api/cron/cleanup-expired/route.ts                   │
│ │  └─ Bearer Auth + JSON Response                          │
│ └─ app/api/health/route.ts                                 │
│    └─ Healthcheck untuk Docker                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Tier-2: Application Service Layer                           │
│ └─ server/api/booking/cleanupExpiredBookings.ts            │
│    └─ Orchestrator + Prisma Transaction                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Tier-3: Data Access Layer                                   │
│ └─ Prisma Client (server/db/client.ts)                     │
│    └─ Direct database operations                           │
└─────────────────────────────────────────────────────────────┘
```

### Docker Services

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Compose                            │
│                                                               │
│  ┌─────────────────┐         ┌──────────────────┐           │
│  │   app service   │◄────────│   cron service   │           │
│  │  (Next.js App)  │         │  (Alpine + curl) │           │
│  │                 │         │                  │           │
│  │  Port: 3000     │         │  Runs every 5min │           │
│  │  Health: /api/  │         │  curl to app:    │           │
│  │         health  │         │  3000/api/cron/  │           │
│  └────────┬────────┘         │  cleanup-expired │           │
│           │                  └──────────────────┘           │
│           │                                                  │
│  ┌────────▼────────┐                                        │
│  │   postgres      │                                        │
│  │   (Database)    │                                        │
│  └─────────────────┘                                        │
│                                                               │
│  Network: myhome (bridge)                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Prasyarat

1. **VPS dengan Docker & Docker Compose** terinstall
2. **Dockploy** terinstall dan berjalan
3. **Repository Git** dengan akses ke VPS
4. **PostgreSQL Database** (bisa dari docker-compose atau external)

---

## ⚙️ Konfigurasi Environment

### 1. Generate CRON_SECRET

```bash
# Generate random secret token
openssl rand -base64 32
```

### 2. Update .env.production

Tambahkan variabel berikut ke `.env.production`:

```env
# Cron Configuration
CRON_SECRET="your-generated-secret-token-here"
BOOKING_UNPAID_GRACE_MINUTES="30"
```

### 3. Environment Variables yang Diperlukan

Pastikan semua variabel berikut sudah dikonfigurasi:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# Auth
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="https://yourdomain.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Midtrans
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_CLIENT_KEY="your-client-key"
MIDTRANS_IS_PRODUCTION="true"

# Cron (WAJIB)
CRON_SECRET="your-generated-secret-token"
BOOKING_UNPAID_GRACE_MINUTES="30"

# Optional
TZ="UTC"
DB_INIT_MODE="migrate"
```

---

## 🚀 Deployment via Dockploy

### Metode 1: Via Dockploy UI

1. **Login ke Dockploy Dashboard**
   ```
   https://your-vps-ip:3000
   ```

2. **Create New Application**
   - Pilih "Docker Compose"
   - Nama: `myhome`
   - Repository: URL Git repository Anda

3. **Configure Environment Variables**
   - Masuk ke tab "Environment"
   - Copy semua variabel dari `.env.production`
   - Paste dan save

4. **Deploy**
   - Klik "Deploy"
   - Dockploy akan:
     - Clone repository
     - Build Docker images
     - Run `docker-compose up -d`
     - Start services

### Metode 2: Via Git Push (Recommended)

1. **Commit semua perubahan**
   ```bash
   git add .
   git commit -m "feat: add cron cleanup system"
   git push origin main
   ```

2. **Dockploy Auto-Deploy**
   - Jika webhook sudah dikonfigurasi, Dockploy akan auto-deploy
   - Atau trigger manual deploy dari dashboard

---

## ✅ Verifikasi

### 1. Cek Container Status

```bash
docker ps
```

Output yang diharapkan:
```
CONTAINER ID   IMAGE              STATUS                    PORTS
abc123...      myhome-app         Up 2 minutes (healthy)    0.0.0.0:3000->3000/tcp
def456...      myhome-cron        Up 2 minutes              
ghi789...      postgres:16-alpine Up 2 minutes              5432/tcp
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "OK",
  "checks": {
    "timestamp": "2025-01-09T10:30:00.000Z",
    "database": "OK",
    ...
  }
}
```

### 3. Test Cron Endpoint (Manual)

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/cron/cleanup-expired
```

Response sukses:
```json
{
  "success": true,
  "data": {
    "executedAt": "2025-01-09T10:30:00.000Z",
    "graceMinutes": 30,
    "expiredPaymentsCount": 5,
    "deletedBookingsCount": 3,
    "deletedBookingIds": ["booking-id-1", "booking-id-2", "booking-id-3"]
  }
}
```

### 4. Cek Cron Logs

```bash
# Lihat logs cron container
docker logs myhome-cron -f

# Atau via Dockploy UI
# Dashboard > myhome > Logs > cron service
```

Output yang diharapkan (setiap 5 menit):
```
[2025-01-09 10:30:00] Starting cleanup process...
[2025-01-09 10:30:00] Calling: http://app:3000/api/cron/cleanup-expired
[2025-01-09 10:30:01] SUCCESS: Cleanup completed
[2025-01-09 10:30:01] Response: {"success":true,"data":{...}}
```

---

## 📊 Monitoring

### 1. Cron Execution Logs

```bash
# Real-time monitoring
docker logs -f myhome-cron

# Last 100 lines
docker logs --tail 100 myhome-cron
```

### 2. Application Logs

```bash
# App container logs
docker logs -f myhome-app

# Filter untuk cron-related logs
docker logs myhome-app 2>&1 | grep "Cron Cleanup"
```

### 3. Database Monitoring

```sql
-- Cek jumlah booking UNPAID
SELECT COUNT(*) FROM "Booking" WHERE status = 'UNPAID';

-- Cek payment PENDING yang akan expire
SELECT COUNT(*) FROM "Payment" 
WHERE status = 'PENDING' AND "expiryTime" < NOW();

-- Cek room availability
SELECT 
  p.name,
  p."totalRooms",
  p."availableRooms",
  COUNT(r.id) FILTER (WHERE r."isAvailable" = true) as actual_available
FROM "Property" p
LEFT JOIN "Room" r ON r."propertyId" = p.id
GROUP BY p.id;
```

---

## 🔧 Troubleshooting

### Problem: Cron tidak berjalan

**Diagnosis:**
```bash
docker logs myhome-cron
```

**Solusi:**
1. Cek apakah container running: `docker ps | grep cron`
2. Cek environment variable: `docker exec myhome-cron env | grep CRON_SECRET`
3. Restart container: `docker restart myhome-cron`

### Problem: 401 Unauthorized

**Diagnosis:**
```bash
# Cek CRON_SECRET di cron container
docker exec myhome-cron env | grep CRON_SECRET

# Cek CRON_SECRET di app container
docker exec myhome-app env | grep CRON_SECRET
```

**Solusi:**
- Pastikan `CRON_SECRET` sama di kedua container
- Update `.env.production` dan redeploy

### Problem: App service unhealthy

**Diagnosis:**
```bash
docker inspect myhome-app | grep -A 10 Health
```

**Solusi:**
1. Cek app logs: `docker logs myhome-app`
2. Test health endpoint manual: `curl http://localhost:3000/api/health`
3. Cek database connection
4. Restart app: `docker restart myhome-app`

### Problem: Cleanup tidak menghapus booking

**Diagnosis:**
```bash
# Test manual dengan curl
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/cron/cleanup-expired
```

**Solusi:**
1. Cek response JSON untuk error
2. Cek app logs untuk error detail
3. Verifikasi data di database sesuai kriteria cleanup
4. Adjust `BOOKING_UNPAID_GRACE_MINUTES` jika perlu

---

## 📝 Catatan Penting

1. **Idempotent**: Cron job dirancang idempotent, aman dijalankan berkali-kali
2. **Transaction**: Semua operasi dalam Prisma transaction untuk data consistency
3. **No Race Condition**: Menggunakan database-level locking via transaction
4. **Graceful Degradation**: Jika cleanup gagal, tidak mempengaruhi aplikasi utama
5. **Monitoring**: Selalu monitor logs untuk memastikan cleanup berjalan normal

---

## 🔐 Security Best Practices

1. **CRON_SECRET**: Gunakan token yang kuat (minimal 32 karakter random)
2. **Internal Network**: Cron hanya bisa akses app via internal Docker network
3. **No Public Exposure**: Endpoint `/api/cron/*` hanya bisa diakses dengan Bearer token
4. **Rotate Secret**: Rotate `CRON_SECRET` secara berkala (misal setiap 3 bulan)

---

## 📚 Referensi

- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Docker Compose](https://docs.docker.com/compose/)
- [Dockploy Documentation](https://dockploy.com/docs)
- [Alpine Cron](https://wiki.alpinelinux.org/wiki/Alpine_Linux:FAQ#My_cron_jobs_don.27t_run.3F)

---

**Last Updated**: 2025-01-09  
**Version**: 1.0.0

