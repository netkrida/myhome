# ⚡ Cron Setup - Quick Reference

**TL;DR:** Route handler sudah support **semua environment**, tinggal deploy saja!

---

## 🎯 Overview

| Environment | Cron Method | Status |
|-------------|-------------|--------|
| **Vercel** | Vercel Cron Jobs (`vercel.json`) | ✅ Ready |
| **VPS Docker** | Docker Cron Container (`docker-compose.yml`) | ✅ Ready |

**Satu endpoint untuk semua:** `/api/cron/cleanup-expired`

---

## 🚀 Vercel - 3 Langkah

### 1. Set Environment Variable
```env
CRON_SECRET=generate-dengan-openssl-rand-base64-32
BOOKING_UNPAID_GRACE_MINUTES=30
```

### 2. Deploy
```bash
git push origin main
```

### 3. Verify
- Dashboard → Settings → Cron Jobs
- Pastikan muncul: `/api/cron/cleanup-expired` (Every 5 minutes)

**Test:**
```bash
curl "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_SECRET"
```

---

## 🐳 VPS Docker - 3 Langkah

### 1. Update `.env.production`
```env
CRON_SECRET=your-secret-here
BOOKING_UNPAID_GRACE_MINUTES=30
TZ=Asia/Jakarta
```

### 2. Deploy
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### 3. Verify
```bash
# Check container
docker ps | grep myhome-cron

# Check logs
docker logs -f myhome-cron
```

**Test:**
```bash
docker exec -it myhome-app curl "http://localhost:3000/api/cron/cleanup-expired" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🔍 Cara Kerja

### Auto-Detection Logic

```typescript
// Route handler otomatis detect environment:
const isVercelCron = request.headers.get("x-vercel-cron") === "true";

if (!isVercelCron) {
  // Docker/Manual → Perlu Bearer token
  // Vercel Cron → Tidak perlu Bearer token
}
```

| Source | Auth Required? |
|--------|----------------|
| Vercel Cron (auto) | ❌ No (has `x-vercel-cron` header) |
| Docker Cron (auto) | ✅ Yes (Bearer token) |
| Manual Test | ✅ Yes (Bearer token) |

---

## 🧪 Testing

### Quick Test Command

**Vercel:**
```bash
curl "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**VPS (from outside):**
```bash
curl "https://yourdomain.com/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_SECRET"
```

**VPS (from inside):**
```bash
docker exec -it myhome-app curl "http://localhost:3000/api/cron/cleanup-expired" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "expiredPaymentsCount": 5,
    "deletedBookingsCount": 3,
    "affectedProperties": [
      { "propertyId": "abc123", "title": "Kos Melati", "deletedCount": 2 }
    ],
    "gracePeriodMinutes": 30,
    "timestamp": "2025-10-12T10:30:00.000Z"
  }
}
```

---

## 📊 Monitoring

### Vercel
```bash
vercel logs --follow | grep "Cron Cleanup"
```

### VPS
```bash
docker logs -f myhome-cron
docker logs -f myhome-app | grep "Cron Cleanup"
```

### Database Check
```sql
-- Check recent cleanup activity
SELECT 
  DATE_TRUNC('minute', "updatedAt") as time,
  COUNT(*) as expired_count
FROM "Payment"
WHERE status = 'EXPIRED' 
  AND "updatedAt" > NOW() - INTERVAL '1 hour'
GROUP BY time
ORDER BY time DESC;
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| **401 Unauthorized** | Check `CRON_SECRET` in env variables |
| **Cron not running (Vercel)** | Check Dashboard → Settings → Cron Jobs |
| **Cron not running (VPS)** | `docker logs myhome-cron` |
| **No data cleaned** | Check if data actually expired + grace period |
| **Container not starting** | `docker-compose restart cron` |

---

## 🔐 Generate CRON_SECRET

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac/WSL:**
```bash
openssl rand -base64 32
```

---

## 📚 Full Documentation

Lihat [`docs/CRON_DEPLOYMENT_GUIDE.md`](./CRON_DEPLOYMENT_GUIDE.md) untuk:
- Detailed setup steps
- Security best practices
- Advanced troubleshooting
- Monitoring & alerts

---

**✅ Done!** Cron cleanup akan jalan otomatis setiap 5 menit di environment manapun.
