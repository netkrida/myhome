# Rooms V2 - Bug Fixes

## Issue: Failed to Create Room - Missing `facilities` Field

### Problem
When trying to add a new room, the API returned an error:
```
Argument `facilities` is missing.
```

This occurred because the `facilities` field in the Prisma schema is required (`Json` type without `?`), but the add room functionality was not providing this field.

### Root Cause
The `Room` model in Prisma schema has a required `facilities` field:
```prisma
model Room {
  // ... other fields
  facilities        Json
  // ... other fields
}
```

However, the `AddRoomDTO` type and `addRoomSchema` validation did not include this field, and the API was not setting a default value.

### Solution

#### 1. Updated Type Definition (`src/server/types/adminkos.ts`)
Added `facilities` field to `AddRoomDTO`:
```typescript
export interface AddRoomDTO {
  // ... existing fields
  facilities?: any[];
}
```

#### 2. Updated Validation Schema (`src/server/schemas/adminkos.schemas.ts`)
Added `facilities` field with default empty array:
```typescript
export const addRoomSchema = z.object({
  // ... existing fields
  facilities: z.array(z.any()).optional().default([]),
});
```

#### 3. Updated API Logic (`src/server/api/adminkos.api.ts`)
Modified the room creation to include facilities with fallback to empty array:
```typescript
const room = await tx.room.create({
  data: {
    // ... existing fields
    facilities: roomData.facilities || [],
  },
});
```

#### 4. Updated UI Component (`src/components/dashboard/adminkos/rooms-v2/add-room-modal.tsx`)
Added `facilities` to form schema and default values:
```typescript
const addRoomSchema = z.object({
  // ... existing fields
  facilities: z.array(z.any()).optional().default([]),
});

const form = useForm<AddRoomFormData>({
  defaultValues: {
    // ... existing fields
    facilities: [],
  },
});
```

### Testing
After the fix:
1. ✅ Room can be created successfully with default empty facilities array
2. ✅ No validation errors
3. ✅ Property total rooms count is updated correctly
4. ✅ Room appears in the grid view immediately

### Future Enhancement
Consider adding a facilities selector in the Add Room modal to allow users to specify room facilities during creation. This would require:
1. Fetching available facilities from constants or API
2. Adding a multi-select component to the form
3. Validating selected facilities
4. Storing facilities as structured JSON data

### Related Files
- `src/server/api/adminkos.api.ts` - API logic
- `src/server/types/adminkos.ts` - Type definitions
- `src/server/schemas/adminkos.schemas.ts` - Validation schemas
- `src/components/dashboard/adminkos/rooms-v2/add-room-modal.tsx` - UI component
- `prisma/schema.prisma` - Database schema

### Notes
- The `facilities` field is stored as JSON in the database
- Empty array `[]` is a valid value for facilities
- Existing rooms with facilities will not be affected
- This fix maintains backward compatibility with existing room creation flows

---

## Enhancement: Room Type Selection from Existing Types

### Feature
Changed the "Tipe Kamar" field in Add Room modal from free text input to a dropdown select that shows existing room types from the selected property.

### Benefits
1. **Data Consistency**: Ensures room types are consistent across rooms in the same property
2. **Better UX**: Users don't need to remember exact room type names
3. **Prevents Typos**: Eliminates spelling mistakes in room type names
4. **Easier Management**: Standardized room types make filtering and reporting easier

### Implementation

#### 1. New API Endpoint (`src/app/api/adminkos/properties/[id]/room-types/route.ts`)
Created endpoint to get unique room types for a property:
```typescript
GET /api/adminkos/properties/{propertyId}/room-types

Response:
{
  "success": true,
  "data": {
    "roomTypes": ["Standard", "Deluxe", "VIP"]
  }
}
```

Features:
- Verifies property ownership
- Returns distinct room types ordered alphabetically
- Requires authentication

#### 2. Updated Add Room Modal (`src/components/dashboard/adminkos/rooms-v2/add-room-modal.tsx`)

