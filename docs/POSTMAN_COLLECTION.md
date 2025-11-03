# 📮 Postman Collection & Environment - MyHome API

Dokumentasi lengkap untuk import collection dan environment Postman untuk testing API MyHome.

## 📋 Table of Contents
- [Environment Setup](#environment-setup)
- [Authentication & Session](#authentication--session)
- [Public APIs](#public-apis)
- [Properties Management](#properties-management)
- [Rooms Management](#rooms-management)
- [Bookings](#bookings)
- [Payments](#payments)
- [AdminKos Dashboard](#adminkos-dashboard)
- [Receptionist](#receptionist)
- [Superadmin](#superadmin)
- [Analytics](#analytics)
- [Utilities](#utilities)

---

## 🌍 Environment Setup

### Environment Variables for Postman

```json
{
  "name": "MyHome - Local",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "api_url",
      "value": "{{base_url}}/api",
      "enabled": true
    },
    {
      "key": "access_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "booking_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "property_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "room_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "payment_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    }
  ]
}
```

### Production Environment

```json
{
  "name": "MyHome - Production",
  "values": [
    {
      "key": "base_url",
      "value": "https://your-production-domain.com",
      "enabled": true
    },
    {
      "key": "api_url",
      "value": "{{base_url}}/api",
      "enabled": true
    },
    {
      "key": "access_token",
      "value": "",
      "enabled": true
    }
  ]
}
```

---

## 🔐 Authentication & Session

### 1. Register Customer

```bash
curl -X POST "{{api_url}}/auth/register/customer" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "phone": "081234567890"
  }'
```

### 2. Register Admin Kos

```bash
curl -X POST "{{api_url}}/auth/register/adminkos" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Kos",
    "email": "adminkos@example.com",
    "password": "SecurePass123!",
    "phone": "081234567890"
  }'
```

### 3. Login (NextAuth)

```bash
curl -X POST "{{api_url}}/auth/callback/credentials" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:** Cookie `next-auth.session-token` akan diset automatically

### 4. Check Email Availability

```bash
curl -X GET "{{api_url}}/auth/check-email?email=test@example.com"
```

### 5. Validate Session

```bash
curl -X GET "{{api_url}}/auth/validate-session" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 6. Logout

```bash
curl -X POST "{{api_url}}/auth/logout" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 7. Clear Session

```bash
curl -X POST "{{api_url}}/auth/clear-session" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 8. Emergency Reset

```bash
curl -X POST "{{api_url}}/auth/emergency-reset" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## 🌐 Public APIs

### 1. Get Public Properties

```bash
curl -X GET "{{api_url}}/public/properties?page=1&limit=12&sortBy=createdAt&sortOrder=desc"
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)
- `propertyType`: Filter by type (KOS_PUTRA, KOS_PUTRI, KOS_CAMPUR)
- `regencyCode`: Filter by regency code
- `districtCode`: Filter by district code
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `sortBy`: Sort field (createdAt, pricePerMonth, etc.)
- `sortOrder`: asc or desc

### 2. Get Public Property Detail

```bash
curl -X GET "{{api_url}}/public/properties/{{property_id}}"
```

### 3. Get Public Property Room Types

```bash
curl -X GET "{{api_url}}/public/properties/{{property_id}}/room-types"
```

### 4. Get Public Property Rooms

```bash
curl -X GET "{{api_url}}/public/properties/{{property_id}}/rooms"
```

### 5. Get Public Room Detail

```bash
curl -X GET "{{api_url}}/public/rooms/{{room_id}}"
```

### 6. Get Public Campuses

```bash
curl -X GET "{{api_url}}/public/campuses"
```

---

## 🏠 Properties Management

### 1. Get All Properties (Authenticated)

```bash
curl -X GET "{{api_url}}/properties?page=1&limit=10" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (DRAFT, PENDING, APPROVED, REJECTED)
- `propertyType`: Filter by type
- `search`: Search by name

### 2. Create Property

```bash
curl -X POST "{{api_url}}/properties" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "step1": {
      "name": "Kos Sejahtera",
      "description": "Kos nyaman dekat kampus",
      "propertyType": "KOS_PUTRA"
    },
    "step2": {
      "location": {
        "address": "Jl. Sudirman No. 123",
        "provinceCode": "33",
        "provinceName": "Jawa Tengah",
        "regencyCode": "3374",
        "regencyName": "Kota Semarang",
        "districtCode": "337401",
        "districtName": "Semarang Tengah",
        "postalCode": "50132",
        "latitude": -6.966667,
        "longitude": 110.416664
      }
    },
    "step3": {
      "facilities": ["WIFI", "AC", "PARKING"],
      "rules": "No smoking, No pets"
    },
    "step4": {
      "images": [
        {
          "url": "https://example.com/image1.jpg",
          "publicId": "property/image1",
          "caption": "Main view"
        }
      ]
    }
  }'
```

### 3. Get Property Detail

```bash
curl -X GET "{{api_url}}/properties/{{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Update Property

```bash
curl -X PUT "{{api_url}}/properties/{{property_id}}" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "name": "Kos Sejahtera Updated",
    "description": "Updated description"
  }'
```

### 5. Delete Property

```bash
curl -X DELETE "{{api_url}}/properties/{{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 6. Approve Property (Superadmin)

```bash
curl -X POST "{{api_url}}/properties/{{property_id}}/approve" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "approved": true
  }'
```

### 7. Get Property Rooms

```bash
curl -X GET "{{api_url}}/properties/{{property_id}}/rooms" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 8. Get Property Stats

```bash
curl -X GET "{{api_url}}/properties/stats" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 9. Get All Properties Coordinates

```bash
curl -X GET "{{api_url}}/properties/coordinates"
```

---

## 🛏️ Rooms Management

### 1. Get All Rooms

```bash
curl -X GET "{{api_url}}/rooms?page=1&limit=10&propertyId={{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 2. Create Room

```bash
curl -X POST "{{api_url}}/rooms" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "propertyId": "{{property_id}}",
    "roomNumber": "A101",
    "floor": 1,
    "roomTypeId": "room-type-id",
    "pricePerMonth": 1500000,
    "deposit": 1500000,
    "facilities": ["AC", "WIFI"],
    "images": [
      {
        "url": "https://example.com/room.jpg",
        "publicId": "room/image1"
      }
    ]
  }'
```

### 3. Get Room Detail

```bash
curl -X GET "{{api_url}}/rooms/{{room_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Update Room

```bash
curl -X PUT "{{api_url}}/rooms/{{room_id}}" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "roomNumber": "A102",
    "pricePerMonth": 1600000
  }'
```

### 5. Delete Room

```bash
curl -X DELETE "{{api_url}}/rooms/{{room_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 6. Update Room Availability

```bash
curl -X PUT "{{api_url}}/rooms/{{room_id}}/availability" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "isAvailable": false
  }'
```

### 7. Get Room Stats

```bash
curl -X GET "{{api_url}}/rooms/stats?propertyId={{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

---

## 📅 Bookings

### 1. Create Booking

```bash
curl -X POST "{{api_url}}/bookings" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "roomId": "{{room_id}}",
    "checkInDate": "2024-12-01T00:00:00.000Z",
    "checkOutDate": "2025-01-01T00:00:00.000Z",
    "guestName": "John Doe",
    "guestPhone": "081234567890",
    "guestEmail": "john@example.com",
    "notes": "Early check-in if possible"
  }'
```

### 2. Get All Bookings

```bash
curl -X GET "{{api_url}}/bookings?page=1&limit=10&status=PENDING" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, EXPIRED)
- `propertyId`: Filter by property
- `roomId`: Filter by room

### 3. Get Booking Detail

```bash
curl -X GET "{{api_url}}/bookings/{{booking_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Update Booking Status

```bash
curl -X PATCH "{{api_url}}/bookings/{{booking_id}}" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "status": "CONFIRMED"
  }'
```

### 5. Update Booking Dates

```bash
curl -X PATCH "{{api_url}}/bookings/{{booking_id}}/dates" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "checkInDate": "2024-12-05T00:00:00.000Z",
    "checkOutDate": "2025-01-05T00:00:00.000Z"
  }'
```

### 6. Pay Full Booking

```bash
curl -X POST "{{api_url}}/bookings/{{booking_id}}/pay-full" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

---

## 💳 Payments

### 1. Create Payment

```bash
curl -X POST "{{api_url}}/payments/create" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}",
    "paymentType": "DEPOSIT"
  }'
```

**Payment Types:**
- `DEPOSIT`: Pay deposit only
- `FULL`: Pay full amount

### 2. Get Payment Detail

```bash
curl -X GET "{{api_url}}/payments/{{payment_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 3. Get Latest Payment for Booking

```bash
curl -X GET "{{api_url}}/payments/latest?bookingId={{booking_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Check Payment Status

```bash
curl -X GET "{{api_url}}/payments/status?orderId=ORDER-123456" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 5. Midtrans Webhook (Payment Notification)

```bash
curl -X POST "{{api_url}}/midtrans/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER-123456",
    "transaction_status": "settlement",
    "gross_amount": "1500000.00"
  }'
```

### 6. Booking Payment Webhook

```bash
curl -X POST "{{api_url}}/bookings/payment/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER-123456",
    "status": "success"
  }'
```

---

## 🏢 AdminKos Dashboard

### 1. Get My Properties

```bash
curl -X GET "{{api_url}}/adminkos/properties" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 2. Get Dashboard Summary

```bash
curl -X GET "{{api_url}}/adminkos/summary" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 3. Get Bookings

```bash
curl -X GET "{{api_url}}/adminkos/bookings?page=1&limit=10&status=CONFIRMED" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Get Booking Detail

```bash
curl -X GET "{{api_url}}/adminkos/bookings/{{booking_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 5. Get Customer Bookings

```bash
curl -X GET "{{api_url}}/adminkos/bookings/customer/{{customer_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 6. Create Manual Booking

```bash
curl -X POST "{{api_url}}/adminkos/bookings/manual" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "roomId": "{{room_id}}",
    "checkInDate": "2024-12-01T00:00:00.000Z",
    "duration": 3,
    "guestName": "Jane Doe",
    "guestPhone": "081234567891",
    "guestEmail": "jane@example.com",
    "notes": "Walk-in booking"
  }'
```

### 7. Get Rooms

```bash
curl -X GET "{{api_url}}/adminkos/rooms?propertyId={{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 8. Get Room Grid

```bash
curl -X GET "{{api_url}}/adminkos/rooms/grid?propertyId={{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 9. Get Room Summary

```bash
curl -X GET "{{api_url}}/adminkos/rooms/summary?propertyId={{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 10. Add Room

```bash
curl -X POST "{{api_url}}/adminkos/rooms/add" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "propertyId": "{{property_id}}",
    "roomNumber": "B201",
    "floor": 2,
    "roomTypeId": "room-type-id",
    "pricePerMonth": 1700000
  }'
```

### 11. Get Revenue

```bash
curl -X GET "{{api_url}}/adminkos/revenue?propertyId={{property_id}}&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 12. Get Payment Breakdown

```bash
curl -X GET "{{api_url}}/adminkos/payment-breakdown?propertyId={{property_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 13. Get Activity Log

```bash
curl -X GET "{{api_url}}/adminkos/activity?page=1&limit=20" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 14. Get Receptionist List

```bash
curl -X GET "{{api_url}}/adminkos/receptionist" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 15. Get Receptionist Detail

```bash
curl -X GET "{{api_url}}/adminkos/receptionist/{{receptionist_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 16. Get Shift Calendar

```bash
curl -X GET "{{api_url}}/adminkos/shift/calendar?month=2024-12" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 17. Get Shift Detail

```bash
curl -X GET "{{api_url}}/adminkos/shift?date=2024-12-01" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 18. Get Bank Accounts

```bash
curl -X GET "{{api_url}}/adminkos/bank-accounts" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 19. Get Approved Bank Accounts

```bash
curl -X GET "{{api_url}}/adminkos/bank-accounts/approved" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 20. Get Payouts

```bash
curl -X GET "{{api_url}}/adminkos/payouts?page=1&limit=10" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 21. Get Payout Balance

```bash
curl -X GET "{{api_url}}/adminkos/payouts/balance" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 22. Request Withdrawal

```bash
curl -X POST "{{api_url}}/adminkos/withdraw" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "amount": 5000000,
    "bankAccountId": "bank-account-id"
  }'
```

### 23. Get Withdrawal Summary

```bash
curl -X GET "{{api_url}}/adminkos/withdraw/summary" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 24. Get Withdrawal Breakdown

```bash
curl -X GET "{{api_url}}/adminkos/withdraw/breakdown?month=2024-12" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 25. Get Ledger Accounts

```bash
curl -X GET "{{api_url}}/adminkos/ledger/accounts" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 26. Get Ledger Entries

```bash
curl -X GET "{{api_url}}/adminkos/ledger/entries?page=1&limit=50" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 27. Get Ledger Balance

```bash
curl -X GET "{{api_url}}/adminkos/ledger/balance?accountId={{account_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 28. Get Ledger Summary

```bash
curl -X GET "{{api_url}}/adminkos/ledger/summary" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 29. Get Ledger Breakdown

```bash
curl -X GET "{{api_url}}/adminkos/ledger/breakdown?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 30. Sync Ledger

```bash
curl -X POST "{{api_url}}/adminkos/ledger/sync" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 31. Get Ledger Timeseries

```bash
curl -X GET "{{api_url}}/adminkos/ledger/timeseries?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

---

## 🎫 Receptionist

### 1. Get Receptionist Profile

```bash
curl -X GET "{{api_url}}/receptionist/profile" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 2. Get Receptionist Bookings

```bash
curl -X GET "{{api_url}}/receptionist/bookings?page=1&limit=10" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 3. Search Customer

```bash
curl -X GET "{{api_url}}/receptionist/customers/search?query=john" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Lookup Booking

```bash
curl -X GET "{{api_url}}/receptionist/bookings/lookup?bookingCode=BK-123456" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 5. Create Direct Booking

```bash
curl -X POST "{{api_url}}/receptionist/bookings/direct" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "roomId": "{{room_id}}",
    "guestName": "Walk-in Customer",
    "guestPhone": "081234567890",
    "duration": 1
  }'
