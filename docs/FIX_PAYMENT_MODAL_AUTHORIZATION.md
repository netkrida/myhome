# Fix: Payment Detail Modal Authorization

## 🐛 **Root Cause**
Authorization gagal karena kode mencari `property.adminKosId` yang **tidak ada** di schema database. Field yang benar adalah `property.ownerId`.

## ✅ **Solusi**
Mengubah authorization check dari `adminKosId` ke `ownerId`.

## 📝 **Perubahan Detail**

### 1. File: `src/app/api/payments/[paymentId]/route.ts`

**SEBELUM:**
```typescript
const isPropertyAdmin = booking.property?.adminKosId === userId;
// adminKosId tidak ada di schema Property!
```

**SESUDAH:**
```typescript
const isPropertyOwner = booking.property?.ownerId === userId;
// ownerId adalah field yang benar di schema Property
```

### 2. File: `src/server/repositories/payment.repository.ts`

**SEBELUM:**
```typescript
adminKosId: paymentWithBooking.booking?.property?.adminKosId,
```

**SESUDAH:**
```typescript
propertyOwnerId: paymentWithBooking.booking?.property?.ownerId,
```

## 🗄️ **Database Schema Reference**

```prisma
model Property {
  id          String   @id @default(cuid())
  name        String
  ownerId     String   // ← Field yang BENAR
  // ... other fields
  
  owner       User     @relation("PropertyOwner", fields: [ownerId], references: [id])
}
```

**Penjelasan:**
- `ownerId`: User ID yang membuat/memiliki property (role ADMINKOS)
- Tidak ada field `adminKosId` di model Property
- Satu user ADMINKOS bisa punya banyak property

## 🔐 **Authorization Flow (Fixed)**

```
1. User akses payment detail
2. Check userRole dan booking.property.ownerId
3. Authorization:
   ✅ SUPERADMIN → akses semua
   ✅ Property Owner (ownerId = userId) → akses payment di property mereka
   ✅ Customer (booking.userId = userId) → akses payment booking mereka
   ❌ Lainnya → 403 Forbidden
```

## 📊 **Expected Console Log (Setelah Fix)**

```
🔍 GET /api/payments/[paymentId] - Request: {
  paymentId: 'cmglx5byx0012ju04aovv2zli',
  userId: 'cmgkpdspf0005l104okzadwn0',
  userRole: 'ADMINKOS'
}

✅ Payment found by ID: {
  paymentId: 'cmglx5byx0012ju04aovv2zli',
  orderId: 'FULL-CMGLX5BX-MGLX5BYW',
  status: 'SUCCESS',
  userId: 'cmgkpm15n0006k504onpgj173',
  bookingId: 'cmglx5bxu0010ju04fl75re7x',
  propertyId: 'cmgkpfvxr000hl104lxqx3mlw',
  propertyName: 'KOS MAWAR INDAH',
  propertyOwnerId: 'cmgkpdspf0005l104okzadwn0', // ← SEKARANG ADA!
  hasBooking: true,
  hasProperty: true
}

🔐 Authorization check: {
  userId: 'cmgkpdspf0005l104okzadwn0',
  userRole: 'ADMINKOS',
  bookingUserId: 'cmgkpm15n0006k504onpgj173',
  propertyId: 'cmgkpfvxr000hl104lxqx3mlw',
  propertyOwnerId: 'cmgkpdspf0005l104okzadwn0', // ← MATCH!
  isCustomer: false,
  isPropertyOwner: true, // ← TRUE karena userId = propertyOwnerId
  isAdminKosRole: true,
  isSuperAdmin: false,
  hasProperty: true
}

✅ Payment retrieved successfully {
  paymentId: 'cmglx5byx0012ju04aovv2zli',
  authorizedAs: 'PROPERTY_OWNER'
}
```

## 🧪 **Testing Checklist**

- [ ] Login sebagai ADMINKOS yang punya property
- [ ] Buka Dashboard → Transaction → Buku Kas
- [ ] Klik icon panah pada transaksi "Pembayaran Kos"
- [ ] Modal harus terbuka dengan data lengkap
- [ ] Check console log → `isPropertyOwner: true`
- [ ] Check console log → `propertyOwnerId` tidak `undefined`

## 📚 **Lesson Learned**

1. **Always check database schema** sebelum menggunakan field
2. **Property ownership** menggunakan `ownerId`, bukan `adminKosId`
3. **AdminKosProfile** adalah tabel terpisah dengan relasi ke User
4. **Debugging logs** sangat penting untuk troubleshooting authorization

---

**Fixed**: October 12, 2025  
**Issue**: Authorization check menggunakan field yang tidak ada  
**Solution**: Gunakan `property.ownerId` sesuai schema database
