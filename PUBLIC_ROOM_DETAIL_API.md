# Public Room Detail API

## 📋 Overview

API ini menyediakan endpoint untuk mengambil detail room dan daftar room dari properti yang dapat diakses secara public tanpa autentikasi. API ini dirancang khusus untuk halaman detail properti dan detail room di frontend public.

## 🏗️ Arsitektur

API ini mengikuti arsitektur 3-tier yang sudah ada:

- **Tier 1 (Controller)**: 
  - `src/app/api/public/rooms/[id]/route.ts` - Detail room individual
  - `src/app/api/public/properties/[id]/rooms/route.ts` - Daftar room dari property
- **Tier 2 (Application Service)**: Tidak diperlukan untuk API public sederhana
- **Tier 3 (Repository)**: 
  - `RoomRepository.getPublicRoomDetail()` - Detail room
  - `RoomRepository.getPublicPropertyRooms()` - Daftar room property

## 🔗 Endpoints

### 1. GET /api/public/rooms/{id}

Mengambil detail lengkap room berdasarkan ID.

**URL**: `/api/public/rooms/{id}`  
**Method**: `GET`  
**Authentication**: Tidak diperlukan  

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Room ID |

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id": "room_123",
    "roomNumber": "A101",
    "floor": 1,
    "roomType": "Kamar AC",
    "description": "Kamar nyaman dengan AC dan fasilitas lengkap",
    "size": "3x4m",
    "monthlyPrice": 1200000,
    "dailyPrice": 50000,
    "weeklyPrice": 300000,
    "quarterlyPrice": 3500000,
    "yearlyPrice": 13000000,
    "depositRequired": true,
    "depositType": "PERCENTAGE",
    "depositValue": 20,
    "facilities": [
      {
        "id": "kasur",
        "name": "Kasur / Spring bed",
        "category": "room"
      },
      {
        "id": "ac_kipas",
        "name": "AC / Kipas angin",
        "category": "room"
      }
    ],
    "isAvailable": true,
    "images": [
      {
        "id": "img_123",
        "category": "ROOM_PHOTOS",
        "imageUrl": "https://res.cloudinary.com/...",
        "caption": "Tampak depan kamar",
        "sortOrder": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "property": {
      "id": "prop_123",
      "name": "Kos Mawar Indah",
      "propertyType": "KOS_PUTRA",
      "location": {
        "provinceName": "DKI Jakarta",
        "regencyName": "Jakarta Selatan",
        "districtName": "Kebayoran Baru",
        "fullAddress": "Jl. Mawar No. 123, Kebayoran Baru"
      },
      "owner": {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "081234567890"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Response Error (404)

```json
{
  "success": false,
  "error": "Room not found or not available for public viewing"
}
```

### 2. GET /api/public/properties/{id}/rooms

Mengambil daftar room dari properti tertentu dengan filtering dan pagination.

**URL**: `/api/public/properties/{id}/rooms`  
**Method**: `GET`  
**Authentication**: Tidak diperlukan  

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | Yes | - | Property ID (path parameter) |
| `page` | number | No | 1 | Halaman |
| `limit` | number | No | 12 | Jumlah item per halaman (max 50) |
| `roomType` | string | No | - | Filter berdasarkan tipe room |
| `isAvailable` | boolean | No | - | Filter berdasarkan ketersediaan |
| `minPrice` | number | No | - | Harga minimum (monthly) |
| `maxPrice` | number | No | - | Harga maksimum (monthly) |
| `floor` | number | No | - | Filter berdasarkan lantai |
| `sortBy` | string | No | roomNumber | Sorting field: roomNumber, floor, monthlyPrice |
| `sortOrder` | string | No | asc | Sorting order: asc, desc |

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "room_123",
        "roomNumber": "A101",
        "floor": 1,
        "roomType": "Kamar AC",
        "description": "Kamar nyaman dengan AC",
        "size": "3x4m",
        "monthlyPrice": 1200000,
        "dailyPrice": 50000,
        "weeklyPrice": 300000,
        "quarterlyPrice": 3500000,
        "yearlyPrice": 13000000,
        "depositRequired": true,
        "depositType": "PERCENTAGE",
        "depositValue": 20,
        "facilities": [...],
        "isAvailable": true,
        "mainImage": "https://res.cloudinary.com/..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Response Error (404)

```json
{
  "success": false,
  "error": "Property not found or not available for public viewing"
}
```

## 🔒 Security & Access Control

- **Public Access**: Kedua endpoint dapat diakses tanpa autentikasi
- **Data Filtering**: Hanya menampilkan room dari properti dengan status `APPROVED`
- **Data Sanitization**: Semua data sudah difilter dan divalidasi sebelum dikembalikan

## 📝 Validation

### Room ID Validation
- Required: Room ID harus ada
- Format: String tidak kosong

### Query Parameters Validation
- `page`: Minimum 1
- `limit`: Minimum 1, maksimum 50
- `minPrice`, `maxPrice`: Tidak boleh negatif
- `minPrice` harus ≤ `maxPrice` jika keduanya ada
- `floor`: Minimum 1
- `sortBy`: Hanya menerima nilai yang diizinkan
- `sortOrder`: Hanya `asc` atau `desc`

## 🚀 Usage Examples

### Mendapatkan Detail Room
```bash
GET /api/public/rooms/clm123abc456def
```

### Mendapatkan Daftar Room Property
```bash
# Basic request
GET /api/public/properties/clm123abc456def/rooms

# With filtering
GET /api/public/properties/clm123abc456def/rooms?page=1&limit=10&roomType=AC&isAvailable=true&minPrice=1000000&maxPrice=2000000&sortBy=monthlyPrice&sortOrder=asc
```

## 🔄 Integration Notes

- API ini terintegrasi dengan sistem property management yang sudah ada
- Menggunakan Cloudinary untuk image hosting
- Response format konsisten dengan API public lainnya
- Mendukung pagination untuk performa yang optimal
- Logging lengkap untuk monitoring dan debugging

## 📊 Performance Considerations

- Pagination default 12 items untuk mengurangi load
- Image optimization melalui Cloudinary
- Database indexing pada field yang sering diquery
- Caching dapat ditambahkan di level CDN/proxy
