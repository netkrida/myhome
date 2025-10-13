# 🚀 Vercel Environment Variables Setup

## Required Environment Variables untuk Deploy ke Vercel

Buka **Vercel Dashboard** → **Project Settings** → **Environment Variables**

---

## 🔐 **Core Required Variables:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:port/db?sslmode=require` | **REQUIRED** - PostgreSQL connection URL |
| `AUTH_SECRET` | Generate dengan: `openssl rand -base64 32` | **REQUIRED** - NextAuth secret untuk production |

---

## 🧹 **Cron Variables (Optional tapi Recommended):**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `CRON_SECRET` | Generate dengan: `openssl rand -base64 32` | Secret untuk autentikasi cron endpoint |
| `BOOKING_UNPAID_GRACE_MINUTES` | `30` | Grace period sebelum booking dihapus (menit) |

---

## 💳 **Midtrans Payment (Optional):**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `MIDTRANS_SERVER_KEY` | `SB-Mid-server-xxx` | Midtrans Server Key |
| `MIDTRANS_CLIENT_KEY` | `SB-Mid-client-xxx` | Midtrans Client Key |
| `MIDTRANS_IS_PRODUCTION` | `false` | `true` untuk production, `false` untuk sandbox |

---

## 🖼️ **Cloudinary Upload (Optional):**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `123456789012345` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `your-api-secret` | Cloudinary API secret |

---

## ⚙️ **Optional Variables:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXTAUTH_URL` | `https://yourdomain.vercel.app` | Base URL (auto-detected di Vercel) |
| `NODE_ENV` | `production` | Auto-set oleh Vercel |
| `SKIP_ENV_VALIDATION` | `false` | Skip env validation (not recommended) |

---

## 📋 **Quick Setup Checklist:**

### 1. Generate Secrets

**Windows PowerShell:**
```powershell
# AUTH_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# CRON_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
# AUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32
```

### 2. Get Database URL

Jika pakai **Vercel Postgres**:
- Go to: Storage → Create Database → Postgres
- Copy connection string dari `.env.local` tab

Jika pakai **external DB** (Supabase, Railway, dll):
- Copy connection string dari provider Anda
- Pastikan format: `postgresql://user:pass@host:port/dbname?sslmode=require`

### 3. Add Variables ke Vercel

**Via Dashboard:**
1. Go to: Project → Settings → Environment Variables
2. Click "Add New"
3. Paste variable name & value
4. Select environment: **Production**, **Preview**, **Development**
5. Click "Save"

**Via Vercel CLI:**
```bash
# Set one by one
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add CRON_SECRET production

# Or pull from local .env.local
vercel env pull .env.vercel
```

### 4. Redeploy

Setelah env variables di-set:

```bash
# Trigger redeploy
vercel --prod

# Or via git
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push origin main
```

---

## 🆘 **Troubleshooting:**

### Error: "AUTH_SECRET is required in production"

**Solution:**
```bash
# Generate secret
openssl rand -base64 32

# Add to Vercel Dashboard
# Variable: AUTH_SECRET
# Value: (paste generated secret)
# Environment: Production
```

### Error: "DATABASE_URL must be a valid database URL"

**Solution:**
```bash
# Check format
postgresql://username:password@host:port/database?sslmode=require

# For Vercel Postgres:
# Use connection string from Storage tab (starts with postgres://...)

# For external DB:
# Make sure host is accessible from Vercel
# Enable SSL mode if required
```

### Error: "Build failed - Prisma client not generated"

**Solution:**
```bash
# Vercel automatically runs `prisma generate` via postinstall
# Make sure package.json has:
"postinstall": "prisma generate"

# If still fails, check DATABASE_URL is set correctly
```

### Deployment succeeds but app crashes

**Check logs:**
```bash
vercel logs --follow

# Common issues:
# 1. DATABASE_URL not accessible (firewall/whitelist)
# 2. AUTH_SECRET not set
# 3. Prisma migrations not applied
```

---

## 🔗 **Database Setup for Vercel:**

### Option 1: Vercel Postgres (Recommended)

```bash
# Via CLI
vercel postgres create

# Via Dashboard
# Go to: Storage → Create Database → Postgres
# Copy connection string
```

### Option 2: External Database (Supabase, Railway, Neon, etc.)

**Supabase:**
1. Create project → Settings → Database
2. Copy "Connection string" (Transaction mode)
3. Replace `[YOUR-PASSWORD]` with actual password
4. Add `?sslmode=require` at the end

**Railway:**
1. Create project → Add PostgreSQL
2. Copy `DATABASE_URL` from Variables tab
3. Ensure public networking is enabled

**Neon:**
1. Create project → Connection Details
2. Copy Pooled connection string
3. Add to Vercel env variables

---

## 🎉 **Verification:**

After setting env variables and redeploying:

### 1. Check Build Logs
```bash
vercel logs --since 10m | grep -i "build"
```

### 2. Test Health Endpoint
```bash
curl https://yourdomain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "environment": "production",
  "database": "connected"
}
```

### 3. Verify Cron Job
- Dashboard → Settings → Cron Jobs
- Should show: `/api/cron/cleanup-expired` (Every 5 minutes)

---

## 📚 **References:**

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**✅ Setup complete!** Your app should deploy successfully on Vercel.
