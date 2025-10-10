# 🚀 Deployment Modes - Complete Guide

## 📋 Overview

Ada **3 mode deployment** yang bisa digunakan untuk kontrol startup behavior container Docker.

---

## 🔄 Mode 1: DATABASE RESET (Fresh Install)

**Gunakan saat**: First deployment, testing, atau ingin reset database sepenuhnya.

### ⚠️ WARNING
**Mode ini akan menghapus SEMUA data yang ada!**

### Environment Variables

```bash
DB_RESET_MODE=reset
```

### Apa yang Terjadi

```bash
prisma migrate reset --force
```

**Proses otomatis**:
1. ✅ Drop database (hapus semua data)
2. ✅ Create database baru
3. ✅ Apply SEMUA migrations dari `prisma/migrations`
4. ✅ Generate Prisma Client (otomatis)
5. ✅ Run seed script (otomatis dari `package.json`)

### Startup Log

```bash
============================================
🔄 DATABASE RESET MODE (DESTRUCTIVE)
============================================
⚠️  WARNING: This will DROP all data and reset the database!
🔄 Running prisma migrate reset --force...

This will:
  1. Drop database
  2. Create fresh database
  3. Apply all migrations
  4. Generate Prisma Client (automatic)
  5. Run seed script (automatic)

✅ Database reset, migrations applied, and seeded successfully!
```

### Setup di Dokploy

```
DB_RESET_MODE=reset
```

**Kemudian setelah deploy berhasil**, **HAPUS** atau ubah ke mode lain untuk mencegah reset di restart berikutnya.

---

## 🚀 Mode 2: NORMAL UPDATE (Code Only)

**Gunakan saat**: Update code tanpa perubahan database schema.

### Environment Variables

```bash
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
DB_RESET_MODE=migrate  # atau biarkan default
```

### Apa yang Terjadi

- ⏭️ Skip Prisma Client generation
- ⏭️ Skip database migrations
- ⏭️ Skip seeding
- ✅ Langsung start aplikasi

### Startup Log

```bash
============================================
🚀 Booting MyHome Container
============================================
📝 DB Reset Mode: migrate
📝 Skip Prisma Generate: true
📝 Skip DB Migration: true
📝 Skip DB Seed: true

⏭️  Skipping Prisma Client generation (SKIP_PRISMA_GENERATE=true)
⏭️  Skipping database migration (SKIP_DB_MIGRATION=true)
⏭️  Skipping database seeding (SKIP_DB_SEED=true)

============================================
🚀 Step 4: Starting Application...
============================================
✓ Ready in ~2-5 seconds
```

### Keuntungan

- ⚡ **Startup super cepat** (~2-5 detik)
- 🛡️ **Data tetap aman** (tidak ada operasi database)
- 🔄 **Zero downtime** untuk code updates

### Setup di Dokploy (Recommended Default)

```
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

---

## 📦 Mode 3: SCHEMA UPDATE

**Gunakan saat**: Ada perubahan Prisma schema atau migrations baru.

### Environment Variables

```bash
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=true  # Skip seed karena data sudah ada
DB_RESET_MODE=migrate  # atau biarkan default
```

### Apa yang Terjadi

1. ✅ Generate Prisma Client baru
2. ✅ Apply pending migrations
3. ⏭️ Skip seed (data sudah ada)
4. ✅ Start aplikasi

### Startup Log

```bash
============================================
📦 Step 1: Generating Prisma Client...
============================================
✅ Prisma Client generated successfully!

============================================
📦 Step 2: Syncing Database Schema...
============================================
📂 Migrations found. Running prisma migrate deploy...
✅ Migrations applied successfully!

⏭️  Skipping database seeding (SKIP_DB_SEED=true)

============================================
🚀 Step 4: Starting Application...
============================================
✓ Ready in ~15-20 seconds
```

### Workflow

#### 1. Buat Migration Lokal

```bash
# Development
npx prisma migrate dev --name add_new_field

# Ini akan:
# - Update database lokal
# - Generate migration file di prisma/migrations
# - Update Prisma Client
```

#### 2. Commit & Push

```bash
git add prisma/
git commit -m "feat: add new field to User model"
git push origin main
```

#### 3. Update Dokploy Environment (Sementara)

```
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=true
```

#### 4. Deploy & Verify

Dokploy akan auto-deploy dan apply migrations.

#### 5. Kembalikan ke Mode Normal

**Setelah deploy sukses**, kembalikan env ke mode normal update:

```
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

---

## 📊 Comparison Matrix

| Mode | Generate | Migration | Seed | Data Loss | Startup Time | Use Case |
|------|----------|-----------|------|-----------|--------------|----------|
| **Reset** | ✅ Auto | ✅ All | ✅ Auto | ⚠️ YES | ~30-40s | Fresh install, testing |
| **Normal Update** | ⏭️ Skip | ⏭️ Skip | ⏭️ Skip | ❌ No | ~2-5s | Code updates (99% of time) |
| **Schema Update** | ✅ Yes | ✅ Pending | ⏭️ Skip | ❌ No | ~15-20s | Schema changes |

---

## 🎯 Recommended Workflow

### Default State (Set di Dokploy)

```bash
# 99% of deployments
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

### When You Need Schema Changes

```bash
# 1. Temporarily toggle flags
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=true

# 2. Push schema changes
git push

# 3. Wait for deployment success

# 4. Revert flags back to default
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

### When You Need Fresh Database (DANGEROUS!)

```bash
# 1. Set reset mode
DB_RESET_MODE=reset

# 2. Trigger deploy (manual or git push)

# 3. IMMEDIATELY remove or change after success
DB_RESET_MODE=migrate  # or remove this variable
```

---

## ⚠️ Important Notes

### `prisma migrate reset` is ALL-IN-ONE

```bash
prisma migrate reset --force
```

**Automatically does**:
- ✅ Drop + Create database
- ✅ Apply all migrations
- ✅ Generate Prisma Client
- ✅ Run seed script

**You don't need to run** `generate`, `migrate`, or `seed` separately!

### Seed Script Location

Pastikan `package.json` memiliki:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

`prisma migrate reset` akan otomatis menjalankan script ini.

---

## 🔍 Troubleshooting

### Reset tidak jalan seed

**Problem**: Seed tidak dijalankan setelah reset

**Solution**: Check `package.json` punya config `prisma.seed`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### Migration fail karena data conflict

**Problem**: Migration gagal karena constraint violation

**Solution**: Gunakan **Mode 1 (Reset)** untuk fresh start, atau fix migration script.

### Startup tetap lambat di Mode 2

**Problem**: Startup masih 30+ detik padahal sudah `SKIP_*=true`

**Solution**: 
1. Check logs - apakah benar-benar skip?
2. Pastikan Dockerfile sudah yang terbaru
3. Rebuild image: `docker build --no-cache`

---

## 📚 References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migrate Reset](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-reset)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)
