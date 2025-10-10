# 🚀 Deployment Modes Quick Reference

## 📋 TL;DR - Environment Variables Cheat Sheet

### 🆕 **Fresh Install (First Time)**
```bash
DB_RESET_MODE=reset
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=false
```
**Result**: ⚠️ Drops all data → Fresh DB → Seed data (~40 seconds)

---

### 🔄 **Code Update (Most Common)**
```bash
DB_RESET_MODE=migrate
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```
**Result**: ✅ No DB operations → Fast startup (~5 seconds)

---

### 📦 **Schema Update (New Migrations)**
```bash
DB_RESET_MODE=migrate
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=true
```
**Result**: ✅ Apply migrations → Keep data → Skip seed (~20 seconds)

---

### 🧪 **Development Reset**
```bash
DB_RESET_MODE=reset
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=false
```
**Result**: ⚠️ Complete reset → Fresh test data (~40 seconds)

---

## 🎯 Dokploy Panel Settings

### Default Production (After Initial Setup)
Set these in **Dokploy → Environment Variables**:

```
DB_RESET_MODE=migrate
SKIP_PRISMA_GENERATE=true
SKIP_DB_MIGRATION=true
SKIP_DB_SEED=true
```

### When You Need Schema Changes
Temporarily change to:

```
DB_RESET_MODE=migrate
SKIP_PRISMA_GENERATE=false
SKIP_DB_MIGRATION=false
SKIP_DB_SEED=true
```

Then **revert back** after deploy completes.

---

## 🔍 How to Tell Which Mode Is Active

Check Dokploy logs for these messages:

### Reset Mode (Destructive)
```
🔄 Step 2: Database Reset Mode (DESTRUCTIVE)
⚠️  WARNING: This will DROP all data and reset the database!
🔄 Running prisma migrate reset --force --skip-seed...
```

### Migrate Mode (Safe)
```
📦 Step 2: Syncing Database Schema...
📂 Migrations found. Running prisma migrate deploy...
✅ Migrations applied successfully!
```

### Skip Mode (Fastest)
```
⏭️ Skipping Prisma Client generation (SKIP_PRISMA_GENERATE=true)
⏭️ Skipping database migration (SKIP_DB_MIGRATION=true)
⏭️ Skipping database seeding (SKIP_DB_SEED=true)
```

---

## ⚡ Performance Impact

| Mode | Startup Time | Data Impact | Use When |
|------|--------------|-------------|----------|
| Skip All | ~5 seconds | None | Code updates |
| Migrate | ~20 seconds | Preserves data | Schema changes |
| Reset | ~40 seconds | ⚠️ Deletes all | Fresh install |

---

## 🆘 Emergency Recovery

### "I accidentally deleted all data!"

1. **Backup restore** (if you have one):
   ```bash
   psql -h host -U user -d database < backup.sql
   ```

2. **Re-seed data** (if no backup):
   ```bash
   DB_RESET_MODE=reset
   SKIP_DB_SEED=false
   ```

### "Migrations stuck / failing"

1. **Reset migrations** (⚠️ deletes data):
   ```bash
   DB_RESET_MODE=reset
   ```

2. **Or manually fix**:
   ```bash
   # In container or local:
   npx prisma migrate resolve --applied <migration_name>
   ```

---

## 📝 Git Workflow

### What to Commit
```bash
✅ git add src/env.js           # Schema definition
✅ git add .env.example         # Template
✅ git add Dockerfile           # Logic
✅ git add prisma/migrations/   # New migrations
✅ git push
```

### What NOT to Commit
```bash
❌ .env                         # Contains secrets
❌ Values in Dokploy Panel      # Set manually
```

---

## 🎓 Pro Tips

1. **Always backup production** before using `DB_RESET_MODE=reset`
2. **Test in staging first** when changing schema
3. **Keep skip flags true** by default in production
4. **Monitor deployment logs** to verify correct mode
5. **Document changes** in commit messages

---

## 📚 Full Documentation

- [`DATABASE_RESET_GUIDE.md`](./DATABASE_RESET_GUIDE.md) - Comprehensive guide
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [`DOCKER_SETUP_SUMMARY.md`](./DOCKER_SETUP_SUMMARY.md) - Docker details

---

## ✅ Checklist Before Deploy

- [ ] Decided which mode to use
- [ ] Set environment variables in Dokploy Panel
- [ ] Backed up production database (if using reset mode)
- [ ] Tested in staging/local first
- [ ] Ready to monitor deployment logs
- [ ] Know how to rollback if needed

---

**Quick Help**: For most updates, just use **Skip All** mode! 🚀
