# Booking & Payment Flow Documentation

## 📋 Overview

Sistem booking dan payment telah direfactor untuk memastikan **booking hanya valid setelah pembayaran berhasil**. Ini mencegah kamar ter-booking oleh user yang belum membayar.

## 🔄 Alur Baru (Payment-First Approach)

### 1. User Membuat Booking
```
Status: UNPAID
Payment Status: PENDING
```
- Booking tersimpan di database dengan status `UNPAID`
- Payment record dibuat dengan status `PENDING`
- Midtrans Snap token di-generate
- User diarahkan ke halaman pembayaran Midtrans

**PENTING:** Booking dengan status `UNPAID` **TIDAK DIHITUNG** sebagai booking aktif. Kamar masih available untuk user lain.

### 2. User Melakukan Pembayaran

#### Scenario A: Pembayaran Berhasil
```
Midtrans → Webhook → Update Payment (SUCCESS) → Update Booking
```
- Midtrans mengirim notification ke webhook
- Payment status: `PENDING` → `SUCCESS`
- Booking status: `UNPAID` → `DEPOSIT_PAID` (jika deposit) atau `CONFIRMED` (jika full payment)
- **Kamar sekarang ter-booking dan tidak available untuk user lain**

#### Scenario B: Pembayaran Gagal/Expired
```
Midtrans → Webhook → Update Payment (FAILED/EXPIRED) → Update Booking
```
- Payment status: `PENDING` → `FAILED` atau `EXPIRED`
- Booking status: `UNPAID` → `EXPIRED`
- **Kamar kembali available untuk user lain**

### 3. Cron Job Auto-Cleanup
```
Setiap 10 menit → Check UNPAID bookings → Expire yang payment-nya expired
```
- Cron job berjalan setiap 10 menit
- Mencari booking dengan status `UNPAID` dan payment expired
- Update status ke `EXPIRED`
- Free up kamar untuk booking baru

## 🏗️ Arsitektur (3-Tier Clean Architecture)

### Tier-1: Presentation Layer (API Routes)
```
src/app/api/bookings/
├── route.ts                    # POST /api/bookings (create booking)
├── payment/
│   └── webhook/
│       └── route.ts            # POST /api/bookings/payment/webhook (Midtrans webhook)
```

### Tier-2: Application Services
```
src/server/api/
└── booking.api.ts              # BookingAPI class
    ├── createBooking()         # Create booking with UNPAID status
    ├── createFullPayment()     # Create full payment after deposit
    └── handleMidtransNotification()  # Handle webhook from Midtrans
```

### Tier-3: Domain & Infrastructure

#### Domain Services
```
src/server/services/
├── booking.service.ts          # Booking business logic
└── payment.service.ts          # Payment business logic
```

#### Repositories (Data Access)
```
src/server/repositories/
├── booking.repository.ts       # Booking CRUD operations
│   ├── getBookingsForRoom()    # Exclude UNPAID bookings
│   └── isRoomAvailable()       # Check room availability
└── payment.repository.ts       # Payment CRUD operations
```

#### Adapters (External Integrations)
```
src/server/adapters/midtrans/
├── index.ts                    # Export all adapters
└── snap.adapter.ts             # Midtrans Snap integration
    ├── createSnapTransaction() # Create payment token
    ├── getTransactionStatus()  # Check payment status
    └── cancelTransaction()     # Cancel payment
```

## 📊 Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING STATUS FLOW                       │
└─────────────────────────────────────────────────────────────┘

User Creates Booking
        │
        ▼
    [UNPAID] ◄─────────────────────┐
        │                          │
        │ Payment Successful       │ Payment Failed/Expired
        ▼                          │
[DEPOSIT_PAID] or [CONFIRMED]      │
        │                          │
        │                          ▼
        ▼                     [EXPIRED]
  [CHECKED_IN]
        │
        ▼
   [COMPLETED]

User Can Cancel Anytime
        │
        ▼
   [CANCELLED]
