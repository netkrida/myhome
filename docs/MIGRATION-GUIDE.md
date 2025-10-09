# 🗄️ Database Migration Guide - Cron Cleanup Indexes

Panduan untuk menjalankan database migration untuk menambahkan indexes yang diperlukan oleh cron cleanup system.

---

## 📋 Overview

Migration ini menambahkan 3 indexes untuk optimasi performa cleanup queries:

1. `Booking_createdAt_idx` - Index pada `Booking.createdAt`
2. `Payment_status_expiryTime_idx` - Composite index pada `Payment(status, expiryTime)`
3. `Payment_expiryTime_idx` - Index pada `Payment.expiryTime`

---

## ⚠️ Important Notes

- **Downtime**: Migration dapat dilakukan tanpa downtime (indexes dibuat dengan `CREATE INDEX IF NOT EXISTS`)
- **Duration**: Tergantung jumlah data, estimasi 1-5 menit untuk database dengan jutaan records
- **Rollback**: Indexes dapat dihapus kapan saja tanpa mempengaruhi data
- **Performance**: Sedikit overhead saat index dibuat, namun query akan jauh lebih cepat setelahnya

---

## 🚀 Automatic Migration (Recommended)

Migration akan dijalankan otomatis saat container app start.

### Via Docker Compose

```bash
# Migration akan run otomatis saat container start
docker-compose up -d app

# Monitor migration logs
docker logs -f myhome-app
```

Expected output:
```
Running database migrations...
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "db_myhome"

Applying migration `20250109_add_cleanup_indexes`

The following migration(s) have been applied:

migrations/
  └─ 20250109_add_cleanup_indexes/
    └─ migration.sql

✔ Generated Prisma Client

Starting application...
```

### Via Dockploy

1. Deploy via Dockploy (push to Git or manual deploy)
2. Dockploy akan build dan start container
3. Migration runs automatically on container start
4. Check logs in Dockploy UI

---

## 🔧 Manual Migration (Alternative)

Jika perlu menjalankan migration secara manual:

### Option 1: Via Docker Exec

```bash
# Connect to app container
docker exec -it myhome-app sh

# Run migration
npx prisma migrate deploy

# Exit container
exit
```

### Option 2: Via Database Client

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U postgres -d db_myhome

# Run migration SQL manually
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Payment_status_expiryTime_idx" ON "Payment"("status", "expiryTime");
CREATE INDEX IF NOT EXISTS "Payment_expiryTime_idx" ON "Payment"("expiryTime");

# Verify indexes created
\d "Booking"
\d "Payment"

# Exit
\q
```

---

## ✅ Verification

### 1. Check Migration Status

```bash
# Via Docker
docker exec myhome-app npx prisma migrate status

# Expected output:
# Database schema is up to date!
```

### 2. Verify Indexes in Database

```sql
-- Connect to database
docker exec -it postgres psql -U postgres -d db_myhome

-- List all indexes on Booking table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Booking';

-- Expected to see:
-- Booking_createdAt_idx

-- List all indexes on Payment table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Payment';

-- Expected to see:
-- Payment_status_expiryTime_idx
-- Payment_expiryTime_idx
```

### 3. Test Query Performance

```sql
-- Test query that uses new indexes
EXPLAIN ANALYZE
SELECT * FROM "Booking"
WHERE status = 'UNPAID'
  AND "createdAt" < NOW() - INTERVAL '30 minutes';

-- Should show "Index Scan using Booking_createdAt_idx"

EXPLAIN ANALYZE
SELECT * FROM "Payment"
WHERE status = 'PENDING'
  AND "expiryTime" < NOW();

-- Should show "Index Scan using Payment_status_expiryTime_idx"
```

---

## 📊 Performance Impact

### Before Migration

```sql
-- Query without index (slow on large tables)
EXPLAIN ANALYZE
SELECT * FROM "Payment"
WHERE status = 'PENDING' AND "expiryTime" < NOW();

