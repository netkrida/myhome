# Midtrans Finish URL - Fix untuk Order ID Placeholder

## 🔴 Masalah

Setelah payment berhasil di Snap, user di-redirect ke:
```
https://9469ca9c51ce.ngrok-free.app/payment/success?orderId={order_id}
```

**Bukan:**
```
https://9469ca9c51ce.ngrok-free.app/payment/success?orderId=FULL-CMGFZP00-MGFZP00U
```

**Penyebab:**
Midtrans Dashboard **Finish URL** setting menggunakan literal string `{order_id}`, tapi Midtrans **TIDAK** replace placeholder ini dengan order ID yang sebenarnya.

**Bukti:**
```
URL di browser: /payment/success?orderId={order_id}
                                          ^^^^^^^^^^
                                          Literal string, bukan order ID!
```

---

## ✅ Solusi 1: Kosongkan Dashboard Finish URL (RECOMMENDED)

### **Mengapa Ini Solusi Terbaik?**

1. **Snap request callbacks sudah benar** - Code kita sudah set callbacks dengan orderId yang benar
2. **Dashboard settings override callbacks** - Jika Dashboard Finish URL diisi, Midtrans akan ignore callbacks dari code
3. **Kosongkan Dashboard settings** - Midtrans akan gunakan callbacks dari Snap request

### **Langkah-langkah:**

#### **Step 1: Login ke Midtrans Dashboard**

1. Buka [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com/)
2. Login dengan akun Anda

#### **Step 2: Buka Snap Preferences**

1. Klik **Settings** (icon gear di sidebar)
2. Klik **Snap Preferences**

#### **Step 3: Kosongkan Finish URLs**

**PENTING:** Hapus semua URL di field berikut:

```
Finish URL:     [                                    ] ← KOSONGKAN
Unfinish URL:   [                                    ] ← KOSONGKAN  
Error URL:      [                                    ] ← KOSONGKAN
```

**Jangan isi apapun!** Biarkan kosong.

#### **Step 4: Save**

Klik **Save** atau **Update**

#### **Step 5: Verify**

Setelah save, field-field tersebut harus kosong:
- ✅ Finish URL: (kosong)
- ✅ Unfinish URL: (kosong)
- ✅ Error URL: (kosong)

---

### **Mengapa Ini Berhasil?**

**Sebelum (Dashboard Finish URL diisi):**
```
1. Code set callbacks:
   finish: "https://xxx.ngrok.app/payment/success?orderId=FULL-ABC-123"

2. Midtrans IGNORE callbacks dari code

3. Midtrans gunakan Dashboard Finish URL:
   "https://xxx.ngrok.app/payment/success?orderId={order_id}"

4. User di-redirect ke:
   "https://xxx.ngrok.app/payment/success?orderId={order_id}"
   ❌ Literal string, bukan order ID!
```

**Sesudah (Dashboard Finish URL kosong):**
```
1. Code set callbacks:
   finish: "https://xxx.ngrok.app/payment/success?orderId=FULL-ABC-123"

2. Dashboard Finish URL kosong

3. Midtrans gunakan callbacks dari code ✅

4. User di-redirect ke:
   "https://xxx.ngrok.app/payment/success?orderId=FULL-ABC-123"
   ✅ Order ID yang benar!
```

---

### **Verify di Code**

Callbacks sudah benar di code kita:

<augment_code_snippet path="src/server/api/payment.api.ts" mode="EXCERPT">
````typescript
const snapRequestWithRedirects = {
  ...snapRequest,
  callbacks: {
    finish: `${cleanBaseUrl}/payment/success?orderId=${orderId}`,
    error: `${cleanBaseUrl}/payment/failed?reason=error&orderId=${orderId}`,
    pending: `${cleanBaseUrl}/payment/pending?orderId=${orderId}`
  }
};

console.log("🔵 Snap redirect URLs:", snapRequestWithRedirects.callbacks);
````
</augment_code_snippet>

**Terminal logs saat create payment:**
```
🔵 Snap redirect URLs: {
  finish: 'https://9469ca9c51ce.ngrok-free.app/payment/success?orderId=FULL-CMGFZP00-MGFZP00U',
  error: 'https://9469ca9c51ce.ngrok-free.app/payment/failed?reason=error&orderId=FULL-CMGFZP00-MGFZP00U',
  pending: 'https://9469ca9c51ce.ngrok-free.app/payment/pending?orderId=FULL-CMGFZP00-MGFZP00U'
}
```

