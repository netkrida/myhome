# Dockploy Compose Deployment

Panduan singkat menjalankan deployment MyHome menggunakan docker-compose.yml yang baru.

## Prasyarat
- Docker & Docker Compose sudah terpasang di VPS Dockploy.
- File .env.production sudah berisi kredensial produksi (lihat nilai terbaru di repo).
- DNS domain myhome.co.id sudah diarahkan ke server Dockploy.

## Langkah Deployment
1. Salin source code dan file .env.production ke server Dockploy.
2. Jalankan build & start: docker compose --project-name myhome up -d --build.
3. Pantau log aplikasi: docker compose --project-name myhome logs -f app.
4. Verifikasi health-check: curl https://myhome.co.id/api/health.

## Detail Layanan
- **app**: image Next.js produksi berdasarkan Dockerfile.
  - Menjalankan 
pm run prisma:migrate:deploy sebelum start untuk sinkronisasi schema.
  - Terekspose ke Traefik dengan domain myhome.co.id dan TLS otomatis.
- **postgres**: PostgreSQL 16 dengan data persisten volume postgres_data.

## Variabel Lingkungan Penting
Sudah ter-load dari .env.production, tambah/ubah di Dockploy sesuai kebutuhan:
- AUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, DIRECT_URL
- CLOUDINARY_*, MIDTRANS_* (jika dipakai)
- HOST=0.0.0.0, PORT=3000, NODE_ENV=production

## Operasional
- Cek status layanan: docker compose ps.
- Apply migrations ulang (jika perlu): docker compose run --rm app npm run prisma:migrate:deploy.
- Restart aplikasi: docker compose restart app.
- Hentikan seluruh layanan: docker compose down (tambahkan -v untuk menghapus data Postgres).

## Catatan
- Bila menggunakan database eksternal, override DATABASE_URL & DIRECT_URL di Dockploy dan nonaktifkan service postgres (hapus pada Compose atau jalankan dengan profil terpisah).
- Pastikan port 3000 tidak dipakai service lain di host.
