# Midtrans Redirect - Solusi Final untuk Error 409

## 🔴 Masalah

Setelah kosongkan Midtrans Dashboard Finish URL, muncul error 409:
```
https://app.sandbox.midtrans.com/snap/v4/redirection/...#/409
```

**Penyebab:**
- Dashboard Finish URL kosong ✅
- Tapi Snap request tidak include `callbacks` ❌
- Midtrans tidak tahu kemana harus redirect user

---

## ✅ Solusi: Gunakan Snap.js Callbacks

Alih-alih set redirect URLs di Snap request (yang bisa menyebabkan 409 error jika URL tidak valid), kita gunakan **Snap.js callbacks** untuk handle redirect di frontend.

### **Keuntungan:**
1. ✅ Tidak perlu set callbacks di Snap request
2. ✅ Tidak perlu set Finish URL di Dashboard
3. ✅ Tidak ada 409 error
4. ✅ Full control atas redirect logic
5. ✅ orderId selalu ter-pass dengan benar

---

## 🔧 Implementasi

### **1. Backend: Hapus Callbacks dari Snap Request**

**File: `src/server/api/payment.api.ts`**

**Sebelum:**
```typescript
const snapRequestWithRedirects = {
  ...snapRequest,
  callbacks: {
    finish: `${cleanBaseUrl}/payment/success?orderId=${orderId}`,
    error: `${cleanBaseUrl}/payment/failed?reason=error&orderId=${orderId}`,
    pending: `${cleanBaseUrl}/payment/pending?orderId=${orderId}`
  }
};

const snapResponse = await createSnapTransaction(snapRequestWithRedirects);
```

**Sesudah:**
```typescript
// Call Midtrans to create Snap transaction
// Note: We don't set callbacks here because:
// 1. Midtrans Dashboard settings should be empty
// 2. We'll handle redirect using Snap.js onSuccess/onPending/onError callbacks
// 3. This avoids 409 errors from invalid redirect URLs
const snapResponse = await createSnapTransaction(snapRequest);
```

**Return orderId ke frontend:**
```typescript
return ok({
  token: snapResponse.token,
  redirectUrl: snapResponse.redirect_url,
  orderId  // ← PENTING: Return orderId!
});
```

---

### **2. Frontend: Handle Redirect dengan Snap.js Callbacks**

**File: `src/components/payment/payment-button.tsx`**

**Sebelum:**
```typescript
(window as any).snap.pay(token, {
  onSuccess: function (result: any) {
    console.log("Payment success:", result);
    // Redirect will be handled by Midtrans finish URL
  },
  onPending: function (result: any) {
    console.log("Payment pending:", result);
    // Redirect will be handled by Midtrans pending URL
  },
  onError: function (result: any) {
    console.error("Payment error:", result);
    toast({ title: "Pembayaran Gagal", ... });
  },
});
```

**Sesudah:**
```typescript
const { token, redirectUrl, orderId } = result.data;

console.log("🔵 Payment token created:", { orderId, hasToken: !!token });

(window as any).snap.pay(token, {
  onSuccess: function (result: any) {
    console.log("✅ Payment success:", result);
    console.log("🔄 Redirecting to success page with orderId:", orderId);
    // Redirect to success page with orderId
    window.location.href = `/payment/success?orderId=${orderId}`;
  },
  onPending: function (result: any) {
    console.log("⏳ Payment pending:", result);
    console.log("🔄 Redirecting to pending page with orderId:", orderId);
    // Redirect to pending page with orderId
    window.location.href = `/payment/pending?orderId=${orderId}`;
  },
  onError: function (result: any) {
    console.error("❌ Payment error:", result);
    console.log("🔄 Redirecting to failed page with orderId:", orderId);
    // Redirect to failed page with orderId
    window.location.href = `/payment/failed?reason=error&orderId=${orderId}`;
  },
  onClose: function () {
    console.log("🚪 Payment popup closed");
    setLoading(false);
  },
});
```

---