**Callbacks sudah include orderId yang benar!** ✅

---

## ✅ Solusi 2: Fallback Mechanism (SUDAH IMPLEMENTED)

Jika Anda **tidak bisa** kosongkan Dashboard settings (misalnya tidak punya akses), success page sudah punya fallback:

### **Behavior:**

1. **Detect placeholder `{order_id}`:**
   ```typescript
   if (orderId === "{order_id}") {
     orderId = null;
   }
   ```

2. **Show message dan redirect:**
   ```
   "Pembayaran Anda sedang diproses. 
    Anda akan diarahkan ke dashboard dalam 3 detik..."
   ```

3. **Auto-redirect ke dashboard:**
   ```typescript
   setTimeout(() => {
     router.push("/dashboard");
   }, 3000);
   ```

4. **User lihat booking di dashboard** dengan status CONFIRMED

### **Logs di Console:**

```
🔍 Success page loaded
   Order ID: {order_id}
❌ Order ID tidak ditemukan di URL atau masih placeholder
💡 Kemungkinan penyebab:
   1. Midtrans Dashboard Finish URL tidak kosong
   2. Dashboard settings override Snap callbacks
💡 Solusi:
   1. Kosongkan Finish URL di Midtrans Dashboard Settings
   2. Atau tunggu redirect ke dashboard...
💡 Webhook sudah memproses payment, redirect ke dashboard
```

### **User Experience:**

```
Payment Success di Snap
  ↓
Redirect ke /payment/success?orderId={order_id}
  ↓
Success page detect placeholder
  ↓
Show message: "Pembayaran sedang diproses..."
  ↓
Wait 3 seconds
  ↓
Redirect ke /dashboard
  ↓
User lihat booking dengan status CONFIRMED ✅
```

**Ini tetap berfungsi!** Webhook sudah memproses payment, database sudah ter-update.

---

## 🧪 Testing

### **Test 1: Dengan Dashboard Finish URL Kosong (Ideal)**

1. **Kosongkan Dashboard Finish URL** (ikuti Step 1-5 di atas)
2. **Create booking baru**
3. **Create payment**
4. **Cek terminal logs:**
   ```
   🔵 Snap redirect URLs: {
     finish: 'https://xxx.ngrok.app/payment/success?orderId=FULL-XXX-YYY',
     ...
   }
   ```
5. **Complete payment di Snap**
6. **Verify redirect URL di browser:**
   ```
   https://xxx.ngrok.app/payment/success?orderId=FULL-XXX-YYY
                                                  ^^^^^^^^^^^^
                                                  Order ID yang benar! ✅
   ```
7. **Success page harus:**
   - ✅ Polling payment status
   - ✅ Tampilkan detail payment
   - ✅ Tampilkan detail booking
   - ✅ Button "Lihat Booking"

### **Test 2: Dengan Dashboard Finish URL Diisi (Fallback)**

1. **Dashboard Finish URL diisi** (tidak kosong)
2. **Create booking baru**
3. **Complete payment di Snap**
4. **Verify redirect URL di browser:**
   ```
   https://xxx.ngrok.app/payment/success?orderId={order_id}
                                                  ^^^^^^^^^^
                                                  Placeholder ❌
   ```
5. **Success page harus:**
   - ✅ Detect placeholder
   - ✅ Show message "Pembayaran sedang diproses..."
   - ✅ Auto-redirect ke dashboard setelah 3 detik
   - ✅ User lihat booking di dashboard dengan status CONFIRMED

**Kedua scenario berhasil!** Tapi Test 1 (Dashboard kosong) memberikan UX yang lebih baik.

---

## 📊 Comparison

| Aspect | Dashboard Finish URL Kosong | Dashboard Finish URL Diisi |
|--------|----------------------------|---------------------------|
| **Redirect URL** | `/payment/success?orderId=FULL-XXX-YYY` ✅ | `/payment/success?orderId={order_id}` ❌ |
| **Success Page** | Tampil detail payment ✅ | Redirect ke dashboard ⚠️ |
| **User Experience** | Excellent ⭐⭐⭐⭐⭐ | Good ⭐⭐⭐ |
| **Payment Status** | SUCCESS ✅ | SUCCESS ✅ |
| **Database** | Updated ✅ | Updated ✅ |
| **Webhook** | Processed ✅ | Processed ✅ |

