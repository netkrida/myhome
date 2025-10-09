# Docker Database Quick Reference

Quick reference untuk database operations di Docker.

## 🚀 Quick Commands

### Reset Database dengan Seed Baru

```bash
# 1. Edit .env.production
DB_INIT_MODE="reset"

# 2. Restart dengan reset
docker-compose down -v
docker-compose up -d

# 3. Check logs
docker-compose logs -f app
```

### First Deployment dengan Seed

```bash
# 1. Edit .env.production
DB_INIT_MODE="init"

# 2. Deploy
docker-compose up -d

# 3. Setelah berhasil, ubah ke migrate
DB_INIT_MODE="migrate"
```

### Normal Production Deployment

```bash
# 1. Edit .env.production
DB_INIT_MODE="migrate"

# 2. Deploy
docker-compose up -d
```

---

## 📋 DB_INIT_MODE Cheat Sheet

| Mode | Command | Use Case | Data Loss? |
|------|---------|----------|------------|
| `migrate` | `prisma migrate deploy` | Production | ❌ No |
| `reset` | `prisma migrate reset + seed` | Testing | ✅ Yes |
| `init` | `migrate deploy + seed` | First deploy | ❌ No |

---

## 🔧 Manual Commands

### Generate Prisma Client

```bash
docker-compose exec app npx prisma generate
```

### Run Migrations

```bash
docker-compose exec app npx prisma migrate deploy
```

### Run Seed

```bash
docker-compose exec app npm run db:seed
```

### Reset Database

```bash
docker-compose exec app npm run db:reset:docker
```

### Open Prisma Studio

```bash
docker-compose exec app npx prisma studio
```

---

## 🗄️ Database Access

### Connect to PostgreSQL

```bash
# Via docker-compose
docker-compose exec postgres psql -U postgres -d db_myhome

# Direct connection
psql -h localhost -p 5432 -U postgres -d db_myhome
```

### Common SQL Commands

```sql
-- List all tables
\dt

-- Describe table
\d "User"

-- Count records
SELECT COUNT(*) FROM "User";

-- Check superadmin
SELECT * FROM "User" WHERE role = 'SUPERADMIN';

-- Exit
\q
```

---

## 📊 Monitoring

### Check Logs

```bash
# All logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Database logs only
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 app
```

### Check Container Status

```bash
# List containers
docker-compose ps

# Check health
docker-compose exec app curl http://localhost:3000/api/health
```

---

## 🔍 Troubleshooting

### Database Connection Failed

```bash
# 1. Check postgres is running
docker-compose ps postgres

# 2. Check DATABASE_URL
docker-compose exec app printenv DATABASE_URL

# 3. Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Seed Data Not Created

```bash
# 1. Check logs
docker-compose logs app | grep seed

# 2. Manual seed
docker-compose exec app npm run db:seed

# 3. Verify
docker-compose exec postgres psql -U postgres -d db_myhome -c "SELECT * FROM \"User\";"
```

### Migration Failed

```bash
# 1. Check migration status
docker-compose exec app npx prisma migrate status

# 2. Reset and retry
DB_INIT_MODE="reset"
docker-compose down -v
docker-compose up -d
```

---

## 🎯 Common Workflows

### Update Schema dan Deploy

```bash
# 1. Update prisma/schema.prisma
# 2. Create migration locally
npx prisma migrate dev --name add_new_feature

# 3. Commit and push
git add .
git commit -m "feat: add new schema"
git push

# 4. Deploy (migrations akan auto-run)
docker-compose down
docker-compose up -d
```

### Fresh Install

```bash
# 1. Clone repo
git clone <repo-url>
cd myhome

# 2. Copy env
cp .env.production.example .env.production

# 3. Edit .env.production
DB_INIT_MODE="init"
# ... fill other values

# 4. Deploy
docker-compose up -d

# 5. Change to migrate mode
DB_INIT_MODE="migrate"
docker-compose restart app
```

### Testing dengan Fresh Data

```bash
# 1. Set reset mode
DB_INIT_MODE="reset"

# 2. Reset
docker-compose down -v
docker-compose up -d

# 3. Test
# Login: superadmin@multikost.com
# Password: @superadmin@myhome.co5432

# 4. Back to normal
DB_INIT_MODE="migrate"
docker-compose restart app
```

---

## 📞 Quick Help

**Need to reset database?**
```bash
DB_INIT_MODE="reset" docker-compose down -v && docker-compose up -d
```

**Need to run seed only?**
```bash
docker-compose exec app npm run db:seed
```

**Need to check database?**
```bash
docker-compose exec postgres psql -U postgres -d db_myhome
```

**Need to see logs?**
```bash
docker-compose logs -f app
```

**Need to restart?**
```bash
docker-compose restart app
```