```

### 6. Check-in Booking

```bash
curl -X POST "{{api_url}}/receptionist/bookings/checkin" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

### 7. Check-out Booking

```bash
curl -X POST "{{api_url}}/receptionist/bookings/checkout" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

### 8. Get Receptionist Rooms

```bash
curl -X GET "{{api_url}}/receptionist/rooms" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 9. Get Receptionist Ledger Accounts

```bash
curl -X GET "{{api_url}}/receptionist/ledger/accounts" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

---

## 👑 Superadmin

### 1. Get All Bank Accounts

```bash
curl -X GET "{{api_url}}/superadmin/bank-accounts?page=1&limit=10" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 2. Get Bank Account Detail

```bash
curl -X GET "{{api_url}}/superadmin/bank-accounts/{{bank_account_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 3. Update Bank Account

```bash
curl -X PUT "{{api_url}}/superadmin/bank-accounts/{{bank_account_id}}" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "accountName": "Updated Account Name"
  }'
```

### 4. Delete Bank Account

```bash
curl -X DELETE "{{api_url}}/superadmin/bank-accounts/{{bank_account_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 5. Approve Bank Account

```bash
curl -X POST "{{api_url}}/superadmin/bank-accounts/{{bank_account_id}}/approve" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "approved": true
  }'
```

