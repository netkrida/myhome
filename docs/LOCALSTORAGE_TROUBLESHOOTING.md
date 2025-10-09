# localStorage Troubleshooting - Order ID Not Found

## 🔴 Masalah

Success page menampilkan error:
```
❌ Order ID tidak ditemukan di URL atau localStorage
```

**Penyebab:**
1. localStorage tidak ter-set saat buka Snap
2. localStorage ter-clear sebelum redirect
3. localStorage expired (> 10 menit)
4. Browser block localStorage (private mode)

---

## 🔍 Debugging Steps

### **Step 1: Verify localStorage Ter-Set**

1. **Buka browser console** (F12)
2. **Klik "Bayar"**
3. **Cek console logs:**
   ```
   🔵 Payment token created: { orderId: 'FULL-XXX-YYY', hasToken: true }
   💾 Stored orderId in localStorage: FULL-XXX-YYY
   💾 Stored timestamp: 1234567890123
   💾 Verify localStorage: {
     orderId: 'FULL-XXX-YYY',
     timestamp: '1234567890123'
   }
   ```

4. **Cek localStorage di DevTools:**
   - F12 → Application → Local Storage → https://9469ca9c51ce.ngrok-free.app
   - Harus ada:
     - `pendingPaymentOrderId`: `FULL-XXX-YYY`
     - `pendingPaymentTimestamp`: `1234567890123`

**Jika TIDAK ada:**
- Browser block localStorage (private mode)
- JavaScript error sebelum localStorage.setItem()
- Cek console untuk error

---

### **Step 2: Verify localStorage Masih Ada Saat Redirect**

1. **Complete payment di Snap**
2. **Setelah redirect ke success page, LANGSUNG cek localStorage:**
   - F12 → Application → Local Storage
   - Harus masih ada `pendingPaymentOrderId` dan `pendingPaymentTimestamp`

**Jika TIDAK ada:**
- localStorage ter-clear sebelum success page load
- Browser clear localStorage saat redirect
- Cek apakah ada code lain yang clear localStorage

---

### **Step 3: Verify Success Page Load localStorage**

1. **Cek console logs di success page:**
   ```
   🔍 Success page loaded
      Search params: {}
      Order ID from URL: null
   🔍 Order ID not in URL, checking localStorage...
      Stored orderId: FULL-XXX-YYY
      Stored timestamp: 1234567890123
   ✅ Using orderId from localStorage: FULL-XXX-YYY
   ✅ Order ID found: FULL-XXX-YYY
   ```

**Jika logs menunjukkan "No orderId found in localStorage":**
- localStorage ter-clear sebelum success page load
- Timestamp expired (> 10 menit)
- Browser block localStorage

---

## ✅ Solusi

### **Solusi 1: Restart Server & Test Baru**

```bash
# Stop server (Ctrl+C)
npm run dev
```

**Test payment baru:**
1. Create booking baru
2. Klik "Bayar"
3. Verify localStorage ter-set (cek console)
4. Complete payment
5. Verify success page load orderId

---

### **Solusi 2: Disable Browser Private Mode**

Jika menggunakan **Incognito/Private mode**, localStorage mungkin di-block.

**Test di normal browser window:**
1. Close incognito window
2. Open normal browser window
3. Test payment baru

---

### **Solusi 3: Clear Browser Cache & Cookies**

```
Ctrl + Shift + Delete
→ Clear cache & cookies
→ Restart browser
```

---

### **Solusi 4: Test di Browser Lain**

Jika masih gagal, test di browser lain:
- Chrome
- Firefox
- Edge

---

### **Solusi 5: Manual Input Order ID**

Jika localStorage tetap gagal, tambahkan manual input di success page.

**Update success page:**

```typescript
// Add state for manual input
const [manualOrderId, setManualOrderId] = useState("");
const [showManualInput, setShowManualInput] = useState(false);

// In useEffect, if no orderId:
if (!orderIdFromUrl) {
  setShowManualInput(true);
  setLoading(false);
  return;
}

// In render:
{showManualInput && (
  <div>
    <p>Order ID tidak ditemukan. Masukkan manual:</p>
    <input 
      value={manualOrderId}
      onChange={(e) => setManualOrderId(e.target.value)}
      placeholder="FULL-XXX-YYY"
    />
    <button onClick={() => {
      setOrderId(manualOrderId);
      setShowManualInput(false);
      setLoading(true);
    }}>
      Submit
    </button>
  </div>
)}
```

