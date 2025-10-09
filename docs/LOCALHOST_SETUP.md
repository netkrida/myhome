# Localhost Setup Guide

## 🚀 Quick Start untuk Development di Localhost

Panduan ini untuk menjalankan project dengan sistem booking & payment yang baru di localhost.

---

## 📋 Prerequisites

- [x] Node.js 18+ installed
- [x] PostgreSQL database running
- [x] Midtrans Sandbox account (gratis)

---

## 🔧 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local` di root project:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myhome"
DIRECT_URL="postgresql://user:password@localhost:5432/myhome"

# NextAuth
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Midtrans Sandbox (FREE)
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_KEY_HERE"
MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_KEY_HERE"
MIDTRANS_IS_PRODUCTION="false"

# Cron Job Security
CRON_SECRET="generate-random-secret-here"

# Cloudinary (jika sudah ada)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

#### Cara Mendapatkan Midtrans Credentials:

1. **Daftar Midtrans Sandbox** (GRATIS)
   - Kunjungi: https://dashboard.sandbox.midtrans.com/register
   - Daftar dengan email Anda
   - Verifikasi email

2. **Dapatkan API Keys**
   - Login ke Dashboard Sandbox
   - Go to: Settings → Access Keys
   - Copy **Server Key** dan **Client Key**
   - Paste ke `.env.local`

3. **Generate Random Secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate CRON_SECRET
   openssl rand -hex 32
   ```

### 3. Setup Database

```bash
# Push schema ke database
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Seed database dengan data dummy
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Server akan berjalan di: http://localhost:3000

---

## 🧪 Testing di Localhost

### Test 1: Create Booking

1. **Login sebagai CUSTOMER**
   - Register atau login dengan role CUSTOMER

2. **Pilih Property & Room**
   - Browse properties
   - Pilih room yang available
   - Klik "Book Now"

3. **Fill Booking Form**
   - Pilih check-in date
   - Pilih lease type (MONTHLY, DAILY, etc.)
   - Pilih deposit atau full payment
   - Submit

4. **Verify Booking Created**
   - Check response: `status: "UNPAID"`
   - Check `paymentToken` ada
   - Redirect ke Midtrans Snap

### Test 2: Payment Flow (Sandbox)

1. **Midtrans Snap Page**
   - Pilih payment method (e.g., BCA Virtual Account)
   - Copy Virtual Account number

2. **Simulate Payment**
   - Di Midtrans Sandbox, payment otomatis SUCCESS
   - Atau gunakan Midtrans Simulator

3. **Verify Webhook**
   - Check terminal logs: "Midtrans notification received"
   - Check booking status updated: `UNPAID` → `DEPOSIT_PAID` atau `CONFIRMED`

### Test 3: Webhook Endpoint

```bash
# Test webhook endpoint
curl http://localhost:3000/api/bookings/payment/webhook

# Expected response:
# {"status":"ok","message":"Midtrans webhook endpoint is active"}
```

### Test 4: Cron Job (Manual Trigger)

```bash
# Trigger cron job manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/expire/bookings

# Expected response:
# {"success":true,"message":"Processed X expired bookings"}
```

### Test 5: Room Availability

1. **Create UNPAID Booking**
   - User A create booking (status: UNPAID)
   - Don't pay yet

2. **Try Book Same Room**
   - User B try to book same room
   - Should SUCCESS (room still available)

3. **Pay First Booking**
   - User A pay the booking
   - Status: UNPAID → CONFIRMED

4. **Try Book Again**
   - User B try to book same room
   - Should FAIL (room not available)

---

## 🔍 Debugging di Localhost

### Check Database

```bash
# Open Prisma Studio
npx prisma studio

# Or use SQL
psql -U user -d myhome

# Check bookings
SELECT id, "bookingCode", status, "paymentStatus", "createdAt" 
FROM "Booking" 
ORDER BY "createdAt" DESC 
LIMIT 10;

# Check payments
SELECT id, "midtransOrderId", status, amount, "createdAt"
FROM "Payment"
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check Logs

Terminal akan menampilkan:
```
✓ Compiled /api/bookings in 234ms
POST /api/bookings 201 in 1234ms
Midtrans notification received: { order_id: 'DEP-...', ... }
```

### Common Issues

#### Issue: "Midtrans configuration is incomplete"
**Solution:**
```bash
# Verify .env.local
cat .env.local | grep MIDTRANS

# Should show:
# MIDTRANS_SERVER_KEY=SB-Mid-server-...
# MIDTRANS_CLIENT_KEY=SB-Mid-client-...
# MIDTRANS_IS_PRODUCTION=false
```

#### Issue: "Database connection error"
**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Or check Docker
docker ps | grep postgres

# Test connection
npx prisma db pull
```

#### Issue: "Module not found"
**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

---

## 🎯 Midtrans Sandbox Testing

### Test Cards (Sandbox)

Midtrans Sandbox menyediakan test cards:

**Credit Card:**
- Card Number: `4811 1111 1111 1114`
- CVV: `123`
- Exp: Any future date
- OTP: `112233`

**Virtual Account:**
- Pilih bank (BCA, BNI, BRI, etc.)
- Copy VA number
- Payment otomatis SUCCESS di sandbox

**GoPay/QRIS:**
- Scan QR code
- Otomatis SUCCESS di sandbox

### Simulate Different Scenarios

1. **Success Payment**
   - Use test cards above
   - Payment akan otomatis SUCCESS

2. **Failed Payment**
   - Card Number: `4911 1111 1111 1113`
   - Payment akan FAILED

3. **Pending Payment**
   - Pilih Bank Transfer
   - Jangan complete payment
   - Wait for expiry (24 hours for deposit, 1 hour for full)

### Check Midtrans Dashboard

1. **Login to Sandbox Dashboard**
   - https://dashboard.sandbox.midtrans.com

2. **View Transactions**
   - Go to: Transactions
   - See all test payments
   - Check status, details, logs

3. **Test Webhook**
   - Click transaction
   - Click "Resend Webhook"
   - Check your localhost logs

---

## 📊 Monitoring

### Watch Logs in Real-time

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch database
npx prisma studio

# Terminal 3: Test API
curl -X POST http://localhost:3000/api/bookings/...
```

### Check Booking Status Flow

```sql
-- See booking status changes
SELECT 
  b.id,
  b."bookingCode",
  b.status as booking_status,
  b."paymentStatus",
  p.status as payment_status,
  p."midtransOrderId",
  b."createdAt",
  b."updatedAt"
FROM "Booking" b
LEFT JOIN "Payment" p ON p."bookingId" = b.id
ORDER BY b."createdAt" DESC
LIMIT 20;
```

---

## 🚀 Next Steps

Setelah testing di localhost berhasil:

1. **Push to Git**
   ```bash
   git add .
   git commit -m "feat: implement payment-first booking system"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Production Midtrans**
   - Upgrade to Production account
   - Update environment variables di Vercel
   - Set webhook URL di Midtrans Dashboard

4. **Monitor Production**
   - Check Vercel logs
   - Monitor Midtrans transactions
   - Check cron job runs

---

## 📚 Additional Resources

- **Midtrans Docs**: https://docs.midtrans.com
- **Midtrans Sandbox**: https://dashboard.sandbox.midtrans.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## 🆘 Need Help?

Check these files:
- `BOOKING_PAYMENT_FLOW.md` - Detailed flow explanation
- `MIGRATION_GUIDE.md` - Migration steps
- `TROUBLESHOOTING.md` - Common issues & solutions

---

**Happy Coding! 🎉**

