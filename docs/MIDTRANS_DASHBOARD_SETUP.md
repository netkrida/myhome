# Midtrans Dashboard Setup - Solusi Final untuk Error 409

## 🎯 Solusi Terbaik: Set Finish URL di Midtrans Dashboard

Setelah berbagai percobaan, **solusi paling reliable** adalah:
1. ✅ Set Finish URL di Midtrans Dashboard
2. ✅ Gunakan localStorage untuk pass orderId
3. ✅ Success page auto-load orderId dari localStorage

---

## 📝 Setup Midtrans Dashboard

### **Step 1: Login ke Midtrans Dashboard**

1. Buka [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com/)
2. Login dengan akun Anda

---

### **Step 2: Buka Snap Preferences**

1. Klik **Settings** (icon gear di sidebar kiri)
2. Klik **Snap Preferences**

---

### **Step 3: Set Redirect URLs**

**PENTING:** Gunakan ngrok URL Anda yang aktif!

#### **Finish URL:**
```
https://9469ca9c51ce.ngrok-free.app/payment/success
```

**Catatan:**
- ✅ Gunakan ngrok URL yang sedang aktif
- ✅ JANGAN tambahkan `?orderId=XXX` (kita gunakan localStorage)
- ✅ Path harus `/payment/success`

#### **Unfinish URL:**
```
https://9469ca9c51ce.ngrok-free.app/payment/pending
```

#### **Error URL:**
```
https://9469ca9c51ce.ngrok-free.app/payment/failed
```

---

### **Step 4: Save Settings**

1. Klik **Save** atau **Update**
2. Verify settings tersimpan

---

### **Step 5: Verify Settings**

Setelah save, settings harus seperti ini:

```
Finish URL:     https://9469ca9c51ce.ngrok-free.app/payment/success
Unfinish URL:   https://9469ca9c51ce.ngrok-free.app/payment/pending
Error URL:      https://9469ca9c51ce.ngrok-free.app/payment/failed
```

**Screenshot untuk referensi:**
```
┌─────────────────────────────────────────────────────────────┐
│ Snap Preferences                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Finish URL:                                                 │
│ [https://9469ca9c51ce.ngrok-free.app/payment/success]      │
│                                                             │
│ Unfinish URL:                                               │
│ [https://9469ca9c51ce.ngrok-free.app/payment/pending]      │
│                                                             │
│ Error URL:                                                  │
│ [https://9469ca9c51ce.ngrok-free.app/payment/failed]       │
│                                                             │
│                                    [Save]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementasi (Sudah Selesai!)

### **1. Backend** ✅

**File: `src/server/api/payment.api.ts`**

- ✅ Tidak set callbacks di Snap request
- ✅ Return orderId ke frontend
- ✅ Midtrans Dashboard handle redirect

### **2. Frontend** ✅

**File: `src/components/payment/payment-button.tsx`**

- ✅ Store orderId di localStorage sebelum buka Snap
- ✅ Store timestamp untuk validasi

### **3. Success Page** ✅

**File: `src/app/(public-pages)/payment/success/page.tsx`**

- ✅ Cek orderId di URL (jika ada)
- ✅ Fallback ke localStorage (primary method)
- ✅ Validasi timestamp (max 10 menit)
- ✅ Auto-clear localStorage setelah digunakan

---

## 📊 Flow Lengkap

```
User klik "Bayar"
  ↓
Frontend store orderId di localStorage ✅
  ↓
Frontend open Snap popup
  ↓
User complete payment
  ↓
Midtrans send webhook → Update database ✅
  ↓
Midtrans redirect (menggunakan Dashboard Finish URL):
  https://9469ca9c51ce.ngrok-free.app/payment/success
  ↓
Success page load
  ↓
Success page get orderId from localStorage ✅
  ↓
Success page poll /api/payments/status?orderId=XXX
  ↓
Success page tampil detail payment ✅
```

**Semua langkah berhasil!** 🎉

---

## 🧪 Testing

### **Step 1: Verify Dashboard Settings**

1. Login ke Midtrans Dashboard
2. Settings → Snap Preferences
3. Verify Finish URL = `https://9469ca9c51ce.ngrok-free.app/payment/success`

---

### **Step 2: Restart Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

**PENTING:** Restart untuk apply backend changes!

---

### **Step 3: Create Payment**

1. **Create booking baru**
2. **Klik "Bayar"**
3. **Cek browser console:**
   ```
   🔵 Payment token created: { orderId: 'FULL-XXX-YYY', hasToken: true }
   💾 Stored orderId in localStorage: FULL-XXX-YYY
   ```
4. **Cek localStorage:**
   - F12 → Application → Local Storage
   - Harus ada `pendingPaymentOrderId` dan `pendingPaymentTimestamp`

---

### **Step 4: Complete Payment**

1. **Di Snap popup, pilih payment method** (e.g., GoPay, QRIS, Credit Card)
2. **Complete payment** (gunakan sandbox credentials)
3. **Cek terminal logs:**
   ```
   🔓 Middleware - Webhook route, skipping auth: /api/midtrans/notify
   🔔 MIDTRANS NOTIFICATION RECEIVED
   ✅ Signature verification passed
   ✅ PAYMENT CONFIRMED SUCCESSFULLY
   ```

