# Supabase Database Setup Guide

## Prerequisites

1. **Supabase Account**: Create account di [supabase.com](https://supabase.com)
2. **Project Created**: Buat project baru di Supabase dashboard

## Database Configuration

### 1. Environment Variables

Copy `.env.example` ke `.env` dan update dengan kredensial Supabase Anda:

```bash
cp .env.example .env
```

Update file `.env`:

```env
# Supabase Database URLs
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth Configuration
AUTH_SECRET="[GENERATE-RANDOM-SECRET]"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="dg0ybxdbt"
CLOUDINARY_API_KEY="836543447587342"
CLOUDINARY_API_SECRET="[YOUR-CLOUDINARY-SECRET]"
```

### 2. Mendapatkan Database URL

1. **Login ke Supabase Dashboard**
2. **Pilih Project** Anda
3. **Go to Settings** → **Database**
4. **Copy Connection String** dengan format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Database Schema Setup

Jalankan migrasi Prisma untuk membuat schema di Supabase:

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke Supabase
npx prisma db push

# (Optional) Seed database dengan data awal
npx prisma db seed
```

## Schema Features

### Models yang Sudah Dikonfigurasi:

1. **User Management**
   - `User` - User utama dengan role-based access
   - `AdminKosProfile` - Profile untuk admin kos
   - `ReceptionistProfile` - Profile untuk receptionist
   - `CustomerProfile` - Profile untuk customer

2. **Property Management**
   - `Property` - Data properti kos
   - `PropertyImage` - Gambar properti (multiple categories)
   - `PropertyStatusHistory` - History perubahan status

3. **Room Management**
   - `Room` - Data kamar dengan pricing
   - `RoomImage` - Gambar kamar

4. **Authentication**
   - `Account` - NextAuth accounts
   - `Session` - User sessions
   - `VerificationToken` - Email verification

### Enums yang Tersedia:

- `UserRole`: SUPERADMIN, ADMINKOS, RECEPTIONIST, CUSTOMER
- `PropertyType`: MALE_ONLY, FEMALE_ONLY, MIXED
- `PropertyStatus`: PENDING, APPROVED, REJECTED, SUSPENDED
- `ImageCategory`: BUILDING_PHOTOS, SHARED_FACILITIES_PHOTOS, FLOOR_PLAN_PHOTOS, ROOM_PHOTOS, BATHROOM_PHOTOS
- `DepositPercentage`: TEN_PERCENT, TWENTY_PERCENT, THIRTY_PERCENT, FORTY_PERCENT, FIFTY_PERCENT

## Security Considerations

### 1. Row Level Security (RLS)

Supabase mendukung RLS. Anda bisa menambahkan policies untuk keamanan:

```sql
-- Enable RLS on tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own data
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);
```

### 2. Database Indexes

Schema sudah include indexes untuk performa optimal:
- User email dan role
- Property status dan location
- Room availability
- Image categories

## Migration Commands

```bash
# Reset database (DANGER: akan hapus semua data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name [migration-name]

# Deploy migrations to production
npx prisma migrate deploy

# View database in browser
npx prisma studio
```

## Troubleshooting

### Common Issues:

1. **Connection Error**
   - Pastikan DATABASE_URL benar
   - Check password dan project reference
   - Pastikan Supabase project aktif

2. **Migration Fails**
   - Check DIRECT_URL configuration
   - Pastikan tidak ada data yang conflict

3. **Permission Denied**
   - Check RLS policies jika diaktifkan
   - Pastikan user memiliki permission yang tepat

## Production Deployment

Untuk production, pastikan:

1. **Environment Variables** di platform deployment (Vercel, Netlify, etc.)
2. **Database Connection Pooling** sudah dikonfigurasi
3. **Backup Strategy** untuk data penting
4. **Monitoring** untuk performa database

## Next Steps

Setelah database setup:

1. **Test Connection**: `npm run dev` dan check console
2. **Create Admin User**: Register user pertama sebagai SUPERADMIN
3. **Upload Test Data**: Test property dan room creation
4. **Configure Cloudinary**: Setup image upload functionality
