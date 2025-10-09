# Docker Database Reset & Seed Guide

Panduan lengkap untuk menjalankan Prisma generate, reset database, dan seed data di Docker.

## 📋 Table of Contents

- [Overview](#overview)
- [Environment Variables](#environment-variables)
- [Database Initialization Modes](#database-initialization-modes)
- [Usage Examples](#usage-examples)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Project ini mendukung 3 mode inisialisasi database di Docker:

1. **migrate** (default) - Hanya jalankan migrations (untuk production)
2. **reset** - Reset database dan jalankan seed (untuk development/testing)
3. **init** - Jalankan migrations + seed (untuk first deployment)

Semua konfigurasi diatur melalui file `.env.production`.

---

## 🔧 Environment Variables

### File: `.env.production`

Tambahkan variable berikut di file `.env.production`:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:myhome123@postgres:5432/db_myhome?schema=public"

# Database Initialization Mode
# Options: "migrate" | "reset" | "init"
DB_INIT_MODE="migrate"

# ... other environment variables
```

### DB_INIT_MODE Options

| Mode | Deskripsi | Use Case |
|------|-----------|----------|
| `migrate` | Hanya jalankan migrations | Production deployment (default) |
| `reset` | Reset DB + seed | Development/Testing |
| `init` | Migrate + seed | First deployment atau fresh install |

---

## 🚀 Database Initialization Modes

### 1. Mode: `migrate` (Production Default)

**Kapan digunakan:**
- Production deployment
- Update schema tanpa hapus data
- Deployment normal

**Yang dilakukan:**
```bash
npx prisma generate
npx prisma migrate deploy
```

**Cara menggunakan:**

Edit `.env.production`:
```env
DB_INIT_MODE="migrate"
```

Atau tidak perlu set (default):
```bash
docker-compose up -d
```

---

### 2. Mode: `reset` (Development/Testing)

**Kapan digunakan:**
- Development environment
- Testing dengan data fresh
- Reset database ke state awal

**Yang dilakukan:**
```bash
npx prisma generate
npx prisma migrate reset --force --skip-seed
npm run db:seed
```

**⚠️ WARNING:** Mode ini akan **MENGHAPUS SEMUA DATA** di database!

**Cara menggunakan:**

Edit `.env.production`:
```env
DB_INIT_MODE="reset"
```

Jalankan:
```bash
docker-compose down -v  # Hapus volumes
docker-compose up -d
```

---

### 3. Mode: `init` (First Deployment)

**Kapan digunakan:**
- First deployment ke server baru
- Fresh installation
- Setup database pertama kali

**Yang dilakukan:**
```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

**Cara menggunakan:**

Edit `.env.production`:
```env
DB_INIT_MODE="init"
```

Jalankan:
```bash
docker-compose up -d
```

---

## 💡 Usage Examples

### Example 1: Production Deployment (Normal)

```bash
# 1. Edit .env.production
DB_INIT_MODE="migrate"

# 2. Deploy
docker-compose up -d

# 3. Check logs
docker-compose logs -f app
```

**Expected output:**
```
📦 Running database migrate...
✅ Database migration completed
🚀 Starting application...
```

---

### Example 2: Reset Database dengan Data Seed Baru

```bash
# 1. Edit .env.production
DB_INIT_MODE="reset"

# 2. Stop dan hapus containers + volumes
docker-compose down -v

# 3. Start ulang (akan reset DB)
docker-compose up -d

# 4. Check logs
docker-compose logs -f app
```

**Expected output:**
```
🔄 Running database reset...
🔧 Docker Database Reset Script
================================
📦 Step 1: Generating Prisma Client...
🗑️  Step 2: Resetting database...
🌱 Step 3: Running database seed...
✅ Database reset and seed completed successfully!
🚀 Starting application...
```

---

### Example 3: First Deployment dengan Seed

```bash
# 1. Edit .env.production
DB_INIT_MODE="init"

# 2. Deploy
docker-compose up -d

# 3. Check logs
docker-compose logs -f app
```

**Expected output:**
```
🚀 Running database init...
🚀 Docker Database Initialization Script
========================================
📦 Step 1: Generating Prisma Client...
🔄 Step 2: Running database migrations...
🌱 Step 3: Running database seed...
✅ Database initialization completed successfully!
🚀 Starting application...
```

---

### Example 4: Update Schema Baru di Production

```bash
# 1. Update schema di prisma/schema.prisma
# 2. Buat migration baru
npx prisma migrate dev --name add_new_feature

# 3. Commit changes
git add .
git commit -m "feat: add new schema"
git push

# 4. Di server, pastikan mode migrate
# Edit .env.production:
DB_INIT_MODE="migrate"

# 5. Deploy
docker-compose down
docker-compose up -d

# 6. Verify
docker-compose logs -f app
```

---

## 📝 Scripts Reference

### NPM Scripts

| Script | Command | Deskripsi |
|--------|---------|-----------|
| `db:reset` | `prisma migrate reset --force --skip-seed && npm run db:seed` | Reset DB lokal |
| `db:reset:docker` | `sh scripts/docker-db-reset.sh` | Reset DB di Docker |
| `db:init:docker` | `sh scripts/docker-db-init.sh` | Init DB di Docker |
| `db:seed` | `tsx prisma/seed.ts` | Jalankan seed |
| `prisma:generate` | `prisma generate` | Generate Prisma Client |
| `prisma:migrate:deploy` | `prisma migrate deploy` | Deploy migrations |

### Shell Scripts

**File: `scripts/docker-db-reset.sh`**
```bash
#!/bin/sh
# Reset database dan seed
npx prisma generate
npx prisma migrate reset --force --skip-seed
npm run db:seed
```

**File: `scripts/docker-db-init.sh`**
```bash
#!/bin/sh
# Initialize database dengan migrations dan seed
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

---

## 🔍 Troubleshooting

### Issue 1: "DATABASE_URL is not set"

**Error:**
```
❌ ERROR: DATABASE_URL environment variable is not set
```

**Solution:**
Pastikan `.env.production` memiliki `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:myhome123@postgres:5432/db_myhome?schema=public"
```

---

### Issue 2: Seed tidak jalan

**Symptoms:**
- Database ter-reset tapi tidak ada data
- Superadmin tidak bisa login

**Solution:**
```bash
# 1. Check logs
docker-compose logs app | grep seed

# 2. Manual seed
docker-compose exec app npm run db:seed

# 3. Verify
docker-compose exec app npx prisma studio
```

---

### Issue 3: Migration conflict

**Error:**
```
Migration conflict detected
```

**Solution:**
```bash
# 1. Reset database
DB_INIT_MODE="reset"
docker-compose down -v
docker-compose up -d

# 2. Atau manual reset
docker-compose exec app npx prisma migrate reset --force
```

---

### Issue 4: Permission denied pada script

**Error:**
```
sh: scripts/docker-db-reset.sh: Permission denied
```

**Solution:**
```bash
# Berikan execute permission
chmod +x scripts/docker-db-reset.sh
chmod +x scripts/docker-db-init.sh

# Commit changes
git add scripts/*.sh
git commit -m "fix: add execute permission to scripts"
git push
```

---

## 🎯 Best Practices

### 1. Production Deployment

```env
# .env.production
DB_INIT_MODE="migrate"  # Selalu gunakan migrate di production
```

### 2. Development/Testing

```env
# .env.production (untuk testing)
DB_INIT_MODE="reset"  # Reset untuk testing
```

### 3. First Deployment

```env
# .env.production (first time)
DB_INIT_MODE="init"  # Init untuk deployment pertama

# Setelah berhasil, ubah ke:
DB_INIT_MODE="migrate"  # Untuk deployment selanjutnya
```

---

## 📊 Workflow Summary

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Startup Flow                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Read .env.production │
              │  Check DB_INIT_MODE   │
              └───────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ migrate │      │  reset  │      │  init   │
   └─────────┘      └─────────┘      └─────────┘
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │generate │      │generate │      │generate │
   │migrate  │      │reset DB │      │migrate  │
   │         │      │seed     │      │seed     │
   └─────────┘      └─────────┘      └─────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                  ┌───────────────┐
                  │  Start App    │
                  │  node server  │
                  └───────────────┘
```

---

## ✅ Verification

### Check Database Status

```bash
# 1. Check logs
docker-compose logs app | tail -50

# 2. Check database
docker-compose exec postgres psql -U postgres -d db_myhome -c "\dt"

# 3. Check seed data
docker-compose exec app npx prisma studio
```

### Test Login

```
URL: https://myhome.co.id/login
Email: superadmin@multikost.com
Password: @superadmin@myhome.co5432
```

---

## 📞 Support

Jika ada masalah:
1. Check logs: `docker-compose logs -f app`
2. Check database: `docker-compose exec postgres psql -U postgres`
3. Manual reset: `docker-compose exec app npm run db:reset:docker`
4. Restart: `docker-compose restart app`

