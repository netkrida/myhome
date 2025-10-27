# WhatsApp Notification System - Implementation Guide

## Overview
Sistem notifikasi WhatsApp otomatis menggunakan Kirimi.id API untuk mengirim pesan ke customer dan adminkos berdasarkan event booking/payment/check-in/check-out.

## Architecture
```
Controller (API) → Service (notification.api.ts) → Domain Service (NotificationService.ts) → Repository (WhatsAppRepository.ts) → Adapter (kirimi/whatsapp.adapter.ts) → Kirimi API
```

## Environment Variables
Tambahkan di file `.env`:
```env
KIRIMI_USER_CODE=your-user-code-here
KIRIMI_DEVICE_ID=your-device-id-here
KIRIMI_SECRET_KEY=your-secret-key-here
```

## Files Created

### 1. Helper - Phone Format
- **File**: `src/server/lib/phone-format.ts`
- **Purpose**: Format nomor HP Indonesia ke format 62xxx
- **Example**: `082283496340` → `6282283496340`

### 2. Templates - Notification Messages with Spintax
- **File**: `src/server/services/notification-templates.ts`
- **Purpose**: Template pesan dengan variasi otomatis (Spintax) untuk menghindari deteksi spam
- **Templates**:
  - `bookingCreatedCustomer` / `bookingCreatedAdminkos`
  - `paymentSuccessCustomer` / `paymentSuccessAdminkos`
  - `checkInCustomer` / `checkInAdminkos`
  - `checkOutCustomer` / `checkOutAdminkos`
  - `dueReminderCustomer`

### 3. Adapter - Kirimi WhatsApp API
- **File**: `src/server/adapters/kirimi/whatsapp.adapter.ts`
- **Functions**:
  - `sendMessage()` - Kirim dengan typing effect
  - `sendMessageFast()` - Kirim tanpa typing effect
  - `broadcastMessage()` - Kirim ke banyak nomor

### 4. Repository - WhatsApp
- **File**: `src/server/repositories/WhatsAppRepository.ts`
- **Purpose**: Wrapper adapter, validasi format nomor, logging
- **Validation**: Semua nomor harus format `62xxx`

### 5. Service - Notification
- **File**: `src/server/services/NotificationService.ts`
- **Functions**:
  - `sendBookingCreatedNotification()`
  - `sendPaymentSuccessNotification()`
  - `sendCheckInNotification()`
  - `sendCheckOutNotification()`
  - `sendDueReminderNotification()`

### 6. API Service
- **File**: `src/server/api/notification.api.ts`
- **Purpose**: Wrapper untuk NotificationService, dipanggil oleh controller

### 7. Schema - Validation
- **File**: `src/server/schemas/notification.schema.ts`
- **Schemas**:
  - `bookingCreatedNotificationSchema`
  - `paymentSuccessNotificationSchema`
  - `checkInNotificationSchema`
  - `checkOutNotificationSchema`
  - `dueReminderNotificationSchema`

### 8. API Controllers
- **Files**:
  - `src/app/api/notifications/booking-created/route.ts`
  - `src/app/api/notifications/payment-success/route.ts`
  - `src/app/api/notifications/check-in/route.ts`
  - `src/app/api/notifications/check-out/route.ts`
  - `src/app/api/notifications/due-reminder/route.ts`

## API Endpoints

### 1. POST `/api/notifications/booking-created`
Kirim notifikasi booking baru ke customer dan adminkos.

**Request Body**:
```json
{
  "customerName": "John Doe",
  "customerPhone": "6281234567890",
  "adminkosPhone": "6287654321098",
  "propertyName": "Kost Mawar",
  "bookingCode": "BK-001",
  "checkInDate": "2025-11-01T14:00:00.000Z",
  "checkOutDate": "2025-11-30T12:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "customerSent": true,
    "adminkosSent": true
  },
  "message": "Booking created notification sent successfully"
}
```

### 2. POST `/api/notifications/payment-success`
Kirim notifikasi pembayaran berhasil ke customer dan adminkos.

