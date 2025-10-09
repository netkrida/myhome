# 🔄 Cron Cleanup API Documentation

## Overview

API endpoint untuk cleanup expired bookings dan payments. Endpoint ini dipanggil secara otomatis oleh cron service setiap 5 menit, namun juga bisa dipanggil manual untuk testing atau troubleshooting.

---

## Endpoint

### `GET /api/cron/cleanup-expired`

Cleanup expired payments dan unpaid bookings yang sudah melewati grace period.

#### Authentication

**Required**: Bearer Token

```
Authorization: Bearer <CRON_SECRET>
```

#### Request

**Method**: `GET`

**Headers**:
```
Authorization: Bearer <CRON_SECRET>
```

**Query Parameters**: None

**Body**: None

#### Response

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "executedAt": "2025-01-09T10:30:00.000Z",
    "graceMinutes": 30,
    "expiredPaymentsCount": 5,
    "deletedBookingsCount": 3,
    "deletedBookingIds": [
      "clx1234567890abcdef",
      "clx0987654321fedcba",
      "clxabcdef123456789"
    ]
  }
}
```

**Error Responses**:

1. **401 Unauthorized** - Missing or invalid Authorization header:
```json
{
  "success": false,
  "error": "Unauthorized: Missing or invalid Authorization header"
}
```

2. **401 Unauthorized** - Invalid token:
```json
{
  "success": false,
  "error": "Unauthorized: Invalid token"
}
```

3. **500 Internal Server Error** - Server configuration error:
```json
{
  "success": false,
  "error": "Server configuration error"
}
```

4. **500 Internal Server Error** - Service error:
```json
{
  "success": false,
  "error": "Failed to cleanup expired bookings"
}
```

---

## Response Fields

### Success Response Data

| Field | Type | Description |
|-------|------|-------------|
| `executedAt` | string (ISO 8601) | Timestamp when cleanup was executed |
| `graceMinutes` | number | Grace period in minutes for unpaid bookings without payment |
| `expiredPaymentsCount` | number | Number of payments that were marked as EXPIRED |
| `deletedBookingsCount` | number | Number of bookings that were deleted |
| `deletedBookingIds` | string[] | Array of booking IDs that were deleted |

---

## Business Logic

### 1. Expire Payments

Marks Payment records as EXPIRED if:
- Current status is `PENDING`
- `expiryTime` < current time

**SQL Equivalent**:
```sql
UPDATE "Payment"
SET status = 'EXPIRED', "updatedAt" = NOW()
WHERE status = 'PENDING' AND "expiryTime" < NOW();
```

### 2. Delete Bookings

Deletes Booking records if:
- Status is `UNPAID`
- AND one of the following:
  - Has at least one Payment with status `EXPIRED`
  - Has no Payment records AND `createdAt` < (current time - grace period)

**SQL Equivalent**:
```sql
-- Bookings with expired payments
DELETE FROM "Booking"
WHERE status = 'UNPAID'
  AND id IN (
    SELECT DISTINCT "bookingId"
    FROM "Payment"
    WHERE status = 'EXPIRED'
  );

-- Bookings without payments and exceeded grace period
DELETE FROM "Booking"
WHERE status = 'UNPAID'
  AND id NOT IN (SELECT DISTINCT "bookingId" FROM "Payment")
  AND "createdAt" < (NOW() - INTERVAL '30 minutes');
```

### 3. Update Room Availability

For each deleted booking:
- Sets `Room.isAvailable = true`
- Updates `Room.updatedAt`

### 4. Recalculate Property Stats

For each affected property:
- Counts total available rooms
- Updates `Property.availableRooms`
- Updates `Property.updatedAt`

**SQL Equivalent**:
```sql
UPDATE "Property"
SET 
  "availableRooms" = (
    SELECT COUNT(*)
    FROM "Room"
    WHERE "propertyId" = "Property".id
      AND "isAvailable" = true
  ),
  "updatedAt" = NOW()
WHERE id = '<property-id>';
```

---

## Transaction Guarantee

All operations are executed within a **Prisma transaction** to ensure:
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Database remains in valid state
- **Isolation**: No race conditions with concurrent operations
- **Durability**: Changes are persisted

---

## Examples

### cURL

```bash
# Basic request
curl -X GET \
  -H "Authorization: Bearer your-cron-secret-here" \
  http://localhost:3000/api/cron/cleanup-expired