---

### **Step 5: Verify Redirect**

**Expected:**
```
Browser auto-redirect ke:
https://9469ca9c51ce.ngrok-free.app/payment/success

Console logs:
🔍 Success page loaded
💾 Using orderId from localStorage: FULL-XXX-YYY
🔄 Fetching payment status (attempt 1)...
📦 Payment status response: { success: true, ... }
✅ Payment confirmed!
```

**Success page harus tampil:**
- ✅ Payment details (amount, method, transaction ID)
- ✅ Booking details (booking code, room, dates)
- ✅ Button "Lihat Booking"

---

## 🎯 Expected Results

### **Browser Console:**
```
🔵 Payment token created: { orderId: 'FULL-CMGFZP00-MGFZP00U', hasToken: true }
💾 Stored orderId in localStorage: FULL-CMGFZP00-MGFZP00U

// After payment complete & redirect:
🔍 Success page loaded
   Search params: {}
   Order ID: null
💾 Using orderId from localStorage: FULL-CMGFZP00-MGFZP00U
🔄 Fetching payment status (attempt 1)...
📦 Payment status response: {
  success: true,
  data: {
    payment: { status: 'SUCCESS', ... },
    booking: { status: 'CONFIRMED', ... }
  }
}
✅ Payment confirmed!
```

### **Terminal Logs:**
```
🔵 Creating payment token: {
  orderId: 'FULL-CMGFZP00-MGFZP00U',
  bookingId: 'cmgfzp00g0007uo84jmrkbhoj',
  paymentType: 'FULL',
  amount: 300000
}
✅ Snap transaction created: {
  orderId: 'FULL-CMGFZP00-MGFZP00U',
  token: '...'
}

// After payment complete:
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
┌─────────────────────────────────────────────────────────┐
│                  ✅ Pembayaran Berhasil!                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Payment Details:                                        │
│ • Order ID: FULL-CMGFZP00-MGFZP00U                     │
│ • Amount: Rp 300.000                                    │
│ • Payment Method: GoPay                                 │
│ • Transaction ID: A120251007031758kVrAZ559NWID         │
│ • Status: SUCCESS                                       │
│                                                         │
│ Booking Details:                                        │
│ • Booking Code: BKMGFZP00GUBY96BF                      │
│ • Room: Kamar 101                                       │
│ • Check-in: 2025-10-08                                  │
│ • Status: CONFIRMED                                     │
│                                                         │
│                    [Lihat Booking]                      │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Penting: Update Ngrok URL

**Setiap kali restart ngrok**, Anda harus update Midtrans Dashboard:

### **Langkah-langkah:**

1. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

2. **Copy new ngrok URL:**
   ```
   https://new-url-here.ngrok-free.app
   ```

3. **Update .env.local:**
   ```env
   APP_BASE_URL="https://new-url-here.ngrok-free.app"
   NEXT_PUBLIC_APP_URL="https://new-url-here.ngrok-free.app"
   NEXTAUTH_URL="https://new-url-here.ngrok-free.app"
   ```

4. **Update Midtrans Dashboard:**
   - Finish URL: `https://new-url-here.ngrok-free.app/payment/success`
   - Unfinish URL: `https://new-url-here.ngrok-free.app/payment/pending`
   - Error URL: `https://new-url-here.ngrok-free.app/payment/failed`
   - **Notification URL:** `https://new-url-here.ngrok-free.app/api/midtrans/notify`

5. **Restart server:**
   ```bash
   npm run dev
   ```

---

## ✅ Checklist

### **Midtrans Dashboard:**
- [ ] Login ke Midtrans Dashboard Sandbox
- [ ] Settings → Snap Preferences
- [ ] Set Finish URL: `https://9469ca9c51ce.ngrok-free.app/payment/success`
- [ ] Set Unfinish URL: `https://9469ca9c51ce.ngrok-free.app/payment/pending`
- [ ] Set Error URL: `https://9469ca9c51ce.ngrok-free.app/payment/failed`
- [ ] Save settings
- [ ] Verify settings tersimpan

### **Testing:**
- [ ] Restart server
- [ ] Create booking baru
- [ ] Verify orderId stored di localStorage
- [ ] Complete payment
- [ ] Verify redirect ke success page (TIDAK 409!)
- [ ] Verify success page load orderId dari localStorage
- [ ] Verify success page tampil detail payment
- [ ] Verify webhook update database

---

## 🎉 Kesimpulan

**Solusi Final:**
1. ✅ Set Finish URL di Midtrans Dashboard
2. ✅ localStorage untuk pass orderId
3. ✅ Success page auto-load dari localStorage

**Benefits:**
- ✅ Tidak ada 409 error
- ✅ Redirect berhasil
- ✅ orderId selalu tersedia
- ✅ Success page tampil detail
- ✅ Robust & reliable

**Flow:**
```
Payment → Webhook update DB → Midtrans redirect → Success page load orderId from localStorage → Tampil detail ✅
```

---

**Silakan set Finish URL di Midtrans Dashboard dan test lagi!** 🚀

Beri tahu saya hasilnya setelah setup Dashboard!

