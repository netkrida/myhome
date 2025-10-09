# Create Room Type API - Documentation

## Overview

API endpoint untuk membuat multiple rooms dengan tipe yang sama (room type). Satu request akan membuat N kamar dengan karakteristik yang sama.

## API Endpoint

### POST `/api/adminkos/properties/{propertyId}/room-types`

**Description**: Create multiple rooms with the same room type

**Authentication**: Required (ADMINKOS role only)

**Request Body**:
```typescript
{
  roomType: string;           // Nama jenis kamar (e.g., "Standard", "Deluxe")
  totalRooms: number;         // Jumlah kamar yang akan dibuat (1-100)
  floor: number;              // Lantai (1-50)
  size?: string;              // Ukuran kamar (optional)
  description?: string;       // Deskripsi jenis kamar (optional)
  
  // Photos (3 categories)
  frontPhotos: Array<{
    url: string;
    publicId: string;
  }>;
  insidePhotos: Array<{
    url: string;
    publicId: string;
  }>;
  bathroomPhotos: Array<{
    url: string;
    publicId: string;
  }>;
  
  // Facilities
  facilities: RoomFacility[];  // Array of facility objects
  
  // Pricing
  monthlyPrice: number;        // Required
  dailyPrice?: number;         // Optional
  weeklyPrice?: number;        // Optional
  quarterlyPrice?: number;     // Optional
  yearlyPrice?: number;        // Optional
}
```

**Response (Success)**:
```typescript
{
  success: true;
  data: {
    roomsCreated: number;      // Number of rooms created
    roomIds: string[];         // Array of created room IDs
  };
  message: string;             // Success message
}
```

**Response (Error)**:
```typescript
{
  success: false;
  error: string;               // Error message
}
```

**Status Codes**:
- `200`: Success
- `400`: Bad request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (not ADMINKOS or not property owner)
- `500`: Internal server error

---

## Implementation Details

### 3-Tier Architecture

#### **Tier 1: API Route**
**File**: `src/app/api/adminkos/properties/[id]/room-types/route.ts`

**Responsibilities**:
- Handle HTTP request/response
- Validate authentication & authorization
- Call Tier 2 service
- Return formatted response

```typescript
export async function POST(request, context) {
  // 1. Authenticate user
  const session = await auth();
  
  // 2. Check ADMINKOS role
  if (session.user.role !== "ADMINKOS") {
    return 403;
  }
  
  // 3. Parse request body
  const body = await request.json();
  
  // 4. Call Tier 2 service
  const result = await createRoomType(userId, propertyId, body);
  
  // 5. Return response
  return NextResponse.json(result);
}
```

#### **Tier 2: Application Service**
**File**: `src/server/api/adminkos.api.ts`

**Function**: `createRoomType()`

**Responsibilities**:
- Verify property ownership
- Generate unique room numbers
- Create rooms in transaction
- Create room images
- Return result

**Key Logic**:

1. **Property Ownership Verification**
```typescript
const property = await prisma.property.findUnique({
  where: { id: propertyId },
  select: { ownerId: true },
});

if (!property || property.ownerId !== userId) {
  return error("Access denied");
}
```

2. **Room Number Generation**
```typescript
// Get existing room numbers
const existingRooms = await prisma.room.findMany({
  where: { propertyId },
  select: { roomNumber: true },
});

// Generate unique room numbers
// Format: {floor}{counter} (e.g., 101, 102, 103)
const roomNumbers: string[] = [];
let counter = 1;
while (roomNumbers.length < totalRooms) {
  const roomNumber = `${floor}${counter.toString().padStart(2, '0')}`;
  if (!existingNumbers.has(roomNumber)) {
    roomNumbers.push(roomNumber);
  }
  counter++;
}
```

3. **Transaction - Create Rooms & Images**
```typescript
await prisma.$transaction(async (tx) => {
  // Create each room
  for (const roomNumber of roomNumbers) {
    const room = await tx.room.create({
      data: {
        propertyId,
        roomNumber,
        floor,
        roomType,
        description,
        size,
        monthlyPrice,
        dailyPrice,
        weeklyPrice,
        quarterlyPrice,
        yearlyPrice,
        facilities,
        isAvailable: true,
      },
    });

    // Create room images
    const allImages = [
      ...frontPhotos.map(img => ({
        roomId: room.id,
        category: 'ROOM_PHOTOS',
        imageUrl: img.url,
        publicId: img.publicId,
      })),
      ...insidePhotos.map(img => ({
        roomId: room.id,
        category: 'ROOM_PHOTOS',
        imageUrl: img.url,
        publicId: img.publicId,
      })),
      ...bathroomPhotos.map(img => ({
        roomId: room.id,
        category: 'BATHROOM_PHOTOS',
        imageUrl: img.url,
        publicId: img.publicId,
      })),
    ];

    await tx.roomImage.createMany({
      data: allImages,
    });
  }
});
```

