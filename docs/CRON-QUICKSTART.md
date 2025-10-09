# 🚀 Cron Cleanup - Quick Start Guide

Panduan cepat untuk testing dan development cron cleanup system.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Git repository cloned
- `.env.production` configured

## ⚡ Quick Start (Local Testing)

### 1. Generate CRON_SECRET

```bash
# Generate random secret
openssl rand -base64 32
```

Copy output dan tambahkan ke `.env.production`:

```env
CRON_SECRET="paste-generated-secret-here"
BOOKING_UNPAID_GRACE_MINUTES="30"
```

### 2. Build & Run dengan Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
NAME            IMAGE           STATUS                    PORTS
myhome-app      myhome-app      Up (healthy)              0.0.0.0:3000->3000/tcp
myhome-cron     myhome-cron     Up                        
postgres        postgres:16     Up                        5432/tcp
```

### 3. Verify Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "checks": {
    "database": "OK",
    ...
  }
}
```

### 4. Test Cron Endpoint (Manual)

```bash
# Replace YOUR_CRON_SECRET with actual secret from .env.production
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/cron/cleanup-expired
```

Expected response:
```json
{
  "success": true,
  "data": {
    "executedAt": "2025-01-09T10:30:00.000Z",
    "graceMinutes": 30,
    "expiredPaymentsCount": 0,
    "deletedBookingsCount": 0,
    "deletedBookingIds": []
  }
}
```

### 5. Monitor Cron Logs

```bash
# Real-time logs
docker logs -f myhome-cron

# Last 50 lines
docker logs --tail 50 myhome-cron
```

Expected output (every 5 minutes):
```
[2025-01-09 10:30:00] Starting cleanup process...
[2025-01-09 10:30:00] Calling: http://app:3000/api/cron/cleanup-expired
[2025-01-09 10:30:01] SUCCESS: Cleanup completed
[2025-01-09 10:30:01] Response: {"success":true,"data":{...}}
```

## 🧪 Testing Scenarios

### Scenario 1: Test Payment Expiration

```sql
-- Create test payment yang akan expire
INSERT INTO "Payment" (
  id, "bookingId", "userId", "midtransOrderId",
  "paymentType", amount, status, "expiryTime",
  "createdAt", "updatedAt"
) VALUES (
  'test-payment-1',
  'existing-booking-id',
  'existing-user-id',
  'TEST-ORDER-001',
  'FULL',
  1000000,
  'PENDING',
  NOW() - INTERVAL '1 hour', -- Already expired
  NOW(),
  NOW()
);

-- Run cleanup (manual trigger)
-- curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
--      http://localhost:3000/api/cron/cleanup-expired

-- Verify payment status changed to EXPIRED
SELECT id, status, "expiryTime" FROM "Payment" WHERE id = 'test-payment-1';
```

### Scenario 2: Test Booking Deletion (with Expired Payment)

```sql
-- 1. Create test room
INSERT INTO "Room" (
  id, "propertyId", "roomNumber", floor, "roomType",
  "monthlyPrice", "isAvailable", "facilities",
  "createdAt", "updatedAt"
) VALUES (
  'test-room-1',
  'existing-property-id',
  'TEST-101',
  1,
  'Standard',
  1000000,
  false, -- Set unavailable
  '{}',
  NOW(),
  NOW()
);

-- 2. Create test booking UNPAID
INSERT INTO "Booking" (
  id, "bookingCode", "userId", "propertyId", "roomId",
  "checkInDate", "leaseType", "totalAmount",
  status, "paymentStatus",
  "createdAt", "updatedAt"
) VALUES (
  'test-booking-1',
  'TEST-BOOK-001',
  'existing-user-id',
  'existing-property-id',
  'test-room-1',
  NOW() + INTERVAL '1 day',
  'MONTHLY',
  1000000,
  'UNPAID',
  'PENDING',
  NOW(),
  NOW()
);

-- 3. Create expired payment for this booking
INSERT INTO "Payment" (
  id, "bookingId", "userId", "midtransOrderId",
  "paymentType", amount, status, "expiryTime",
  "createdAt", "updatedAt"
) VALUES (
  'test-payment-2',
  'test-booking-1',
  'existing-user-id',
  'TEST-ORDER-002',
  'FULL',
  1000000,
  'EXPIRED',
  NOW() - INTERVAL '1 hour',
  NOW(),
  NOW()
);

-- 4. Run cleanup
-- curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
--      http://localhost:3000/api/cron/cleanup-expired

-- 5. Verify booking deleted and room available
SELECT id FROM "Booking" WHERE id = 'test-booking-1'; -- Should return empty
SELECT id, "isAvailable" FROM "Room" WHERE id = 'test-room-1'; -- isAvailable should be true
```