## 📊 Flow Lengkap

### **Payment Flow (Setelah Fix):**

```
1. User klik "Bayar"
   ↓
2. Frontend call /api/payments/create
   ↓
3. Backend create payment & Snap token
   ↓
4. Backend return { token, orderId }
   ↓
5. Frontend open Snap popup dengan token
   ↓
6. User complete payment di Snap
   ↓
7. Midtrans send webhook → /api/midtrans/notify
   ↓
8. Webhook update database (Payment & Booking status)
   ↓
9. Snap.js trigger onSuccess callback
   ↓
10. Frontend redirect: window.location.href = `/payment/success?orderId=${orderId}`
    ↓
11. Success page poll /api/payments/status?orderId=XXX
    ↓
12. Success page tampil detail payment ✅
```

**Key Points:**
- ✅ Webhook update database (step 8)
- ✅ Frontend redirect dengan orderId (step 10)
- ✅ Success page poll status (step 11)
- ✅ User lihat detail payment (step 12)

---

## 🧪 Testing

### **Test 1: Create Payment**

1. **Create booking baru**
2. **Klik "Bayar"**
3. **Cek browser console:**
   ```
   🔵 Payment token created: { orderId: 'FULL-XXX-YYY', hasToken: true }
   ```
4. **Snap popup harus muncul** ✅

### **Test 2: Complete Payment**

1. **Di Snap popup, pilih payment method** (e.g., GoPay, QRIS, dll)
2. **Complete payment** (gunakan sandbox credentials)
3. **Cek browser console:**
   ```
   ✅ Payment success: { ... }
   🔄 Redirecting to success page with orderId: FULL-XXX-YYY
   ```
4. **Browser harus redirect ke:**
   ```
   /payment/success?orderId=FULL-XXX-YYY
   ```

### **Test 3: Success Page**

1. **Success page harus loading** (polling status)
2. **Cek browser console:**
   ```
   🔍 Success page loaded
   🔄 Fetching payment status (attempt 1)...
   📦 Payment status response: { success: true, data: { ... } }
   ✅ Payment confirmed!
   ```
3. **Success page harus tampil:**
   - ✅ Payment details (amount, method, transaction ID)
   - ✅ Booking details (booking code, room, dates)
   - ✅ Button "Lihat Booking"

### **Test 4: Webhook**

1. **Cek terminal logs:**
   ```
   🔓 Middleware - Webhook route, skipping auth: /api/midtrans/notify
   🔔 MIDTRANS NOTIFICATION RECEIVED
   ✅ Signature verification passed
   💾 Processing payment confirmation...
   ✅ Payment updated: { status: 'SUCCESS', ... }
   ✅ Booking updated: { status: 'CONFIRMED', ... }
   ✅ PAYMENT CONFIRMED SUCCESSFULLY
   ```

### **Test 5: Database**

1. **Cek database:**
   ```sql
   SELECT * FROM "Payment" WHERE "midtransOrderId" = 'FULL-XXX-YYY';
   SELECT * FROM "Booking" WHERE "id" = 'booking-id';
   ```
2. **Expected:**
   - Payment.status = "SUCCESS"
   - Payment.paymentMethod = "gopay" (atau method yang dipilih)
   - Payment.transactionId = "xxx"
   - Booking.status = "CONFIRMED"
   - Booking.paymentStatus = "SUCCESS"

---

## ✅ Checklist

### **Backend:**
- [x] Hapus callbacks dari Snap request
- [x] Return orderId ke frontend
- [x] Webhook berhasil update database

### **Frontend:**
- [x] Extract orderId dari API response
- [x] Implement Snap.js onSuccess callback
- [x] Implement Snap.js onPending callback
- [x] Implement Snap.js onError callback
- [x] Redirect dengan orderId di URL

### **Midtrans Dashboard:**
- [x] Finish URL: **KOSONG**
- [x] Unfinish URL: **KOSONG**
- [x] Error URL: **KOSONG**

