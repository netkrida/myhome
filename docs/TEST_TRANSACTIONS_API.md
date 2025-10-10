# Testing Transactions API

## Langkah-langkah Debugging

### 1. Buka Browser DevTools
- Buka halaman `/dashboard/superadmin/transactions`
- Buka DevTools (F12)
- Pergi ke tab **Network**
- Refresh halaman

### 2. Periksa Network Requests
Cari request ke:
- `/api/superadmin/transactions/summary`
- `/api/superadmin/transactions/chart`
- `/api/superadmin/transactions/list`

### 3. Periksa Response
Untuk setiap request, periksa:
- **Status Code**: Apakah 200, 401, 403, atau 500?
- **Response Body**: Apa isi response-nya?
- **Request Headers**: Apakah ada cookie session?

### 4. Periksa Console
Di tab **Console**, cari error messages seperti:
- "Error fetching transactions"
- "Error fetching summary"
- "Error fetching chart data"

### 5. Periksa Server Logs
Di terminal tempat Next.js berjalan, cari log:
- "Error in GET /api/superadmin/transactions/list:"
- "Error getting transaction list:"
- "Error getting transaction summary:"

## Kemungkinan Masalah

### A. Tidak Ada Autentikasi
**Gejala**: Status 401 atau 500 dengan error "Authentication required"
**Solusi**: Pastikan sudah login sebagai SUPERADMIN

### B. Bukan Role SUPERADMIN
**Gejala**: Status 403 dengan error "Only SUPERADMIN can access transaction data"
**Solusi**: Login dengan akun SUPERADMIN

### C. Tidak Ada Data
**Gejala**: Status 200, tapi `transactions: []` dan `total: 0`
**Solusi**: 
- Periksa apakah ada data Payment di database
- Periksa filter date range (default: 30 hari terakhir)
- Coba hapus filter date range

### D. Error di Query
**Gejala**: Status 500 dengan error di server logs
**Solusi**: Periksa error message di server logs

## Quick Test Query

Jalankan query ini di database untuk memeriksa data Payment:

```sql
-- Cek total Payment
SELECT COUNT(*) as total FROM "Payment";

-- Cek Payment dalam 30 hari terakhir
SELECT COUNT(*) as total 
FROM "Payment" 
WHERE COALESCE("transactionTime", "createdAt") >= NOW() - INTERVAL '30 days';

-- Cek Payment dengan detail
SELECT 
  id,
  "midtransOrderId",
  status,
  "paymentType",
  amount,
  "transactionTime",
  "createdAt"
FROM "Payment"
ORDER BY COALESCE("transactionTime", "createdAt") DESC
LIMIT 10;
```

## Manual API Test

Gunakan curl atau Postman untuk test API:

```bash
# Test dengan cookie session dari browser
curl -X GET 'http://localhost:3000/api/superadmin/transactions/list?page=1&pageSize=25' \
  -H 'Cookie: next-auth.session-token=YOUR_SESSION_TOKEN'
```

## Expected Response

Response yang benar:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "...",
        "midtransOrderId": "...",
        "status": "SUCCESS",
        "paymentType": "FULL",
        "amount": 1000000,
        ...
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

Response jika tidak ada data:

```json
{
  "success": true,
  "data": {
    "transactions": [],
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

