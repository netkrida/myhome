# 🚀 Docker Deployment Guide - MultiKost

Panduan lengkap untuk deploy aplikasi MultiKost menggunakan Docker dan Dockploy.

## 📋 Prerequisites

- Docker & Docker Compose
- Git
- Node.js 20+ (untuk development)

## 🏗️ File Structure untuk Deployment

```
├── Dockerfile                 # Multi-stage build dengan standalone output
├── docker-compose.yml         # Production setup (web + database)
├── docker-compose.dev.yml     # Development setup (database only)
├── .dockerignore              # Files to exclude from Docker build
├── .env.example               # Environment variables template
├── next.config.js             # Next.js config dengan output: 'standalone'
└── scripts/
    └── docker-setup.sh        # Setup script untuk deployment
```

## ⚙️ Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan nilai-nilai berikut:

### 🔐 Required Variables
```bash
# Database
DATABASE_URL="postgresql://postgres:your_password@db:5432/multikost?schema=public"
POSTGRES_PASSWORD="your_secure_password"

# Authentication
AUTH_SECRET="your-32-character-secret"  # Generate: npx auth secret
NEXTAUTH_URL="https://yourdomain.com"  # Your production domain
```

### 🎛️ Optional Variables
```bash
# OAuth (jika menggunakan Discord login)
AUTH_DISCORD_ID="your_discord_client_id"
AUTH_DISCORD_SECRET="your_discord_client_secret"

# Cloudinary (untuk upload gambar)
CLOUDINARY_API_SECRET="your_cloudinary_secret"

# Midtrans (untuk payment)
MIDTRANS_SERVER_KEY="your_midtrans_server_key"
MIDTRANS_CLIENT_KEY="your_midtrans_client_key"
```

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone <repository-url>
cd multikost
cp .env.example .env
# Edit .env dengan nilai yang sesuai
```

### 2. Development Setup
```bash
# Jalankan database saja
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies dan jalankan dev server
npm install
npm run dev
```

### 3. Production Setup
```bash
# Otomatis setup menggunakan script
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh

# Atau manual
docker-compose up -d
```

## 🐳 Docker Commands

### Build & Run
```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down
```

### Database Management
```bash
# Run migrations
docker-compose exec web npm run prisma:migrate:deploy

# Generate Prisma client
docker-compose exec web npm run prisma:generate

# Seed database
docker-compose exec web npm run db:seed
```

### Health Check
```bash
# Check application health
curl http://localhost:3000/api/health

# Check container health
docker-compose ps
```

## 🌐 Dockploy Deployment

### 1. Persiapan Repository
Pastikan semua file deployment sudah di push ke GitHub:
- ✅ `Dockerfile`
- ✅ `docker-compose.yml`
- ✅ `.env.example`
- ✅ `next.config.js` (dengan `output: 'standalone'`)

### 2. Setup di Dockploy
1. **Create New Project** di Dockploy
2. **Connect GitHub Repository**
3. **Set Environment Variables** dari `.env.example`
4. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Port: `3000`

### 3. Environment Variables di Dockploy
Set minimal variables berikut:
```
DATABASE_URL=postgresql://postgres:password@db:5432/multikost
AUTH_SECRET=your-32-character-secret
NEXTAUTH_URL=https://your-domain.com
POSTGRES_PASSWORD=your_secure_password
SKIP_ENV_VALIDATION=true
```

### 4. Database Setup
Dockploy akan otomatis:
- Build Docker image dengan multi-stage build
- Setup PostgreSQL database
- Run health checks
- Deploy dengan zero-downtime

## 🔍 Troubleshooting

### Build Issues
```bash
# Check build logs
docker-compose logs web

# Rebuild without cache
docker-compose build --no-cache

# Check environment variables
docker-compose exec web env | grep -E "(DATABASE|AUTH|NEXT)"
```

### Database Issues
```bash
# Check database connection
docker-compose exec db psql -U postgres -d multikost -c "SELECT 1;"

# Reset database
docker-compose down -v
docker-compose up -d
```

### Health Check Failures
```bash
# Check health endpoint
curl -v http://localhost:3000/api/health

# Check container status
docker-compose ps
docker-compose logs web
```

## 📊 Monitoring

### Health Checks
- **Application**: `GET /api/health`
- **Database**: Built-in PostgreSQL health check
- **Container**: Docker health check setiap 30 detik

### Logs
```bash
# Application logs
docker-compose logs -f web

# Database logs
docker-compose logs -f db

# All services
docker-compose logs -f
```

## 🔧 Advanced Configuration

### Custom Domain
Update `NEXTAUTH_URL` di environment variables:
```bash
NEXTAUTH_URL=https://yourdomain.com
```

### SSL/HTTPS
Dockploy otomatis handle SSL dengan Let's Encrypt.

### Scaling
```bash
# Scale web service
docker-compose up -d --scale web=3
```

### Backup Database
```bash
# Create backup
docker-compose exec db pg_dump -U postgres multikost > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres multikost < backup.sql
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] `AUTH_SECRET` generated (32+ characters)
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Database password secure
- [ ] Cloudinary credentials (if using image upload)
- [ ] Midtrans credentials (if using payments)
- [ ] Health check endpoint working
- [ ] SSL certificate configured
- [ ] Database backup strategy

## 🆘 Support

Jika mengalami masalah:
1. Check health endpoint: `/api/health`
2. Review logs: `docker-compose logs -f`
3. Verify environment variables
4. Check database connectivity
5. Restart services: `docker-compose restart`