### **Testing:**
- [ ] Create payment baru
- [ ] Complete payment di Snap
- [ ] Verify redirect ke success page dengan orderId
- [ ] Verify success page tampil detail
- [ ] Verify webhook update database
- [ ] Verify database status benar

---

## 🎯 Expected Results

### **Browser Console (Frontend):**
```
🔵 Payment token created: { orderId: 'FULL-CMGFZP00-MGFZP00U', hasToken: true }
✅ Payment success: { order_id: 'FULL-CMGFZP00-MGFZP00U', ... }
🔄 Redirecting to success page with orderId: FULL-CMGFZP00-MGFZP00U
🔍 Success page loaded
   Order ID: FULL-CMGFZP00-MGFZP00U
🔄 Fetching payment status (attempt 1)...
📦 Payment status response: { success: true, data: { ... } }
✅ Payment confirmed!
```

### **Terminal Logs (Backend):**
```
🔵 Creating payment token: { orderId: 'FULL-CMGFZP00-MGFZP00U', ... }
✅ Snap transaction created: { orderId: 'FULL-CMGFZP00-MGFZP00U', ... }

🔓 Middleware - Webhook route, skipping auth: /api/midtrans/notify
🔔 MIDTRANS NOTIFICATION RECEIVED
✅ Signature verification passed
💾 Processing payment confirmation...
✅ Payment updated: { status: 'SUCCESS', paymentMethod: 'gopay', ... }
✅ Booking updated: { status: 'CONFIRMED', ... }
✅ PAYMENT CONFIRMED SUCCESSFULLY
```

### **Success Page:**
```
✅ Pembayaran Berhasil!

Payment Details:
- Order ID: FULL-CMGFZP00-MGFZP00U
- Amount: Rp 300.000
- Payment Method: GoPay
- Transaction ID: xxx
- Status: SUCCESS

Booking Details:
- Booking Code: BKMGFZP00GUBY96BF
- Room: Kamar 101
- Check-in: 2025-10-08
- Status: CONFIRMED

[Lihat Booking]
```

---

## 🆘 Troubleshooting

### **Jika masih error 409:**

1. **Verify Dashboard settings:**
   - Finish URL: **KOSONG**
   - Unfinish URL: **KOSONG**
   - Error URL: **KOSONG**

2. **Clear browser cache:**
   ```
   Ctrl + Shift + Delete → Clear cache
   ```

3. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Test dengan booking baru**

### **Jika redirect tidak include orderId:**

1. **Cek browser console:**
   ```
   🔵 Payment token created: { orderId: '...', hasToken: true }
   ```
   Harus ada orderId!

2. **Cek API response:**
   ```javascript
   const { token, orderId } = result.data;
   console.log({ token, orderId });
   ```

3. **Cek backend logs:**
   ```
   ✅ Snap transaction created: { orderId: '...', ... }
   ```

### **Jika success page tidak tampil detail:**

1. **Cek URL di browser:**
   ```
   /payment/success?orderId=FULL-XXX-YYY
   ```
   Harus ada orderId!

2. **Cek browser console:**
   ```
   🔍 Success page loaded
      Order ID: FULL-XXX-YYY
   ```

3. **Cek terminal logs:**
   ```
   🔍 GET /api/payments/status - Request: { orderId: 'FULL-XXX-YYY' }
   ✅ Payment status retrieved successfully
   ```

---

## 🎉 Kesimpulan

**Solusi:** Gunakan **Snap.js callbacks** untuk handle redirect, bukan Snap request callbacks atau Dashboard settings.

**Keuntungan:**
- ✅ Tidak ada 409 error
- ✅ orderId selalu ter-pass dengan benar
- ✅ Full control atas redirect logic
- ✅ Success page tampil detail payment
- ✅ Better user experience

**Flow:**
```
Payment → Snap popup → onSuccess callback → Redirect dengan orderId → Success page ✅
```

---

**Silakan test payment baru dan beri tahu hasilnya!** 🚀

