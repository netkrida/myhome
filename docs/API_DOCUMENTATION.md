# MyHome - Complete API Documentation

## 📋 Overview

Dokumentasi lengkap untuk semua API endpoints dalam sistem MyHome. Sistem ini menggunakan **3-tier architecture** dengan role-based access control untuk manajemen kos dan booking.

- **Base URL**: `http://localhost:3000` (Development)
- **Authentication**: NextAuth.js dengan JWT tokens
- **Response Format**: JSON
- **Architecture**: 3-tier (API Routes → Application Services → Domain Services/Repositories)

## 🏗️ System Architecture

### 3-Tier Architecture
- **Tier 1**: HTTP API Controllers (`src/app/api/`)
- **Tier 2**: Application Services (`src/server/api/`)
- **Tier 3**: Domain Services, Repositories, Adapters (`src/server/services/`, `src/server/repositories/`)

### Role-Based Access Control (RBAC)
- **SUPERADMIN**: Full system access, user management, property approval
- **ADMINKOS**: Property and room management, booking management for own properties
- **RECEPTIONIST**: Front desk operations, booking management
- **CUSTOMER**: Browsing properties, creating bookings

## 🔐 Authentication System

### NextAuth.js Integration
- Session-based authentication dengan JWT
- Credential provider untuk email/password login
- Role-based route protection dengan middleware

## 📡 API Endpoints Overview

### 🔐 Authentication Endpoints
- `GET /api/auth/providers` - Daftar authentication providers
- `GET /api/auth/session` - Informasi session aktif
- `POST /api/auth/register/adminkos` - Registrasi AdminKos
- `POST /api/auth/check-email` - Cek ketersediaan email
- `GET /api/auth/validate-session` - Validasi session
- `POST /api/auth/logout` - Logout
- `POST /api/auth/clear-session` - Clear session
- `POST /api/auth/emergency-reset` - Emergency reset

### 👥 User Management (SUPERADMIN only)
- `GET /api/users` - Daftar semua user dengan filter
- `GET /api/users/{id}` - Detail user berdasarkan ID
- `POST /api/users` - Buat user baru
- `PUT /api/users/{id}` - Update data user
- `DELETE /api/users/{id}` - Soft delete user
- `PATCH /api/users/{id}/status` - Ubah status aktif user
- `PATCH /api/users/{id}/role` - Ubah role user
- `GET /api/users/stats` - Statistik user

### 🏠 Property Management
- `GET /api/properties` - Daftar properti (role-based access)
- `GET /api/properties/{id}` - Detail properti
- `POST /api/properties` - Buat properti baru (ADMINKOS)
- `PUT /api/properties/{id}` - Update properti (ADMINKOS)
- `DELETE /api/properties/{id}` - Soft delete properti (ADMINKOS)
- `PATCH /api/properties/{id}/status` - Approve/reject properti (SUPERADMIN)
- `GET /api/properties/stats` - Statistik properti
- `GET /api/properties/coordinates` - Koordinat untuk map
- `GET /api/properties/public-stats` - Statistik public

### 🛏️ Room Management
- `GET /api/rooms` - Daftar kamar (role-based access)
- `GET /api/rooms/{id}` - Detail kamar
- `POST /api/rooms` - Buat kamar baru (ADMINKOS)
- `PUT /api/rooms/{id}` - Update kamar (ADMINKOS)
- `DELETE /api/rooms/{id}` - Soft delete kamar (ADMINKOS)
- `PATCH /api/rooms/{id}/availability` - Update ketersediaan (ADMINKOS)
- `GET /api/rooms/stats` - Statistik kamar

### 📅 Booking Management
- `GET /api/bookings` - Daftar booking (role-based filtering)
- `GET /api/bookings/{id}` - Detail booking
- `POST /api/bookings` - Buat booking baru
- `POST /api/bookings/calculate` - Hitung harga booking
- `PATCH /api/bookings/{id}/status` - Update status booking
- `PATCH /api/bookings/{id}/cancel` - Cancel booking

### 🌐 Public APIs (No Authentication)
- `GET /api/public/properties` - Daftar properti untuk homepage
- `GET /api/public/properties/{id}` - Detail properti untuk halaman detail
- `GET /api/public/properties/{id}/rooms` - Daftar room dari properti tertentu
- `GET /api/public/rooms/{id}` - Detail room individual

### 🗺️ Location & Geocoding
- `GET /api/wilayah/provinces` - Daftar provinsi
- `GET /api/wilayah/regencies` - Daftar kabupaten/kota
- `GET /api/wilayah/districts` - Daftar kecamatan
- `GET /api/geocoding/reverse` - Reverse geocoding

