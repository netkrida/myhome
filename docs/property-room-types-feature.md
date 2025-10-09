# Property Room Types Feature

## Overview
Fitur untuk menampilkan dan mengelola **jenis kamar** (room types) di halaman detail properti AdminKos, menggantikan tampilan individual rooms dengan tampilan yang lebih ringkas berdasarkan tipe kamar.

## Problem Statement
Sebelumnya, halaman detail properti menampilkan semua kamar individual yang membuat tampilan menjadi panjang dan kurang efisien. User ingin melihat ringkasan berdasarkan **jenis kamar** dengan statistik per tipe.

## Solution
Mengubah tampilan dari individual rooms menjadi room types dengan:
1. Statistik per jenis kamar (total, tersedia, terisi)
2. Range harga per jenis kamar
3. Tingkat hunian per jenis kamar
4. Button untuk menambah jenis kamar baru
5. Halaman form untuk menambah jenis kamar

## Implementation

### 1. API Endpoint

**File**: `src/app/api/adminkos/properties/[id]/room-types-summary/route.ts`

```typescript
GET /api/adminkos/properties/{propertyId}/room-types-summary
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRoomTypes": 3,
    "totalRooms": 15,
    "roomTypes": [
      {
        "roomType": "Standard",
        "totalRooms": 8,
        "availableRooms": 3,
        "occupiedRooms": 5,
        "lowestPrice": 1500000,
        "highestPrice": 1500000,
        "mainImage": "https://..."
      },
      {
        "roomType": "Deluxe",
        "totalRooms": 5,
        "availableRooms": 2,
        "occupiedRooms": 3,
        "lowestPrice": 2000000,
        "highestPrice": 2500000,
        "mainImage": "https://..."
      },
      {
        "roomType": "VIP",
        "totalRooms": 2,
        "availableRooms": 0,
        "occupiedRooms": 2,
        "lowestPrice": 3000000,
        "highestPrice": 3000000,
        "mainImage": null
      }
    ]
  }
}
```

**Features**:
- ✅ Verifies property ownership
- ✅ Groups rooms by room type
- ✅ Calculates statistics per room type
- ✅ Finds price range (lowest - highest)
- ✅ Gets main image from first room
- ✅ Requires authentication (AdminKos only)

**Logic**:
1. Fetch all rooms for the property
2. Group by `roomType` field
3. Calculate totals, available, occupied for each type
4. Find min/max price for each type
5. Get first available image for each type

### 2. Component: PropertyRoomTypes

**File**: `src/components/dashboard/adminkos/properties/property-room-types.tsx`

**Features**:
- **Summary Stats Card**:
  - Total jenis kamar
  - Total kamar
  - Kamar tersedia
  - Tingkat hunian keseluruhan
  - Button "Tambah Jenis Kamar"

- **Room Type Cards**:
  - Image preview (or placeholder)
  - Availability badge
  - Room type name
  - Price range display
  - Stats grid (Total, Tersedia, Terisi)
  - Occupancy rate with progress bar

- **Empty State**:
  - Shown when no room types exist
  - Call-to-action button to add first room type

- **Loading State**:
  - Skeleton loaders while fetching data

- **Error State**:
  - User-friendly error message

**UI Layout**:
```
┌─────────────────────────────────────────────┐
│ Ringkasan Jenis Kamar    [+ Tambah Jenis]  │
├─────────────────────────────────────────────┤
│ [3 Jenis] [15 Kamar] [5 Tersedia] [67%]   │
└─────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ [Image]      │ │ [Image]      │ │ [Image]      │
│ Standard     │ │ Deluxe       │ │ VIP          │
│ Rp 1.5jt/bln │ │ Rp 2-2.5jt   │ │ Rp 3jt/bln   │
│ 8│3│5        │ │ 5│2│3        │ │ 2│0│2        │
│ [Progress]   │ │ [Progress]   │ │ [Progress]   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 3. Updated Property Detail View

**File**: `src/components/dashboard/adminkos/properties/property-detail-view.tsx`

**Changes**:
- Replaced `PropertyRoomsList` with `PropertyRoomTypes`
- Updated import statement
- Simplified rooms tab content

**Before**:
```tsx
import { PropertyRoomsList } from "@/components/dashboard/superadmin/properties/property-rooms-list";

<TabsContent value="rooms">
  <PropertyRoomsList propertyId={property.id} rooms={property.rooms || []} />
</TabsContent>
```

**After**:
```tsx
import { PropertyRoomTypes } from "./property-room-types";

