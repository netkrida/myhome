# Troubleshooting Guide

## 🐛 Common Issues & Solutions

### 1. Build Error: "Server Actions must be async functions"

#### Error Message
```
./src/server/adapters/midtrans/snap.adapter.ts:204:17
Ecmascript file had an error

Server Actions must be async functions.
```

#### Cause
File menggunakan directive `"use server"` di bagian atas, yang membuat Next.js menganggap **semua exported functions** sebagai Server Actions. Server Actions di Next.js **harus async functions**.

Functions seperti `getSnapScriptUrl()` dan `getMidtransClientKey()` adalah **synchronous** (tidak async), sehingga menyebabkan error.

#### Solution ✅
**Hapus `"use server"` directive** dari file adapter karena:
1. Adapter functions dipanggil dari server-side code (API routes, server components)
2. Tidak perlu menjadi Server Actions
3. Hanya functions yang dipanggil dari client-side yang perlu `"use server"`

**File yang diubah:**
- `src/server/adapters/midtrans/snap.adapter.ts`

**Perubahan:**
```typescript
// BEFORE (❌ Error)
"use server";

export function getSnapScriptUrl(): string {
  // ...
}

// AFTER (✅ Fixed)
// Removed "use server" directive

export function getSnapScriptUrl(): string {
  // ...
}
```

---

### 2. TypeScript Error: "Could not find declaration file for 'midtrans-client'"

#### Error Message
```
Could not find a declaration file for module 'midtrans-client'.
Try `npm i --save-dev @types/midtrans-client` if it exists
```

#### Cause
Package `midtrans-client` tidak memiliki TypeScript type definitions.

#### Solution ✅
Tambahkan `// @ts-ignore` comment sebelum import:

```typescript
// @ts-ignore - midtrans-client doesn't have TypeScript definitions
import midtransClient from "midtrans-client";
```

**Alternative Solution:**
Buat custom type definition file `src/types/midtrans-client.d.ts`:
```typescript
declare module 'midtrans-client' {
  export class Snap {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    createTransaction(params: any): Promise<any>;
    transaction: {
      status(orderId: string): Promise<any>;
      cancel(orderId: string): Promise<any>;
      approve(orderId: string): Promise<any>;
      expire(orderId: string): Promise<any>;
    };
  }
}
```

---

### 3. Migration Error: "Enum value 'PENDING' is still in use"

#### Error Message
```
Error: Enum value 'PENDING' is still in use by existing data
```

#### Cause
Database masih memiliki records dengan status `PENDING` yang akan dihapus dari enum.

#### Solution ✅
Update data terlebih dahulu sebelum migration:

```sql
-- Update all PENDING bookings to UNPAID
UPDATE "Booking" 
SET status = 'UNPAID' 
WHERE status = 'PENDING';

-- Then run migration
npx prisma migrate dev --name add_unpaid_booking_status
```

---

### 4. Webhook Not Working

#### Symptoms
- Midtrans notification tidak update booking status
- Payment berhasil tapi booking masih UNPAID

#### Checklist ✅

1. **Verify Webhook URL di Midtrans Dashboard**
   ```
   Settings → Configuration → Payment Notification URL
   https://yourdomain.com/api/bookings/payment/webhook
   ```

2. **Check Endpoint Accessibility**
   ```bash
   curl https://yourdomain.com/api/bookings/payment/webhook
   # Should return: {"status":"ok","message":"Midtrans webhook endpoint is active"}
   ```

3. **Verify Environment Variables**
   ```bash
   # Check .env or Vercel Environment Variables
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
   ```

4. **Check Vercel Logs**
   ```bash
   vercel logs --follow
   # Or in Vercel Dashboard → Logs
   ```

5. **Test Webhook Manually**
   ```bash
   # Get real notification from Midtrans Dashboard → Transactions
   # Copy notification JSON
   curl -X POST https://yourdomain.com/api/bookings/payment/webhook \
     -H "Content-Type: application/json" \
     -d @notification.json
   ```

6. **Verify Signature Calculation**
   ```typescript
   // In PaymentService.verifySignature()
   const signatureString = `${order_id}${status_code}${gross_amount}${serverKey}`;
   const calculatedSignature = crypto
     .createHash('sha512')
     .update(signatureString)
     .digest('hex');
   ```

---

### 5. Cron Job Not Running

#### Symptoms
- UNPAID bookings tidak expire otomatis
- Cron job tidak muncul di Vercel Dashboard

#### Checklist ✅