### 6. Get All Payouts

```bash
curl -X GET "{{api_url}}/superadmin/payouts?page=1&limit=10&status=PENDING" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 7. Get Payout Detail

```bash
curl -X GET "{{api_url}}/superadmin/payouts/{{payout_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 8. Approve Payout

```bash
curl -X POST "{{api_url}}/superadmin/payouts/{{payout_id}}/approve" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "approved": true,
    "notes": "Approved for processing"
  }'
```

### 9. Get Transactions List

```bash
curl -X GET "{{api_url}}/superadmin/transactions/list?page=1&limit=10" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 10. Get Transaction Detail

```bash
curl -X GET "{{api_url}}/superadmin/transactions/{{transaction_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 11. Get Transaction Summary

```bash
curl -X GET "{{api_url}}/superadmin/transactions/summary?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 12. Get Transaction Chart Data

```bash
curl -X GET "{{api_url}}/superadmin/transactions/chart?period=monthly&year=2024" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 13. Export Transactions

```bash
curl -X GET "{{api_url}}/superadmin/transactions/export?startDate=2024-01-01&endDate=2024-12-31&format=csv" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  --output transactions.csv
```

---

## 📊 Analytics

### 1. Track Event

```bash
curl -X POST "{{api_url}}/analytics/track" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "page_view",
    "page": "/properties/123",
    "properties": {
      "propertyId": "123",
      "source": "homepage"
    }
  }'
```

