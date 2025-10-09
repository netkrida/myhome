# 🚀 Quick Reference - Cron Cleanup System

Referensi cepat untuk operasi sehari-hari.

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Health Check | `https://myhome.co.id/api/health` |
| Cleanup Endpoint | `https://myhome.co.id/api/cron/cleanup-expired` |
| Dockploy Dashboard | `https://your-vps-ip:3000` |

---

## 🔑 Environment Variables

```env
CRON_SECRET="your-secret-token"
BOOKING_UNPAID_GRACE_MINUTES="30"
```

---

## 🐳 Docker Commands

### Container Management

```bash
# List containers
docker ps

# View logs
docker logs -f myhome-cron
docker logs -f myhome-app

# Restart containers
docker restart myhome-cron
docker restart myhome-app

# Stop/Start
docker stop myhome-cron
docker start myhome-cron

# Execute command in container
docker exec -it myhome-cron sh
docker exec -it myhome-app sh
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f cron
docker-compose logs -f app
```

---

## 🧪 Testing Commands

### Health Check

```bash
curl https://myhome.co.id/api/health
```

### Manual Cleanup Trigger

```bash
# Replace YOUR_CRON_SECRET with actual secret
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://myhome.co.id/api/cron/cleanup-expired
```

### Test Script

```bash
chmod +x test-cron-api.sh
./test-cron-api.sh https://myhome.co.id "YOUR_CRON_SECRET"
```

---

## 📊 Database Queries

### Check Expired Payments

```sql
SELECT COUNT(*) FROM "Payment" 
WHERE status = 'PENDING' AND "expiryTime" < NOW();
```

### Check Unpaid Bookings

```sql
SELECT COUNT(*) FROM "Booking" 
WHERE status = 'UNPAID';
```

### Check Room Availability Accuracy

```sql
SELECT 
  p.name,
  p."availableRooms",
  COUNT(r.id) FILTER (WHERE r."isAvailable" = true) as actual
FROM "Property" p
LEFT JOIN "Room" r ON r."propertyId" = p.id
GROUP BY p.id;
```

### Check Recent Cleanup Activity

```sql
-- Check recently deleted bookings (via audit log if exists)
-- Or check Payment status changes
SELECT 
  id,
  status,
  "expiryTime",
  "updatedAt"
FROM "Payment"
WHERE status = 'EXPIRED'
  AND "updatedAt" > NOW() - INTERVAL '1 hour'
ORDER BY "updatedAt" DESC;
```

---

## 🔍 Monitoring

### Cron Logs

```bash
# Real-time
docker logs -f myhome-cron

# Last 50 lines
docker logs --tail 50 myhome-cron

# Since 1 hour ago
docker logs --since 1h myhome-cron
```

### App Logs (Cleanup Related)

```bash
# Filter for cleanup logs
docker logs myhome-app 2>&1 | grep "Cron Cleanup"

# Last 100 lines
docker logs --tail 100 myhome-app | grep "Cron Cleanup"
```

### Container Stats

```bash
# Resource usage
docker stats

# Specific container
docker stats myhome-cron
```

---

## 🆘 Troubleshooting

### Cron Not Running

```bash
# Check container status
docker ps | grep cron

# Check logs
docker logs myhome-cron

# Restart
docker restart myhome-cron

# Manual trigger
docker exec myhome-cron /usr/local/bin/cleanup.sh
```

### 401 Unauthorized

```bash
# Check CRON_SECRET in both containers
docker exec myhome-cron env | grep CRON_SECRET
docker exec myhome-app env | grep CRON_SECRET

# Should be identical
```

### App Unhealthy

```bash
# Check health
curl https://myhome.co.id/api/health

# Check logs
docker logs myhome-app

# Restart
docker restart myhome-app
```

### Database Issues

```bash
# Check postgres status
docker ps | grep postgres

# Check connection
docker exec -it postgres psql -U postgres -d db_myhome -c "SELECT 1;"

# Restart postgres
docker restart postgres
```

---

## 🔧 Common Tasks

### Update CRON_SECRET

1. Generate new secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update `.env.production`

3. Redeploy:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Adjust Grace Period

1. Update `.env.production`:
   ```env
   BOOKING_UNPAID_GRACE_MINUTES="60"  # Change to desired value
   ```

2. Restart app:
   ```bash
   docker restart myhome-app
   ```

### Manual Cleanup

```bash
# Trigger cleanup manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://myhome.co.id/api/cron/cleanup-expired
```

### Stop Cron Temporarily

```bash
# Stop cron container
docker stop myhome-cron

# App continues to work normally

# Start again when ready
docker start myhome-cron
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/server/api/booking/cleanupExpiredBookings.ts` | Service logic |
| `src/app/api/cron/cleanup-expired/route.ts` | API endpoint |
| `docker/cron/cleanup.sh` | Cleanup script |
| `docker/cron/crontab` | Cron schedule |
| `.env.production` | Environment config |
| `docker-compose.yml` | Docker orchestration |

---

## 📚 Documentation

| Document | Link |
|----------|------|
| Deployment Guide | [README-CRON-DEPLOYMENT.md](README-CRON-DEPLOYMENT.md) |
| Quick Start | [CRON-QUICKSTART.md](CRON-QUICKSTART.md) |
| API Documentation | [docs/API-CRON-CLEANUP.md](docs/API-CRON-CLEANUP.md) |
| Migration Guide | [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) |
| Deployment Checklist | [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) |

---

## 🔢 Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| Cron Schedule | `*/5 * * * *` | Every 5 minutes |
| Grace Period | 30 minutes | For unpaid bookings without payment |
| Retry Count | 3 | Number of retries for API call |
| Retry Delay | 2 seconds | Delay between retries |
| Timeout | 20 seconds | Max time for API call |

---

## 📞 Emergency Contacts

- **Developer**: _________________
- **DevOps**: _________________
- **Database Admin**: _________________
- **On-call**: _________________

---

## ⚡ Quick Actions

### Emergency Stop

```bash
docker stop myhome-cron
```

### Emergency Restart

```bash
docker restart myhome-cron myhome-app
```

### View All Logs

```bash
docker-compose logs -f
```

### Check Everything

```bash
# Containers
docker ps

# Health
curl https://myhome.co.id/api/health

# Cleanup (manual)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://myhome.co.id/api/cron/cleanup-expired

# Logs
docker logs --tail 20 myhome-cron
```

---

**Keep this file handy for quick reference!** 📌

