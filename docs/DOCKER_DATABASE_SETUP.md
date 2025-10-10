# Docker Database Setup - Quick Start

Panduan singkat untuk setup database di Docker dengan Prisma generate, reset, dan seed.

## 🎯 TL;DR

```bash
# 1. Edit .env.production
DB_INIT_MODE="reset"  # atau "init" atau "migrate"

# 2. Deploy
docker-compose up -d

# 3. Check logs
docker-compose logs -f app
```

---

## 📋 3 Mode Database Initialization

### 1. **migrate** (Production Default)
```env
DB_INIT_MODE="migrate"
```
- ✅ Hanya jalankan migrations
- ✅ Aman untuk production
- ✅ Data tidak hilang

### 2. **reset** (Development/Testing)
```env
DB_INIT_MODE="reset"
```
- ⚠️ **HAPUS SEMUA DATA**
- ✅ Reset database ke clean state
- ✅ Jalankan seed data baru

### 3. **init** (First Deployment)
```env
DB_INIT_MODE="init"
```
- ✅ Jalankan migrations
- ✅ Jalankan seed data
- ✅ Untuk deployment pertama kali

---

## 🚀 Quick Start Guide

### Scenario 1: Production Deployment (Normal)

```bash
# 1. Edit .env.production
DB_INIT_MODE="migrate"

# 2. Deploy
docker-compose up -d
```

**Output:**
```
📦 Running database migrate...
✅ Database migration completed
🚀 Starting application...
```

---

### Scenario 2: Reset Database dengan Seed Baru

```bash
# 1. Edit .env.production
DB_INIT_MODE="reset"

# 2. Stop dan hapus volumes
docker-compose down -v

# 3. Start ulang
docker-compose up -d

# 4. Check logs
docker-compose logs -f app
```

**Output:**
```
🔄 Running database reset...
📦 Generating Prisma Client...
🗑️  Resetting database...
🌱 Running database seed...
✅ Database reset completed!
🚀 Starting application...
```

---

### Scenario 3: First Deployment

```bash
# 1. Edit .env.production
DB_INIT_MODE="init"

# 2. Deploy
docker-compose up -d

# 3. Setelah berhasil, ubah ke migrate
# Edit .env.production:
DB_INIT_MODE="migrate"

# 4. Restart
docker-compose restart app
```

**Output:**
```
🚀 Running database init...
📦 Generating Prisma Client...
🔄 Running migrations...
🌱 Running seed...
✅ Database init completed!
🚀 Starting application...
```

---

## 📁 File Structure

```
myhome/
├── .env.production              # Main config (edit DB_INIT_MODE here)
├── .env.production.example      # Template dengan dokumentasi
├── docker-compose.yml           # Docker config dengan auto-init
├── package.json                 # NPM scripts
├── scripts/
│   ├── docker-db-reset.sh      # Reset database script
│   ├── docker-db-init.sh       # Init database script
│   └── README.md               # Scripts documentation
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
└── docs/
    ├── DOCKER_DATABASE_RESET.md      # Full documentation
    └── DOCKER_DB_QUICK_REFERENCE.md  # Quick reference
```

---

## 🔧 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `db:reset:docker` | `sh scripts/docker-db-reset.sh` | Reset DB di Docker |
| `db:init:docker` | `sh scripts/docker-db-init.sh` | Init DB di Docker |
| `db:seed` | `tsx prisma/seed.ts` | Run seed only |
| `prisma:generate` | `prisma generate` | Generate client |
| `prisma:migrate:deploy` | `prisma migrate deploy` | Deploy migrations |

---

## 🎯 Common Tasks

### Update Schema Baru

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_new_feature

# 3. Commit
git add .
git commit -m "feat: add new schema"
git push

# 4. Deploy (auto-migrate)
docker-compose down
docker-compose up -d
```

### Manual Seed

```bash
docker-compose exec app npm run db:seed
```

### Check Database

```bash
# Via psql
docker-compose exec postgres psql -U postgres -d db_myhome

# Via Prisma Studio
docker-compose exec app npx prisma studio
```

### View Logs

```bash
# All logs
docker-compose logs -f app

# Seed logs only
docker-compose logs app | grep seed

# Last 50 lines
docker-compose logs --tail=50 app
```

---

## 🔍 Troubleshooting

### Issue: Seed tidak jalan

```bash
# Manual seed
docker-compose exec app npm run db:seed

# Check logs
docker-compose logs app | grep seed
```

### Issue: Migration failed

```bash
# Reset dan retry
DB_INIT_MODE="reset"
docker-compose down -v
docker-compose up -d
```

### Issue: Permission denied

```bash
# Windows
icacls scripts\docker-db-reset.sh /grant Everyone:F
icacls scripts\docker-db-init.sh /grant Everyone:F

# Linux/Mac
chmod +x scripts/docker-db-reset.sh
chmod +x scripts/docker-db-init.sh
```

---

## 📚 Documentation

- **Full Guide**: [docs/DOCKER_DATABASE_RESET.md](docs/DOCKER_DATABASE_RESET.md)
- **Quick Reference**: [docs/DOCKER_DB_QUICK_REFERENCE.md](docs/DOCKER_DB_QUICK_REFERENCE.md)
- **Scripts README**: [scripts/README.md](scripts/README.md)

---

## ✅ Test Credentials

Setelah seed berhasil:

```
URL: https://myhome.co.id/login
Email: superadmin@myhome.co.id
Password: @superadmin@myhome.co5432
Role: SUPERADMIN
```

---

## 🎉 Summary

1. **Edit `.env.production`** - Set `DB_INIT_MODE`
2. **Deploy** - `docker-compose up -d`
3. **Check** - `docker-compose logs -f app`
4. **Test** - Login dengan credentials di atas

**Mode Options:**
- `migrate` - Production (default)
- `reset` - Testing (⚠️ deletes data)
- `init` - First deployment

**Need help?** Check [docs/DOCKER_DATABASE_RESET.md](docs/DOCKER_DATABASE_RESET.md)

