# Migration Guide: Booking & Payment System Update

## 🎯 Tujuan Migration

Mengupdate sistem booking agar **booking hanya valid setelah pembayaran berhasil**. Ini mencegah kamar ter-booking oleh user yang belum membayar.

## ⚠️ Breaking Changes

### 1. BookingStatus Enum
**BEFORE:**
```typescript
enum BookingStatus {
  PENDING       // ❌ Removed
  DEPOSIT_PAID
  CONFIRMED
  CHECKED_IN
  COMPLETED
  CANCELLED
  EXPIRED
}
```

**AFTER:**
```typescript
enum BookingStatus {
  UNPAID        // ✅ New - replaces PENDING
  DEPOSIT_PAID
  CONFIRMED
  CHECKED_IN
  COMPLETED
  CANCELLED
  EXPIRED
}
```

### 2. Booking Creation Flow
**BEFORE:**
- Booking created with status `PENDING`
- Room immediately blocked for other users
- Payment happens later

**AFTER:**
- Booking created with status `UNPAID`
- Room still available for other users
- Room only blocked after payment SUCCESS

## 📋 Migration Steps

### Step 1: Backup Database
```bash
# PostgreSQL backup
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use your hosting provider's backup feature
```

### Step 2: Update Existing Data

**Option A: Update all PENDING to UNPAID**
```sql
-- Update bookings table
UPDATE "Booking" 
SET status = 'UNPAID' 
WHERE status = 'PENDING';
```

**Option B: Expire old PENDING bookings**
```sql
-- If you want to clean up old pending bookings
UPDATE "Booking" 
SET status = 'EXPIRED' 
WHERE status = 'PENDING' 
  AND "createdAt" < NOW() - INTERVAL '7 days';

-- Update recent ones to UNPAID
UPDATE "Booking" 
SET status = 'UNPAID' 
WHERE status = 'PENDING';
```

### Step 3: Run Prisma Migration
```bash
# Generate and apply migration
npx prisma migrate dev --name update_booking_status_add_unpaid

# This will:
# 1. Update the enum in database
# 2. Generate migration file
# 3. Apply migration
```

**Alternative (for development):**
```bash
# Push schema directly without migration file
npx prisma db push

# Then generate Prisma client
npx prisma generate
```

### Step 4: Update Environment Variables
```bash
# Add to .env or .env.local
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here
MIDTRANS_IS_PRODUCTION=false

# For cron job security
CRON_SECRET=generate_random_secret_here
```

**Generate CRON_SECRET:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### Step 5: Configure Midtrans Webhook

1. Login ke Midtrans Dashboard
2. Go to Settings → Configuration
3. Set Payment Notification URL:
   ```
   https://yourdomain.com/api/bookings/payment/webhook
   ```
4. Save configuration

### Step 6: Deploy to Production

```bash
# Build and test locally first
npm run build
npm run start

# Deploy to Vercel
vercel --prod

# Or push to main branch (if auto-deploy enabled)
git push origin main
```

### Step 7: Verify Deployment

#### Check Cron Job
```bash
# Vercel Dashboard → Project → Settings → Cron Jobs
# Should show: /api/cron/expire/bookings running every 10 minutes
```

#### Test Webhook Endpoint
```bash
curl https://yourdomain.com/api/bookings/payment/webhook
# Should return: {"status":"ok","message":"Midtrans webhook endpoint is active"}
```

#### Test Cron Endpoint
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/expire/bookings
# Should return: {"success":true,"message":"Processed X expired bookings"}
```

## 🔍 Post-Migration Verification

### 1. Check Database Schema
```sql
-- Verify enum values
SELECT enum_range(NULL::public."BookingStatus");
-- Should include: UNPAID, DEPOSIT_PAID, CONFIRMED, etc.