# With pretty JSON output
curl -X GET \
  -H "Authorization: Bearer your-cron-secret-here" \
  http://localhost:3000/api/cron/cleanup-expired | jq '.'

# Production
curl -X GET \
  -H "Authorization: Bearer your-cron-secret-here" \
  https://myhome.co.id/api/cron/cleanup-expired
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/cron/cleanup-expired', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`,
  },
});

const result = await response.json();

if (result.success) {
  console.log('Cleanup successful:', result.data);
} else {
  console.error('Cleanup failed:', result.error);
}
```

### Python

```python
import requests
import os

url = 'http://localhost:3000/api/cron/cleanup-expired'
headers = {
    'Authorization': f'Bearer {os.getenv("CRON_SECRET")}'
}

response = requests.get(url, headers=headers)
result = response.json()

if result['success']:
    print('Cleanup successful:', result['data'])
else:
    print('Cleanup failed:', result['error'])
```

### Bash Script (Cron)

```bash
#!/bin/bash

CRON_SECRET="your-secret-here"
APP_URL="http://app:3000"

curl -fsS \
  --retry 3 \
  --retry-delay 2 \
  --max-time 20 \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/cron/cleanup-expired"
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CRON_SECRET` | Yes | - | Secret token for authentication |
| `BOOKING_UNPAID_GRACE_MINUTES` | No | 30 | Grace period in minutes for unpaid bookings without payment |

---

## Security

### Authentication

- **Bearer Token**: Required for all requests
- **Token Validation**: Constant-time comparison to prevent timing attacks
- **No Public Access**: Endpoint only accessible with valid token

### Best Practices

1. **Strong Secret**: Use at least 32 characters random string
2. **Environment Variable**: Never hardcode secret in code
3. **Rotate Regularly**: Change secret every 3-6 months
4. **Internal Network**: Cron service calls via internal Docker network
5. **HTTPS**: Use HTTPS in production

### Generate Strong Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Rate Limiting

**Current**: No rate limiting (internal use only)

**Recommendation**: If exposing to external services, implement rate limiting:
- Max 12 requests per hour (every 5 minutes)
- Use Redis or in-memory cache for tracking

---

## Monitoring

### Success Metrics

Monitor these metrics from response:
- `expiredPaymentsCount`: Should be low if payment expiry is working correctly
- `deletedBookingsCount`: Should be low if users are completing payments
- `deletedBookingIds`: Track specific bookings for investigation

### Alerts

Set up alerts for:
- **High deletion rate**: > 10 bookings deleted per cleanup
- **Consistent failures**: 3+ consecutive 500 errors
- **Authentication failures**: Multiple 401 errors (potential security issue)

### Logging

All cleanup operations are logged:
```
[Cron Cleanup] Success: {
  executedAt: '2025-01-09T10:30:00.000Z',
  graceMinutes: 30,
  expiredPaymentsCount: 5,
  deletedBookingsCount: 3,
  deletedBookingIds: [...]
}
```

---

## Troubleshooting

### 401 Unauthorized

**Cause**: Invalid or missing CRON_SECRET

**Solution**:
1. Verify CRON_SECRET in environment
2. Check Authorization header format
3. Ensure no extra spaces in token

### 500 Internal Server Error

**Cause**: Database connection or query error

**Solution**:
1. Check database connectivity
2. Review application logs
3. Verify Prisma schema is up to date
4. Check database indexes exist

### No Bookings Deleted

**Cause**: No bookings meet deletion criteria

**Solution**:
1. Verify booking status is UNPAID
2. Check payment status and expiry time
3. Verify grace period configuration
4. Review booking creation timestamps

---

## Related Documentation

- [Deployment Guide](../README-CRON-DEPLOYMENT.md)
- [Quick Start Guide](../CRON-QUICKSTART.md)
- [Implementation Summary](../CRON-CLEANUP-IMPLEMENTATION.md)

---

**Last Updated**: 2025-01-09  
**API Version**: 1.0.0