**Request Body**:
```json
{
  "customerName": "John Doe",
  "customerPhone": "6281234567890",
  "adminkosPhone": "6287654321098",
  "propertyName": "Kost Mawar",
  "bookingCode": "BK-001",
  "amount": 1500000
}
```

### 3. POST `/api/notifications/check-in`
Kirim notifikasi check-in ke customer dan adminkos.

**Request Body**:
```json
{
  "customerName": "John Doe",
  "customerPhone": "6281234567890",
  "adminkosPhone": "6287654321098",
  "propertyName": "Kost Mawar",
  "bookingCode": "BK-001",
  "checkInDate": "2025-11-01T14:00:00.000Z"
}
```

### 4. POST `/api/notifications/check-out`
Kirim notifikasi check-out ke customer dan adminkos.

**Request Body**:
```json
{
  "customerName": "John Doe",
  "customerPhone": "6281234567890",
  "adminkosPhone": "6287654321098",
  "propertyName": "Kost Mawar",
  "bookingCode": "BK-001",
  "checkOutDate": "2025-11-30T12:00:00.000Z"
}
```

### 5. POST `/api/notifications/due-reminder`
Kirim pengingat jatuh tempo ke customer.

**Request Body**:
```json
{
  "customerName": "John Doe",
  "customerPhone": "6281234567890",
  "propertyName": "Kost Mawar",
  "bookingCode": "BK-001",
  "dueDate": "2025-11-30T12:00:00.000Z",
  "daysLeft": 3
}
```

## Integration Example

### Memanggil notifikasi dari service booking/payment:

```typescript
import { NotificationService } from "@/server/services/NotificationService";

// Setelah booking dibuat
const notificationResult = await NotificationService.sendBookingCreatedNotification({
  customerName: booking.user.name,
  customerPhone: booking.user.phoneNumber,  // Sudah format 62xxx dari schema
  adminkosPhone: booking.property.owner.phoneNumber,  // Sudah format 62xxx dari schema
  propertyName: booking.property.name,
  bookingCode: booking.bookingCode,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
});

if (notificationResult.success) {
  console.log("✅ Notifikasi terkirim:", notificationResult.data);
} else {
  console.error("❌ Gagal kirim notifikasi:", notificationResult.error);
}
```

## Logging
Semua layer menggunakan logging emoji konsisten:
- 🔍 = Processing/Sending
- ✅ = Success
- ❌ = Error/Failed

## Phone Number Format
- **Input**: User bisa input `08xxx` atau `62xxx`
- **Stored**: Otomatis diubah ke `62xxx` oleh helper `formatIndonesianPhoneNumber()`
- **Validation**: Schema memvalidasi format `62[0-9]{9,13}`

## Spintax Feature
Template pesan menggunakan Spintax untuk variasi otomatis:
```
{Halo|Hi|Hai} {Pak|Bu|Bapak|Ibu} {Nama}!
```
Akan menghasilkan variasi:
- "Halo Pak Nama!"
- "Hi Bu Nama!"
- "Hai Bapak Nama!"
- dst.

Ini mengurangi risiko deteksi spam oleh WhatsApp.

## Next Steps
1. Dapatkan credentials dari Kirimi.id (user_code, device_id, secret_key)
2. Tambahkan credentials ke file `.env`
3. Test endpoint dengan Postman/curl
4. Integrasikan pemanggilan notifikasi di service booking/payment/checkin/checkout yang sudah ada
5. (Optional) Buat cron job untuk pengingat jatuh tempo

## Testing
```bash
# Test sending notification
curl -X POST http://localhost:3000/api/notifications/booking-created \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "6281234567890",
    "adminkosPhone": "6287654321098",
    "propertyName": "Kost Test",
    "bookingCode": "TEST-001",
    "checkInDate": "2025-11-01T14:00:00.000Z",
    "checkOutDate": "2025-11-30T12:00:00.000Z"
  }'
```

## Notes
- Frontend tidak perlu diubah - semua proses di backend
- Notifikasi otomatis dipanggil dari service layer saat event terjadi
- Nomor HP customer dan adminkos diambil dari database (field `phoneNumber`)
- Pastikan data booking sudah include relasi `user` dan `property.owner` untuk akses nomor HP
