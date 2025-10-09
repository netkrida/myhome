# ✅ MyHome Deployment Checklist - Dockploy

## 📋 Pre-Deployment Checklist

### 1. Repository & Code
- [ ] All changes committed and pushed to `main` branch
- [ ] No uncommitted changes in working directory
- [ ] `.env.production` exists (but NOT committed to git)
- [ ] All tests passing locally

### 2. Environment Variables
Pastikan semua environment variables berikut sudah dikonfigurasi di Dockploy:

#### Database
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `DIRECT_URL` - Direct PostgreSQL connection (same as DATABASE_URL)

#### Authentication
- [ ] `AUTH_SECRET` - NextAuth secret (min 32 characters)
- [ ] `NEXTAUTH_URL` - Production URL (https://myhome.co.id)
- [ ] `APP_BASE_URL` - Same as NEXTAUTH_URL
- [ ] `NEXT_PUBLIC_APP_URL` - Same as NEXTAUTH_URL

#### Cloudinary
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

#### Midtrans
- [ ] `MIDTRANS_SERVER_KEY`
- [ ] `MIDTRANS_CLIENT_KEY`
- [ ] `MIDTRANS_IS_PRODUCTION`
- [ ] `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- [ ] `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`

#### Cron & App Config
- [ ] `CRON_SECRET`
- [ ] `BOOKING_UNPAID_GRACE_MINUTES`
- [ ] `NODE_ENV=production`
- [ ] `HOST=0.0.0.0`
- [ ] `PORT=3000`
- [ ] `NEXT_PUBLIC_APP_NAME=MyHome`
- [ ] `NEXT_TELEMETRY_DISABLED=1`

### 3. Files Verification
- [ ] `Dockerfile` exists and up-to-date
- [ ] `package.json` has `start:docker` or `start` script
- [ ] `prisma/schema.prisma` exists
- [ ] `prisma/seed.ts` exists
- [ ] `prisma/migrations/` folder exists with migration files
- [ ] `next.config.js` has `output: 'standalone'`

### 4. Database
- [ ] PostgreSQL service running in Dockploy
- [ ] Database name: `db_myhome`
- [ ] Database accessible from app container
- [ ] Network connectivity verified

## 🚀 Deployment Steps

### Step 1: Test Build Locally (Optional but Recommended)
```bash
# Run test build script
bash scripts/test-dockploy-build.sh

# Or manual test
docker build -t myhome-test .
docker run -p 3001:3000 --env-file .env.production myhome-test
```

**Expected Output:**
- ✅ Build completes without errors
- ✅ Container starts successfully
- ✅ Logs show all 4 steps: generate → migrate → seed → start

### Step 2: Configure Dockploy Application

1. **Create Application**
   - [ ] Login to Dockploy dashboard
   - [ ] Create new application or select existing
   - [ ] Name: `myhome-app`

2. **Repository Settings**
   - [ ] Repository URL: `https://github.com/netkrida/boxbook.git`
   - [ ] Branch: `main`
   - [ ] Build Method: `Dockerfile`
   - [ ] Dockerfile Path: `./Dockerfile`

3. **Build Configuration**
   - [ ] Build Context: `.`
   - [ ] Auto Deploy: `Enabled` (optional)

4. **Runtime Configuration**
   - [ ] Port Mapping: `3000:3000`
   - [ ] Restart Policy: `unless-stopped`
   - [ ] Network: Same network as PostgreSQL

5. **Environment Variables**
   - [ ] Add all environment variables from checklist above
   - [ ] Verify DATABASE_URL hostname matches PostgreSQL service name

### Step 3: Deploy

1. **Trigger Deployment**
   - [ ] Click "Deploy" button in Dockploy
   - [ ] Or push to `main` branch (if auto-deploy enabled)

2. **Monitor Build**
   - [ ] Watch build logs in Dockploy
   - [ ] Verify all build stages complete:
     - Stage 1 (deps): Install dependencies + prisma generate
     - Stage 2 (builder): Build Next.js app
     - Stage 3 (runner): Copy artifacts + setup entrypoint

3. **Monitor Container Startup**
   - [ ] Container status changes to `RUNNING`
   - [ ] Check logs for startup sequence

## ✅ Post-Deployment Verification

### 1. Check Container Logs

Expected log output:
```
============================================
🚀 Booting MyHome Container
============================================
📝 Environment: NODE_ENV=production
📝 Port: 3000

✅ DATABASE_URL is configured
✅ PostgreSQL is ready!

============================================
📦 Step 1: Generating Prisma Client...
============================================
✅ Prisma Client generated successfully!

============================================
📦 Step 2: Syncing Database Schema...
============================================
📂 Migrations found. Running prisma migrate deploy...
✅ Migrations applied successfully!

============================================
🌱 Step 3: Seeding Database...
============================================
🌱 Running seed via npm run db:seed...
✅ Seed completed successfully!

============================================
🚀 Step 4: Starting Application...
============================================
🎯 Starting with: npm run start:docker
▲ Next.js 15.2.3
✓ Ready in 2.3s
```

**Verification:**
- [ ] All 4 steps completed successfully
- [ ] No error messages in logs
- [ ] Application shows "Ready" message

### 2. Test Endpoints

```bash
# Test homepage
curl https://myhome.co.id

# Test API (if available)
curl https://myhome.co.id/api/health

# Test property listing
curl https://myhome.co.id/api/properties
```

**Verification:**
- [ ] Homepage loads successfully (HTTP 200)
- [ ] API endpoints respond correctly
- [ ] No 500 errors

### 3. Database Verification

```bash
# Connect to PostgreSQL
docker exec -it <postgres-container> psql -U postgres -d db_myhome

# Check tables
\dt

# Check seed data
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Property";
SELECT COUNT(*) FROM "Room";
```

**Verification:**
- [ ] All tables exist
- [ ] Seed data present
- [ ] No migration errors

### 4. Functional Testing

- [ ] Login functionality works
- [ ] Property listing displays correctly
- [ ] Room booking flow works
- [ ] Payment integration functional
- [ ] Image uploads work (Cloudinary)
- [ ] Role-based access control works

### 5. Performance Check

- [ ] Page load time < 3 seconds
- [ ] No memory leaks (check container stats)
- [ ] CPU usage normal
- [ ] Database queries optimized

## 🐛 Troubleshooting

### Container Won't Start

**Check:**
1. [ ] DATABASE_URL is set correctly
2. [ ] PostgreSQL container is running
3. [ ] Network connectivity between containers
4. [ ] Environment variables are complete

**Fix:**
```bash
# View logs
docker logs <container-name>

# Check environment
docker exec -it <container-name> env | grep DATABASE_URL

# Restart container
docker restart <container-name>
```

### Prisma Errors

**Check:**
1. [ ] Prisma schema is valid: `npx prisma validate`
2. [ ] Migrations are up-to-date
3. [ ] Database is accessible

**Fix:**
```bash
# Regenerate Prisma Client
docker exec -it <container-name> npx prisma generate

# Re-run migrations
docker exec -it <container-name> npx prisma migrate deploy

# Check database connection
docker exec -it <container-name> npx prisma db execute --stdin <<< "SELECT 1"
```

### Seed Errors

**Note:** Seed errors are non-fatal (script uses `|| true`)

**Check:**
1. [ ] Seed script is idempotent
2. [ ] No unique constraint violations
3. [ ] Data already exists (this is OK)

**Fix:**
```bash
# Re-run seed manually
docker exec -it <container-name> npm run db:seed
```

### Application Errors

**Check:**
1. [ ] All environment variables set
2. [ ] No build errors
3. [ ] Dependencies installed correctly

**Fix:**
```bash
# Rebuild image
docker build --no-cache -t myhome-app .

# Check Next.js build
docker exec -it <container-name> ls -la .next/
```

## 🔄 Rollback Procedure

If deployment fails:

1. **Via Dockploy UI:**
   - [ ] Go to Deployments tab
   - [ ] Select previous successful deployment
   - [ ] Click "Rollback"

2. **Via Docker:**
   ```bash
   # Tag previous image
   docker tag myhome-app:previous myhome-app:latest
   
   # Restart container
   docker restart myhome-app
   ```

## 📊 Success Criteria

Deployment is successful when:

- ✅ Container status: `RUNNING`
- ✅ All 4 startup steps completed
- ✅ Application accessible at https://myhome.co.id
- ✅ Database connected and seeded
- ✅ No errors in logs after 5 minutes
- ✅ All functional tests passing

## 📝 Notes

- First deployment may take 5-10 minutes
- Subsequent deployments are faster (cached layers)
- Seed script is idempotent (safe to run multiple times)
- Container runs as non-root user (`node`)
- Logs are available in Dockploy dashboard

## 📚 Additional Resources

- [Deployment Guide](docs/DOCKPLOY_DEPLOYMENT_GUIDE.md)
- [Docker Troubleshooting](docs/DOCKER_TROUBLESHOOTING.md)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment)

---

**Last Updated:** 2025-01-09  
**Version:** 1.0.0

