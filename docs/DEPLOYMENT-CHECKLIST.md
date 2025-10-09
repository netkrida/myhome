# ✅ Deployment Checklist - Cron Cleanup System

Gunakan checklist ini untuk memastikan deployment berjalan lancar.

---

## 📋 Pre-Deployment

### 1. Environment Configuration

- [ ] Generate CRON_SECRET dengan `openssl rand -base64 32`
- [ ] Update `.env.production` dengan CRON_SECRET
- [ ] Verify BOOKING_UNPAID_GRACE_MINUTES (default: 30)
- [ ] Verify semua environment variables lain sudah benar
- [ ] Backup `.env.production` ke secure location

### 2. Code Review

- [ ] Review `src/server/api/booking/cleanupExpiredBookings.ts`
- [ ] Review `src/app/api/cron/cleanup-expired/route.ts`
- [ ] Verify Prisma schema indexes sudah ditambahkan
- [ ] Check docker-compose.yml configuration
- [ ] Verify Dockerfile updates

### 3. Database

- [ ] Backup database sebelum deployment
- [ ] Verify database connection string
- [ ] Check database has enough storage
- [ ] Verify database user has required permissions

### 4. Testing (Local)

- [ ] Build Docker images locally: `docker-compose build`
- [ ] Run containers locally: `docker-compose up -d`
- [ ] Test health endpoint: `curl http://localhost:3000/api/health`
- [ ] Test cleanup endpoint: `./test-cron-api.sh http://localhost:3000 "YOUR_SECRET"`
- [ ] Monitor cron logs: `docker logs -f myhome-cron`
- [ ] Verify no errors in app logs: `docker logs myhome-app`
- [ ] Stop local containers: `docker-compose down`

---

## 🚀 Deployment

### 1. Git Operations

- [ ] Commit all changes: `git add .`
- [ ] Create meaningful commit message
- [ ] Push to repository: `git push origin main`
- [ ] Verify push successful
- [ ] Tag release (optional): `git tag v1.0.0-cron-cleanup`

### 2. Dockploy Deployment

**Option A: Auto-Deploy (Webhook)**
- [ ] Verify webhook is configured
- [ ] Push triggers auto-deploy
- [ ] Monitor deployment progress in Dockploy UI

**Option B: Manual Deploy**
- [ ] Login to Dockploy dashboard
- [ ] Navigate to project
- [ ] Click "Deploy" button
- [ ] Monitor deployment logs
- [ ] Wait for deployment to complete

### 3. Database Migration

- [ ] Verify migration runs automatically on startup
- [ ] Check migration logs in app container
- [ ] Verify indexes created: `\d "Booking"` and `\d "Payment"` in psql
- [ ] Confirm no migration errors

---

## ✅ Post-Deployment Verification

### 1. Container Health

- [ ] Check all containers running: `docker ps`
- [ ] Verify app container is healthy
- [ ] Verify cron container is running
- [ ] Verify postgres container is running
- [ ] Check container resource usage: `docker stats`

### 2. Health Checks

- [ ] Test health endpoint: `curl https://myhome.co.id/api/health`
- [ ] Verify response status is 200 or 206
- [ ] Check database connection in health response
- [ ] Verify all health checks pass

### 3. Cron Endpoint

- [ ] Test without auth (should return 401):
  ```bash
  curl https://myhome.co.id/api/cron/cleanup-expired
  ```

- [ ] Test with wrong token (should return 401):
  ```bash
  curl -H "Authorization: Bearer wrong-token" \
       https://myhome.co.id/api/cron/cleanup-expired
  ```

- [ ] Test with correct token (should return 200):
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
       https://myhome.co.id/api/cron/cleanup-expired
  ```

- [ ] Verify response contains expected fields:
  - executedAt
  - graceMinutes
  - expiredPaymentsCount
  - deletedBookingsCount
  - deletedBookingIds

### 4. Cron Execution

- [ ] Wait for first cron execution (max 5 minutes)
- [ ] Check cron logs: `docker logs myhome-cron`
- [ ] Verify successful execution in logs
- [ ] Check for any error messages
- [ ] Verify cleanup runs every 5 minutes

### 5. Database Verification

- [ ] Connect to database
- [ ] Check indexes exist:
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename IN ('Booking', 'Payment');
  ```

