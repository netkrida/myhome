# Public Property Room Types API

## 📋 Overview

API ini menyediakan endpoint untuk mengambil detail room types dari properti beserta informasi ketersediaan kamar (terisi/kosong) yang dapat diakses secara public tanpa autentikasi. API ini dirancang khusus untuk menampilkan breakdown room types dengan status availability real-time.

## 🏗️ Arsitektur

API ini mengikuti arsitektur 3-tier yang sudah ada:

- **Tier 1 (Controller)**: `src/app/api/public/properties/[id]/room-types/route.ts`
- **Tier 2 (Application Service)**: Tidak diperlukan untuk API public sederhana
- **Tier 3 (Repository)**: `RoomRepository.getPropertyRoomTypes()` di `src/server/repositories/room.repository.ts`

## 🔗 Endpoint

### GET /api/public/properties/{id}/room-types

Mengambil detail room types dari properti beserta informasi availability setiap kamar.

#### Path Parameters
- `id` (string, required): Property ID dalam format CUID

#### Query Parameters
- `includeOccupied` (boolean, optional): Include occupied rooms in response. Default: false
- `roomType` (string, optional): Filter by specific room type

#### Response Format

```json
{
  "success": true,
  "data": {
    "property": {
      "id": "clm123abc456def",
      "name": "Kos Mawar Indah",
      "propertyType": "FEMALE_ONLY",
      "fullAddress": "Jl. Mawar No. 123, Jakarta Selatan",
      "totalRooms": 20,
      "availableRooms": 15
    },
    "roomTypes": [
      {
        "roomType": "Kamar Standard",
        "description": "Kamar dengan fasilitas dasar",
        "totalRooms": 10,
        "availableRooms": 7,
        "occupiedRooms": 3,
        "pricing": {
          "monthlyPrice": 1000000,
          "dailyPrice": 50000,
          "weeklyPrice": 300000,
          "quarterlyPrice": 2800000,
          "yearlyPrice": 11000000
        },
        "depositInfo": {
          "depositRequired": true,
          "depositType": "PERCENTAGE",
          "depositValue": 20
        },
        "facilities": [
          {
            "id": "kasur",
            "name": "Kasur",
            "category": "room"
          },
          {
            "id": "lemari_pakaian",
            "name": "Lemari Pakaian",
            "category": "room"
          }
        ],
        "rooms": [
          {
            "id": "clm456def789ghi",
            "roomNumber": "101",
            "floor": 1,
            "isAvailable": true,
            "isOccupied": false,
            "currentBooking": null,
            "mainImage": "https://res.cloudinary.com/dg0ybxdbt/image/upload/v1234567890/room_101.jpg"
          },
          {
            "id": "clm789ghi012jkl",
            "roomNumber": "102",
            "floor": 1,
            "isAvailable": false,
            "isOccupied": true,
            "currentBooking": {
              "id": "clm012jkl345mno",
              "bookingCode": "BK-2024-001",
              "checkInDate": "2024-01-15T00:00:00.000Z",
              "checkOutDate": null,
              "status": "CHECKED_IN",
              "customerName": "Siti Nurhaliza"
            },
            "mainImage": "https://res.cloudinary.com/dg0ybxdbt/image/upload/v1234567890/room_102.jpg"
          }
        ],
        "mainImage": "https://res.cloudinary.com/dg0ybxdbt/image/upload/v1234567890/standard_room.jpg"
      }
    ],
    "summary": {
      "totalRoomTypes": 2,
      "totalRooms": 20,
      "totalAvailable": 15,
      "totalOccupied": 5
    }
  }
}
```

#### Error Responses

**400 Bad Request**
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

**404 Not Found**
```json
{
  "success": false,
  "error": "Property not found or not available for public viewing"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## 🔒 Security & Access Control

- **Public Access**: Tidak memerlukan autentikasi
- **Property Status**: Hanya property dengan status `APPROVED` yang dapat diakses
- **Data Filtering**: Sensitive data seperti owner details tidak disertakan

## 📊 Business Logic

### Room Availability Logic
- **Available**: `isAvailable = true` DAN tidak ada booking aktif
- **Occupied**: Ada booking dengan status `CONFIRMED`, `CHECKED_IN`, atau `DEPOSIT_PAID`
- **Booking Status**: Hanya booking yang belum expired yang dianggap aktif

### Room Type Grouping
- Rooms dikelompokkan berdasarkan `roomType`
- Pricing dan facilities diambil dari room pertama dalam group
- Availability dihitung per room type

## 🚀 Usage Examples

### Basic Request
```bash
GET /api/public/properties/clm123abc456def/room-types
```

### Include Occupied Rooms
```bash
GET /api/public/properties/clm123abc456def/room-types?includeOccupied=true
```

### Filter by Room Type
```bash
GET /api/public/properties/clm123abc456def/room-types?roomType=Kamar%20Standard
```

### Combined Filters
```bash
GET /api/public/properties/clm123abc456def/room-types?includeOccupied=true&roomType=Kamar%20AC
```

## 🔄 Integration Notes

- API ini terintegrasi dengan sistem property dan booking management
- Real-time availability berdasarkan booking status terkini
- Menggunakan Cloudinary untuk image hosting
- Response format konsisten dengan API public lainnya
- Logging lengkap untuk monitoring dan debugging

## 📈 Performance Considerations

- Query dioptimasi dengan proper indexing
- Hanya mengambil main image per room untuk performa
- Booking query dibatasi pada status aktif saja
- Property validation dilakukan di awal untuk early exit

## 🧪 Testing

Gunakan tools seperti Postman atau curl untuk testing:

```bash
# Test basic functionality
curl -X GET "http://localhost:3001/api/public/properties/{property-id}/room-types"

# Test with filters
curl -X GET "http://localhost:3001/api/public/properties/{property-id}/room-types?includeOccupied=true"
```