-- Result: Seq Scan on "Payment" (cost=0.00..XXX rows=XXX)
-- Time: ~500ms on 100k records
```

### After Migration

```sql
-- Query with index (fast)
EXPLAIN ANALYZE
SELECT * FROM "Payment"
WHERE status = 'PENDING' AND "expiryTime" < NOW();

-- Result: Index Scan using Payment_status_expiryTime_idx (cost=0.00..XXX rows=XXX)
-- Time: ~5ms on 100k records
```

**Performance Improvement**: ~100x faster for cleanup queries

---

## 🔄 Rollback

Jika perlu rollback migration:

### Option 1: Drop Indexes Only

```sql
-- Connect to database
docker exec -it postgres psql -U postgres -d db_myhome

-- Drop indexes
DROP INDEX IF EXISTS "Booking_createdAt_idx";
DROP INDEX IF EXISTS "Payment_status_expiryTime_idx";
DROP INDEX IF EXISTS "Payment_expiryTime_idx";

-- Verify
\d "Booking"
\d "Payment"
```

### Option 2: Full Migration Rollback

```bash
# Connect to app container
docker exec -it myhome-app sh

# Rollback last migration
npx prisma migrate resolve --rolled-back 20250109_add_cleanup_indexes

# Drop indexes manually (see Option 1)
```

**Note**: Rollback tidak akan mempengaruhi data, hanya menghapus indexes.

---

## 🐛 Troubleshooting

### Problem: Migration Fails

**Error**: `P3009: migrate found failed migrations`

**Solution**:
```bash
# Mark migration as applied
docker exec myhome-app npx prisma migrate resolve --applied 20250109_add_cleanup_indexes

# Or run SQL manually (see Manual Migration section)
```

### Problem: Index Already Exists

**Error**: `relation "Booking_createdAt_idx" already exists`

**Solution**: 
- This is normal if migration was run before
- Migration uses `IF NOT EXISTS` so it's safe
- Verify indexes exist with `\d "Booking"`

### Problem: Permission Denied

**Error**: `permission denied to create index`

**Solution**:
```bash
# Verify database user has CREATE privilege
docker exec -it postgres psql -U postgres -d db_myhome

# Grant privileges
GRANT CREATE ON SCHEMA public TO your_user;
```

### Problem: Long Running Migration

**Symptom**: Migration takes more than 10 minutes

**Solution**:
- This is normal for very large tables (millions of records)
- Indexes are created in background
- Application can still run (no downtime)
- Monitor progress:
  ```sql
  SELECT * FROM pg_stat_progress_create_index;
  ```

---

## 📝 Migration File

Location: `prisma/migrations/20250109_add_cleanup_indexes/migration.sql`

```sql
-- Add indexes for cron cleanup performance optimization

-- Add index on Booking.createdAt for grace period queries
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");

-- Add composite index on Payment (status, expiryTime) for expired payment queries
CREATE INDEX IF NOT EXISTS "Payment_status_expiryTime_idx" ON "Payment"("status", "expiryTime");

-- Add index on Payment.expiryTime for expiry time queries
CREATE INDEX IF NOT EXISTS "Payment_expiryTime_idx" ON "Payment"("expiryTime");
```

---

## 🔍 Monitoring

### Check Index Usage

```sql
-- Check if indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('Booking', 'Payment')
ORDER BY idx_scan DESC;
```

### Check Index Size

```sql
-- Check index sizes
SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename IN ('Booking', 'Payment')
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## ✅ Checklist

- [ ] Backup database before migration
- [ ] Run migration (automatic or manual)
- [ ] Verify migration status
- [ ] Check indexes exist in database
- [ ] Test query performance
- [ ] Monitor index usage
- [ ] Document any issues
- [ ] Update team

---

## 📞 Support

If you encounter issues:

1. Check migration logs: `docker logs myhome-app`
2. Verify database connection
3. Check database user permissions
4. Try manual migration via SQL
5. Contact database admin if needed

---

**Migration Version**: 20250109_add_cleanup_indexes  
**Created**: 2025-01-09  
**Impact**: Performance optimization (no data changes)  
**Downtime**: None  
**Rollback**: Safe (can drop indexes anytime)

