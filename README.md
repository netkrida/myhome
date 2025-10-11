<!-- BADGES -->
![Node.js](https://img.shields.io/badge/Node-20.x-green?logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue?logo=prisma)
![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

# MyHome – Platform Pemesanan Kos

MyHome adalah platform pemesanan kos yang memudahkan pencari kos menemukan properti, melihat tipe kamar, melakukan pemesanan dan pembayaran online, serta memberi pemilik kos dashboard pengelolaan. Dirancang untuk SuperAdmin, AdminKos, dan Customer, MyHome mengutamakan kemudahan, keamanan, dan otomasi proses booking kos.

---

## Fitur Utama

- Pencarian & filter kos
- Halaman detail properti
- Tipe kamar & ketersediaan real-time
- Booking & pembayaran online (Midtrans)
- Dashboard admin multi-role (SuperAdmin, AdminKos, Receptionist, Customer)
- Upload gambar properti (Cloudinary atau storage VPS)
- Autentikasi & otorisasi (NextAuth)
- Notifikasi status pesanan & refund notice
- Monitoring transaksi & notifikasi Midtrans (khusus SuperAdmin)

---

## Demo & Screenshot

Demo: [https://myhome.co.id](https://myhome.co.id)

| Home | Detail Properti | Dashboard |
|------|-----------------|-----------|
| ![](./public/screnshoot-web/home.png) | ![](./public/screnshoot-web/property-detail.png) | ![](./public/screnshoot-web/dashboard.png) |

---

## Galeri Screenshot Lengkap

| Tampilan | Gambar |
|----------|--------|
| Home | ![](./public/screnshoot-web/home.png) |
| Detail Properti | ![](./public/screnshoot-web/property-detail.png) |
| Dashboard | ![](./public/screnshoot-web/dashboard.png) |
| Booking | ![](./public/screnshoot-web/image4.png) |
| Pembayaran | ![](./public/screnshoot-web/image5.png) |
| Notifikasi | ![](./public/screnshoot-web/image6.png) |
| Monitoring Transaksi | ![](./public/screnshoot-web/image7.png) |

---

## Arsitektur & Tech Stack

**Arsitektur 3-Tier:**

- **Tier 1: UI (app/*)**
  - Server/Client Components Next.js 15
  - Hanya memanggil API internal atau server actions
- **Tier 2: Controller/API (app/api/**/route.ts)**
  - Validasi input (Zod), otorisasi, mapping DTO, HTTP status
- **Tier 3: Service/Domain**
  - `server/api/*`, `server/services/*`, `server/repositories/*`, `server/db/*`, `server/schemas|types|lib/*`
  - Logika bisnis, akses DB, integrasi eksternal

**Stack:**
- Next.js 15, TypeScript, Prisma, PostgreSQL
- NextAuth, Shadcn UI, Tailwind CSS
- Docker, Dockploy
- Midtrans (pembayaran)
- Cloudinary / VPS storage (upload gambar)

**Diagram Alur Request:**

```
Client → app/* (UI) → app/api/**/route.ts (API) → server/api/* (Service) → server/repositories/* (Repo) → DB
```

---

## Struktur Folder

```
app/
  (public-pages)/
  (protected-pages)/
  api/
    ...
server/
  api/
  services/
  repositories/
  db/
  schemas/
  types/
  lib/
prisma/
  schema.prisma
  seed-superadmin.ts
src/
  components/
    ui/
    dashboard/
public/
  screnshoot-web/
    home.png
    property-detail.png
    dashboard.png
```

---

## Prasyarat

- Node.js 20.x
- PNPM/NPM
- Docker & Docker Compose
- Database PostgreSQL
- Akses Midtrans (Server & Client Key)
- (Opsional) NVM untuk Windows

---

## Konfigurasi Lingkungan (.env)

```env
DATABASE_URL=postgresql://postgres:myhome123@postgres:5432/db_myhome
DIRECT_URL=postgresql://postgres:myhome123@postgres:5432/db_myhome
NEXTAUTH_URL=https://myhome.co.id
AUTH_SECRET=your-secret-here
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
STORAGE_DRIVER=local # atau 'cloudinary'
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
FILE_STORAGE_PATH=/data/uploads
```

**Cloudinary**: Untuk upload gambar properti secara global, cocok untuk deployment cloud.

**Storage VPS (local)**: Simpan file di server sendiri, path volume Docker: `/data/uploads`.

---

## Instalasi & Pengembangan Lokal

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm dev
```

Seed SuperAdmin (wajib untuk login awal):

```bash
pnpm ts-node prisma/seed-superadmin.ts
```

- Email: `superadmin@myhome.co.id`
- Password: `@superadmin@myhome.co5432` _(ganti setelah deploy)_

---

## Migrasi & Seed

- **Migrasi DB:**  
  `pnpm prisma migrate dev` (dev)  
  `pnpm prisma db push` (sync schema tanpa migrasi)
- **Seed SuperAdmin:**  
  `pnpm ts-node prisma/seed-superadmin.ts`  
  _Jangan gunakan kredensial seed di production._

---

## Build & Deploy (Docker + Dockploy)

**Build & Run:**

```bash
docker build -t myhome-app .
docker compose up -d
```

**Volume Penting:**

- `postgres:/var/lib/postgresql/data` (data DB)
- `uploads:/app/public/uploads` (atau `/data/uploads` untuk storage VPS)

**Dockploy:**  
Pastikan variabel env, healthcheck, scale, dan log sudah diatur di file Dockploy.

---

## Integrasi Pembayaran (Midtrans)

1. User booking → create transaction (API)
2. Redirect ke Snap/Payment Page Midtrans
3. Callback/notification dari Midtrans ke endpoint backend
4. Update status pembayaran di DB
5. Jika refund, sistem kirim notifikasi & update status

_Cek dokumen Midtrans untuk detail implementasi dan best practice._

---

## Keamanan & Praktik Baik

- Simpan secret di server (jangan expose ke client)
- Validasi input dengan Zod di API
- Pembatasan role & otorisasi di setiap endpoint
- Backup database & rotasi token secara berkala

---

## Testing

- Unit test untuk domain/service
- Integration test controller via fetch ke `app/api`

---

## Roadmap

- Multi-currency & multi-language
- Kupon/discount
- Multi-tenant (banyak pemilik kos)
- Laporan pajak otomatis
- PWA & mobile support

---

## Kontribusi

1. Fork & clone repo
2. Buat branch fitur/bugfix
3. PR ke `main` dengan deskripsi jelas

---


**MyHome – Platform Pemesanan Kos**  
© 2025 MyHome Team
