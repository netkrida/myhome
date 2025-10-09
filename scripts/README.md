# 📜 Scripts untuk MyHome Deployment

Kumpulan script untuk membantu deployment MyHome di Dockploy.

## 📁 File Scripts

### 🗄️ Database Management Scripts

#### `docker-db-reset.sh`
Script untuk reset database dan jalankan seed di Docker environment.

**Fungsi:**
- Generate Prisma Client
- Reset database (drop all tables)
- Run migrations
- Run seed data

**⚠️ WARNING:** Script ini akan **MENGHAPUS SEMUA DATA** di database!

**Cara menjalankan:**
```bash
# Via npm script (recommended)
npm run db:reset:docker

# Direct
sh scripts/docker-db-reset.sh

# Di Docker container
docker-compose exec app npm run db:reset:docker
```

---

#### `docker-db-init.sh`
Script untuk initialize database dengan migrations dan seed di Docker environment.

**Fungsi:**
- Generate Prisma Client
- Run migrations (deploy)
- Run seed data

**Use case:** First deployment atau fresh installation

**Cara menjalankan:**
```bash
# Via npm script (recommended)
npm run db:init:docker

# Direct
sh scripts/docker-db-init.sh

# Di Docker container
docker-compose exec app npm run db:init:docker
```

---

### 🚀 `deploy-dockploy.sh`
Script helper untuk mempersiapkan dan memvalidasi deployment di Dockploy.

**Fungsi:**
- Validasi file-file yang diperlukan
- Check environment variables
- Validasi konfigurasi Next.js
- Test Docker build (optional)
- Generate deployment summary

**Cara menjalankan:**
```bash
# Linux/Mac
chmod +x scripts/deploy-dockploy.sh
./scripts/deploy-dockploy.sh

# Windows (Git Bash)
bash scripts/deploy-dockploy.sh

# Windows (PowerShell)
wsl bash scripts/deploy-dockploy.sh
```

### 🧪 `test-docker-build.sh`
Script untuk testing Docker build sebelum deployment.

**Fungsi:**
- Build Docker image
- Test container startup
- Validasi health endpoint
- Check resource usage
- Generate test report

**Cara menjalankan:**
```bash
# Linux/Mac
chmod +x scripts/test-docker-build.sh
./scripts/test-docker-build.sh

# Windows (Git Bash)
bash scripts/test-docker-build.sh

# Windows (PowerShell)
wsl bash scripts/test-docker-build.sh
```

### 🗄️ `init-db.sql`
Script SQL untuk inisialisasi database PostgreSQL.

**Fungsi:**
- Set timezone ke Asia/Jakarta
- Create extensions yang diperlukan
- Grant permissions
- Log initialization

**Penggunaan:**
File ini akan otomatis dijalankan oleh Docker Compose saat container PostgreSQL pertama kali dibuat.

## 🔧 Prerequisites

### Untuk Linux/Mac:
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y curl wget jq docker.io

# Make scripts executable
chmod +x scripts/*.sh
```

### Untuk Windows:
```bash
# Option 1: Git Bash (Recommended)
# Download Git for Windows: https://git-scm.com/download/win
# Jalankan script dengan: bash scripts/script-name.sh

# Option 2: WSL (Windows Subsystem for Linux)
# Install WSL: wsl --install
# Jalankan script dengan: wsl bash scripts/script-name.sh

# Option 3: PowerShell dengan Docker Desktop
# Install Docker Desktop for Windows
# Jalankan script dengan: docker run --rm -v ${PWD}:/app -w /app alpine/git bash scripts/script-name.sh
```

## 🚀 Quick Start

### 1. Persiapan Deployment
```bash
# Jalankan deployment helper
bash scripts/deploy-dockploy.sh
```

### 2. Test Build (Optional)
```bash
# Test Docker build sebelum deploy
bash scripts/test-docker-build.sh
```

### 3. Deploy ke Dockploy
1. Follow instruksi dari `deploy-dockploy.sh`
2. Set environment variables di Dockploy
3. Deploy dan monitor logs

## 📊 Output Examples

### Deploy Helper Output:
```
🚀 MyHome Dockploy Deployment Helper
===================================================

[INFO] Checking required files for Dockploy deployment...
[SUCCESS] ✅ Dockerfile found
[SUCCESS] ✅ docker-compose.yml found
[SUCCESS] ✅ .dockerignore found
[SUCCESS] ✅ .env.dockploy.example found

[INFO] Checking environment configuration...
[SUCCESS] ✅ .env.production found
[SUCCESS] ✅ AUTH_SECRET is set
[SUCCESS] ✅ DATABASE_URL is set

🎉 Your project is ready for Dockploy deployment!
```

### Build Test Output:
```
🧪 Docker Build Test untuk MyHome
===================================================

[INFO] Building Docker image...
[SUCCESS] ✅ Docker build successful
[INFO] Image size: 1.2GB

[INFO] Testing container startup...
[SUCCESS] ✅ Container is running
[SUCCESS] ✅ Health endpoint is responding

🎉 Docker build test completed successfully!
```

## 🔍 Troubleshooting

### Script Permission Issues (Linux/Mac):
```bash
# Fix permissions
chmod +x scripts/*.sh

# Or run with bash directly
bash scripts/deploy-dockploy.sh
```

### Docker Not Found:
```bash
# Install Docker
# Linux: sudo apt-get install docker.io
# Mac: brew install docker
# Windows: Download Docker Desktop

# Verify installation
docker --version
```

### Script Fails on Windows:
```bash
# Use Git Bash (recommended)
bash scripts/deploy-dockploy.sh

# Or use WSL
wsl bash scripts/deploy-dockploy.sh

# Or use Docker container
docker run --rm -v ${PWD}:/app -w /app alpine/git bash scripts/deploy-dockploy.sh
```

## 📚 Related Documentation

- `../DEPLOYMENT_GUIDE.md` - Panduan deployment lengkap
- `../docs/DOCKPLOY_DEPLOYMENT.md` - Dokumentasi Dockploy detail
- `../docs/DOCKER_BUILD_GUIDE.md` - Panduan Docker build
- `../docs/DOCKER_DEPLOYMENT.md` - Deployment Docker umum

## 🆘 Support

Jika mengalami masalah dengan script:

1. **Check Prerequisites**: Pastikan Docker dan dependencies terinstall
2. **Run with Bash**: Gunakan `bash scripts/script-name.sh`
3. **Check Permissions**: Pastikan script executable (`chmod +x`)
4. **Check Logs**: Lihat output error untuk debugging
5. **Manual Steps**: Follow panduan di DEPLOYMENT_GUIDE.md

**💡 Tip**: Gunakan Git Bash di Windows untuk kompatibilitas terbaik dengan script bash.
