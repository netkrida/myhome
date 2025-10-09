# Midtrans Payment Integration - Troubleshooting Guide

## 🔴 Masalah yang Dialami

Berdasarkan logs yang Anda berikan:

```
POST /api/bookings/payment/webhook 201 in 1207ms
🔍 Middleware - Processing: {
  pathname: '/api/bookings/payment/webhook',
  ...
}
🔍 Middleware - Token: { hasToken: false, ... }
🔄 Middleware - Redirecting to login
```

**Root Cause**: Middleware authentication memblokir webhook dari Midtrans karena webhook tidak membawa auth token.

---

## ✅ Solusi yang Sudah Diterapkan

### 1. **Middleware Fix**

File: `src/middleware.ts`

**Yang ditambahkan:**
```typescript
// Webhook endpoints yang TIDAK memerlukan authentication
const WEBHOOK_ROUTES = [
  "/api/midtrans/notify",           // Endpoint baru (recommended)
  "/api/bookings/payment/webhook",  // Endpoint lama (existing)
  "/api/payments/webhook"           // Fallback
];

// Skip webhook routes - security handled by signature verification
if (WEBHOOK_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
  console.log("🔓 Middleware - Webhook route, skipping auth:", pathname);
  return NextResponse.next();
}
```

**Public routes yang ditambahkan:**
- `/payment` - Payment pages (success, failed, pending)
- `/api/payments/status` - Status polling endpoint
- `/api/debug` - Debug endpoints

### 2. **Webhook Endpoint Fix**

File: `src/app/api/midtrans/notify/route.ts`

**Yang diperbaiki:**
- ✅ Return **200 OK** untuk semua case (termasuk invalid signature)
- ✅ Enhanced logging untuk debugging
- ✅ Proper error handling sesuai Midtrans best practices

**Sebelum:**
```typescript
if (!isSignatureValid) {
  return NextResponse.json({ ... }, { status: 401 }); // ❌ Akan di-retry
}
```

**Sesudah:**
```typescript
if (!isSignatureValid) {
  // Return 200 to prevent Midtrans from retrying
  return NextResponse.json({ ... }, { status: 200 }); // ✅ Tidak di-retry
}
```

### 3. **Comprehensive Logging**

Semua layer sudah ditambahkan logging:
- 🔵 Create payment token
- 🔔 Webhook notification received
- 🔐 Signature verification
- 💾 Database transaction
- ✅ Success confirmation

---

## 🚀 Langkah-Langkah Testing

### **Step 1: Restart Server** ⚠️ PENTING!

```bash
# Stop server (Ctrl+C di terminal)
# Start server
npm run dev
```

**Mengapa harus restart?**
- Middleware changes hanya ter-apply setelah restart
- Environment variables ter-reload

### **Step 2: Test Webhook Access**

**Cara 1: Menggunakan script (Linux/Mac/Git Bash)**
```bash
chmod +x scripts/test-webhook-access.sh
./scripts/test-webhook-access.sh
```

**Cara 2: Manual test dengan curl**
```bash
# Test health check
curl https://9469ca9c51ce.ngrok-free.app/api/midtrans/notify

# Expected response:
# {"message":"Midtrans webhook endpoint is active"}
# Status: 200 (NOT 307 redirect!)
```

**Cara 3: Test di browser**
```
https://9469ca9c51ce.ngrok-free.app/api/midtrans/notify
```

Harus menampilkan JSON response, **BUKAN** redirect ke login!

### **Step 3: Update Midtrans Dashboard**

1. Login ke [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com/)

2. **Settings** → **Configuration**

3. **Payment Notification URL**:
   ```
   https://9469ca9c51ce.ngrok-free.app/api/midtrans/notify
   ```

4. **Save**

### **Step 4: Test Real Payment**

1. **Create booking dan payment**
2. **Complete payment di Midtrans Snap**
3. **Cek terminal logs** - harus muncul:

