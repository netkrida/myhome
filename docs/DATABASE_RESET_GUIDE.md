# 🔄 Database Reset Guide

## Overview

This guide explains the different database initialization modes available in the Docker deployment and when to use each.

## 🎯 Environment Variables

### `DB_RESET_MODE`

Controls how the database is initialized on container startup.

| Mode | Behavior | Use Case |
|------|----------|----------|
| `migrate` | Safe migration (default) | Normal updates, production deployments |
| `reset` | **DESTRUCTIVE** - Drops all data | Fresh install, development reset |

### `SKIP_DB_MIGRATION`

When set to `true`, skips all database schema operations.

### `SKIP_DB_SEED`

When set to `true`, skips seeding data after migration/reset.

## 📋 Common Scenarios

### 1️⃣ **Fresh Install (First Time Setup)**

```bash
# In Dokploy Panel or .env:
DB_RESET_MODE=reset
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false  # Ignored when DB_RESET_MODE=reset
SKIP_DB_SEED=false
```

**What happens:**
1. ✅ Generate Prisma Client
2. ⚠️ **DROP ALL DATA** from database
3. ✅ Create fresh database
4. ✅ Apply all migrations
5. ✅ Seed initial data (users, properties, rooms)

**Log output:**
```
🔄 Step 2: Database Reset Mode (DESTRUCTIVE)
⚠️  WARNING: This will DROP all data and reset the database!
🔄 Running prisma migrate reset --force --skip-seed...
✅ Database reset completed!

🌱 Step 3: Seeding Database...
✅ Seed completed successfully!
```

---

### 2️⃣ **Code Updates (No DB Changes)**

```bash
# In Dokploy Panel:
DB_RESET_MODE=migrate     # Default
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

**What happens:**
1. ⏭️ Skip Prisma Client generation (already exists)
2. ⏭️ Skip database migration (no schema changes)
3. ⏭️ Skip seeding (data already exists)
4. ✅ Start application immediately (~5 seconds)

**Log output:**
```
⏭️ Skipping Prisma Client generation (SKIP_PRISMA_GENERATE=true)
⏭️ Skipping database migration (SKIP_DB_MIGRATION=true)
⏭️ Skipping database seeding (SKIP_DB_SEED=true)

🚀 Step 4: Starting Application...
✓ Ready in 2-3 seconds
```

---

### 3️⃣ **Schema Updates (New Migrations)**

```bash
# In Dokploy Panel:
DB_RESET_MODE=migrate
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=true         # Don't re-seed existing data
```

**What happens:**
1. ✅ Generate Prisma Client with new schema
2. ✅ Apply new migrations (preserves existing data)
3. ⏭️ Skip seeding (data already exists)
4. ✅ Start application

**Log output:**
```
📦 Step 2: Syncing Database Schema...
📂 Migrations found. Running prisma migrate deploy...
✅ Migrations applied successfully!

⏭️ Skipping database seeding (SKIP_DB_SEED=true)
```

---

### 4️⃣ **Complete Reset (Development/Staging)**

```bash
# In Dokploy Panel (⚠️ USE WITH CAUTION):
DB_RESET_MODE=reset
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false   # Ignored
SKIP_DB_SEED=false
```

**What happens:**
1. ✅ Generate Prisma Client
2. ⚠️ **DROP DATABASE** (all data lost)
3. ✅ Re-create database
4. ✅ Apply all migrations from scratch
5. ✅ Seed fresh data

**⚠️ WARNING**: This will permanently delete all data!

---

## 🔍 How It Works

### Dockerfile Logic Flow

```bash
# Step 1: Prisma Client
if [ "$SKIP_PRISMA_GENERATE" != "true" ]; then
  npx prisma generate
fi

# Step 2: Database Schema
if [ "$DB_RESET_MODE" = "reset" ]; then
  # DESTRUCTIVE: Drop and recreate
  npx prisma migrate reset --force --skip-seed
elif [ "$SKIP_DB_MIGRATION" != "true" ]; then
  # SAFE: Apply pending migrations
  npx prisma migrate deploy
fi

# Step 3: Seed Data
if [ "$SKIP_DB_SEED" != "true" ]; then
  npm run db:seed
fi