<TabsContent value="rooms">
  <PropertyRoomTypes propertyId={property.id} />
</TabsContent>
```

### 4. Add Room Type Page (Multi-Step Form)

**File**: `src/app/(protected-pages)/dashboard/adminkos/properties/[id]/add-room-type/page.tsx`

**Route**: `/dashboard/adminkos/properties/{propertyId}/add-room-type`

**Form Type**: Multi-Step Form (5 Steps)

#### Step 1: Informasi Jenis Kamar
**Component**: `Step1RoomTypeInfo`

**Fields**:
- Nama Jenis Kamar* (text) - e.g., "Standard", "Deluxe", "VIP"
- Jumlah Kamar* (number, 1-100) - berapa banyak kamar yang akan dibuat
- Lantai* (number, 1-50)
- Ukuran Kamar (text, optional) - e.g., "3x4m"

**Validation**:
- ✅ Room type name required (max 100 chars)
- ✅ Total rooms: 1-100
- ✅ Floor: 1-50
- ✅ Size: max 50 chars (optional)

#### Step 2: Deskripsi
**Component**: `Step2Description`

**Fields**:
- Deskripsi (textarea, optional, max 1000 chars)

**Features**:
- Tips menulis deskripsi yang baik
- Always valid (optional step)

#### Step 3: Foto Kamar
**Component**: `Step3Photos`

**Features**:
- Upload 1-10 foto kamar
- Auto-upload to Cloudinary
- Image preview with loading states
- Remove/retry upload functionality
- Drag & drop support

**Validation**:
- ✅ Minimal 1 foto required
- ✅ Max 10 foto
- ✅ File type: image/* only
- ✅ Max size: 5MB per file

**Upload Process**:
1. User selects images
2. Client validates file type & size
3. Creates preview with object URL
4. Uploads to `/api/upload/image`
5. Stores Cloudinary URL
6. Shows upload progress & status

#### Step 4: Fasilitas
**Component**: `Step4Facilities`

**Features**:
- Checkbox selection for room facilities
- Checkbox selection for bathroom facilities
- "Pilih Semua" / "Hapus Semua" per category
- Visual feedback for selected items
- Counter badges showing selected/total

**Validation**:
- ✅ Minimal 1 fasilitas required

**Facility Categories**:
- **Room Facilities**: Kasur, Lemari, Meja belajar, AC, TV, dll.
- **Bathroom Facilities**: Kamar mandi dalam, Water heater, Shower, dll.

#### Step 5: Harga Sewa
**Component**: `Step5Pricing`

**Fields**:
- Harga Bulanan* (number, required)
- Harga Harian (number, optional)
- Harga Mingguan (number, optional)
- Harga 3 Bulan (number, optional)
- Harga Tahunan (number, optional)

**Validation**:
- ✅ Monthly price required & must be > 0
- ✅ All optional prices must be > 0 if provided

**Features**:
- Tips menentukan harga
- Number input with step 10000

#### Form Behavior

**Navigation**:
- Previous/Next buttons
- Step indicator with progress bar
- Can't proceed if current step invalid
- Form state persistence (localStorage)

**Submission**:
- Validates all required steps
- Combines all step data
- Creates room type with multiple rooms
- Shows loading state
- Redirects to property detail on success
- Shows error toast on failure

**Data Structure**:
```typescript
{
  propertyId: string;
  roomType: string;
  totalRooms: number;
  floor: number;
  size?: string;
  description?: string;
  images: Array<{ url: string; publicId: string }>;
  facilities: RoomFacility[];
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
}
```

**Note**: API implementation is TODO - currently shows placeholder

### 5. Export Updates

**File**: `src/components/dashboard/adminkos/properties/index.ts`

Added export:
```typescript
export { PropertyRoomTypes } from "./property-room-types";
```

## User Flow

### Viewing Room Types

1. User navigates to property detail page
2. User clicks "Kamar" tab
3. System displays:
   - Summary statistics
   - List of room types with cards
   - Each card shows stats and occupancy
4. User can see at a glance:
   - How many room types exist
   - Availability per type
   - Price range per type
   - Overall occupancy

### Adding New Room Type

1. User clicks "Tambah Jenis Kamar" button
2. System navigates to add room type form
3. User fills in:
   - Room type name (e.g., "Deluxe")
   - Number of rooms to create (e.g., 5)
   - Floor, size, description
   - Pricing for different periods
4. User clicks "Simpan Jenis Kamar"
5. System creates N rooms with same type
6. System redirects back to property detail
7. New room type appears in the list

## Benefits

### For AdminKos

1. **Better Overview** 📊
   - See room types at a glance
   - Understand property composition
   - Quick occupancy insights

2. **Simplified Management** 🎯
   - Manage by type, not individual rooms
   - Easier to add multiple similar rooms
   - Consistent pricing per type

3. **Better UX** 👍
   - Less scrolling
   - More organized information
   - Clearer statistics

4. **Scalability** 📈
   - Works well with many rooms
   - Grouped view is more efficient
   - Easier to understand large properties

### For System

1. **Performance** ⚡
   - Less data to render
   - Grouped queries are efficient
   - Better for properties with many rooms

2. **Maintainability** 🔧
   - Cleaner component structure
   - Separation of concerns
   - Easier to extend

## Technical Notes

### Price Range Display

When `lowestPrice === highestPrice`:
```
Rp 1.500.000
```

When prices vary:
```
Rp 1.500.000 - Rp 2.000.000
```

### Image Handling

- Uses first room's first image as main image
- Falls back to placeholder icon if no image
- Category filter: `ROOM_PHOTOS`

### Occupancy Calculation

```typescript
const occupancyRate = totalRooms > 0 
  ? Math.round((occupiedRooms / totalRooms) * 100) 
  : 0;