### 2. Get Analytics Summary

```bash
curl -X GET "{{api_url}}/analytics/summary?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 3. Get Realtime Analytics

```bash
curl -X GET "{{api_url}}/analytics/realtime" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Get Total Visitors

```bash
curl -X GET "{{api_url}}/analytics/visitors/total?startDate=2024-01-01&endDate=2024-12-31"
```

### 5. Get Visitor Stats

```bash
curl -X GET "{{api_url}}/analytics/visitors/stats?period=daily&days=7"
```

---

## 🛠️ Utilities

### 1. Health Check

```bash
curl -X GET "{{api_url}}/health"
```

### 2. Upload Image

```bash
curl -X POST "{{api_url}}/upload/image" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -F "image=@/path/to/image.jpg" \
  -F "folder=properties"
```

### 3. Reverse Geocoding (GET)

```bash
curl -X GET "{{api_url}}/geocoding/reverse?lat=-6.966667&lng=110.416664"
```

### 4. Reverse Geocoding (POST)

```bash
curl -X POST "{{api_url}}/geocoding/reverse" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -6.966667,
    "lng": 110.416664
  }'
```

### 5. Get Banks List

```bash
curl -X GET "{{api_url}}/banks?search=bca" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 6. Get Provinces

```bash
curl -X GET "{{api_url}}/wilayah/provinces"
```

### 7. Get Regencies by Province

```bash
curl -X GET "{{api_url}}/wilayah/regencies/{{province_code}}"
```

### 8. Get Districts by Regency

```bash
curl -X GET "{{api_url}}/wilayah/districts/{{regency_code}}"
```

---

## 🔧 User Management

### 1. Get All Users

```bash
curl -X GET "{{api_url}}/users?page=1&limit=10&role=CUSTOMER" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 2. Create User