Changes:
- Added state for `roomTypes`, `isLoadingRoomTypes`, `selectedPropertyId`
- Added `fetchRoomTypes()` function to fetch room types when property is selected
- Changed Room Type field from `Input` to `Select` dropdown
- Auto-fetches room types when property changes
- Resets room type selection when property changes
- Shows loading state while fetching
- Shows appropriate placeholder messages:
  - "Memuat tipe kamar..." - while loading
  - "Pilih properti terlebih dahulu" - when no property selected
  - "Belum ada tipe kamar" - when property has no rooms yet
  - "Pilih tipe kamar" - normal state

#### 3. User Flow

1. User selects a property from dropdown
2. System automatically fetches existing room types for that property
3. Room Type dropdown is populated with existing types
4. User selects a room type from the list
5. User fills in other details (room number, floor, price, etc.)
6. User submits the form

#### 4. Edge Cases Handled

- **No property selected**: Room Type dropdown is disabled
- **Property has no rooms yet**: Shows "Belum ada tipe kamar" message
- **Loading state**: Shows "Memuat tipe kamar..." while fetching
- **Property change**: Resets room type selection and fetches new types
- **API error**: Gracefully handles errors and shows empty list

### Future Considerations

If a property needs a completely new room type that doesn't exist yet, consider:
1. Adding an "Add New Room Type" option in the dropdown
2. Creating a separate "Manage Room Types" feature
3. Allowing new room type creation during property setup

For now, new room types can be added by:
1. Using the full room creation flow (with photos, facilities, etc.)
2. Or manually adding via database if needed

### Related Files
- `src/app/api/adminkos/properties/[id]/room-types/route.ts` - New API endpoint
- `src/components/dashboard/adminkos/rooms-v2/add-room-modal.tsx` - Updated modal component

### Technical Notes

**Authentication Import Fix:**
- ❌ Wrong: `import { getServerSession } from "next-auth"; import { authOptions } from "@/server/lib/auth-options";`
- ✅ Correct: `import { auth } from "@/server/auth";`
- The project uses NextAuth v5 with custom auth configuration in `src/server/auth/`
- Use `auth()` function instead of `getServerSession(authOptions)`

---

## Feature: Room Detail Modal with Booking Information

### Overview
Added "Lihat Detail" action in room cards that opens a comprehensive modal showing:
- Complete room information (number, type, floor, description, size)
- Property information (name, address)
- Pricing details (monthly, daily, weekly, quarterly, yearly)
- Active booking information (if any) with tenant details
- Payment status and remaining balance

### Implementation

#### 1. New API Endpoint (`src/app/api/adminkos/rooms/[id]/detail/route.ts`)
```typescript
GET /api/adminkos/rooms/{roomId}/detail

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "roomNumber": "101",
    "roomType": "Standard",
    "floor": 1,
    "description": "...",
    "size": "3x4m",
    "monthlyPrice": 1500000,
    "dailyPrice": 75000,
    // ... other pricing
    "isAvailable": false,
    "facilities": [...],
    "property": {
      "id": "...",
      "name": "Kos Mawar",
      "fullAddress": "..."
    },
    "images": [...],
    "activeBooking": {
      "id": "...",
      "bookingCode": "BK-001",
      "status": "CHECKED_IN",
      "paymentStatus": "PARTIAL",
      "leaseType": "MONTHLY",
      "checkInDate": "2025-01-01",
      "checkOutDate": null,
      "totalAmount": 3000000,
      "paidAmount": 1500000,
      "remainingAmount": 1500000,
      "user": {
        "id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "08123456789"
      }
    }
  }
}
```

Features:
- Verifies property ownership
- Returns complete room data with all pricing options
- Includes active booking if exists (CONFIRMED or CHECKED_IN status)
- Calculates paid amount and remaining balance
- Requires authentication (AdminKos only)

#### 2. New Type Definition (`src/server/types/adminkos.ts`)
```typescript
export interface RoomDetailDTO {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  description: string | null;
  size: string | null;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  facilities: any;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    name: string;
    fullAddress: string;
  };
  images: {
    id: string;
    imageUrl: string;
    category: string;
  }[];
  activeBooking: {
    // ... booking details
  } | null;
}
```