- [ ] Verify cleanup logic:
  ```sql
  -- Should be 0 or low
  SELECT COUNT(*) FROM "Payment" 
  WHERE status = 'PENDING' AND "expiryTime" < NOW();
  
  -- Should be 0 or low
  SELECT COUNT(*) FROM "Booking" 
  WHERE status = 'UNPAID' 
    AND "createdAt" < NOW() - INTERVAL '30 minutes';
  ```

- [ ] Check room availability accuracy:
  ```sql
  SELECT 
    p.name,
    p."availableRooms",
    COUNT(r.id) FILTER (WHERE r."isAvailable" = true) as actual
  FROM "Property" p
  LEFT JOIN "Room" r ON r."propertyId" = p.id
  GROUP BY p.id
  HAVING p."availableRooms" != COUNT(r.id) FILTER (WHERE r."isAvailable" = true);
  ```

---

## 📊 Monitoring Setup

### 1. Logging

- [ ] Verify logs are accessible via Dockploy UI
- [ ] Set up log retention policy
- [ ] Configure log rotation if needed
- [ ] Test log search functionality

### 2. Alerts (Optional)

- [ ] Set up alert for high deletion rate (>10 bookings/cleanup)
- [ ] Set up alert for consecutive failures (3+ errors)
- [ ] Set up alert for authentication failures
- [ ] Configure notification channels (email, Slack, etc.)

### 3. Metrics (Optional)

- [ ] Track cleanup execution count
- [ ] Track average deletion count
- [ ] Track error rate
- [ ] Create dashboard for visualization

---

## 📝 Documentation

### 1. Team Communication

- [ ] Notify team about new cron system
- [ ] Share documentation links
- [ ] Explain monitoring procedures
- [ ] Document escalation process

### 2. Runbook

- [ ] Document common issues and solutions
- [ ] Create troubleshooting guide
- [ ] Document rollback procedure
- [ ] Update team wiki/knowledge base

### 3. Access

- [ ] Ensure team has access to Dockploy
- [ ] Share CRON_SECRET securely (password manager)
- [ ] Document where to find logs
- [ ] Share database access credentials (if needed)

---

## 🔄 Post-Deployment Tasks

### Immediate (First 24 Hours)

- [ ] Monitor logs every hour
- [ ] Check for any errors or warnings
- [ ] Verify cleanup is running on schedule
- [ ] Monitor database performance
- [ ] Check application performance impact

### Short-term (First Week)

- [ ] Review cleanup metrics daily
- [ ] Analyze deletion patterns
- [ ] Optimize grace period if needed
- [ ] Gather team feedback
- [ ] Document any issues encountered

### Long-term (First Month)

- [ ] Review overall system performance
- [ ] Analyze cleanup effectiveness
- [ ] Consider adjustments to schedule
- [ ] Plan for improvements
- [ ] Update documentation based on learnings

---

## 🆘 Rollback Plan

If issues occur:

### 1. Quick Rollback

- [ ] Stop cron container: `docker stop myhome-cron`
- [ ] Verify app still works without cron
- [ ] Investigate issue
- [ ] Fix and redeploy

### 2. Full Rollback

- [ ] Revert Git commit: `git revert HEAD`
- [ ] Push to repository: `git push origin main`
- [ ] Redeploy via Dockploy
- [ ] Verify system is stable
- [ ] Plan fix for next deployment

### 3. Emergency Stop

- [ ] SSH to VPS
- [ ] Stop cron container: `docker stop myhome-cron`
- [ ] Remove cron container: `docker rm myhome-cron`
- [ ] App continues to work normally
- [ ] Manual cleanup if needed

---

## ✅ Sign-off

### Deployment Team

- [ ] Developer: _________________ Date: _______
- [ ] DevOps: _________________ Date: _______
- [ ] QA: _________________ Date: _______

### Verification

- [ ] All pre-deployment checks passed
- [ ] Deployment completed successfully
- [ ] All post-deployment verifications passed
- [ ] Monitoring is active
- [ ] Team is notified
- [ ] Documentation is updated

### Notes

```
Add any deployment notes, issues encountered, or special considerations here:




```

---

## 📞 Emergency Contacts

- **Developer**: _________________
- **DevOps**: _________________
- **Database Admin**: _________________
- **On-call**: _________________

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: 1.0.0  
**Status**: [ ] Success [ ] Failed [ ] Rolled Back

---

**Remember**: 
- Take your time with each step
- Don't skip verification steps
- Document any issues
- Ask for help if needed
- Celebrate when done! 🎉