**Kesimpulan:** Kedua cara berhasil, tapi **kosongkan Dashboard Finish URL** untuk UX terbaik.

---

## 🎯 Recommendation

### **Untuk Development (Ngrok):**

**Kosongkan Dashboard Finish URL** dan biarkan code yang handle callbacks.

**Keuntungan:**
- ✅ Tidak perlu update Dashboard setiap ngrok URL berubah
- ✅ Callbacks dari code selalu up-to-date
- ✅ Success page tampil detail payment
- ✅ Better user experience

### **Untuk Production:**

**Gunakan custom domain** dan **kosongkan Dashboard Finish URL**.

**Setup:**
1. Deploy aplikasi ke production (Vercel/custom server)
2. Gunakan custom domain: `https://yourdomain.com`
3. Update `.env` dengan production URL
4. **Kosongkan** Dashboard Finish URL di Midtrans Production
5. Callbacks dari code akan gunakan production URL

**Callbacks akan otomatis:**
```typescript
callbacks: {
  finish: `https://yourdomain.com/payment/success?orderId=${orderId}`,
  error: `https://yourdomain.com/payment/failed?reason=error&orderId=${orderId}`,
  pending: `https://yourdomain.com/payment/pending?orderId=${orderId}`
}
```

---

## ✅ Checklist

### **Setup Midtrans Dashboard:**
- [ ] Login ke Midtrans Dashboard Sandbox
- [ ] Buka Settings → Snap Preferences
- [ ] **Kosongkan Finish URL**
- [ ] **Kosongkan Unfinish URL**
- [ ] **Kosongkan Error URL**
- [ ] Save settings
- [ ] Verify fields kosong

### **Testing:**
- [ ] Create booking baru
- [ ] Create payment
- [ ] Cek terminal logs untuk "🔵 Snap redirect URLs"
- [ ] Complete payment di Snap
- [ ] Verify redirect URL include orderId yang benar
- [ ] Success page tampil detail payment
- [ ] Database ter-update dengan benar

### **Fallback (Jika Dashboard tidak bisa dikosongkan):**
- [x] Success page detect placeholder `{order_id}` ✅
- [x] Show message "Pembayaran sedang diproses" ✅
- [x] Auto-redirect ke dashboard ✅
- [x] User lihat booking di dashboard ✅

---

## 🆘 Troubleshooting

### **Jika masih redirect ke `?orderId={order_id}`:**

1. **Verify Dashboard settings:**
   - Finish URL harus **KOSONG**
   - Jangan ada URL apapun

2. **Clear browser cache:**
   ```
   Ctrl + Shift + Delete → Clear cache
   ```

3. **Test dengan booking baru:**
   - Jangan gunakan payment lama
   - Create booking baru
   - Create payment baru

4. **Cek terminal logs:**
   ```
   🔵 Snap redirect URLs: { ... }
   ```
   Harus ada orderId yang benar, bukan `{order_id}`

### **Jika success page tidak tampil detail:**

1. **Cek browser console:**
   ```
   F12 → Console
   ```
   Harus ada logs "🔍 Success page loaded"

2. **Cek terminal logs:**
   ```
   🔍 GET /api/payments/status - Request: { orderId: 'FULL-XXX-YYY' }
   ✅ Payment status retrieved successfully
   ```

3. **Test endpoint langsung:**
   ```bash
   curl "https://xxx.ngrok.app/api/payments/status?orderId=FULL-XXX-YYY"
   ```

---

## 🎉 Kesimpulan

**Solusi terbaik:** **Kosongkan Midtrans Dashboard Finish URL**

**Mengapa?**
- ✅ Code sudah benar (callbacks include orderId)
- ✅ Dashboard settings override callbacks
- ✅ Kosongkan Dashboard → Midtrans gunakan callbacks dari code
- ✅ Success page tampil detail payment
- ✅ Better user experience

**Fallback sudah ada** jika Dashboard tidak bisa dikosongkan, tapi UX tidak sebaik solusi utama.

---

**Silakan kosongkan Dashboard Finish URL dan test lagi!** 🚀