#### 3. New API Method (`src/server/api/adminkos.api.ts`)
```typescript
static getRoomDetail = withAuth(
  async (userContext: UserContext, roomId: string): Promise<Result<RoomDetailDTO>> => {
    // Implementation
  }
);
```

Features:
- Role-based access control (AdminKos only)
- Property ownership verification
- Fetches room with all related data
- Queries active booking separately
- Calculates payment summary

#### 4. New Component (`src/components/dashboard/adminkos/rooms-v2/room-detail-modal.tsx`)

Features:
- **Responsive Dialog**: Max width 4xl, max height 90vh
- **Scrollable Content**: ScrollArea for long content
- **Loading State**: Spinner while fetching data
- **Error Handling**: User-friendly error messages
- **Room Information Section**:
  - Room number, type, floor
  - Property name and address
  - Description and size (if available)
  - Status badge (Tersedia/Terisi/Nonaktif)
- **Pricing Section**:
  - Grid layout for all pricing options
  - Highlighted monthly price (primary)
  - Conditional display for optional prices
- **Active Booking Section** (if exists):
  - Booking code with status badges
  - Tenant information (name, email, phone)
  - Check-in/check-out dates
  - Payment summary (total, paid, remaining)
  - Color-coded status badges
- **Empty State**: When no active booking

#### 5. Updated Components

**RoomCard** (`src/components/dashboard/adminkos/rooms-v2/room-card.tsx`):
- Added `onViewDetail` prop
- Added "Lihat Detail" menu item (first in dropdown)
- Uses Info icon for visual distinction

**RoomsGrid** (`src/components/dashboard/adminkos/rooms-v2/rooms-grid.tsx`):
- Added `onViewDetail` prop
- Passes handler to RoomCard components

**Rooms Page** (`src/app/(protected-pages)/dashboard/adminkos/rooms/page.tsx`):
- Added `detailModalOpen` state
- Added `selectedRoomId` state
- Added `handleViewDetail` handler
- Integrated RoomDetailModal component

### User Flow

1. User views rooms grid
2. User clicks three-dot menu on any room card
3. User clicks "Lihat Detail" (first option)
4. Modal opens showing:
   - Room details
   - Pricing information
   - Active booking (if any) with tenant info
5. User can see complete information at a glance
6. User closes modal by clicking X or outside

### Benefits

1. **Comprehensive View**: All room information in one place
2. **Booking Visibility**: Quick access to active booking details
3. **Tenant Information**: Contact details readily available
4. **Payment Tracking**: Clear view of payment status
5. **Better UX**: No need to navigate to different pages
6. **Quick Reference**: Fast access to room details

### Technical Notes

**Field Name Fix:**
- RoomImage model uses `imageUrl` not `url`
- Updated all references to use correct field name
- Prisma schema: `imageUrl String @db.VarChar(500)`

**Status Badges:**
- Booking Status: PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
- Payment Status: PENDING, PARTIAL, PAID, REFUNDED
- Color-coded for quick visual identification

**Date Formatting:**
- Uses `date-fns` with Indonesian locale
- Format: "dd MMM yyyy" (e.g., "01 Jan 2025")

### Related Files
- `src/app/api/adminkos/rooms/[id]/detail/route.ts` - New API endpoint
- `src/server/api/adminkos.api.ts` - Added getRoomDetail method
- `src/server/types/adminkos.ts` - Added RoomDetailDTO type
- `src/components/dashboard/adminkos/rooms-v2/room-detail-modal.tsx` - New modal component
- `src/components/dashboard/adminkos/rooms-v2/room-card.tsx` - Updated with detail action
- `src/components/dashboard/adminkos/rooms-v2/rooms-grid.tsx` - Updated props
- `src/components/dashboard/adminkos/rooms-v2/index.ts` - Added export
- `src/app/(protected-pages)/dashboard/adminkos/rooms/page.tsx` - Integrated modal

