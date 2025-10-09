# Quick Debug Guide - Payment Issues

Panduan cepat untuk debug 2 masalah payment yang Anda alami.

## 🎯 Masalah yang Dialami

### ❌ Masalah 1: Order ID tidak ditemukan di halaman success
### ❌ Masalah 2: Payment fields NULL di database (webhook tidak diproses)

---

## 🚀 Quick Fix Steps

### Step 1: Cek Logs Terminal (PENTING!)

Saat Anda melakukan payment, terminal harus menampilkan logs seperti ini:

**Saat Create Payment:**
```
🔵 Creating payment token: {
  orderId: 'DEP-CLXXX-ABC123',
  bookingId: 'clxxx...',
  paymentType: 'DEPOSIT',
  amount: 500000,
  baseUrl: 'https://xxx.ngrok-free.app'
}
🔵 Snap redirect URLs: {
  finish: 'https://xxx.ngrok-free.app/payment/success?orderId=DEP-CLXXX-ABC123',
  error: 'https://xxx.ngrok-free.app/payment/failed?reason=error&orderId=DEP-CLXXX-ABC123',
  pending: 'https://xxx.ngrok-free.app/payment/pending?orderId=DEP-CLXXX-ABC123'
}
✅ Snap transaction created: { ... }
```

**Saat Webhook Diterima:**
```
🔔 ========================================
🔔 MIDTRANS NOTIFICATION RECEIVED
🔔 ========================================
📦 Full payload: { ... }
🔑 Order ID: DEP-CLXXX-ABC123
📊 Transaction Status: settlement
💳 Payment Type: bank_transfer
💰 Gross Amount: 500000.00
🔐 Signature Key: abc123...
🔔 ========================================
✅ Notification validation passed
🔐 Verifying signature...
✅ Signature verification passed
💾 Processing payment confirmation...
...
✅ PAYMENT CONFIRMED SUCCESSFULLY
```

**❓ Apa yang harus dilakukan:**

1. **Jika TIDAK ADA logs webhook sama sekali** → Lanjut ke Step 2
2. **Jika ADA logs webhook tapi ada error** → Baca error message dan lanjut ke Step 3
3. **Jika ADA logs webhook dan sukses** → Lanjut ke Step 4

---

### Step 2: Cek Ngrok Dashboard

1. Buka browser: **http://localhost:4040**
2. Klik tab **"Requests"** atau **"Inspect"**
3. Cari request **POST** ke `/api/midtrans/notify`

**Jika TIDAK ADA request:**
- ❌ Webhook dari Midtrans tidak sampai ke server
- **Solusi:**
  1. Cek apakah ngrok masih running: `ps aux | grep ngrok`
  2. Cek Notification URL di Midtrans Dashboard
  3. Pastikan URL adalah: `https://your-ngrok-url.ngrok-free.app/api/midtrans/notify`

**Jika ADA request:**
- ✅ Webhook sampai ke server
- Klik request untuk lihat detail
- Cek **Status Code** (harus 200)
- Cek **Response Body** untuk lihat error (jika ada)
- Lanjut ke Step 3

---

### Step 3: Test Webhook Manual

Gunakan debug endpoint untuk test webhook tanpa Midtrans:

**Cara 1: Menggunakan curl**
```bash
# Ganti ORDER_ID dengan order ID dari database
# Misal: DEP-CLXXX-ABC123

curl -X POST https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "DEP-CLXXX-ABC123",
    "transactionStatus": "settlement"
  }'
```

**Cara 2: Menggunakan Postman/Insomnia**
- Method: **POST**
- URL: `https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "orderId": "DEP-CLXXX-ABC123",
    "transactionStatus": "settlement"
  }
  ```

**Cara 3: Menggunakan script (jika di Linux/Mac)**
```bash
chmod +x scripts/test-payment.sh
./scripts/test-payment.sh webhook DEP-CLXXX-ABC123
```

**Hasil yang diharapkan:**
- Terminal menampilkan logs webhook processing
- Response JSON: `{ "success": true, ... }`
- Database ter-update (cek di Step 4)

**Jika gagal:**
- Baca error message di response
- Cek terminal logs untuk detail error
- Kemungkinan: Payment tidak ditemukan, database error, dll

---

### Step 4: Cek Database

**Cara 1: Menggunakan Prisma Studio**
```bash
npx prisma studio
```
- Buka browser: http://localhost:5555
- Klik **Payment** table
- Cari record dengan `midtransOrderId` = order ID Anda
- Cek field: `status`, `paymentMethod`, `transactionTime`, `transactionId`

**Cara 2: Menggunakan SQL**
```sql
-- Cek payment
SELECT 
  "midtransOrderId",
  "status",
  "paymentMethod",
  "transactionTime",
  "transactionId",
  "amount"
FROM "Payment"
WHERE "midtransOrderId" = 'DEP-CLXXX-ABC123';

-- Cek booking terkait
SELECT 
  b."bookingCode",
  b."status",
  b."paymentStatus"
FROM "Booking" b
JOIN "Payment" p ON p."bookingId" = b.id
WHERE p."midtransOrderId" = 'DEP-CLXXX-ABC123';
```

**Cara 3: Menggunakan debug endpoint**
```bash
curl https://your-ngrok-url.ngrok-free.app/api/debug/payment/DEP-CLXXX-ABC123
```

**Yang harus dicek:**
- ✅ `status` = "SUCCESS" (bukan PENDING)
- ✅ `paymentMethod` = "bank_transfer" atau payment method lain (bukan NULL)
- ✅ `transactionTime` = timestamp (bukan NULL)
- ✅ `transactionId` = ID dari Midtrans (bukan NULL)

