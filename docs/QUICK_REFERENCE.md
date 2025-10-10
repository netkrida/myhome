# 🚀 Quick Reference - MyHome Complete API

## 📥 Import ke Postman

### Step 1: Import Collection
1. Buka Postman
2. Klik **Import** → **Upload Files**
3. Pilih file `myhome-complete-api-collection.json`
4. Klik **Import**

### Step 2: Import Environment
1. Klik **Import** → **Upload Files**
2. Pilih file `postman-environment.json`
3. Klik **Import**
4. Pilih environment "MyHome - Complete API Environment" di dropdown

### Step 3: Setup Authentication (Optional)
1. Login melalui aplikasi web atau API
2. Copy JWT token dari response/session
3. Set variable `auth_token` di environment
4. Token akan otomatis digunakan untuk authenticated endpoints

## ⚡ Quick Test Scenarios

### 🌐 Public APIs (No Auth Required)
```
GET {{base_url}}/api/public/properties?page=1&limit=5
GET {{base_url}}/api/public/properties/{id}
GET {{base_url}}/api/public/properties/{id}/rooms?page=1&limit=10
GET {{base_url}}/api/public/rooms/{id}
GET {{base_url}}/api/wilayah/provinces
GET {{base_url}}/api/health
```

### 🔐 Authentication Tests
```
POST {{base_url}}/api/auth/check-email
Body: {"email": "test@example.com"}

POST {{base_url}}/api/auth/register/adminkos
Body: {user registration data}

GET {{base_url}}/api/auth/session
```

### 👥 User Management (SUPERADMIN)
```
GET {{base_url}}/api/users?page=1&limit=10
GET {{base_url}}/api/users/stats
```

### 🏠 Property Management
```
GET {{base_url}}/api/properties?page=1&limit=10
GET {{base_url}}/api/properties/coordinates
GET {{base_url}}/api/properties/stats
```

### 🛏️ Room Management
```
GET {{base_url}}/api/rooms?propertyId={{property_id}}
GET {{base_url}}/api/rooms/stats
```

### 📅 Booking Management
```
GET {{base_url}}/api/bookings?page=1&limit=10
POST {{base_url}}/api/bookings/calculate
```

## 📋 Common Parameters Cheat Sheet

### Pagination
| Parameter | Values | Example |
|-----------|--------|---------|
| `page` | 1, 2, 3... | `page=1` |
| `limit` | 1-50 | `limit=12` |

### Property Filters
| Parameter | Values | Example |
|-----------|--------|---------|
| `propertyType` | MALE_ONLY, FEMALE_ONLY, MIXED | `propertyType=MIXED` |
| `status` | PENDING, APPROVED, REJECTED | `status=APPROVED` |
| `regencyCode` | String | `regencyCode=3171` |
| `districtCode` | String | `districtCode=317101` |
| `search` | String | `search=kos indah` |

### Price & Sorting
| Parameter | Values | Example |
|-----------|--------|---------|
| `minPrice` | Number | `minPrice=500000` |
| `maxPrice` | Number | `maxPrice=2000000` |
| `sortBy` | price, newest | `sortBy=price` |
| `sortOrder` | asc, desc | `sortOrder=asc` |

### User Filters
| Parameter | Values | Example |
|-----------|--------|---------|
| `role` | SUPERADMIN, ADMINKOS, RECEPTIONIST, CUSTOMER | `role=ADMINKOS` |
| `isActive` | true, false | `isActive=true` |

### Booking Filters
| Parameter | Values | Example |
|-----------|--------|---------|
| `status` | PENDING, CONFIRMED, CANCELLED, COMPLETED | `status=CONFIRMED` |
| `bookingType` | DAILY, MONTHLY | `bookingType=MONTHLY` |
| `propertyId` | String | `propertyId={{property_id}}` |

## 🎯 Common Use Cases

### Homepage Cards (Default)
```
GET /api/public/properties?page=1&limit=12&sortBy=newest
```

### Search by Location
```
GET /api/public/properties?regencyCode=3171&districtCode=317101
```

### Filter Male-Only Properties
```
GET /api/public/properties?propertyType=MALE_ONLY
```

### Budget Range Search
```
GET /api/public/properties?minPrice=800000&maxPrice=1500000
```

### Cheapest Properties First
```
GET /api/public/properties?sortBy=price&sortOrder=asc
```

## 🔧 Response Structure

```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "property-id",
        "name": "Nama Kos",
        "propertyType": "MIXED",
        "availableRooms": 5,
        "cheapestMonthlyPrice": 800000,
        "mainImage": "https://...",
        "location": {
          "districtName": "Setiabudi",
          "regencyName": "Jakarta Selatan"
        },
        "facilities": [...]
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

## ❌ Common Errors

### 400 - Invalid Parameters
- `page < 1`
- `limit > 50`
- Invalid `propertyType`
- Invalid `sortBy` or `sortOrder`

### 500 - Server Error
- Database connection issues
- Internal processing errors

## 💡 Tips

1. **Pagination**: Gunakan `hasNext` dan `hasPrev` untuk navigasi
2. **Performance**: Limit maksimal 50 untuk performa optimal
3. **Filtering**: Semua filter dapat dikombinasikan
4. **Sorting**: Default sorting adalah `newest` dengan `desc`
5. **Images**: `mainImage` bisa null jika tidak ada gambar

## 🔗 Related Endpoints

- `/api/wilayah/provinces` - Daftar provinsi
- `/api/wilayah/regencies` - Daftar kabupaten/kota
- `/api/wilayah/districts` - Daftar kecamatan

## 📞 Support

Jika ada masalah dengan API:
1. Cek server development berjalan di port 3000
2. Pastikan database terkoneksi
3. Periksa console log untuk error details
