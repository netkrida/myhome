# 🎯 Vercel Cron Setup - Hobby Plan

## 📋 Overview

Vercel **Hobby plan** memiliki limitasi pada cron job scheduling:

| Feature | Hobby Plan | Pro Plan |
|---------|------------|----------|
| **Max Cron Jobs** | 20 per project | 20 per project |
| **Timing Accuracy** | ❌ Not guaranteed (±1 hour) | ✅ Guaranteed (±1 minute) |
| **Best Schedule** | Hourly or Daily | Any interval |
| **Cost** | Free | $20/month |

**Contoh:** Cron `0 1 * * *` (1 AM daily) akan trigger antara **1:00 AM - 1:59 AM** (tidak tepat waktu).

---

## ⚙️ Current Configuration

File `vercel.json` sudah dikonfigurasi untuk **Hobby plan**:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 * * * *"
    }
  ],
  "env": {
    "DEPLOYMENT_ENV": "vercel"
  }
}
```

**Schedule:** `0 * * * *` = **Every hour** (at minute 0)

---

## 🕐 Recommended Schedules for Hobby Plan

### ✅ **Recommended (Hourly/Daily):**

| Schedule | Cron Expression | Description |
|----------|-----------------|-------------|
| **Every hour** | `0 * * * *` | 🟢 **Current config** - Good untuk cleanup |
| Every 2 hours | `0 */2 * * *` | Alternative jika ingin lebih jarang |
| Every 6 hours | `0 */6 * * *` | Minimal cleanup (4x/day) |
| Daily at 2 AM | `0 2 * * *` | Sekali sehari (paling hemat) |
| Twice daily | `0 2,14 * * *` | Pagi & sore (2x/day) |

### ❌ **Not Recommended for Hobby:**

| Schedule | Cron Expression | Issue |
|----------|-----------------|-------|
| ❌ Every 5 minutes | `*/5 * * * *` | Timing not guaranteed, bisa delay 1 jam |
| ❌ Every 10 minutes | `*/10 * * * *` | Timing not guaranteed |
| ❌ Every 15 minutes | `*/15 * * * *` | Timing not guaranteed |
| ❌ Every 30 minutes | `*/30 * * * *` | Timing not guaranteed |

**Catatan:** Interval < 1 hour **tidak reliable** di Hobby plan!

---

## 🧹 Cleanup Logic Impact

### Current Config: `0 * * * *` (Every hour)

**Scenario:**
1. User booking pada **10:15 AM**
2. Payment expired setelah **15 menit** → **10:30 AM**
3. Grace period **30 menit** → cleanup eligible setelah **11:00 AM**
4. Cron jalan **11:00 AM - 11:59 AM** (tidak tepat, tapi OK)
5. Booking di-cleanup antara **11:00 AM - 11:59 AM**

**Max delay:** ~1 jam setelah eligible untuk cleanup (acceptable untuk use case ini)

### Alternative: Daily Cleanup

Jika Anda ingin lebih hemat resources:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Scenario:**
- Cron jalan **1x per hari** pada **2 AM - 2:59 AM**
- Cleanup semua expired bookings dari 24 jam sebelumnya
- Lebih hemat, tapi expired bookings bertahan lebih lama di database

---

## 🚀 Deployment

### 1. Current Setup (Hourly)

```bash
# Already configured in vercel.json
git add vercel.json
git commit -m "feat: configure cron for Hobby plan (hourly)"
git push origin main
```

### 2. Alternative: Daily Cleanup

```bash
# Edit vercel.json manually, change to:
# "schedule": "0 2 * * *"

git add vercel.json
git commit -m "feat: configure cron for Hobby plan (daily)"
git push origin main
```

---

## 🔍 Monitoring & Testing

### Manual Trigger (for testing)

Karena Hobby plan tidak guaranteed timing, Anda bisa test manual:

```bash
# Test cleanup endpoint
curl -X GET "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v
```

### Check Logs

```bash
# Via Vercel CLI
vercel logs --follow | grep "Cron Cleanup"