**Jika masih NULL:**
- Webhook belum diproses
- Kembali ke Step 2 dan 3

---

### Step 5: Trigger Webhook dari Midtrans Dashboard

Jika webhook tidak otomatis terkirim, trigger manual:

1. Login ke [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com/)
2. Klik **Transactions** di menu
3. Cari order ID Anda (gunakan search box)
4. Klik order untuk lihat detail
5. Klik **Actions** → **Resend Notification**
6. Cek terminal logs dan database (Step 1 dan 4)

---

### Step 6: Fix Order ID di Success Page

**Jika masalah masih ada setelah Step 1-5:**

1. **Cek browser console** di halaman success:
   - Buka DevTools (F12)
   - Lihat tab Console
   - Cari log: `🔍 Success page loaded`
   - Lihat `Order ID: xxx`

2. **Jika Order ID = null:**
   - Cek URL di address bar
   - Seharusnya: `https://xxx.ngrok-free.app/payment/success?orderId=DEP-XXX-YYY`
   - Jika tidak ada `?orderId=...`, berarti redirect URL salah

3. **Test manual:**
   ```bash
   # Buka URL ini di browser (ganti ORDER_ID)
   https://your-ngrok-url.ngrok-free.app/payment/success?orderId=DEP-CLXXX-ABC123
   ```

4. **Cek Midtrans Dashboard Settings:**
   - Settings → Snap Preferences
   - **Finish URL** harus: `https://your-ngrok-url.ngrok-free.app/payment/success`
   - **JANGAN** tambahkan `?orderId=xxx` di sini!
   - Snap request yang menambahkan parameter

---

## 🔍 Checklist Debugging

Gunakan checklist ini untuk memastikan semua sudah benar:

### Environment Setup
- [ ] Ngrok running: `ngrok http 3000`
- [ ] Ngrok URL dicopy ke `.env.local` → `APP_BASE_URL`
- [ ] Server running: `npm run dev`
- [ ] Database running dan accessible

### Midtrans Dashboard
- [ ] Login ke [Dashboard Sandbox](https://dashboard.sandbox.midtrans.com/)
- [ ] Settings → Configuration → **Payment Notification URL**:
      `https://your-ngrok-url.ngrok-free.app/api/midtrans/notify`
- [ ] Settings → Snap Preferences → **Finish URL**:
      `https://your-ngrok-url.ngrok-free.app/payment/success`
- [ ] Settings → Snap Preferences → **Error URL**:
      `https://your-ngrok-url.ngrok-free.app/payment/failed?reason=error`

### Payment Flow
- [ ] Create payment → Logs muncul di terminal
- [ ] Snap popup terbuka
- [ ] Complete payment di Snap
- [ ] Redirect ke success page
- [ ] Webhook logs muncul di terminal
- [ ] Database ter-update

### Verification
- [ ] Cek ngrok dashboard: http://localhost:4040
- [ ] Cek terminal logs: webhook received & processed
- [ ] Cek database: payment status = SUCCESS
- [ ] Cek success page: data ditampilkan dengan benar

---

## 🆘 Jika Masih Bermasalah

### 1. Restart Everything
```bash
# Stop ngrok (Ctrl+C)
# Stop server (Ctrl+C)

# Start ngrok
ngrok http 3000

# Copy new ngrok URL to .env.local
# Update Midtrans Dashboard with new URL

# Start server
npm run dev

# Try payment again
```

### 2. Check Logs Carefully
Semua logs sudah ditambahkan dengan emoji untuk mudah dibaca:
- 🔵 = Info
- 🔔 = Webhook
- ✅ = Success
- ❌ = Error
- 🔐 = Security
- 💾 = Database

Baca logs dari atas ke bawah untuk trace flow.

### 3. Use Debug Endpoints
```bash
# Check payment status
curl https://your-ngrok-url.ngrok-free.app/api/debug/payment/DEP-XXX-YYY

# Test webhook
curl -X POST https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"orderId":"DEP-XXX-YYY","transactionStatus":"settlement"}'
```

### 4. Manual Database Update (Last Resort)
Jika webhook benar-benar tidak bisa diproses, update manual:

```sql
-- Update payment
UPDATE "Payment"
SET 
  "status" = 'SUCCESS',
  "paymentMethod" = 'bank_transfer',
  "transactionTime" = NOW(),
  "transactionId" = 'MANUAL-TEST-123'
WHERE "midtransOrderId" = 'DEP-CLXXX-ABC123';

-- Update booking
UPDATE "Booking"
SET 
  "status" = 'DEPOSIT_PAID',
  "paymentStatus" = 'SUCCESS'
WHERE id = (
  SELECT "bookingId" 
  FROM "Payment" 
  WHERE "midtransOrderId" = 'DEP-CLXXX-ABC123'
);
```

**⚠️ WARNING:** Ini hanya untuk testing! Production harus pakai webhook.

---

## 📞 Need Help?

Jika masih bermasalah setelah mengikuti semua step:

1. **Screenshot error messages**
2. **Copy terminal logs** (full logs dari create payment sampai webhook)
3. **Copy ngrok dashboard** (request/response details)
4. **Export database record** (payment & booking)
5. **Share semua info di atas** untuk debugging lebih lanjut

---

## ✅ Success Indicators

Payment berhasil jika:
- ✅ Terminal logs menampilkan "PAYMENT CONFIRMED SUCCESSFULLY"
- ✅ Database: Payment.status = "SUCCESS"
- ✅ Database: Booking.status = "DEPOSIT_PAID" atau "CONFIRMED"
- ✅ Success page menampilkan detail payment dengan benar
- ✅ Ngrok dashboard menampilkan webhook request dengan status 200

