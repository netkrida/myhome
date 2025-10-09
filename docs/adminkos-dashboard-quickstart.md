# AdminKos Dashboard - Quick Start Guide

## Prerequisites

1. **User dengan role ADMINKOS**
   - Buat user dengan role ADMINKOS melalui registrasi atau database
   - Pastikan user sudah login

2. **Data untuk Testing**
   - Minimal 1 property dengan status APPROVED
   - Beberapa rooms dengan varying availability
   - Beberapa bookings dengan different statuses
   - Beberapa payments dengan different types

## Setup Test Data

### 1. Create AdminKos User

```sql
-- Via SQL (jika belum ada)
INSERT INTO "User" (id, email, name, role, "emailVerified", "isActive")
VALUES (
  'clxxxxx', -- generate CUID
  'adminkos@test.com',
  'Admin Kos Test',
  'ADMINKOS',
  NOW(),
  true
);

INSERT INTO "AdminKosProfile" (id, "userId")
VALUES ('clxxxxx', 'clxxxxx'); -- same CUID as user
```

Atau gunakan endpoint registrasi:
```bash
POST /api/auth/register/adminkos
{
  "name": "Admin Kos Test",
  "email": "adminkos@test.com",
  "password": "password123",
  "phoneNumber": "081234567890",
  "provinceCode": "31",
  "provinceName": "DKI Jakarta",
  "regencyCode": "3171",
  "regencyName": "Jakarta Pusat",
  "districtCode": "317101",
  "districtName": "Gambir",
  "streetAddress": "Jl. Test No. 123"
}
```

### 2. Create Property (APPROVED)

Login sebagai AdminKos, lalu buat property melalui UI atau API:

```bash
POST /api/properties
{
  "name": "Kos Mawar",
  "buildYear": 2020,
  "propertyType": "MIXED",
  "description": "Kos nyaman di pusat kota",
  "totalRooms": 10,
  "provinceCode": "31",
  "provinceName": "DKI Jakarta",
  "regencyCode": "3171",
  "regencyName": "Jakarta Pusat",
  "districtCode": "317101",
  "districtName": "Gambir",
  "fullAddress": "Jl. Mawar No. 123",
  "latitude": -6.1751,
  "longitude": 106.8650,
  "facilities": {
    "propertyFacilities": ["WiFi", "Parkir", "CCTV"],
    "roomFacilities": ["AC", "Kasur", "Lemari"],
    "bathroomFacilities": ["Shower", "Water Heater"],
    "parkingFacilities": ["Motor"]
  },
  "rules": {
    "generalRules": ["Dilarang merokok", "Jam malam 22:00"],
    "guestRules": ["Tamu harus lapor"],
    "paymentRules": ["Bayar di awal bulan"]
  }
}
```

Kemudian approve property (sebagai SUPERADMIN):
```bash
PATCH /api/properties/{propertyId}/status
{
  "status": "APPROVED",
  "reason": "Property memenuhi syarat"
}
```

### 3. Create Rooms

```bash
POST /api/rooms
{
  "propertyId": "{propertyId}",
  "roomNumber": "101",
  "floor": 1,
  "roomType": "Standard",
  "size": "3x4",
  "monthlyPrice": 1500000,
  "dailyPrice": 100000,
  "weeklyPrice": 600000,
  "depositRequired": true,
  "depositType": "PERCENTAGE",
  "depositValue": 50,
  "facilities": {
    "roomFacilities": ["AC", "Kasur", "Lemari"],
    "bathroomFacilities": ["Shower", "Water Heater"]
  },
  "isAvailable": true
}
```

Buat beberapa rooms dengan varying availability (some available, some not).

### 4. Create Bookings

```bash
POST /api/bookings
{
  "userId": "{customerId}",
  "roomId": "{roomId}",
  "checkInDate": "2025-01-15T14:00:00Z",
  "leaseType": "MONTHLY"
}
```

Buat bookings dengan different statuses:
- UNPAID (baru dibuat)
- DEPOSIT_PAID (deposit sudah dibayar)
- CONFIRMED (full payment sudah dibayar)
- CHECKED_IN (sudah check-in)

### 5. Create Payments

Payments akan otomatis dibuat saat booking dibuat. Untuk testing, update status:

```sql
-- Update payment to SUCCESS
UPDATE "Payment"
SET status = 'SUCCESS',
    "transactionTime" = NOW(),
    "transactionId" = 'TRX123456'
WHERE id = '{paymentId}';

-- Update booking status
UPDATE "Booking"
SET status = 'CONFIRMED',
    "paymentStatus" = 'SUCCESS'
WHERE id = '{bookingId}';
```

## Access Dashboard

1. **Login** sebagai AdminKos user
2. **Navigate** ke `/dashboard/adminkos`
3. **Verify** semua sections:
   - ✅ Summary Cards (8 KPIs)
   - ✅ Today's Activity (3 panels)
   - ✅ Revenue Chart (12 months)
   - ✅ Payment Breakdown (pie chart)
   - ✅ My Properties (cards)