# Via Dashboard
# Go to: Logs tab → Filter by "Cron Cleanup"
```

### Verify Cron Schedule

1. Vercel Dashboard → Settings → Cron Jobs
2. Should show:
   - **Path:** `/api/cron/cleanup-expired`
   - **Schedule:** `0 * * * *` (Every hour)
   - **Status:** ✅ Active

---

## 🔄 Upgrade Path (Optional)

Jika Anda butuh **precise timing** (setiap 5-15 menit):

### Option 1: Upgrade to Pro Plan ($20/month)

**Benefits:**
- ✅ Guaranteed timing (±1 minute accuracy)
- ✅ Support `*/5 * * * *` (every 5 minutes)
- ✅ Priority support

**How to upgrade:**
```bash
# Via Dashboard
# Settings → Usage → Upgrade to Pro

# Via CLI
vercel upgrade pro
```

### Option 2: Use VPS Cron (Free)

Untuk precise timing tanpa biaya, gunakan VPS Docker cron:

```yaml
# docker-compose.yml (already configured in your repo)
services:
  cron:
    container_name: myhome-cron
    build:
      context: ./docker/cron
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      CRON_SECRET: ${CRON_SECRET}
      APP_URL: http://app:3000
      TZ: Asia/Jakarta
    depends_on:
      app:
        condition: service_healthy
    networks:
      - myhome
```

**VPS cron runs every 5 minutes** (precise timing, no cost)

---

## 📊 Comparison: Vercel Hobby vs VPS

| Feature | Vercel Hobby | VPS Docker |
|---------|--------------|------------|
| **Schedule** | Hourly (not precise) | Every 5 min (precise) |
| **Cost** | Free | ~$5/month (VPS) |
| **Timing** | ±1 hour delay | ±10 seconds |
| **Setup** | Easy (just `vercel.json`) | Medium (Docker config) |
| **Maintenance** | Zero | Low (manage VPS) |
| **Reliability** | Medium | High |

**Recommendation:**
- **Vercel Hobby (hourly)** → Good enough untuk cleanup bookings
- **VPS Docker (every 5 min)** → Jika butuh precise timing

---

## 🆘 Troubleshooting

### Cron not running at expected time

**Expected behavior di Hobby plan:**
- Schedule: `0 * * * *` (every hour at minute 0)
- Actual: Jalan antara **:00 - :59** (random dalam 1 jam window)

**Example:**
- Expected: 10:00 AM
- Actual: Bisa jalan di 10:00, 10:15, 10:37, atau 10:59

**Solution:** ✅ This is normal for Hobby plan. Upgrade to Pro untuk precise timing.

### Cron runs but no cleanup

**Check if there's expired data:**
```sql
-- Check expired payments
SELECT COUNT(*) 
FROM "Payment" 
WHERE status = 'PENDING' 
  AND "expiryTime" < NOW();

-- Check unpaid bookings
SELECT COUNT(*) 
FROM "Booking" 
WHERE status = 'UNPAID' 
  AND "createdAt" < NOW() - INTERVAL '30 minutes';
```

### 401 Unauthorized error

**Solution:**
```bash
# Check CRON_SECRET in Vercel Dashboard
# Settings → Environment Variables → CRON_SECRET

# Test with correct secret
curl -X GET "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CORRECT_SECRET"
```

---

## 📚 Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Pricing Plans](https://vercel.com/pricing)
- [Cron Expression Generator](https://crontab.guru/)
- [Project Docs - CRON_DEPLOYMENT_GUIDE.md](./CRON_DEPLOYMENT_GUIDE.md)

---

## ✅ Summary

**Current Setup:**
- ✅ Schedule: `0 * * * *` (every hour)
- ✅ Compatible with Hobby plan
- ✅ Good enough untuk cleanup expired bookings
- ✅ Zero cost

**Next Steps:**
1. Commit & push `vercel.json`
2. Set `CRON_SECRET` di Vercel env variables
3. Deploy
4. Verify cron job di Dashboard → Settings → Cron Jobs

**Max delay:** Cleanup bisa delay sampai ~1 jam setelah booking expired (acceptable untuk most use cases).

**Jika butuh precise timing:** Gunakan VPS Docker cron (already configured) atau upgrade to Pro plan.

---

**🎉 Setup complete untuk Hobby plan!**