1. **Verify `vercel.json` exists**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/expire/bookings",
         "schedule": "*/10 * * * *"
       }
     ]
   }
   ```

2. **Check Vercel Dashboard**
   ```
   Project → Settings → Cron Jobs
   Should show: /api/cron/expire/bookings (Every 10 minutes)
   ```

3. **Verify CRON_SECRET**
   ```bash
   # In Vercel Environment Variables
   CRON_SECRET=your_random_secret_key
   ```

4. **Test Manually**
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://yourdomain.com/api/cron/expire/bookings
   ```

5. **Check Cron Logs**
   ```bash
   # Vercel Dashboard → Logs
   # Filter by: /api/cron/expire/bookings
   ```

---

### 6. Room Still Blocked by UNPAID Booking

#### Symptoms
- User tidak bisa booking kamar
- Error: "Room not available"
- Padahal booking sebelumnya masih UNPAID

#### Cause
Availability check tidak exclude UNPAID bookings.

#### Solution ✅
Verify `BookingRepository.getBookingsForRoom()`:

```typescript
const bookings = await prisma.booking.findMany({
  where: {
    roomId,
    status: {
      // Must exclude UNPAID, CANCELLED, EXPIRED
      notIn: [BookingStatus.UNPAID, BookingStatus.CANCELLED, BookingStatus.EXPIRED]
    },
    // ... date range filters
  }
});
```

---

### 7. Payment Token Not Generated

#### Symptoms
- Booking created successfully
- But `paymentToken` is undefined
- Cannot redirect to Midtrans payment page

#### Checklist ✅

1. **Check Midtrans Credentials**
   ```bash
   # Verify in .env
   MIDTRANS_SERVER_KEY=SB-Mid-server-xxx  # Must start with SB- for sandbox
   MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
   MIDTRANS_IS_PRODUCTION=false
   ```

2. **Check Error Logs**
   ```bash
   # Look for "Midtrans error:" in logs
   vercel logs --follow
   ```

3. **Verify Snap Request Payload**
   ```typescript
   // In PaymentService.createSnapRequest()
   const request: MidtransSnapRequest = {
     transaction_details: {
       order_id: payment.midtransOrderId,  // Must be unique
       gross_amount: Math.round(payment.amount)  // Must be integer
     },
     customer_details: {
       first_name: user.name || 'Customer',
       email: user.email || '',  // Required
       phone: user.phoneNumber
     },
     // ...
   };
   ```

4. **Test Midtrans API Directly**
   ```bash
   curl -X POST https://app.sandbox.midtrans.com/snap/v1/transactions \
     -H "Authorization: Basic $(echo -n 'YOUR_SERVER_KEY:' | base64)" \
     -H "Content-Type: application/json" \
     -d '{
       "transaction_details": {
         "order_id": "TEST-001",
         "gross_amount": 100000
       }
     }'
   ```

---

### 8. Database Connection Issues (Localhost)

#### Symptoms
- Error: "Can't reach database server"
- Prisma client errors

#### Solution ✅

1. **Check Database is Running**
   ```bash
   # For PostgreSQL
   pg_isready
   
   # Or check Docker container
   docker ps
   ```

2. **Verify DATABASE_URL**
   ```bash
   # In .env
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   DIRECT_URL="postgresql://user:password@localhost:5432/dbname"
   ```

3. **Test Connection**
   ```bash
   npx prisma db pull
   # Should succeed if connection is OK
   ```

4. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

---

### 9. Build Succeeds but Runtime Errors

#### Symptoms
- Build passes
- But errors when accessing endpoints
- "Module not found" or "Cannot find module"

#### Solution ✅

1. **Clear Next.js Cache**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Import Paths**
   ```typescript
   // Use absolute imports with @/ alias
   import { BookingAPI } from "@/server/api/booking.api";
   
   // Not relative imports
   import { BookingAPI } from "../../../server/api/booking.api";
   ```

---

### 10. TypeScript Errors After Migration

#### Symptoms
- "Property 'UNPAID' does not exist on type 'BookingStatus'"
- Type errors in IDE

#### Solution ✅

1. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Restart TypeScript Server**
   ```
   VS Code: Cmd/Ctrl + Shift + P
   → "TypeScript: Restart TS Server"
   ```

3. **Clear TypeScript Cache**
   ```bash
   # Delete tsconfig.tsbuildinfo if exists
   rm tsconfig.tsbuildinfo
   ```

---

## 🆘 Getting Help

If issues persist:

1. **Check Logs**
   - Vercel Dashboard → Logs
   - Browser Console (F12)
   - Terminal output

2. **Verify Environment**
   - All environment variables set
   - Database accessible
   - Midtrans credentials correct

3. **Test Endpoints**
   - Use Postman or curl
   - Check response status codes
   - Verify request/response payloads

4. **Review Documentation**
   - `BOOKING_PAYMENT_FLOW.md`
   - `MIGRATION_GUIDE.md`
   - Midtrans API docs

---

**Last Updated**: 2025-01-06

