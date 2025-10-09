# Payment Security Update - Authentication & Authorization

## 🔒 Security Enhancement

Menambahkan authentication dan authorization di payment status endpoint untuk memastikan user hanya bisa melihat payment mereka sendiri.

---

## 🎯 Masalah Sebelumnya

### **Endpoint `/api/payments/status` - Public (Tidak Aman)**

**Before:**
```typescript
// ❌ Public endpoint - no authentication
// ❌ No userId validation
// ⚠️ Siapa saja yang tahu orderId bisa akses payment details

export async function GET(request: NextRequest) {
  const orderId = searchParams.get("orderId");
  
  // Query hanya berdasarkan orderId
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId }  // ❌ Tidak ada filter userId
  });
}
```

**Masalah:**
- ⚠️ User A bisa lihat payment User B jika tahu orderIdnya
- ⚠️ Tidak ada validasi ownership
- ⚠️ Privacy issue

---

## ✅ Solusi Implementasi

### **1. Update API Route - Add Authentication**

**File:** `src/app/api/payments/status/route.ts`

**After:**
```typescript
import { auth } from "@/server/auth";

export async function GET(request: NextRequest) {
  // ✅ Require authentication
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please login." },
      { status: 401 }
    );
  }
  
  const userId = session.user.id;
  const orderId = searchParams.get("orderId");
  
  // ✅ Pass userId for validation
  const result = await PaymentAPI.getPaymentStatus(orderId, userId);
}
```

**Changes:**
- ✅ Import `auth` from NextAuth
- ✅ Check session - return 401 if not logged in
- ✅ Get userId from session
- ✅ Pass userId to PaymentAPI

---

### **2. Update Payment API - Add userId Parameter**

**File:** `src/server/api/payment.api.ts`

**Before:**
```typescript
static async getPaymentStatus(
  orderId: string
): Promise<Result<{ payment: PaymentDTO; booking: BookingDTO }>>
```

**After:**
```typescript
static async getPaymentStatus(
  orderId: string,
  userId: string  // ✅ NEW parameter
): Promise<Result<{ payment: PaymentDTO; booking: BookingDTO }>> {
  // ✅ Pass userId to repository for validation
  const paymentResult = await PaymentRepository.findByOrderIdWithBooking(orderId, userId);
}
```

**Changes:**
- ✅ Add `userId` parameter
- ✅ Pass userId to repository

---

### **3. Update Payment Repository - Add userId Validation**

**File:** `src/server/repositories/payment.repository.ts`

**Before:**
```typescript
static async findByOrderIdWithBooking(
  midtransOrderId: string
): Promise<Result<PaymentDTO & { booking: any }>> {
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId }  // ❌ No userId filter
  });
  
  if (!payment) {
    return notFound("Payment not found");
  }
  
  return ok({ ...this.mapToDTO(payment), booking: payment.booking });
}
```

**After:**
```typescript
static async findByOrderIdWithBooking(
  midtransOrderId: string,
  userId?: string  // ✅ NEW optional parameter
): Promise<Result<PaymentDTO & { booking: any }>> {
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId }
  });
  
  if (!payment) {
    return notFound("Payment not found");
  }
  
  // ✅ Validate userId if provided (for security)
  if (userId && payment.userId !== userId) {
    console.error("❌ Unauthorized access attempt:", {
      orderId: midtransOrderId,
      requestUserId: userId,
      paymentUserId: payment.userId
    });
    return forbidden("You are not authorized to access this payment");
  }
  
  return ok({ ...this.mapToDTO(payment), booking: payment.booking });
}
```

**Changes:**
- ✅ Add optional `userId` parameter
- ✅ Validate `payment.userId === userId`
- ✅ Return `forbidden` error if userId mismatch
- ✅ Log unauthorized access attempts

---

### **4. Update Middleware - Remove from Public Routes**

**File:** `src/middleware.ts`

**Before:**
```typescript
const PUBLIC_ROUTES = [
  "/api/payments/status",  // ❌ Public
  // ...
];
```

**After:**
```typescript
const PUBLIC_ROUTES = [
  // ✅ Removed /api/payments/status
  // Now requires authentication
  // ...
];
```

**Changes:**
- ✅ Remove `/api/payments/status` from PUBLIC_ROUTES
- ✅ Endpoint now requires authentication via middleware

---

## 📊 Security Flow

### **Before (Tidak Aman):**