```

## 🔐 Security

### Webhook Security
- **Signature Verification**: Setiap webhook dari Midtrans diverifikasi menggunakan SHA512 signature
- **Public Endpoint**: Webhook endpoint tidak memerlukan authentication (dipanggil oleh Midtrans server)
- **Error Handling**: Selalu return 200 OK untuk mencegah Midtrans retry

### Cron Job Security
- **CRON_SECRET**: Protected dengan environment variable `CRON_SECRET`
- **Authorization Header**: `Bearer {CRON_SECRET}`

## 🚀 Deployment Steps

### 1. Update Database Schema
```bash
# Generate migration
npx prisma migrate dev --name add_unpaid_booking_status

# Or push schema directly (development)
npx prisma db push
```

### 2. Update Environment Variables
```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_IS_PRODUCTION=false

# Cron Job Security
CRON_SECRET=your_random_secret_key
```

### 3. Configure Midtrans Webhook
Di Midtrans Dashboard, set webhook URL:
```
https://yourdomain.com/api/bookings/payment/webhook
```

### 4. Deploy to Vercel
```bash
# Vercel akan otomatis setup cron job dari vercel.json
vercel --prod
```

## 🧪 Testing

### Test Booking Creation
```bash
curl -X POST https://yourdomain.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "roomId": "room_id",
    "checkInDate": "2024-01-01",
    "leaseType": "MONTHLY"
  }'
```

### Test Webhook (Local)
```bash
curl -X POST http://localhost:3000/api/bookings/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "DEP-12345678-ABC",
    "transaction_status": "settlement",
    "gross_amount": "1000000",
    "signature_key": "..."
  }'
```

### Test Cron Job
```bash
curl -X GET https://yourdomain.com/api/cron/expire/bookings \
  -H "Authorization: Bearer your_cron_secret"
```

## 📝 Key Changes Summary

### 1. Schema Changes
- ✅ Added `UNPAID` status to `BookingStatus` enum
- ✅ Updated TypeScript types in `src/server/types/booking.ts`

### 2. Midtrans Adapter
- ✅ Created `src/server/adapters/midtrans/snap.adapter.ts`
- ✅ Isolated all Midtrans API calls from business logic
- ✅ Easy to switch to other payment gateways

### 3. Booking Logic
- ✅ Initial booking status: `UNPAID` (not `PENDING`)
- ✅ Availability check excludes `UNPAID` bookings
- ✅ Webhook updates booking status based on payment

### 4. Webhook Endpoint
- ✅ Created `src/app/api/bookings/payment/webhook/route.ts`
- ✅ Handles Midtrans notifications
- ✅ Updates booking and payment status

### 5. Cron Job
- ✅ Created `src/app/api/cron/expire/bookings/route.ts`
- ✅ Auto-expires UNPAID bookings with expired payments
- ✅ Runs every 10 minutes via Vercel Cron

## 🎯 Benefits

1. **Fair Booking System**: First-come-first-served based on PAYMENT, not booking creation
2. **No Ghost Bookings**: Unpaid bookings don't block rooms
3. **Clean Architecture**: Easy to maintain and test
4. **Payment Gateway Agnostic**: Easy to switch from Midtrans to Xendit/etc
5. **Automatic Cleanup**: Cron job handles expired bookings
6. **Secure**: Signature verification and secret-based authentication

## 🔍 Monitoring

### Check UNPAID Bookings
```sql
SELECT * FROM "Booking" 
WHERE status = 'UNPAID' 
ORDER BY "createdAt" DESC;
```

### Check Expired Payments
```sql
SELECT b.*, p.* 
FROM "Booking" b
JOIN "Payment" p ON p."bookingId" = b.id
WHERE b.status = 'UNPAID' 
  AND p."expiryTime" < NOW();
```

### Check Webhook Logs
```bash
# Vercel logs
vercel logs --follow

# Or check in Vercel Dashboard
# https://vercel.com/your-team/your-project/logs
```

## 📞 Support

Jika ada masalah:
1. Check Midtrans Dashboard untuk status payment
2. Check webhook logs di Vercel
3. Check database untuk booking dan payment status
4. Verify environment variables
5. Test webhook endpoint manually

---

**Last Updated**: 2025-01-06
**Version**: 2.0.0

