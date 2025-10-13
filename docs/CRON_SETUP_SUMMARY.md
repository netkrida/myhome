# ✅ Setup Cron - Summary

## 📦 Files Created/Updated

### ✨ New Files
1. ✅ `vercel.json` - Konfigurasi Vercel Cron
2. ✅ `docs/CRON_DEPLOYMENT_GUIDE.md` - Panduan lengkap multi-environment
3. ✅ `docs/CRON_QUICK_REFERENCE.md` - Quick reference guide
4. ✅ `generate-cron-secret.ps1` - PowerShell script generate secret

### 🔧 Updated Files
1. ✅ `src/app/api/cron/cleanup-expired/route.ts` - Auto-detect Vercel/Docker
2. ✅ `README.md` - Added cron section

---

## 🎯 Jawaban Pertanyaan Anda

> **"Apakah cronnya itu juga sudah bisa langsung dipakai oleh VPS saya?"**

**Jawaban: YA! Sudah bisa dipakai di VPS, tapi setup berbeda:**

| Environment | Method | File Config | Status |
|-------------|--------|-------------|--------|
| **Vercel** | Vercel Cron Jobs | `vercel.json` | ✅ Ready |
| **VPS Docker** | Docker Cron Container | `docker-compose.yml` | ✅ Already configured |

### Key Points:

1. **Route handler SATU untuk SEMUA environment** (`/api/cron/cleanup-expired`)
2. **Auto-detection:** Otomatis detect apakah request dari Vercel atau Docker
3. **VPS sudah ada setup:** File `docker-compose.yml` sudah punya service `cron` + script `docker/cron/cleanup.sh`
4. **Vercel baru ditambahkan:** File `vercel.json` baru dibuat untuk Vercel Cron

---

## 🚀 Next Steps

### For Vercel:

1. **Generate CRON_SECRET:**
   ```powershell
   .\generate-cron-secret.ps1
   ```

2. **Add to Vercel Dashboard:**
   - Settings → Environment Variables
   - Add `CRON_SECRET` = (paste generated secret)

3. **Deploy:**
   ```bash
   git add .
   git commit -m "feat: add Vercel cron configuration"
   git push origin main
   ```

4. **Verify:**
   - Dashboard → Settings → Cron Jobs
   - Should see: `/api/cron/cleanup-expired` (Every 5 minutes)

### For VPS (Docker):

1. **Update `.env.production` di VPS:**
   ```env
   CRON_SECRET=your-generated-secret-here
   BOOKING_UNPAID_GRACE_MINUTES=30
   TZ=Asia/Jakarta
   ```

2. **Deploy:**
   ```bash
   ssh user@your-vps
   cd /path/to/myhomeapp
   git pull
   docker-compose down
   docker-compose up -d --build
   ```

3. **Verify:**
   ```bash
   docker ps | grep myhome-cron
   docker logs -f myhome-cron
   ```

---

## 🔍 How It Works

### Auto-Detection Logic

```typescript
// File: src/app/api/cron/cleanup-expired/route.ts

const isVercelCron = request.headers.get("x-vercel-cron") === "true";

if (!isVercelCron) {
  // Docker Cron or Manual Test
  // → Requires Authorization: Bearer <CRON_SECRET>
} else {
  // Vercel Cron (automatic)
  // → No Bearer token needed (Vercel handles auth internally)
}
```

### Execution Flow

**Vercel:**
```
Vercel Cron Scheduler (every 5 min)
  ↓
GET /api/cron/cleanup-expired
  + Header: x-vercel-cron: true
  ↓
Route Handler (auto-detect: Vercel)
  ↓
CleanupExpiredBookingsService.execute()
  ↓
Database cleanup
  ↓
Response + Logs
```

**VPS Docker:**
```
Cron in Docker Container (every 5 min)
  ↓
Execute: docker/cron/cleanup.sh
  ↓
curl http://app:3000/api/cron/cleanup-expired
  + Header: Authorization: Bearer <CRON_SECRET>
  ↓
Route Handler (auto-detect: Docker)
  ↓
Validate CRON_SECRET
  ↓
CleanupExpiredBookingsService.execute()
  ↓
Database cleanup
  ↓
Response + Logs
```

---

## 🧪 Testing

### Test Vercel Cron (Manual)
```bash
curl "https://yourdomain.vercel.app/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test VPS Docker (From Inside)
```bash
docker exec -it myhome-app curl "http://localhost:3000/api/cron/cleanup-expired" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Test VPS Docker (From Outside)
```bash
curl "https://yourdomain.com/api/cron/cleanup-expired" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "expiredPaymentsCount": 5,
    "deletedBookingsCount": 3,
    "affectedProperties": [...],
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

---

## 🔐 Security

- ✅ CRON_SECRET required for manual/Docker calls
- ✅ Vercel Cron authenticated via `x-vercel-cron` header
- ✅ Different secrets recommended for Vercel vs VPS
- ✅ Never commit secrets to git

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [`CRON_QUICK_REFERENCE.md`](./docs/CRON_QUICK_REFERENCE.md) | TL;DR setup guide |
| [`CRON_DEPLOYMENT_GUIDE.md`](./docs/CRON_DEPLOYMENT_GUIDE.md) | Detailed multi-env guide |
| [`API-CRON-CLEANUP.md`](./docs/API-CRON-CLEANUP.md) | API specification |
| [`CRON-CLEANUP-IMPLEMENTATION.md`](./docs/CRON-CLEANUP-IMPLEMENTATION.md) | Implementation details |

---

## ✅ Checklist

### Done ✅
- [x] `vercel.json` created with cron config
- [x] Route handler supports auto-detection (Vercel/Docker)
- [x] Documentation created (quick ref + detailed guide)
- [x] PowerShell script for generating secrets
- [x] README updated with cron section
- [x] VPS Docker setup already exists (no changes needed)

### To Do 🔜
- [ ] Generate CRON_SECRET
- [ ] Add CRON_SECRET to Vercel env variables
- [ ] Deploy to Vercel
- [ ] Verify Vercel cron running
- [ ] Update VPS `.env.production` with CRON_SECRET
- [ ] Deploy to VPS
- [ ] Verify VPS cron running

---

## 🎉 Conclusion

**Setup sudah COMPLETE!** 

- **Vercel:** Tinggal set env var + deploy
- **VPS:** Tinggal update `.env.production` + redeploy
- **Route handler:** Sudah support SEMUA environment secara otomatis

**Satu kode, jalan di mana-mana! 🚀**
