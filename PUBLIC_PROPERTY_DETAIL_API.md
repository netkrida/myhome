# Public Property Detail API

## 📋 Overview

API ini menyediakan endpoint untuk mengambil detail lengkap properti yang dapat diakses secara public tanpa autentikasi. API ini dirancang khusus untuk halaman detail properti di frontend public.

## 🏗️ Arsitektur

API ini mengikuti arsitektur 3-tier yang sudah ada:

- **Tier 1 (Controller)**: `src/app/api/public/properties/[id]/route.ts`
- **Tier 2 (Application Service)**: Tidak diperlukan untuk API public sederhana
- **Tier 3 (Repository)**: `PropertyRepository.getPublicPropertyDetail()` di `src/server/repositories/property.repository.ts`

## 🔗 Endpoint

### GET /api/public/properties/{id}

Mengambil detail lengkap properti berdasarkan ID.

**URL**: `/api/public/properties/{id}`  
**Method**: `GET`  
**Auth Required**: No  
**Permissions Required**: None

#### URL Parameters

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| id        | string | Yes      | Property ID (CUID format)      |

#### Success Response

**Code**: `200 OK`

**Content Example**:
```json
{
  "success": true,
  "data": {
    "id": "cmg51mxxn000buovwm83ypxl8",
    "name": "KOS INDAH SEKALI",
    "buildYear": 2025,
    "propertyType": "MIXED",
    "description": "kos ini sangat bagus",
    "roomTypes": ["Kamar Standard"],
    "totalRooms": 1,
    "availableRooms": 1,
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
    "facilities": [
      {
        "id": "lemari",
        "name": "Lemari pakaian",
        "category": "property"
      }
    ],
    "rules": [
      {
        "id": "no_smoking",
        "name": "Dilarang merokok",
        "category": "general"
      }
    ],
    "images": [
      {
        "id": "img123",
        "category": "BUILDING_PHOTOS",
        "imageUrl": "https://cloudinary.com/...",
        "caption": "Tampak depan",
        "sortOrder": 0,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "rooms": [
      {
        "id": "room123",
        "roomNumber": "101",
        "floor": 1,
        "roomType": "Kamar Standard",
        "description": "Kamar nyaman dengan AC",
        "size": "3x4 meter",
        "monthlyPrice": 1500000,
        "dailyPrice": 75000,
        "weeklyPrice": 450000,
        "quarterlyPrice": 4200000,
        "yearlyPrice": 16000000,
        "depositRequired": true,
        "depositType": "PERCENTAGE",
        "depositValue": 50,
        "facilities": [
          {
            "id": "ac",
            "name": "AC",
            "category": "room"
          }
        ],
        "isAvailable": true,
        "images": [
          {
            "id": "roomimg123",
            "category": "ROOM_PHOTOS",
            "imageUrl": "https://cloudinary.com/...",
            "caption": "Interior kamar",
            "sortOrder": 0,
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

**Code**: `400 Bad Request`
```json
{
  "success": false,
  "error": "Invalid property ID format",
  "details": [
    {
      "code": "invalid_string",
      "message": "Invalid cuid",
      "path": ["id"]
    }
  ]
}
```

**Code**: `404 Not Found`
```json
{
  "success": false,
  "error": "Property not found or not available for public viewing"
}
```

**Code**: `500 Internal Server Error`
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## 🔒 Business Rules

1. **Status Filter**: Hanya properti dengan status `APPROVED` yang dapat diakses
2. **Public Access**: Tidak memerlukan autentikasi
3. **Complete Data**: Mengembalikan semua data properti termasuk:
   - Informasi dasar properti
   - Lokasi lengkap dengan koordinat
   - Fasilitas dan aturan
   - Semua gambar properti (sorted by sortOrder)
   - Semua room dengan detail lengkap
   - Semua gambar room (sorted by sortOrder)

## 🧪 Testing

### Automated Tests

Jalankan test otomatis:
```bash
npm run test:api
```

Test mencakup:
- ✅ Validasi format ID yang tidak valid (400)
- ✅ Property yang tidak ditemukan (404)
- ✅ Property yang valid dan approved (200)
- ✅ Response time yang wajar (< 5 detik)
- ✅ Concurrent requests handling

### Manual Testing

```bash
# Test valid property
curl -X GET "http://localhost:3000/api/public/properties/cmg51mxxn000buovwm83ypxl8"

# Test invalid ID format
curl -X GET "http://localhost:3000/api/public/properties/invalid-id"

# Test non-existent property
curl -X GET "http://localhost:3000/api/public/properties/clm0000000000000000000000"
```

## 📊 Performance

- **Response Time**: < 1 detik untuk properti dengan data lengkap
- **Concurrent Requests**: Dapat menangani multiple requests bersamaan
- **Database Queries**: Optimized dengan include relations dalam single query

## 🔄 Integration

API ini terintegrasi dengan:
- **PropertyRepository**: Untuk data access layer
- **Prisma ORM**: Untuk database operations
- **Zod Validation**: Untuk input validation
- **TypeScript**: Untuk type safety

## 📝 Notes

- API ini read-only dan tidak mengubah data
- Semua gambar di-sort berdasarkan `sortOrder` ascending
- Room list di-sort berdasarkan `roomNumber` ascending
- Harga dalam format number (Rupiah)
- Koordinat dalam format decimal degrees
- Timestamp dalam format ISO 8601