# Step 4: Start App
npm run start:docker
```

### `prisma migrate reset` Behavior

When you run `npx prisma migrate reset --force --skip-seed`:

1. **Drops the database** (all tables, data, indexes)
2. **Creates a new database**
3. **Applies all migrations** in `prisma/migrations/` folder
4. **Skips automatic seed** (we control seeding separately)

This is different from `prisma migrate deploy` which:
- Only applies **pending** migrations
- **Preserves existing data**
- Safer for production

---

## 🎯 Best Practices

### Production Deployments

1. **Initial Setup** (one time):
   ```bash
   DB_RESET_MODE=reset
   SKIP_*=false
   ```

2. **All Subsequent Updates** (default):
   ```bash
   DB_RESET_MODE=migrate  # or skip entirely
   SKIP_PRISMA_GENERATE=true
   SKIP_DB_MIGRATION=true
   SKIP_DB_SEED=true
   ```

3. **Schema Changes Only**:
   ```bash
   DB_RESET_MODE=migrate
   SKIP_PRISMA_GENERATE=false
   SKIP_DB_MIGRATION=false
   SKIP_DB_SEED=true
   ```

### Development Workflow

```bash
# Local development with docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml down -v  # Remove volumes
docker-compose -f docker-compose.dev.yml up       # Fresh start with reset
```

### Staging/Testing

```bash
# Reset staging database for testing
# Set in Dokploy temporarily:
DB_RESET_MODE=reset

# After deploy completes, revert to:
DB_RESET_MODE=migrate
SKIP_*=true
```

---

## ⚠️ Safety Warnings

### `DB_RESET_MODE=reset` Will:

- ❌ **Delete ALL data** (bookings, payments, users, reviews)
- ❌ **Cannot be undone**
- ❌ **Production impact**: Downtime while resetting
- ✅ Only use for: Fresh installs, development, staging resets

### Before Using `reset` Mode:

1. ✅ **Backup your database** if data is important
2. ✅ Verify you're on the correct environment (not production!)
3. ✅ Inform team members about the reset
4. ✅ Have a rollback plan

### Backup Command (PostgreSQL):

```bash
# Before reset, backup production database:
pg_dump -h host -U user -d database > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed:
psql -h host -U user -d database < backup_20250110_120000.sql
```

---

## 📊 Decision Matrix

| Scenario | `DB_RESET_MODE` | `SKIP_PRISMA_GENERATE` | `SKIP_DB_MIGRATION` | `SKIP_DB_SEED` |
|----------|-----------------|------------------------|---------------------|----------------|
| 🆕 First deploy | `reset` | `false` | `false` | `false` |
| 🔄 Code update | `migrate` | `true` | `true` | `true` |
| 📦 Schema change | `migrate` | `false` | `false` | `true` |
| 🧪 Dev/Test reset | `reset` | `false` | `false` | `false` |
| 🚀 Production | `migrate` | `true` | `true` | `true` |

---

## 🔧 Troubleshooting

### Issue: "Foreign key constraint violated"

**Cause**: Seeding fails due to existing data relationships.

**Solution**:
```bash
# Use reset mode to clean slate:
DB_RESET_MODE=reset
```

### Issue: "Migration already applied"

**Cause**: Trying to apply migrations that are already in database.

**Solution**:
```bash
# Skip migrations on subsequent deploys:
SKIP_DB_MIGRATION=true
```

### Issue: Startup too slow

**Cause**: Regenerating Prisma Client and running migrations every time.

**Solution**:
```bash
# Skip all DB operations after initial setup:
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

---

## 📚 Related Documentation

- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [`DOCKER_SETUP_SUMMARY.md`](./DOCKER_SETUP_SUMMARY.md) - Docker configuration
- [`SEED_DATA_GUIDE.md`](../SEED_DATA_GUIDE.md) - Seed data details
- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

## ✅ Summary

- ✅ **Default mode** (`migrate`): Safe, preserves data, applies pending migrations
- ⚠️ **Reset mode** (`reset`): Destructive, drops all data, fresh start
- ✅ **Skip flags**: Speed up deployments by skipping unnecessary operations
- ✅ **Production**: Use skip flags after initial setup
- ⚠️ **Always backup** before using reset mode in production