```

### Room Grouping Logic

```typescript
const roomTypeMap = new Map<string, RoomTypeData>();

rooms.forEach(room => {
  const existing = roomTypeMap.get(room.roomType);
  
  if (existing) {
    // Update existing type stats
    existing.totalRooms++;
    if (room.isAvailable) existing.availableRooms++;
    else existing.occupiedRooms++;
    existing.lowestPrice = Math.min(existing.lowestPrice, room.monthlyPrice);
    existing.highestPrice = Math.max(existing.highestPrice, room.monthlyPrice);
  } else {
    // Create new type entry
    roomTypeMap.set(room.roomType, { /* initial data */ });
  }
});
```

## Future Enhancements

### Phase 2 (Optional)

1. **Room Type Detail Page**
   - Click on room type card to see all rooms of that type
   - Manage individual rooms within a type
   - Bulk edit for rooms of same type

2. **Room Type Edit**
   - Edit room type details
   - Update all rooms of that type
   - Change pricing for all rooms

3. **Room Type Delete**
   - Delete all rooms of a type
   - Confirmation dialog
   - Cascade delete handling

4. **Facilities per Room Type**
   - Define facilities specific to room type
   - Apply to all rooms of that type
   - Visual facility icons

5. **Photos per Room Type**
   - Upload photos for room type
   - Apply to all rooms of that type
   - Gallery view

## Related Files

**Created**:
- `src/app/api/adminkos/properties/[id]/room-types-summary/route.ts` - API endpoint
- `src/components/dashboard/adminkos/properties/property-room-types.tsx` - Room types display component
- `src/app/(protected-pages)/dashboard/adminkos/properties/[id]/add-room-type/page.tsx` - Multi-step form page
- `src/components/dashboard/adminkos/room-type/step-1-room-type-info.tsx` - Step 1 component
- `src/components/dashboard/adminkos/room-type/step-2-description.tsx` - Step 2 component
- `src/components/dashboard/adminkos/room-type/step-3-photos.tsx` - Step 3 component
- `src/components/dashboard/adminkos/room-type/step-4-facilities.tsx` - Step 4 component
- `src/components/dashboard/adminkos/room-type/step-5-pricing.tsx` - Step 5 component
- `src/components/dashboard/adminkos/room-type/index.ts` - Export file
- `docs/property-room-types-feature.md` - Documentation

**Modified**:
- `src/components/dashboard/adminkos/properties/property-detail-view.tsx` - Use PropertyRoomTypes
- `src/components/dashboard/adminkos/properties/index.ts` - Add export

## Testing Checklist

- [ ] API returns correct room types summary
- [ ] Property ownership is verified
- [ ] Room types are grouped correctly
- [ ] Price ranges are calculated correctly
- [ ] Occupancy rates are accurate
- [ ] Images are displayed or fallback to placeholder
- [ ] Empty state shows when no room types
- [ ] Loading state shows while fetching
- [ ] Error state shows on API failure
- [ ] Add button navigates to correct page
- [ ] Form validation works correctly
- [ ] Form submission creates rooms (when API implemented)
- [ ] Success toast shows after creation
- [ ] Redirect works after creation
- [ ] Responsive design works on mobile
- [ ] Dark mode works correctly