```
User A → /api/payments/status?orderId=ORDER-B
  ↓
❌ No authentication check
  ↓
Query: orderId = ORDER-B
  ↓
❌ No userId validation
  ↓
Return payment ORDER-B ⚠️
  ↓
User A bisa lihat payment User B! ❌
```

---

### **After (Aman):**

```
User A → /api/payments/status?orderId=ORDER-B
  ↓
✅ Check authentication
  ↓
✅ Get userId from session (User A)
  ↓
Query: orderId = ORDER-B
  ↓
✅ Validate: payment.userId === User A?
  ↓
❌ payment.userId = User B (mismatch!)
  ↓
Return 403 Forbidden ✅
  ↓
User A TIDAK bisa lihat payment User B! ✅
```

---

## 🧪 Testing Scenarios

### **Scenario 1: User Akses Payment Sendiri** ✅

```
User A login
  ↓
User A → /api/payments/status?orderId=ORDER-A
  ↓
✅ Authenticated (User A)
  ↓
✅ orderId = ORDER-A
  ↓
✅ payment.userId = User A (match!)
  ↓
✅ Return payment details
```

**Expected:** ✅ Success - User A lihat payment sendiri

---

### **Scenario 2: User Akses Payment User Lain** ❌

```
User A login
  ↓
User A → /api/payments/status?orderId=ORDER-B
  ↓
✅ Authenticated (User A)
  ↓
✅ orderId = ORDER-B
  ↓
❌ payment.userId = User B (mismatch!)
  ↓
❌ Return 403 Forbidden
```

**Expected:** ❌ Forbidden - User A TIDAK bisa lihat payment User B

---

### **Scenario 3: User Tidak Login** ❌

```
No session
  ↓
Guest → /api/payments/status?orderId=ORDER-A
  ↓
❌ Not authenticated
  ↓
❌ Return 401 Unauthorized
```

**Expected:** ❌ Unauthorized - Harus login dulu

---

## ✅ Benefits

### **1. Privacy Protection** 🔒

- ✅ User hanya bisa lihat payment sendiri
- ✅ Tidak bisa lihat payment user lain
- ✅ Protect sensitive payment information

---

### **2. Security** 🛡️

- ✅ Authentication required
- ✅ Authorization validation (userId check)
- ✅ Log unauthorized access attempts

---

### **3. Compliance** 📋

- ✅ Follow security best practices
- ✅ Protect user data privacy
- ✅ Prevent data leakage

---

## 🔄 Backward Compatibility

### **Success Page Flow - Tetap Bekerja** ✅

**Flow:**
```
User complete payment
  ↓
User sudah login (session active) ✅
  ↓
Redirect ke /payment/success
  ↓
Success page call /api/payments/status?orderId=XXX
  ↓
✅ Authenticated (user session)
  ↓
✅ userId validation passed
  ↓
✅ Return payment details
  ↓
✅ Success page tampil details
```

**Tidak ada breaking changes!** User yang baru complete payment pasti sudah login.

---

## 📝 Error Handling

### **Error 401 - Unauthorized**

```json
{
  "success": false,
  "error": "Unauthorized. Please login."
}
```

**Cause:** User tidak login

**Solution:** Redirect ke login page

---

### **Error 403 - Forbidden**

```json
{
  "success": false,
  "error": "You are not authorized to access this payment"
}
```

**Cause:** User mencoba akses payment user lain

**Solution:** Show error message, redirect ke dashboard

---

### **Error 404 - Not Found**

```json
{
  "success": false,
  "error": "Payment not found"
}
```

**Cause:** orderId tidak ada di database

**Solution:** Show error message

---

## 🎯 Kesimpulan

**Security Enhancement:**
1. ✅ **Authentication** - User harus login
2. ✅ **Authorization** - User hanya bisa akses payment sendiri
3. ✅ **Validation** - userId check di repository layer
4. ✅ **Logging** - Log unauthorized access attempts

**Benefits:**
- 🔒 Privacy protection
- 🛡️ Security enhancement
- 📋 Compliance with best practices
- ✅ No breaking changes

**Result:**
- ✅ User A hanya bisa lihat payment User A
- ✅ User B hanya bisa lihat payment User B
- ✅ Tidak ada data leakage
- ✅ Secure & safe!

---

## 🧪 Testing Checklist

- [ ] User login → akses payment sendiri → ✅ Success
- [ ] User login → akses payment user lain → ❌ Forbidden
- [ ] User tidak login → akses payment → ❌ Unauthorized
- [ ] Success page setelah payment → ✅ Tampil details
- [ ] Auto-detect flow → ✅ Bekerja normal

**Semua scenario harus pass!** ✅