#### **Tier 3: Database (Prisma)**
**Models Used**:
- `Room`: Store room data
- `RoomImage`: Store room images

---

## Photo Categories Mapping

### Frontend Categories → Database Categories

| Frontend Category | Database Category | Description |
|------------------|-------------------|-------------|
| `frontPhotos` | `ROOM_PHOTOS` | Foto depan kamar |
| `insidePhotos` | `ROOM_PHOTOS` | Foto dalam kamar |
| `bathroomPhotos` | `BATHROOM_PHOTOS` | Foto kamar mandi |

**Note**: Front dan inside photos menggunakan category yang sama (`ROOM_PHOTOS`) karena enum `ImageCategory` di Prisma belum memiliki kategori terpisah untuk front room.

---

## Room Number Generation Logic

### Format
```
{floor}{counter}
```

### Examples
- Floor 1: 101, 102, 103, 104, 105
- Floor 2: 201, 202, 203, 204, 205
- Floor 3: 301, 302, 303, 304, 305

### Uniqueness
- Check existing room numbers in property
- Skip numbers that already exist
- Generate next available number
- Safety limit: max 1000 iterations

### Edge Cases
- If room 101 exists, create 102
- If 101-105 exist, create 106
- If all numbers taken, return error

---

## Example Usage

### Request
```bash
POST /api/adminkos/properties/prop_123/room-types
Content-Type: application/json

{
  "roomType": "Standard",
  "totalRooms": 5,
  "floor": 1,
  "size": "3x4m",
  "description": "Kamar standar dengan fasilitas lengkap",
  "frontPhotos": [
    {
      "url": "https://res.cloudinary.com/.../front1.jpg",
      "publicId": "front1"
    }
  ],
  "insidePhotos": [
    {
      "url": "https://res.cloudinary.com/.../inside1.jpg",
      "publicId": "inside1"
    },
    {
      "url": "https://res.cloudinary.com/.../inside2.jpg",
      "publicId": "inside2"
    }
  ],
  "bathroomPhotos": [
    {
      "url": "https://res.cloudinary.com/.../bathroom1.jpg",
      "publicId": "bathroom1"
    }
  ],
  "facilities": [
    { "id": "bed", "name": "Kasur", "category": "room" },
    { "id": "ac", "name": "AC", "category": "room" },
    { "id": "shower", "name": "Shower", "category": "bathroom" }
  ],
  "monthlyPrice": 1500000,
  "dailyPrice": 75000,
  "weeklyPrice": 450000
}
```

### Response
```json
{
  "success": true,
  "data": {
    "roomsCreated": 5,
    "roomIds": [
      "room_abc123",
      "room_def456",
      "room_ghi789",
      "room_jkl012",
      "room_mno345"
    ]
  },
  "message": "Berhasil menambahkan 5 kamar tipe Standard"
}
```

### Database Result
5 rooms created:
- Room 101 (Standard, Floor 1)
- Room 102 (Standard, Floor 1)
- Room 103 (Standard, Floor 1)
- Room 104 (Standard, Floor 1)
- Room 105 (Standard, Floor 1)

Each room has:
- 1 front photo (ROOM_PHOTOS)
- 2 inside photos (ROOM_PHOTOS)
- 1 bathroom photo (BATHROOM_PHOTOS)
- 3 facilities
- Same pricing

---

## Error Handling

### Common Errors

1. **Property Not Found**
```json
{
  "success": false,
  "error": "Property not found or access denied"
}
```

2. **Room Number Generation Failed**
```json
{
  "success": false,
  "error": "Could not generate unique room numbers"
}
```

3. **Transaction Failed**
```json
{
  "success": false,
  "error": "Failed to create room type"
}
```

---

## Frontend Integration

**File**: `src/app/(protected-pages)/dashboard/adminkos/properties/[id]/add-room-type/page.tsx`

```typescript
const onSubmit = async (data: RoomTypeFormData) => {
  // Prepare data
  const roomTypeData = {
    roomType: data.roomType,
    totalRooms: data.totalRooms,
    // ... other fields
  };

  // Call API
  const response = await fetch(
    `/api/adminkos/properties/${propertyId}/room-types`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomTypeData),
    }
  );

  const result = await response.json();

  if (result.success) {
    toast.success(result.message);
    router.push(`/dashboard/adminkos/properties/${propertyId}`);
  } else {
    toast.error(result.error);
  }
};
```

---

## Testing Checklist

- [ ] Create room type with 1 room
- [ ] Create room type with multiple rooms (5+)
- [ ] Create room type with all photo categories
- [ ] Create room type with only some photo categories
- [ ] Create room type with all pricing options
- [ ] Create room type with only monthly price
- [ ] Verify room numbers are unique
- [ ] Verify room numbers skip existing numbers
- [ ] Verify all images are saved correctly
- [ ] Verify facilities are saved correctly
- [ ] Test with non-owner user (should fail)
- [ ] Test with non-ADMINKOS role (should fail)
- [ ] Test transaction rollback on error