---

## 🧪 Testing Checklist

### **Before Payment:**
- [ ] Browser console open (F12)
- [ ] Not in private/incognito mode
- [ ] localStorage enabled in browser

### **During Payment:**
- [ ] Click "Bayar"
- [ ] Verify console: "💾 Stored orderId in localStorage"
- [ ] Verify DevTools: localStorage has `pendingPaymentOrderId`
- [ ] Complete payment in Snap

### **After Redirect:**
- [ ] Verify console: "✅ Using orderId from localStorage"
- [ ] Verify success page loads
- [ ] Verify payment details displayed

---

## 📊 Expected Logs

### **Payment Button (Before Snap):**
```
🔵 Payment token created: { orderId: 'FULL-CMGFZP00-MGFZP00U', hasToken: true }
💾 Stored orderId in localStorage: FULL-CMGFZP00-MGFZP00U
💾 Stored timestamp: 1696680000000
💾 Verify localStorage: {
  orderId: 'FULL-CMGFZP00-MGFZP00U',
  timestamp: '1696680000000'
}
```

### **Success Page (After Redirect):**
```
🔍 Success page loaded
   Search params: {}
   Order ID from URL: null
🔍 Order ID not in URL, checking localStorage...
   Stored orderId: FULL-CMGFZP00-MGFZP00U
   Stored timestamp: 1696680000000
✅ Using orderId from localStorage: FULL-CMGFZP00-MGFZP00U
✅ Order ID found: FULL-CMGFZP00-MGFZP00U
⏸️ Skipping payment status fetch - no orderId
🔄 Fetching payment status (attempt 1)...
📦 Payment status response: { success: true, ... }
💳 Payment status: SUCCESS
✅ Payment successful!
```

---

## 🆘 Common Issues

### **Issue 1: "No orderId found in localStorage"**

**Penyebab:**
- localStorage tidak ter-set
- Browser block localStorage
- Private mode

**Solusi:**
- Test di normal browser window
- Verify console logs saat klik "Bayar"
- Cek DevTools → Application → Local Storage

---

### **Issue 2: "Stored orderId is too old, ignoring"**

**Penyebab:**
- Timestamp > 10 menit
- User terlalu lama di Snap popup

**Solusi:**
- Test payment baru
- Complete payment lebih cepat (< 10 menit)

---

### **Issue 3: localStorage ter-clear sebelum redirect**

**Penyebab:**
- Browser clear localStorage saat redirect
- Code lain yang clear localStorage

**Solusi:**
- Cek apakah ada code yang call `localStorage.clear()`
- Test di browser lain

---

## 🎯 Alternative: Set orderId di URL

Jika localStorage tetap gagal, gunakan URL parameter:

### **Update Midtrans Dashboard Finish URL:**

**Cara 1: Hardcode di Dashboard**
```
https://9469ca9c51ce.ngrok-free.app/payment/success?orderId=PLACEHOLDER
```

Tapi ini tidak akan work karena Midtrans tidak replace placeholder.

**Cara 2: Gunakan Snap.js callbacks** (sudah implemented)

Tapi ini tidak work di redirect mode.

**Cara 3: localStorage** (current solution) ✅

Ini adalah solusi terbaik untuk redirect mode.

---

## 🎉 Kesimpulan

**localStorage adalah solusi terbaik** untuk pass orderId di redirect mode.

**Troubleshooting steps:**
1. ✅ Verify localStorage ter-set (console logs)
2. ✅ Verify localStorage masih ada saat redirect (DevTools)
3. ✅ Verify success page load localStorage (console logs)
4. ✅ Test di normal browser window (not private mode)
5. ✅ Clear cache & cookies
6. ✅ Test di browser lain

**Jika semua gagal:**
- Manual input order ID di success page
- Atau redirect ke dashboard (webhook sudah update database)

---

**Silakan ikuti debugging steps di atas dan beri tahu saya hasilnya!** 🚀