```bash
curl -X POST "{{api_url}}/users" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "role": "CUSTOMER"
  }'
```

### 3. Get User Detail

```bash
curl -X GET "{{api_url}}/users/{{user_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 4. Update User

```bash
curl -X PUT "{{api_url}}/users/{{user_id}}" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "name": "Updated Name",
    "phone": "081234567890"
  }'
```

### 5. Delete User

```bash
curl -X DELETE "{{api_url}}/users/{{user_id}}" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 6. Update User Role

```bash
curl -X PATCH "{{api_url}}/users/{{user_id}}/role" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "role": "ADMINKOS"
  }'
```

### 7. Update User Status

```bash
curl -X PATCH "{{api_url}}/users/{{user_id}}/status" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "status": "ACTIVE"
  }'
```

### 8. Get User Stats

```bash
curl -X GET "{{api_url}}/users/stats" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

---

## ⚙️ Settings

### 1. Get Profile

```bash
curl -X GET "{{api_url}}/settings/profile" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

### 2. Update Profile

```bash
curl -X PATCH "{{api_url}}/settings/profile" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "name": "Updated Name",
    "phone": "081234567890"
  }'
```

### 3. Change Password

```bash
curl -X POST "{{api_url}}/settings/password" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!"
  }'
```

### 4. Upload Avatar

