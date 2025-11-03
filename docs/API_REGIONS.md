# Regions API Documentation

API endpoints untuk mendapatkan data wilayah Indonesia (Kabupaten/Kota dan Kecamatan) yang digunakan untuk filtering properti.

## Endpoints

### 1. GET /api/regions/regencies

Mendapatkan daftar semua kabupaten/kota dari seluruh Indonesia.

**Request:**
```http
GET /api/regions/regencies
```

**Response:**
```json
{
  "success": true,
  "regencies": [
    {
      "code": "1101",
      "name": "KABUPATEN ACEH SELATAN"
    },
    {
      "code": "1102",
      "name": "KABUPATEN ACEH TENGGARA"
    }
    // ... more regencies
  ]
}
```

**Response Fields:**
- `success` (boolean): Status keberhasilan request
- `regencies` (array): Daftar kabupaten/kota
  - `code` (string): Kode kabupaten/kota
  - `name` (string): Nama kabupaten/kota

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Notes:**
- Data disusun alfabetis berdasarkan nama
- Menggunakan cache untuk optimasi performa
- Mengambil data dari semua provinsi di Indonesia

---

### 2. GET /api/regions/districts

Mendapatkan daftar kecamatan berdasarkan kode kabupaten/kota.

**Request:**
```http
GET /api/regions/districts?regencyCode=3201
```

**Query Parameters:**
- `regencyCode` (required): Kode kabupaten/kota

**Response:**
```json
{
  "success": true,
  "districts": [
    {
      "code": "3201010",
      "name": "Bandung Kulon"
    },
    {
      "code": "3201020",
      "name": "Bandung Wetan"
    }
    // ... more districts
  ]
}
```

**Response Fields:**
- `success` (boolean): Status keberhasilan request
- `districts` (array): Daftar kecamatan
  - `code` (string): Kode kecamatan
  - `name` (string): Nama kecamatan

**Error Response:**
```json
{
  "success": false,
  "error": "Kode kabupaten/kota diperlukan"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request (missing regencyCode)
- `500`: Internal server error

---

## Data Source

API ini mengambil data dari [wilayah.id](https://wilayah.id) - database wilayah administratif Indonesia yang komprehensif.

## Caching

Kedua endpoint menggunakan `force-cache` strategy untuk mengoptimalkan performa karena data wilayah jarang berubah.

## Usage Example

### Mengambil semua kabupaten/kota
```typescript
const response = await fetch('/api/regions/regencies');
const data = await response.json();

if (data.success) {
  console.log(data.regencies); // Array of regencies
}
```

### Mengambil kecamatan berdasarkan kabupaten
```typescript
const regencyCode = '3201';
const response = await fetch(`/api/regions/districts?regencyCode=${regencyCode}`);
const data = await response.json();

if (data.success) {
  console.log(data.districts); // Array of districts
}
```

## Related Components

- **PropertyFilterBar**: Menggunakan kedua endpoint ini untuk filter lokasi
- **PropertyListingSection**: Menerima filter dari PropertyFilterBar

## Related API Endpoints

Untuk endpoint wilayah dengan struktur berbeda (by province):
- `GET /api/wilayah/provinces` - Get all provinces
- `GET /api/wilayah/regencies/[provinceCode]` - Get regencies by province
- `GET /api/wilayah/districts/[regencyCode]` - Get districts by regency