```
🔓 Middleware - Webhook route, skipping auth: /api/midtrans/notify
🔔 ========================================
🔔 MIDTRANS NOTIFICATION RECEIVED
🔔 ========================================
📦 Full payload: { ... }
🔑 Order ID: DEP-XXX-YYY
📊 Transaction Status: settlement
💳 Payment Type: bank_transfer
💰 Gross Amount: 500000.00
🔐 Signature Key: abc123...
🔔 ========================================
✅ Notification validation passed
🔐 Verifying signature...
✅ Signature verification passed
💾 Processing payment confirmation...
🔄 confirmPayment called: { ... }
🔍 Finding payment by order ID: DEP-XXX-YYY
✅ Payment found: { ... }
🔄 Mapping transaction status: settlement
✅ Mapped to payment status: SUCCESS
🔄 Determining booking status...
   Current booking status: UNPAID
   Payment type: DEPOSIT
   New payment status: SUCCESS
   → Booking status will be: DEPOSIT_PAID
💾 Starting database transaction...
   📝 Updating payment record...
   ✅ Payment updated: { ... }
   📝 Updating booking record...
   ✅ Booking updated: { ... }
✅ Database transaction completed successfully
✅ ========================================
✅ PAYMENT CONFIRMED SUCCESSFULLY
✅ ========================================
```

### **Step 5: Verify Database**

**Cara 1: Prisma Studio**
```bash
npx prisma studio
```
- Buka http://localhost:5555
- Cek Payment table
- Pastikan fields ter-update

**Cara 2: Debug Endpoint**
```bash
curl https://9469ca9c51ce.ngrok-free.app/api/debug/payment/DEP-XXX-YYY
```

**Cara 3: SQL Query**
```sql
SELECT 
  "midtransOrderId",
  "status",
  "paymentMethod",
  "transactionTime",
  "transactionId"
FROM "Payment"
WHERE "midtransOrderId" = 'DEP-XXX-YYY';
```

**Expected result:**
- ✅ `status` = "SUCCESS"
- ✅ `paymentMethod` = "bank_transfer" (atau lainnya)
- ✅ `transactionTime` = timestamp
- ✅ `transactionId` = ID dari Midtrans

---

## 🔍 Debugging Checklist

### Before Testing
- [ ] Server di-restart setelah middleware changes
- [ ] Ngrok running: `ngrok http 3000`
- [ ] `.env.local` updated dengan ngrok URL baru
- [ ] Midtrans Dashboard updated dengan ngrok URL

### Webhook Access Test
- [ ] GET `/api/midtrans/notify` return 200 (bukan 307)
- [ ] POST `/api/midtrans/notify` return 400/200 (bukan 307)
- [ ] GET `/api/payments/status` return 200/404 (bukan 307)
- [ ] GET `/payment/success` return 200 (bukan 307)

### Payment Flow Test
- [ ] Create payment → Logs muncul
- [ ] Snap popup terbuka
- [ ] Complete payment
- [ ] **Webhook logs muncul** ← PENTING!
- [ ] Database ter-update
- [ ] Success page menampilkan data

### Verification
- [ ] Ngrok dashboard: webhook request ada (status 200)
- [ ] Terminal: "🔓 Middleware - Webhook route, skipping auth"
- [ ] Terminal: "✅ PAYMENT CONFIRMED SUCCESSFULLY"
- [ ] Database: Payment.status = SUCCESS
- [ ] Database: Booking.status = DEPOSIT_PAID/CONFIRMED

---

## 🚨 Common Issues

### Issue 1: Webhook masih redirect ke login

**Symptoms:**
```
🔄 Middleware - Redirecting to login
```

**Solutions:**
1. ✅ Server belum di-restart → **Restart server!**
2. ✅ Middleware changes belum ter-apply → **Hard restart (kill process)**
3. ✅ URL webhook salah → **Cek URL di Midtrans Dashboard**

**Test:**
```bash
curl https://your-ngrok-url.ngrok-free.app/api/midtrans/notify
```
Harus return JSON, bukan HTML redirect!

### Issue 2: Signature verification failed

**Symptoms:**
```
❌ Invalid Midtrans signature
```

**Solutions:**
1. ✅ Server key salah → Cek `MIDTRANS_SERVER_KEY` di `.env.local`
2. ✅ Gross amount format salah → Harus "500000.00" (dengan 2 desimal)
3. ✅ Order ID tidak match → Cek order ID di database