-- Check existing bookings
SELECT status, COUNT(*) 
FROM "Booking" 
GROUP BY status;
```

### 2. Test Booking Flow

#### Create Test Booking
```bash
curl -X POST https://yourdomain.com/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "userId": "test_user_id",
    "roomId": "test_room_id",
    "checkInDate": "2024-02-01",
    "leaseType": "MONTHLY"
  }'
```

Expected response:
```json
{
  "booking": {
    "id": "...",
    "status": "UNPAID",  // ✅ Should be UNPAID
    "paymentStatus": "PENDING"
  },
  "paymentToken": "..."
}
```

#### Verify Room Availability
```sql
-- Room should still be available for other bookings
SELECT * FROM "Booking" 
WHERE "roomId" = 'test_room_id' 
  AND status NOT IN ('UNPAID', 'CANCELLED', 'EXPIRED');
-- Should return 0 rows (room is available)
```

### 3. Test Payment Webhook

Use Midtrans Sandbox to test payment:
1. Create booking
2. Pay using Midtrans Snap
3. Check webhook logs in Vercel
4. Verify booking status updated to DEPOSIT_PAID or CONFIRMED

### 4. Monitor Cron Job

```bash
# Check Vercel logs
vercel logs --follow

# Or in Vercel Dashboard
# https://vercel.com/your-team/your-project/logs
# Filter by: /api/cron/expire/bookings
```

## 🐛 Troubleshooting

### Issue 1: Migration Failed
```
Error: Enum value 'PENDING' is still in use
```

**Solution:**
```sql
-- Update all PENDING bookings first
UPDATE "Booking" SET status = 'UNPAID' WHERE status = 'PENDING';

-- Then run migration again
npx prisma migrate dev
```

### Issue 2: Webhook Not Working
```
Midtrans notification not updating booking status
```

**Check:**
1. Webhook URL configured correctly in Midtrans Dashboard
2. Endpoint is publicly accessible (not behind auth)
3. Check Vercel logs for errors
4. Verify MIDTRANS_SERVER_KEY is correct

**Test manually:**
```bash
# Get signature from Midtrans notification
# Then test webhook
curl -X POST https://yourdomain.com/api/bookings/payment/webhook \
  -H "Content-Type: application/json" \
  -d @test_notification.json
```

### Issue 3: Cron Job Not Running
```
UNPAID bookings not expiring automatically
```

**Check:**
1. `vercel.json` exists in project root
2. Cron job visible in Vercel Dashboard
3. CRON_SECRET environment variable set
4. Check cron job logs in Vercel

**Manual trigger:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/expire/bookings
```

### Issue 4: TypeScript Errors
```
Property 'UNPAID' does not exist on type 'BookingStatus'
```

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## 📊 Rollback Plan

If something goes wrong:

### 1. Revert Database
```sql
-- Restore from backup
psql -U your_user -d your_database < backup_file.sql
```

### 2. Revert Code
```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous version
git checkout previous_commit_hash

# Deploy
vercel --prod
```

### 3. Disable Cron Job
```bash
# Remove vercel.json or comment out cron config
# Then redeploy
```

## ✅ Success Criteria

Migration is successful when:

- [x] Database schema updated with UNPAID status
- [x] All existing PENDING bookings migrated to UNPAID or EXPIRED
- [x] New bookings created with UNPAID status
- [x] Webhook endpoint receiving and processing Midtrans notifications
- [x] Booking status updates correctly after payment
- [x] Room availability check excludes UNPAID bookings
- [x] Cron job running every 10 minutes
- [x] Expired UNPAID bookings automatically marked as EXPIRED
- [x] No TypeScript errors
- [x] All tests passing

## 📞 Support

If you encounter issues:

1. Check logs in Vercel Dashboard
2. Verify environment variables
3. Test endpoints manually
4. Check database data
5. Review Midtrans Dashboard

---

**Migration Date**: 2025-01-06
**Estimated Downtime**: < 5 minutes
**Rollback Time**: < 10 minutes

