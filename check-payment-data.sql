-- Check Payment Data
-- Jalankan query ini di database untuk memeriksa data Payment

-- 1. Cek total Payment
SELECT COUNT(*) as total_payments FROM "Payment";

-- 2. Cek Payment terbaru dengan tanggal
SELECT 
  id,
  "midtransOrderId",
  status,
  "paymentType",
  amount,
  "transactionTime",
  "createdAt",
  COALESCE("transactionTime", "createdAt") as effective_date
FROM "Payment"
ORDER BY COALESCE("transactionTime", "createdAt") DESC
LIMIT 10;

-- 3. Cek range tanggal Payment
SELECT 
  MIN(COALESCE("transactionTime", "createdAt")) as oldest_payment,
  MAX(COALESCE("transactionTime", "createdAt")) as newest_payment,
  COUNT(*) as total
FROM "Payment";

-- 4. Cek Payment dalam 30 hari terakhir
SELECT COUNT(*) as payments_last_30_days
FROM "Payment"
WHERE COALESCE("transactionTime", "createdAt") >= NOW() - INTERVAL '30 days';

-- 5. Cek Payment dalam 90 hari terakhir
SELECT COUNT(*) as payments_last_90_days
FROM "Payment"
WHERE COALESCE("transactionTime", "createdAt") >= NOW() - INTERVAL '90 days';

-- 6. Cek Payment dalam 1 tahun terakhir
SELECT COUNT(*) as payments_last_year
FROM "Payment"
WHERE COALESCE("transactionTime", "createdAt") >= NOW() - INTERVAL '1 year';

-- 7. Cek distribusi Payment per bulan
SELECT 
  DATE_TRUNC('month', COALESCE("transactionTime", "createdAt")) as month,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount
FROM "Payment"
GROUP BY DATE_TRUNC('month', COALESCE("transactionTime", "createdAt"))
ORDER BY month DESC
LIMIT 12;

-- 8. Cek Payment dengan relasi lengkap
SELECT 
  p.id,
  p."midtransOrderId",
  p.status,
  p.amount,
  p."createdAt",
  b.id as booking_id,
  b."bookingCode",
  u.id as user_id,
  u.email as user_email
FROM "Payment" p
LEFT JOIN "Booking" b ON p."bookingId" = b.id
LEFT JOIN "User" u ON p."userId" = u.id
ORDER BY p."createdAt" DESC
LIMIT 10;

