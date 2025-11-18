# 🚀 Quick Fix: Cloudinary Images Not Showing in Production

## Problem
Gambar iklan tidak muncul di production environment meskipun sudah ter-upload ke Cloudinary.

## Root Cause
Missing client-side environment variable `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

## Solution (3 Steps)

### 1️⃣ Add Environment Variable

Tambahkan ke file `.env` atau environment variables di hosting Anda:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

**Note**: Gunakan cloud name yang sama dengan `CLOUDINARY_CLOUD_NAME` yang sudah ada.

### 2️⃣ Rebuild Application

```bash
# Local
npm run build

# Docker
docker-compose down
docker-compose up --build -d

# Dokploy
# Trigger rebuild di Dokploy dashboard
```

### 3️⃣ Restart Application

```bash
# Docker
docker-compose restart

# PM2
pm2 restart all

# Dokploy/VPS
systemctl restart your-app-service
```

## Verification

1. Buka `/dashboard/superadmin/iklan`
2. Check apakah gambar iklan sudah muncul
3. Upload iklan baru dan pastikan preview-nya muncul

## Example Configuration

**Docker Compose** (`docker-compose.yml`):
```yaml
environment:
  - CLOUDINARY_CLOUD_NAME=dg0ybxdbt
  - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dg0ybxdbt  # ← Add this
```

**Dokploy/VPS** (.env):
```bash
CLOUDINARY_CLOUD_NAME="dg0ybxdbt"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dg0ybxdbt"  # ← Add this
```

## Why This Fix Works

- `CLOUDINARY_CLOUD_NAME` = Server-side only (untuk upload)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = Client-side (untuk display di browser)

Next.js requires `NEXT_PUBLIC_` prefix for environment variables yang diakses di client components.

## Need More Details?

See: `docs/CLOUDINARY_IMAGE_FIX.md` for complete technical documentation.