### 📊 Dashboard & Analytics
- `GET /api/dashboard/overview` - Overview dashboard
- `GET /api/dashboard/stats` - Statistik dashboard
- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/dashboard/activities` - Recent activities

### 📁 File Upload
- `POST /api/upload/image` - Upload image ke Cloudinary (ADMINKOS)

### 🔧 System & Health
- `GET /api/health` - Health check
- `POST /api/cron/expire` - Expire bookings (Cron job)

## 📋 Detailed Endpoint Documentation

### GET /api/public/properties

Mendapatkan daftar properti kos yang sudah disetujui untuk ditampilkan di homepage.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Nomor halaman (min: 1) |
| `limit` | number | No | 12 | Jumlah data per halaman (min: 1, max: 50) |
| `propertyType` | enum | No | - | Filter tipe properti: `MALE_ONLY`, `FEMALE_ONLY`, `MIXED` |
| `regencyCode` | string | No | - | Kode kabupaten/kota |
| `districtCode` | string | No | - | Kode kecamatan |
| `minPrice` | number | No | - | Harga minimum per bulan (Rupiah) |
| `maxPrice` | number | No | - | Harga maksimum per bulan (Rupiah) |
| `sortBy` | enum | No | `newest` | Urutkan berdasarkan: `price`, `newest` |
| `sortOrder` | enum | No | `desc` | Urutan: `asc`, `desc` |

#### Response Format

```json
{
  "success": boolean,
  "data": {
    "properties": [
      {
        "id": "string",
        "name": "string",
        "propertyType": "MALE_ONLY" | "FEMALE_ONLY" | "MIXED",
        "availableRooms": number,
        "facilities": [
          {
            "id": "string",
            "name": "string",
            "category": "property" | "parking"
          }
        ],
        "cheapestMonthlyPrice": number,
        "mainImage": "string | null",
        "location": {
          "districtName": "string",
          "regencyName": "string"
        }
      }
    ],
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrev": boolean
    }
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "string",
  "details": [
    {
      "code": "string",
      "message": "string",
      "path": ["string"]
    }
  ]
}
```

## 🔧 Usage Examples

### 1. Basic Request
```bash
GET /api/public/properties?page=1&limit=12
```

### 2. Filter by Property Type
```bash
GET /api/public/properties?propertyType=MALE_ONLY
```

### 3. Filter by Location
```bash
GET /api/public/properties?regencyCode=3171&districtCode=317101
```

### 4. Filter by Price Range
```bash
GET /api/public/properties?minPrice=500000&maxPrice=2000000
```

### 5. Sort by Price
```bash
GET /api/public/properties?sortBy=price&sortOrder=asc
```

### 6. Complex Filter
```bash
GET /api/public/properties?propertyType=MIXED&regencyCode=3171&minPrice=800000&maxPrice=1500000&sortBy=price&sortOrder=asc
```

## 📊 Response Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (Invalid parameters) |
| 500 | Internal Server Error |

## 🎯 Data Fields Explanation

### Property Object

- **id**: Unique identifier properti
- **name**: Nama kos
- **propertyType**: Tipe properti (MALE_ONLY/FEMALE_ONLY/MIXED)
- **availableRooms**: Jumlah kamar yang tersedia
- **facilities**: Array fasilitas yang tersedia
- **cheapestMonthlyPrice**: Harga bulanan termurah dari semua kamar
- **mainImage**: URL gambar utama (kategori BUILDING_PHOTOS, sortOrder terkecil)
- **location**: Informasi lokasi (kecamatan dan kabupaten/kota)

### Pagination Object

- **page**: Halaman saat ini
- **limit**: Jumlah data per halaman
- **total**: Total data keseluruhan
- **totalPages**: Total halaman
- **hasNext**: Apakah ada halaman selanjutnya
- **hasPrev**: Apakah ada halaman sebelumnya

## 🚀 Import ke Postman

1. Download file `postman-collection-public-properties-api.json`
2. Buka Postman
3. Klik **Import** di pojok kiri atas
4. Pilih file JSON yang sudah didownload
5. Collection akan otomatis ter-import dengan semua contoh request

## 🔍 Testing

Setelah import ke Postman, Anda dapat:

1. **Set Environment Variable**: 
   - Buat environment baru
   - Set variable `base_url` = `http://localhost:3000`

2. **Test Basic Request**:
   - Jalankan "Get All Properties (Basic)"
   - Pastikan mendapat response 200

3. **Test Filtering**:
   - Coba berbagai kombinasi filter
   - Perhatikan perubahan hasil

4. **Test Error Handling**:
   - Jalankan "Invalid Parameters"
   - Pastikan mendapat response 400 dengan detail error

## 🏠 Public Property Detail API

### GET /api/public/properties/{id}

Mendapatkan detail lengkap properti untuk halaman detail public.

**Parameters:**
- `id` (path): Property ID (CUID format)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "clm123...",
    "name": "Kos Putri Melati",
    "buildYear": 2020,
    "propertyType": "FEMALE_ONLY",
    "description": "Kos nyaman untuk putri...",
    "roomTypes": ["Standard", "VIP"],
    "totalRooms": 20,
    "availableRooms": 15,
    "location": {
      "provinceCode": "32",
      "provinceName": "Jawa Barat",
      "regencyCode": "3273",
      "regencyName": "Kota Bandung",
      "districtCode": "327301",
      "districtName": "Coblong",
      "fullAddress": "Jl. Dago No. 123, Bandung",
      "latitude": -6.8915,
      "longitude": 107.6107
    },
    "facilities": [...],
    "rules": [...],
    "images": [
      {
        "id": "img123...",
        "category": "BUILDING_PHOTOS",
        "imageUrl": "https://cloudinary.com/...",
        "caption": "Tampak depan",
        "sortOrder": 0
      }
    ],
    "rooms": [
      {
        "id": "room123...",
        "roomNumber": "101",
        "floor": 1,
        "roomType": "Standard",
        "description": "Kamar nyaman dengan AC",
        "size": "3x4 meter",
        "monthlyPrice": 1500000,
        "dailyPrice": 75000,
        "depositRequired": true,
        "depositType": "PERCENTAGE",
        "depositValue": 50,
        "facilities": [...],
        "isAvailable": true,
        "images": [...]
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Invalid property ID format",
  "details": [...]
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": "Property not found or not available for public viewing"
}
```

## 📝 Notes

- API ini hanya menampilkan properti dengan status `APPROVED`
- Harga yang ditampilkan adalah harga termurah dari semua kamar di properti tersebut
- Gambar utama diambil dari kategori `BUILDING_PHOTOS` dengan `sortOrder` terkecil
- Pagination maksimal 50 items per halaman untuk performa optimal
- Semua filter bersifat opsional dan dapat dikombinasikan
- API detail properti menampilkan semua data lengkap termasuk semua room dan gambar