### Scenario 3: Test Booking Deletion (No Payment, Grace Period Exceeded)

```sql
-- 1. Create booking UNPAID without payment, created 1 hour ago
INSERT INTO "Booking" (
  id, "bookingCode", "userId", "propertyId", "roomId",
  "checkInDate", "leaseType", "totalAmount",
  status, "paymentStatus",
  "createdAt", "updatedAt"
) VALUES (
  'test-booking-2',
  'TEST-BOOK-002',
  'existing-user-id',
  'existing-property-id',
  'test-room-1',
  NOW() + INTERVAL '1 day',
  'MONTHLY',
  1000000,
  'UNPAID',
  'PENDING',
  NOW() - INTERVAL '1 hour', -- Created 1 hour ago (exceeds 30 min grace)
  NOW()
);

-- 2. Run cleanup
-- curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
--      http://localhost:3000/api/cron/cleanup-expired

-- 3. Verify booking deleted
SELECT id FROM "Booking" WHERE id = 'test-booking-2'; -- Should return empty
```

## 🔧 Troubleshooting

### Problem: Container tidak start

```bash
# Check logs
docker-compose logs app
docker-compose logs cron

# Restart
docker-compose restart
```

### Problem: 401 Unauthorized

```bash
# Verify CRON_SECRET in both containers
docker exec myhome-app env | grep CRON_SECRET
docker exec myhome-cron env | grep CRON_SECRET

# Should be identical
```

### Problem: Cron tidak execute

```bash
# Check cron logs
docker logs myhome-cron

# Verify crontab
docker exec myhome-cron cat /etc/crontabs/root

# Manually trigger cleanup script
docker exec myhome-cron /usr/local/bin/cleanup.sh
```

### Problem: Database connection error

```bash
# Check postgres status
docker-compose ps postgres

# Check app logs
docker logs myhome-app

# Verify DATABASE_URL in .env.production
```

## 🛑 Stop & Clean Up

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 📊 Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f cron

# Execute command in container
docker exec -it myhome-app sh
docker exec -it myhome-cron sh

# Check container resource usage
docker stats

# Inspect container
docker inspect myhome-app
docker inspect myhome-cron
```

## 🔄 Development Workflow

1. **Make changes** to code
2. **Rebuild** specific service:
   ```bash
   docker-compose build app
   # or
   docker-compose build cron
   ```
3. **Restart** service:
   ```bash
   docker-compose up -d app
   # or
   docker-compose up -d cron
   ```
4. **Test** changes
5. **Monitor** logs

## 📝 Notes

- Cron runs every 5 minutes by default
- Grace period default: 30 minutes
- All operations are idempotent (safe to run multiple times)
- Cleanup uses Prisma transaction (atomic operations)
- Logs are sent to STDOUT (visible via `docker logs`)

---

**Quick Reference**:
- Health: `http://localhost:3000/api/health`
- Cleanup: `http://localhost:3000/api/cron/cleanup-expired`
- Auth: `Authorization: Bearer <CRON_SECRET>`

**Next Steps**: See `README-CRON-DEPLOYMENT.md` for production deployment guide.