```bash
curl -X POST "{{api_url}}/settings/avatar" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -F "avatar=@/path/to/avatar.jpg"
```

### 5. Delete Avatar

```bash
curl -X DELETE "{{api_url}}/settings/avatar" \
  -H "Cookie: next-auth.session-token={{access_token}}"
```

---

## 📬 Notifications

### 1. Send Booking Created Notification

```bash
curl -X POST "{{api_url}}/notifications/booking-created" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

### 2. Send Payment Success Notification

```bash
curl -X POST "{{api_url}}/notifications/payment-success" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

### 3. Send Check-in Notification

```bash
curl -X POST "{{api_url}}/notifications/check-in" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

### 4. Send Check-out Notification

```bash
curl -X POST "{{api_url}}/notifications/check-out" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

### 5. Send Due Reminder Notification

```bash
curl -X POST "{{api_url}}/notifications/due-reminder" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token={{access_token}}" \
  -d '{
    "bookingId": "{{booking_id}}"
  }'
```

---

## ⏰ Cron Jobs

### 1. Expire Unpaid Bookings

```bash
curl -X GET "{{api_url}}/cron/expire/bookings" \
  -H "Authorization: Bearer {{CRON_SECRET}}"
```

### 2. Cleanup Expired Sessions

```bash
curl -X GET "{{api_url}}/cron/cleanup-expired" \
  -H "Authorization: Bearer {{CRON_SECRET}}"
```

---

## 🧪 Testing Tips

### Demo Accounts (after seeding)

1. **Superadmin**
   - Email: `superadmin@boxbook.id`
   - Password: `admin123`

2. **Admin Kos**
   - Email: `adminkos@boxbook.id`
   - Password: `admin123`

3. **Customer**
   - Email: `customer@boxbook.id`
   - Password: `customer123`

4. **Receptionist**
   - Email: `receptionist@boxbook.id`
   - Password: `recep123`

### Postman Pre-request Script for Auth

```javascript
// Auto-refresh token if expired
pm.sendRequest({
    url: pm.environment.get("api_url") + "/auth/validate-session",
    method: 'GET',
    header: {
        'Cookie': 'next-auth.session-token=' + pm.environment.get("access_token")
    }
}, function (err, response) {
    if (response.code === 401) {
        console.log('Session expired, need to re-login');
    }
});
```

### Postman Test Script for Extracting IDs

```javascript
// Extract booking ID from response
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("booking_id", jsonData.id);
    console.log("Booking ID saved:", jsonData.id);
}

// Extract property ID
if (pm.response.json().data) {
    pm.environment.set("property_id", pm.response.json().data.id);
}

// Extract room ID
if (pm.response.json().data) {
    pm.environment.set("room_id", pm.response.json().data.id);
}
```

---

## 📝 Notes

1. **Authentication**: Most endpoints require authentication via `next-auth.session-token` cookie
2. **CSRF Protection**: NextAuth handles CSRF automatically for authenticated requests
3. **Rate Limiting**: Not implemented yet, but recommended for production
4. **Pagination**: Most list endpoints support `page` and `limit` query parameters
5. **Error Format**: All errors return JSON with `{ error: "message" }` or `{ success: false, error: "message" }`
6. **Date Format**: All dates should be in ISO 8601 format (`2024-12-01T00:00:00.000Z`)

---

## 🚀 Quick Start

1. Import environment to Postman
2. Import collection to Postman
3. Set `base_url` in environment
4. Run "Login" request to get session token
5. Token will be stored automatically in cookies
6. Start testing other endpoints!

---

**Generated**: November 2, 2025  
**API Version**: 1.0  
**Base URL**: `http://localhost:3000/api`
