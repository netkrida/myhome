# Filter Wilayah - Property Listing

Dokumentasi untuk fitur filter wilayah (Provinsi & Kabupaten/Kota) di PropertyFilterBar.

## Overview

Filter wilayah menggunakan cascading selection dimana:
1. User memilih **Provinsi** terlebih dahulu
2. Setelah provinsi dipilih, dropdown **Kabupaten/Kota** akan muncul dengan data sesuai provinsi yang dipilih

## API Endpoints yang Digunakan

Filter menggunakan API wilayah yang sudah ada di `/api/wilayah/`:

### 1. GET /api/wilayah/provinces

Mendapatkan semua provinsi di Indonesia.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "11",
      "name": "ACEH"
    },
    {
      "code": "12",
      "name": "SUMATERA UTARA"
    }
    // ... 38 provinsi total
  ]
}
```

### 2. GET /api/wilayah/regencies/[provinceCode]

Mendapatkan kabupaten/kota berdasarkan kode provinsi.

**Example:**
```http
GET /api/wilayah/regencies/11
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "1101",
      "name": "KABUPATEN ACEH SELATAN",
      "province_code": "11"
    },
    {
      "code": "1102",
      "name": "KABUPATEN ACEH TENGGARA",
      "province_code": "11"
    }
    // ... kabupaten/kota lainnya
  ]
}
```

## Component: PropertyFilterBar

File: `src/components/public/property-filter-bar.tsx`

### State Management

```typescript
const [provinces, setProvinces] = useState<Region[]>([]);
const [regencies, setRegencies] = useState<Region[]>([]);
const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
```

### Filter Parameters

```typescript
interface FilterParams {
  propertyType?: string;
  provinceCode?: string;    // Kode provinsi yang dipilih
  regencyCode?: string;     // Kode kabupaten/kota yang dipilih
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### Lifecycle

1. **Component Mount**
   ```typescript
   useEffect(() => {
     fetchProvinces(); // Load semua provinsi
   }, []);
   ```

2. **Provinsi Selected**
   ```typescript
   useEffect(() => {
     if (filters.provinceCode) {
       fetchRegencies(filters.provinceCode); // Load kabupaten/kota
     } else {
       setRegencies([]); // Reset jika provinsi di-unselect
     }
   }, [filters.provinceCode]);
   ```

### Cascade Reset Logic

Ketika provinsi berubah, kabupaten/kota otomatis di-reset:

```typescript
if (key === "provinceCode" && filters.provinceCode !== value) {
  delete newFilters.regencyCode; // Auto-reset kabupaten/kota
}
```

## UI Behavior

### Loading States

- **Provinsi Loading**: Placeholder shows "Memuat provinsi..."
- **Provinsi Error**: Placeholder shows "Provinsi tidak tersedia"
- **Provinsi Ready**: Placeholder shows "Pilih Provinsi"

### Conditional Rendering

- **Provinsi dropdown**: Selalu tampil (setelah data dimuat)
- **Kabupaten/Kota dropdown**: Hanya tampil setelah provinsi dipilih

```tsx
{/* Province - Always visible */}
<Select value={filters.provinceCode} ...>
  ...
</Select>

{/* Regency - Only when province selected */}
{filters.provinceCode && (
  <Select value={filters.regencyCode} ...>
    ...
  </Select>
)}
```

## Debugging

Console logging telah ditambahkan untuk memudahkan debugging:

```
🔄 Fetching provinces...
📡 Provinces response status: 200
✅ Provinces data: {...}
📍 Loaded 38 provinces

🔄 Fetching regencies for province: 11
📡 Regencies response status: 200
✅ Regencies data: {...}
📍 Loaded 23 regencies
```

## Data Flow

```
┌─────────────────┐
│  Component      │
│  Mount          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ fetchProvinces()│
│ /api/wilayah/   │
│ provinces       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Selects    │
│ Province        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│fetchRegencies() │
│ /api/wilayah/   │
│ regencies/[code]│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Selects    │
│ Regency         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apply Filters   │
│ to Properties   │
└─────────────────┘
```

## Integration dengan PropertyListingSection

Filter yang dipilih dikirim ke `PropertyListingSection` melalui callback:

```typescript
const applyFilters = () => {
  onFilterChange(filters); // Send filters to parent
  setIsOpen(false);
};
```

Parent (`PropertyListingSection`) kemudian menggunakan filter untuk memanggil API:

```typescript
const params = new URLSearchParams({
  page: page.toString(),
  limit: "12",
  ...currentFilters, // Includes provinceCode & regencyCode
});

const response = await fetch(`/api/public/properties?${params.toString()}`);
```

## Best Practices

1. **Error Handling**: Semua fetch dilindungi dengan try-catch
2. **Loading States**: User selalu tahu status loading
3. **Graceful Degradation**: Jika API fail, UI tidak crash
4. **Console Logging**: Memudahkan debugging di development
5. **Type Safety**: Semua menggunakan TypeScript interfaces

## Troubleshooting

### Filter tidak muncul
- Cek console log untuk error API
- Pastikan dev server sudah di-restart
- Cek Network tab di DevTools

### Data tidak muncul setelah pilih provinsi
- Cek console log untuk API response
- Pastikan provinceCode valid
- Cek API wilayah.id tidak sedang down

### Reset tidak bekerja
- Pastikan cascade logic berfungsi
- Cek state management di handleFilterUpdate