**Debug:**
```typescript
// Signature calculation:
SHA512(order_id + status_code + gross_amount + serverKey)

// Example:
SHA512("DEP-XXX-YYY" + "200" + "500000.00" + "your-server-key")
```

### Issue 3: Database tidak ter-update

**Symptoms:**
- Webhook logs muncul
- Signature valid
- Tapi Payment.status masih PENDING

**Solutions:**
1. ✅ Transaction error → Cek logs untuk database error
2. ✅ Idempotency check → Payment sudah processed sebelumnya
3. ✅ Status mapping salah → Cek `transaction_status` dari Midtrans

**Debug:**
```bash
# Test webhook manual
curl -X POST https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "DEP-XXX-YYY",
    "transactionStatus": "settlement"
  }'
```

### Issue 4: Order ID tidak ditemukan di success page

**Symptoms:**
```
Order ID tidak ditemukan
```

**Solutions:**
1. ✅ URL parameter tidak ter-pass → Cek browser console
2. ✅ Redirect URL salah → Cek Snap request logs
3. ✅ Midtrans Dashboard settings → Jangan tambahkan parameter di Finish URL

**Test:**
```
# Manual test
https://your-ngrok-url.ngrok-free.app/payment/success?orderId=DEP-XXX-YYY
```

---

## 📊 Expected Flow

### 1. Create Payment
```
User → Create Booking → Create Payment → Get Snap Token
```

**Logs:**
```
🔵 Creating payment token: { orderId: 'DEP-XXX-YYY', ... }
✅ Snap transaction created
```

### 2. Payment Process
```
User → Open Snap → Complete Payment → Midtrans sends webhook
```

**Logs:**
```
🔓 Middleware - Webhook route, skipping auth
🔔 MIDTRANS NOTIFICATION RECEIVED
✅ Signature verification passed
💾 Processing payment confirmation
✅ PAYMENT CONFIRMED SUCCESSFULLY
```

### 3. Database Update
```
Payment.status: PENDING → SUCCESS
Booking.status: UNPAID → DEPOSIT_PAID/CONFIRMED
```

### 4. User Redirect
```
Midtrans → /payment/success?orderId=XXX → Poll status → Show success
```

---

## 📝 Midtrans Best Practices (Implemented)

Berdasarkan [dokumentasi resmi Midtrans](https://docs.midtrans.com/reference/handle-notifications):

✅ **HTTPS endpoint** - Ngrok provides HTTPS
✅ **Idempotent handling** - Check if status !== PENDING
✅ **Signature verification** - SHA512 hash validation
✅ **Return 200 OK** - For all cases to prevent retries
✅ **Response time < 5s** - Database transaction optimized
✅ **Check 3 fields for success**:
   - `status_code`: "200"
   - `fraud_status`: "accept"
   - `transaction_status`: "settlement" or "capture"
✅ **Handle out-of-order notifications** - Idempotency check
✅ **Parse JSON gracefully** - Non-strict parsing
✅ **Proper HTTP status codes** - 200 for success, 400 for validation

---

## 🆘 Still Having Issues?

### Collect Debug Information

1. **Terminal logs** (full logs dari create payment sampai webhook)
2. **Ngrok dashboard** (http://localhost:4040) - webhook request/response
3. **Browser console** (success page logs)
4. **Database record** (Payment & Booking)
5. **Midtrans Dashboard** (transaction details)

### Share Information

Kirim informasi berikut:
- Screenshot terminal logs
- Screenshot ngrok dashboard
- Screenshot browser console
- Database query result
- Midtrans transaction ID

---

## ✅ Success Indicators

Payment berhasil jika:
- ✅ Terminal: "🔓 Middleware - Webhook route, skipping auth"
- ✅ Terminal: "✅ PAYMENT CONFIRMED SUCCESSFULLY"
- ✅ Ngrok: Webhook request dengan status 200
- ✅ Database: Payment.status = "SUCCESS"
- ✅ Database: Booking.status = "DEPOSIT_PAID" atau "CONFIRMED"
- ✅ Success page: Menampilkan detail payment dengan benar

