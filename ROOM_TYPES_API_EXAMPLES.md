# Room Types API - Contoh Penggunaan

## 📋 Overview

Dokumen ini berisi contoh-contoh penggunaan API `/api/public/properties/[id]/room-types` yang telah berhasil dibuat dan diuji.

## 🔗 Base URL
```
http://localhost:3000/api/public/properties/[property-id]/room-types
```

## 📝 Contoh Response Lengkap

### Request
```bash
GET /api/public/properties/cmg9kg8sv0001uoxsb7htjuyl/room-types
```

### Response
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "cmg9kg8sv0001uoxsb7htjuyl",
      "name": "KOS MAWAR INDAH",
      "propertyType": "MIXED",
      "fullAddress": "Maton House, Marpoyan Damai, Pekanbaru, Riau, 28282",
      "totalRooms": 10,
      "availableRooms": 8
    },
    "roomTypes": [
      {
        "roomType": "Kamar Standard",
        "description": "Kamar Standar: Hunian nyaman & hemat, fasilitas dasar lengkap, cocok untuk mahasiswa & pekerja.",
        "totalRooms": 4,
        "availableRooms": 4,
        "occupiedRooms": 0,
        "pricing": {
          "monthlyPrice": 300000
        },
        "depositInfo": {
          "depositRequired": false,
          "depositType": "PERCENTAGE"
        },
        "facilities": [
          {
            "id": "kasur",
            "name": "Kasur / Spring bed",
            "category": "room"
          },
          {
            "id": "lemari_pakaian",
            "name": "Lemari pakaian",
            "category": "room"
          }
          // ... more facilities
        ],
        "rooms": [
          {
            "id": "cmg9kvgpd0006uoxs6tm30hb2",
            "roomNumber": "1",
            "floor": 1,
            "isAvailable": true,
            "isOccupied": false,
            "mainImage": "https://res.cloudinary.com/dg0ybxdbt/image/upload/v1759418866/kos-properties/rooms/yhingl1vgxjphjfsoufk.png"
          }
          // ... more rooms
        ],
        "mainImage": "https://res.cloudinary.com/dg0ybxdbt/image/upload/v1759418866/kos-properties/rooms/yhingl1vgxjphjfsoufk.png"
      },
      {
        "roomType": "Kamar VIP",
        "description": "Kamar VIP di Kos Mawar Indah menawarkan hunian luas, modern, dan eksklusif dengan kenyamanan maksimal.",
        "totalRooms": 6,
        "availableRooms": 4,
        "occupiedRooms": 0,
        "pricing": {
          "monthlyPrice": 400000
        },
        "depositInfo": {
          "depositRequired": false,
          "depositType": "PERCENTAGE"
        },
        "facilities": [
          // ... facilities list
        ],
        "rooms": [
          // ... rooms list with availability info
        ],
        "mainImage": "https://res.cloudinary.com/dg0ybxdbt/image/upload/v1759418885/kos-properties/rooms/fnyg5swxnhl4t5oiyc5f.png"
      }
    ],
    "summary": {
      "totalRoomTypes": 2,
      "totalRooms": 10,
      "totalAvailable": 8,
      "totalOccupied": 0
    }
  }
}
```

## 🎯 Fitur Utama yang Berhasil Diimplementasi

### ✅ 1. Grouping by Room Type
- Rooms dikelompokkan berdasarkan `roomType`
- Setiap room type menampilkan summary availability
- Pricing dan facilities diambil dari room pertama dalam group

### ✅ 2. Real-time Availability Status
- `isAvailable`: Status availability dari database
- `isOccupied`: Berdasarkan booking aktif (CONFIRMED, CHECKED_IN, DEPOSIT_PAID)
- `currentBooking`: Info booking aktif jika ada

### ✅ 3. Comprehensive Room Information
- Detail setiap kamar dengan nomor, lantai, dan gambar
- Pricing information per room type
- Facilities breakdown per category (room, bathroom)
- Deposit information

### ✅ 4. Filtering Options
- `includeOccupied=true`: Menampilkan kamar yang terisi
- `roomType=Kamar Standard`: Filter berdasarkan tipe kamar tertentu

### ✅ 5. Summary Statistics
- Total room types dalam property
- Total rooms, available, dan occupied
- Breakdown per room type

## 🧪 Test Cases yang Berhasil

### Test 1: Basic Request
```bash
curl "http://localhost:3001/api/public/properties/cmg9kg8sv0001uoxsb7htjuyl/room-types"
```
**Result**: ✅ Menampilkan semua room types dengan kamar available saja

### Test 2: Include Occupied Rooms
```bash
curl "http://localhost:3001/api/public/properties/cmg9kg8sv0001uoxsb7htjuyl/room-types?includeOccupied=true"
```
**Result**: ✅ Menampilkan semua kamar termasuk yang tidak available

### Test 3: Filter by Room Type
```bash
curl "http://localhost:3001/api/public/properties/cmg9kg8sv0001uoxsb7htjuyl/room-types?roomType=Kamar%20Standard"
```
**Result**: ✅ Hanya menampilkan room type "Kamar Standard"

### Test 4: Invalid Property ID
```bash
curl "http://localhost:3001/api/public/properties/invalid-id/room-types"
```
**Result**: ✅ Error 400 dengan pesan validation error

## 📊 Data Structure Analysis

### Property Information
- ✅ Basic property details (name, type, address)
- ✅ Total rooms dan available rooms count
- ✅ Hanya property dengan status APPROVED

### Room Type Details
- ✅ Room type name dan description
- ✅ Count statistics (total, available, occupied)
- ✅ Pricing information (monthly, daily, dll)
- ✅ Deposit information
- ✅ Facilities categorized by type
- ✅ Main image untuk room type

### Individual Room Info
- ✅ Room identification (ID, number, floor)
- ✅ Availability status (available, occupied)
- ✅ Current booking info jika ada
- ✅ Main image per room

## 🎉 Kesimpulan

API `/api/public/properties/[id]/room-types` telah berhasil diimplementasi dengan fitur lengkap:

1. **✅ Menampilkan detail rooms per ID property**
2. **✅ Grouping berdasarkan room types**
3. **✅ Informasi kamar terisi dan kosong**
4. **✅ Real-time availability berdasarkan booking**
5. **✅ Filtering dan query options**
6. **✅ Comprehensive room details**
7. **✅ Proper error handling**
8. **✅ Security (hanya APPROVED properties)**

API ini siap digunakan untuk frontend aplikasi dan memberikan semua informasi yang dibutuhkan untuk menampilkan detail room types dengan status availability real-time.
