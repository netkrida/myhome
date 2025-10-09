# Debugging Payment Issues

Panduan lengkap untuk debugging masalah payment Midtrans.

## 🐛 Masalah Umum

### Masalah 1: Order ID tidak ditemukan di halaman success

**Gejala:**
- Redirect ke `/payment/success` berhasil
- Halaman menampilkan "Order ID tidak ditemukan"

**Penyebab:**
1. Midtrans tidak mengirim `orderId` di URL redirect
2. Redirect URL di Midtrans Dashboard tidak sesuai
3. Redirect URL di Snap request tidak sesuai

**Solusi:**

#### Step 1: Cek Console Browser
Buka browser console di halaman success dan lihat log:
```
🔍 Success page loaded
   Search params: { ... }
   Order ID: xxx
```

Jika `Order ID: null`, berarti parameter tidak ter-pass.

#### Step 2: Cek Midtrans Dashboard Settings
1. Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Pergi ke **Settings** → **Snap Preferences**
3. Pastikan **Finish URL** adalah:
   ```
   https://your-ngrok-url.ngrok-free.app/payment/success
   ```
   **JANGAN** tambahkan `?orderId=xxx` di sini!

#### Step 3: Cek Snap Request
Lihat terminal logs saat create payment:
```
🔵 Snap redirect URLs: {
  finish: 'https://xxx.ngrok-free.app/payment/success?orderId=DEP-XXX-YYY',
  error: 'https://xxx.ngrok-free.app/payment/failed?reason=error&orderId=DEP-XXX-YYY',
  pending: 'https://xxx.ngrok-free.app/payment/pending?orderId=DEP-XXX-YYY'
}
```

Pastikan `orderId` ada di URL.

#### Step 4: Test Manual
Buka URL ini di browser:
```
https://your-ngrok-url.ngrok-free.app/payment/success?orderId=DEP-XXX-YYY
```

Ganti `DEP-XXX-YYY` dengan order ID yang valid dari database.

---

### Masalah 2: Payment fields NULL di database

**Gejala:**
- Payment record ada di database
- Field `paymentMethod`, `transactionTime`, `transactionId` = NULL
- Field `status` masih PENDING

**Penyebab:**
1. Webhook dari Midtrans tidak sampai ke server
2. Webhook gagal diproses (error di server)
3. Signature verification gagal
4. Database transaction gagal

**Solusi:**

#### Step 1: Cek Ngrok Dashboard
1. Buka http://localhost:4040 (ngrok web interface)
2. Lihat tab **Requests**
3. Cari request POST ke `/api/midtrans/notify`

**Jika tidak ada request:**
- Webhook tidak sampai dari Midtrans
- Cek Notification URL di Midtrans Dashboard
- Pastikan ngrok masih running

**Jika ada request:**
- Klik request untuk lihat detail
- Cek status code response (harus 200)
- Lihat request body dari Midtrans
- Lihat response body dari server

#### Step 2: Cek Terminal Logs
Saat webhook diterima, harus ada log seperti ini:
```
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

**Jika tidak ada log sama sekali:**
- Webhook tidak sampai ke server
- Cek ngrok dan Midtrans Dashboard

**Jika ada error di log:**
- Baca error message
- Lihat di bagian mana error terjadi
- Lanjut ke Step 3

#### Step 3: Test Webhook Manual
Gunakan debug endpoint untuk test webhook tanpa Midtrans:

```bash
# Get order ID dari database
# Misal: DEP-CLXXX-ABC123

# Test webhook
curl -X POST https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "DEP-CLXXX-ABC123",
    "transactionStatus": "settlement",
    "grossAmount": "500000"
  }'
```

Atau gunakan Postman/Insomnia:
- Method: POST
- URL: `https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook`
- Body (JSON):
  ```json
  {
    "orderId": "DEP-CLXXX-ABC123",
    "transactionStatus": "settlement",
    "grossAmount": "500000"
  }
  ```

Lihat response dan terminal logs.

#### Step 4: Cek Database Langsung
```sql
-- Cek payment record
SELECT 
  "midtransOrderId",
  "paymentType",
  "amount",
  "status",
  "paymentMethod",
  "transactionTime",
  "transactionId",
  "createdAt",
  "updatedAt"
FROM "Payment"
WHERE "midtransOrderId" = 'DEP-CLXXX-ABC123';

-- Cek booking terkait
SELECT 
  "bookingCode",
  "status",
  "paymentStatus",
  "totalAmount",
  "depositAmount"
