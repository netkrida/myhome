# 🚀 MyHome Deployment Scripts

Kumpulan script untuk mengelola deployment aplikasi MyHome di domain **myhome.co.id**.

## 📋 Daftar Script

| Script | Fungsi | Penggunaan |
|--------|--------|------------|
| `deploy-production.sh` | Full production deployment | `./scripts/deploy-production.sh` |
| `manage-domain.sh` | Domain & SSL management | `./scripts/manage-domain.sh [command]` |
| `backup-database.sh` | Database backup & restore | `./scripts/backup-database.sh [command]` |
| `quick-deploy.sh` | Quick deployment | `./scripts/quick-deploy.sh` |

## 🎯 Quick Start

### 1. First Time Deployment
```bash
# Setup environment
cp .env.example .env
# Edit .env dengan nilai production

# Full deployment
./scripts/deploy-production.sh
```

### 2. Quick Updates
```bash
# Quick deployment setelah git push
./scripts/quick-deploy.sh
```

### 3. Domain Management
```bash
# Check domain status
./scripts/manage-domain.sh status

# Setup Nginx
./scripts/manage-domain.sh nginx

# SSL setup instructions
./scripts/manage-domain.sh ssl
```

### 4. Database Backup
```bash
# Create backup
./scripts/backup-database.sh backup

# Setup automated backups
./scripts/backup-database.sh cron
```

## 📖 Script Details

### 🚀 deploy-production.sh

**Full production deployment script**

**Features:**
- Environment validation
- Docker build & deployment
- Database migration
- Health checks
- SSL setup guidance

**Usage:**
```bash
./scripts/deploy-production.sh
```

**What it does:**
1. ✅ Check prerequisites (Docker, Docker Compose)
2. ✅ Validate environment variables
3. ✅ Build Docker images
4. ✅ Start services
5. ✅ Run database migrations
6. ✅ Perform health checks
7. ✅ Show deployment info

---

### 🌐 manage-domain.sh

**Domain and SSL management**

**Commands:**
```bash
./scripts/manage-domain.sh status    # Show domain status
./scripts/manage-domain.sh dns       # Check DNS configuration
./scripts/manage-domain.sh nginx     # Setup Nginx config
./scripts/manage-domain.sh ssl       # SSL setup instructions
./scripts/manage-domain.sh compose   # Create production docker-compose
./scripts/manage-domain.sh test      # Test domain connectivity
```

**Features:**
- DNS validation
- Nginx reverse proxy setup
- SSL certificate guidance
- Domain connectivity testing

---

### 💾 backup-database.sh

**Database backup and restore**

**Commands:**
```bash
./scripts/backup-database.sh backup   # Create full backup
./scripts/backup-database.sh restore  # Restore from backup
./scripts/backup-database.sh list     # List available backups
./scripts/backup-database.sh cron     # Setup automated backups
./scripts/backup-database.sh status   # Show backup status
```

**Features:**
- PostgreSQL database backup
- Configuration backup
- Automated cleanup (7 days retention)
- Cron job setup
- Restore functionality

**Backup includes:**
- Database dump (compressed)
- Configuration files
- Upload files (if any)

---

### ⚡ quick-deploy.sh

**Fast deployment for updates**

**Usage:**
```bash
./scripts/quick-deploy.sh
```

**What it does:**
1. ✅ Pull latest changes from git
2. ✅ Update environment if needed
3. ✅ Rebuild and restart containers
4. ✅ Run migrations
5. ✅ Health check

**Perfect for:**
- Code updates
- Quick fixes
- Regular deployments

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
# Domain
NEXTAUTH_URL="https://myhome.co.id"
NODE_ENV="production"

# Database
DATABASE_URL="postgresql://myhome:@myhome_123@myhome-myhome-jlldmr:5432/db_myhome?schema=public"
POSTGRES_DB="db_myhome"
POSTGRES_USER="myhome"
POSTGRES_PASSWORD="@myhome_123"

# Auth
AUTH_SECRET="your-32-character-secret"

# App
NEXT_PUBLIC_APP_NAME="MyHome"
```

### Nginx Configuration
Script `manage-domain.sh nginx` akan membuat:
- `/nginx/myhome.conf` - Nginx configuration
- SSL termination
- Security headers
- Reverse proxy ke port 3000

### Docker Compose
Script `manage-domain.sh compose` akan membuat:
- `docker-compose.prod.yml` - Production configuration
- Domain-specific environment
- Health checks

## 🛠️ Manual Setup Steps

### 1. Server Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose

# Install Nginx (for reverse proxy)
sudo apt install nginx

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx
```

### 2. DNS Configuration
Point domain ke server IP:
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 300
```

### 3. Nginx Setup
```bash
# Setup Nginx config
./scripts/manage-domain.sh nginx

# Install config
sudo cp nginx/myhome.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/myhome.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d myhome.co.id -d www.myhome.co.id

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔍 Troubleshooting

### Common Issues

**1. Docker build fails**
```bash
# Check logs
docker-compose logs web

# Rebuild without cache
docker-compose build --no-cache
```

**2. Database connection fails**
```bash
# Check database status
docker-compose ps db

# Check database logs
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

**3. Domain not accessible**
```bash
# Check DNS
./scripts/manage-domain.sh dns

# Test connectivity
./scripts/manage-domain.sh test

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

**4. SSL issues**
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

### Health Checks

**Application Health:**
```bash
curl https://myhome.co.id/api/health
```

**Container Status:**
```bash
docker-compose ps
```

**Logs:**
```bash
docker-compose logs -f web
```

## 📊 Monitoring

### Automated Backups
```bash
# Setup daily backups at 2 AM
./scripts/backup-database.sh cron

# Check backup status
./scripts/backup-database.sh status
```

### Log Monitoring
```bash
# Real-time logs
docker-compose logs -f

# Application logs only
docker-compose logs -f web

# Database logs only
docker-compose logs -f db
```

### Resource Monitoring
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🆘 Emergency Procedures

### Quick Rollback
```bash
# Stop current deployment
docker-compose down

# Restore from backup
./scripts/backup-database.sh restore backups/latest_backup.sql.gz

# Start services
docker-compose up -d
```

### Emergency Access
```bash
# Access container shell
docker-compose exec web sh

# Access database
docker-compose exec db psql -U myhome -d db_myhome
```

### Reset Everything
```bash
# Complete reset (DANGER!)
docker-compose down -v
docker system prune -a
./scripts/deploy-production.sh
```

## 📞 Support

Untuk bantuan lebih lanjut:
1. Check logs: `docker-compose logs -f`
2. Check health: `https://myhome.co.id/api/health`
3. Run diagnostics: `./scripts/manage-domain.sh status`
4. Check backups: `./scripts/backup-database.sh status`
