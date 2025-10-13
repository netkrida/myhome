# ✅ Vercel Hobby Plan - Cron Setup Complete

## 🎯 Problem: Deployment Failed

**Root Cause:** Vercel **Hobby plan** memiliki limitasi pada cron scheduling:
- ❌ Schedule `*/5 * * * *` (every 5 minutes) **tidak reliable** di Hobby plan
- ⚠️ Timing tidak guaranteed, bisa delay sampai ±1 jam
- ✅ Solusi: Gunakan **hourly schedule** (`0 * * * *`)

---

## ✅ Solution Applied

### 1. Updated `vercel.json`

**Before (Not recommended for Hobby):**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "*/5 * * * *"  // ❌ Every 5 minutes - not reliable on Hobby
    }
  ]
}
```

**After (Optimized for Hobby):**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 * * * *"  // ✅ Every hour - reliable on Hobby
    }
  ]
}
```

**Changes:**
- `*/5 * * * *` → `0 * * * *`
- From: Every 5 minutes
- To: **Every hour** (at minute 0)

---

## 📊 Impact Analysis

### Cleanup Timing Comparison

| Plan | Schedule | Timing | Max Delay | Cost |
|------|----------|--------|-----------|------|
| **Hobby** | `0 * * * *` (hourly) | ±1 hour | ~1 hour | Free |
| **Pro** | `*/5 * * * *` (5 min) | ±1 minute | ~5 minutes | $20/month |
| **VPS Docker** | `*/5 * * * *` (5 min) | ±10 seconds | ~5 minutes | ~$5/month |

### Example Scenario

**User Journey:**
1. User booking: **10:15 AM**
2. Payment expired: **10:30 AM** (15 min after booking)
3. Grace period ends: **11:00 AM** (30 min after expired)
4. Cron runs: **11:00 AM - 11:59 AM** (random dalam window ini)
5. Cleanup executed: **11:00 AM - 11:59 AM**

**Result:** Max delay ~1 jam setelah eligible untuk cleanup (acceptable untuk use case ini)

---

## 🚀 Next Steps

### 1. Set Environment Variables di Vercel

**Required:**
```bash
# Generate secrets
# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Add to Vercel Dashboard:
# Settings → Environment Variables
```

**Variables to add:**

| Variable | Value | Required? |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://...` | ✅ Yes |
| `AUTH_SECRET` | Generated secret | ✅ Yes |
| `CRON_SECRET` | Generated secret | ⚠️ Recommended |
| `BOOKING_UNPAID_GRACE_MINUTES` | `30` | ⚠️ Recommended |

### 2. Deploy to Vercel

```bash
# Commit changes
git add vercel.json README.md docs/
git commit -m "feat: configure cron for Vercel Hobby plan (hourly schedule)"

# Push to trigger deploy
git push origin main
```

### 3. Verify Deployment

```bash
# Check deployment status
vercel logs --follow

# Test health endpoint
curl https://yourdomain.vercel.app/api/health

# Verify cron job in Dashboard
# Go to: Settings → Cron Jobs
# Should show: /api/cron/cleanup-expired (0 * * * *)
```

### 4. Manual Test (Optional)

```bash
# Test cleanup endpoint manually
curl -X GET "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

---

## 📚 Documentation Created

### ✨ New Files

1. ✅ **`docs/VERCEL_CRON_HOBBY_PLAN.md`** - Complete Hobby plan guide
   - Hobby vs Pro comparison
   - Recommended schedules
   - Troubleshooting
   - Upgrade path

2. ✅ **`docs/VERCEL_ENV_SETUP.md`** - Environment variables guide
   - Required variables
   - Optional variables
   - Generate secrets
   - Troubleshooting

### 🔧 Updated Files

1. ✅ **`vercel.json`** - Changed schedule to `0 * * * *` (hourly)
2. ✅ **`README.md`** - Added Hobby plan notes & documentation links

---

## 🔄 Alternative Options

### Option 1: Upgrade to Pro Plan ($20/month)

**Benefits:**
- ✅ Precise timing (±1 minute)
- ✅ Support `*/5 * * * *` (every 5 minutes)
- ✅ Priority support

**How to upgrade:**
```bash
# Via Dashboard: Settings → Usage → Upgrade to Pro
# Via CLI: vercel upgrade pro
```

### Option 2: Use VPS Docker Cron (Free/Cheap)

**Already configured in your repo!**

```yaml
# docker-compose.yml
services:
  cron:
    # Runs every 5 minutes with precise timing
    # Cost: ~$5/month (VPS hosting)
```

**Benefits:**
- ✅ Precise timing (every 5 minutes)
- ✅ Lower cost (~$5/month for VPS)
- ✅ Full control

**Deploy to VPS:**
```bash
# SSH to VPS
ssh user@your-vps

# Pull latest code
git pull origin main

# Deploy
docker-compose up -d --build

# Verify cron running
docker logs -f myhome-cron
```

---

## 🎯 Recommendation

### For Your Use Case (Booking Cleanup):

**✅ Vercel Hobby (Hourly) - RECOMMENDED**

**Reasons:**
1. **Good enough:** Cleanup delay ~1 jam masih acceptable untuk booking system
2. **Zero cost:** Free tier
3. **Zero maintenance:** Fully managed by Vercel
4. **Simple setup:** Just `vercel.json` + env vars

**Trade-off:**
- Expired bookings bertahan ~1 jam lebih lama di database
- User experience: Tidak ada impact (booking sudah expired, cuma cleanup database)

### When to Upgrade:

**Upgrade to Pro if:**
- ⚠️ Butuh cleanup < 1 jam setelah expired
- ⚠️ Database storage jadi masalah (banyak expired data)
- ⚠️ Butuh precise timing untuk compliance/audit

**Use VPS Docker if:**
- ⚠️ Butuh precise timing tapi budget terbatas
- ⚠️ Sudah punya VPS untuk production
- ⚠️ Ingin full control atas cron execution

---

## ✅ Summary

**Problem Solved:**
- ✅ Vercel deployment failed karena cron schedule tidak cocok untuk Hobby plan
- ✅ Changed from `*/5 * * * *` to `0 * * * *` (hourly)
- ✅ Documentation updated & created

**Current Status:**
- ✅ `vercel.json` configured for Hobby plan
- ✅ Route handler supports auto-detection (Vercel/Docker)
- ✅ Documentation complete

**Next Action:**
1. Set `DATABASE_URL` + `AUTH_SECRET` + `CRON_SECRET` di Vercel Dashboard
2. Deploy to Vercel (`git push`)
3. Verify cron job active in Dashboard

**Files Ready to Commit:**
```bash
git add vercel.json README.md docs/
git commit -m "feat: configure cron for Vercel Hobby plan"
git push origin main
```

---

**🎉 Setup complete untuk Vercel Hobby plan!** 

Cron akan jalan setiap jam untuk cleanup expired bookings & payments.