FROM "Booking"
WHERE id = (
  SELECT "bookingId" 
  FROM "Payment" 
  WHERE "midtransOrderId" = 'DEP-CLXXX-ABC123'
);
```

#### Step 5: Trigger Webhook dari Midtrans Dashboard
1. Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Pergi ke **Transactions**
3. Cari order ID Anda
4. Klik **Actions** → **Resend Notification**
5. Cek terminal logs dan database

---

## 🔧 Debug Endpoints

### 1. Check Payment Status
```
GET /api/debug/payment/[orderId]
```

Example:
```bash
curl https://your-ngrok-url.ngrok-free.app/api/debug/payment/DEP-CLXXX-ABC123
```

Response:
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "...",
      "midtransOrderId": "DEP-CLXXX-ABC123",
      "status": "PENDING",
      "paymentMethod": null,
      "transactionTime": null,
      "transactionId": null
    },
    "booking": {
      "id": "...",
      "bookingCode": "BK...",
      "status": "UNPAID",
      "paymentStatus": "PENDING"
    }
  }
}
```

### 2. Test Webhook Processing
```
POST /api/debug/test-webhook
```

Example:
```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/debug/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "DEP-CLXXX-ABC123",
    "transactionStatus": "settlement"
  }'
```

---

## 📊 Checklist Debugging

### Before Payment
- [ ] Ngrok running dan URL valid
- [ ] Notification URL di Midtrans Dashboard benar
- [ ] Redirect URLs di Midtrans Dashboard benar
- [ ] Environment variables lengkap
- [ ] Database connection OK

### During Payment
- [ ] Payment record created di database (status PENDING)
- [ ] Snap popup terbuka
- [ ] Payment berhasil di Midtrans
- [ ] Redirect ke success page

### After Payment
- [ ] Webhook request masuk (cek ngrok dashboard)
- [ ] Terminal logs menampilkan webhook processing
- [ ] Payment status updated di database
- [ ] Booking status updated di database
- [ ] Success page menampilkan data dengan benar

---

## 🚨 Common Errors

### Error: "Invalid signature"
**Penyebab:** Server key salah atau payload berubah

**Solusi:**
1. Cek `MIDTRANS_SERVER_KEY` di `.env.local`
2. Pastikan sama dengan di Midtrans Dashboard
3. Restart server setelah ubah env

### Error: "Payment not found"
**Penyebab:** Order ID tidak ada di database

**Solusi:**
1. Cek database: `SELECT * FROM "Payment" WHERE "midtransOrderId" = 'xxx'`
2. Pastikan payment created sebelum webhook
3. Cek logs saat create payment

### Error: "Transaction failed"
**Penyebab:** Database error saat update

**Solusi:**
1. Cek database connection
2. Cek Prisma schema
3. Lihat error detail di logs

### Error: "Order ID tidak ditemukan" di success page
**Penyebab:** URL parameter tidak ter-pass

**Solusi:**
1. Cek browser console logs
2. Cek URL di address bar
3. Test manual dengan URL lengkap
4. Cek Midtrans Dashboard redirect settings

---

## 📝 Logging Guide

### Enable Detailed Logs
Semua logs sudah ditambahkan dengan emoji untuk mudah dibaca:

- 🔵 = Info (create payment, etc)
- 🔔 = Webhook received
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- 🔐 = Security (signature verification)
- 💾 = Database operation
- 🔄 = Processing
- 🔍 = Search/Find

### Read Logs
```bash
# Terminal akan menampilkan logs seperti ini:
🔵 Creating payment token: { orderId: 'DEP-XXX', ... }
✅ Snap transaction created: { ... }

# Saat webhook:
🔔 MIDTRANS NOTIFICATION RECEIVED
📦 Full payload: { ... }
✅ Signature verification passed
💾 Starting database transaction...
✅ PAYMENT CONFIRMED SUCCESSFULLY
```

---

## 🔗 Useful Links

- Ngrok Dashboard: http://localhost:4040
- Midtrans Dashboard: https://dashboard.sandbox.midtrans.com/
- Database GUI: Prisma Studio (`npx prisma studio`)

---

## 💡 Tips

1. **Selalu cek ngrok dashboard** untuk lihat webhook requests
2. **Gunakan test webhook endpoint** untuk debug tanpa Midtrans
3. **Cek database langsung** untuk verify updates
4. **Simpan order ID** untuk debugging
5. **Screenshot error messages** untuk reference