## Testing Checklist

### Visual Testing
- [ ] Dashboard loads without errors
- [ ] All 8 KPI cards display
- [ ] Numbers are formatted correctly (currency, percentage)
- [ ] Today's activity shows correct data
- [ ] Revenue chart displays 12 months
- [ ] Payment breakdown shows pie chart
- [ ] Properties cards display with images
- [ ] Responsive design works (mobile, tablet, desktop)

### Data Accuracy
- [ ] Total Properti Aktif = count of APPROVED properties
- [ ] Total Kamar = sum of all rooms
- [ ] Kamar Tersedia = count of isAvailable=true
- [ ] Occupancy Rate = (1 - available/total) * 100
- [ ] Booking Aktif = count of active bookings
- [ ] Pendapatan Bulan Ini = sum of SUCCESS payments this month
- [ ] Deposit Diterima = sum of DEPOSIT payments this month
- [ ] Tagihan Tertunda = count of PENDING payments

### Functionality
- [ ] Check-in list shows CONFIRMED bookings for today
- [ ] Check-out list shows CHECKED_IN bookings for today
- [ ] Pending payments show expiring within 24h
- [ ] Revenue chart shows trend indicator
- [ ] Payment breakdown shows correct percentages
- [ ] Property cards show correct stats
- [ ] "Kelola Properti" button works

### Edge Cases
- [ ] Empty state (no properties) shows CTA
- [ ] No bookings today shows empty message
- [ ] No pending payments shows empty message
- [ ] No revenue shows empty chart
- [ ] Loading states work
- [ ] Error states handled gracefully

## Common Issues & Solutions

### Issue: Dashboard shows all zeros
**Solution**: 
- Verify user has ADMINKOS role
- Check if properties are APPROVED
- Ensure rooms exist for the properties

### Issue: No revenue data
**Solution**:
- Create payments with SUCCESS status
- Ensure payments have transactionTime
- Verify payments are linked to user's properties

### Issue: Today's activity empty
**Solution**:
- Create bookings with checkInDate/checkOutDate = today
- Ensure booking status is CONFIRMED or CHECKED_IN
- Check timezone settings

### Issue: Properties not showing
**Solution**:
- Verify property status is not REJECTED
- Check if property has images
- Ensure property belongs to logged-in user

## API Endpoints for Testing

```bash
# Get Summary
GET /api/adminkos/summary

# Get Today's Activity
GET /api/adminkos/activity

# Get Revenue Chart
GET /api/adminkos/revenue

# Get Payment Breakdown
GET /api/adminkos/payment-breakdown

# Get My Properties
GET /api/adminkos/properties

# Get Bookings (with filters)
GET /api/adminkos/bookings?page=1&limit=10&status=CONFIRMED

# Get Rooms (with filters)
GET /api/adminkos/rooms?page=1&limit=10&isAvailable=true
```

## Sample Data Script

Untuk quick testing, gunakan script ini (adjust IDs):

```sql
-- Assume you have:
-- userId: 'user_adminkos_123'
-- propertyId: 'prop_123'
-- roomId: 'room_123'
-- customerId: 'user_customer_123'

-- Create booking for today check-in
INSERT INTO "Booking" (
  id, "bookingCode", "userId", "propertyId", "roomId",
  "checkInDate", "checkOutDate", "leaseType",
  "totalAmount", "depositAmount", "paymentStatus", status
) VALUES (
  'book_123',
  'BK-2025-001',
  'user_customer_123',
  'prop_123',
  'room_123',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'MONTHLY',
  1500000,
  750000,
  'SUCCESS',
  'CONFIRMED'
);

-- Create payment for this month
INSERT INTO "Payment" (
  id, "bookingId", "userId", "midtransOrderId",
  "paymentType", amount, status, "transactionTime"
) VALUES (
  'pay_123',
  'book_123',
  'user_customer_123',
  'ORDER-2025-001',
  'FULL',
  1500000,
  'SUCCESS',
  NOW()
);
```

## Next Steps

After verifying the dashboard works:

1. **Add More Features**:
   - Filters (date range, property selection)
   - Export CSV functionality
   - Real-time updates

2. **Integrate with Other Pages**:
   - Link to property detail page
   - Link to booking detail page
   - Link to room management page

3. **Add Notifications**:
   - Alert for pending approvals
   - Alert for failed payments
   - Alert for expiring bookings

4. **Performance Optimization**:
   - Add caching for summary data
   - Implement pagination for large datasets
   - Add loading skeletons

## Support

Jika ada masalah, check:
1. Browser console untuk errors
2. Network tab untuk API responses
3. Server logs untuk backend errors
4. Database untuk data integrity

Happy testing! 🚀

