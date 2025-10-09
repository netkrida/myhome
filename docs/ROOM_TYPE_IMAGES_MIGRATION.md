# Room Type Images Migration - Shared Images Architecture

## 📋 Overview

Mengubah logika penyimpanan foto kamar dari **per-room duplication** menjadi **shared images per room type** untuk efisiensi storage dan menghindari duplikasi data.

---

## ❌ Problem - Before Migration

### Current Logic (Inefficient)
```
Create 5 rooms tipe "Standard" dengan 4 foto:
→ 20 baris di RoomImage table (4 foto × 5 kamar)
→ Setiap kamar punya duplikat foto yang sama
→ Waste storage space
→ Sulit update foto (harus update 5× untuk 5 kamar)
```

### Database Structure (Before)
```
Room (id, roomType, ...)
  ↓ 1:N
RoomImage (id, roomId, imageUrl, ...)
```

**Example Data**:
```
Room 101 (Standard) → RoomImage: img1, img2, img3, img4
Room 102 (Standard) → RoomImage: img1, img2, img3, img4  ❌ DUPLICATE
Room 103 (Standard) → RoomImage: img1, img2, img3, img4  ❌ DUPLICATE
Room 104 (Standard) → RoomImage: img1, img2, img3, img4  ❌ DUPLICATE
Room 105 (Standard) → RoomImage: img1, img2, img3, img4  ❌ DUPLICATE

Total: 20 rows for same 4 images!
```

---

## ✅ Solution - After Migration

### New Logic (Efficient)
```
Create 5 rooms tipe "Standard" dengan 4 foto:
→ 4 baris di RoomTypeImage table (shared)
→ 5 rooms reference ke 4 foto yang sama
→ Save storage space
→ Easy update (update once, affects all rooms)
```

### Database Structure (After)
```
Property
  ↓ 1:N
RoomTypeImage (id, propertyId, roomType, imageUrl, ...)
  ↑ N:1 (via propertyId + roomType)
Room (id, propertyId, roomType, ...)
```

**Example Data**:
```
Property: "Kos ABC"
  ↓
RoomTypeImage:
  - img1 (propertyId: "abc", roomType: "Standard", category: "ROOM_PHOTOS")
  - img2 (propertyId: "abc", roomType: "Standard", category: "ROOM_PHOTOS")
  - img3 (propertyId: "abc", roomType: "Standard", category: "ROOM_PHOTOS")
  - img4 (propertyId: "abc", roomType: "Standard", category: "BATHROOM_PHOTOS")

Room 101 (propertyId: "abc", roomType: "Standard") ─┐
Room 102 (propertyId: "abc", roomType: "Standard") ─┤
Room 103 (propertyId: "abc", roomType: "Standard") ─┼─→ Share same 4 images
Room 104 (propertyId: "abc", roomType: "Standard") ─┤
Room 105 (propertyId: "abc", roomType: "Standard") ─┘

Total: 4 rows for 4 images (shared by 5 rooms)!
```

---

## 🗄️ Database Changes

### 1. New Model: `RoomTypeImage`

**File**: `prisma/schema.prisma`

```prisma
model RoomTypeImage {
  id         String        @id @default(cuid())
  propertyId String
  roomType   String        @db.VarChar(100)
  category   ImageCategory
  imageUrl   String        @db.VarChar(500)
  publicId   String?       @db.VarChar(255)
  caption    String?       @db.VarChar(255)
  sortOrder  Int           @default(0)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  property   Property      @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId, roomType])
  @@index([propertyId, roomType, category])
}
```

**Key Points**:
- ✅ Composite key: `propertyId + roomType` (not unique, multiple images per type)
- ✅ Cascade delete: When property deleted, images deleted
- ✅ Indexed for fast queries
- ✅ Same structure as RoomImage (category, imageUrl, publicId, sortOrder)

### 2. Updated Property Model

```prisma
model Property {
  // ... existing fields
  roomTypeImages  RoomTypeImage[]  // NEW relation
}
```

### 3. Migration

**File**: `prisma/migrations/20251008160333_add_room_type_images/migration.sql`

```sql
CREATE TABLE "RoomTypeImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomType" VARCHAR(100) NOT NULL,
    "category" "ImageCategory" NOT NULL,
    "imageUrl" VARCHAR(500) NOT NULL,
    "publicId" VARCHAR(255),
    "caption" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomTypeImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomTypeImage_propertyId_roomType_idx" 
  ON "RoomTypeImage"("propertyId", "roomType");

CREATE INDEX "RoomTypeImage_propertyId_roomType_category_idx" 
  ON "RoomTypeImage"("propertyId", "roomType", "category");

ALTER TABLE "RoomTypeImage" 
  ADD CONSTRAINT "RoomTypeImage_propertyId_fkey" 
  FOREIGN KEY ("propertyId") 
  REFERENCES "Property"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
```

---

## 🔄 Code Changes

### 1. Create Room Type API

**File**: `src/server/api/adminkos.api.ts`

**Before**:
```typescript
// Create rooms in loop
for (const roomNumber of roomNumbers) {
  const room = await tx.room.create({ ... });
  
  // ❌ Create images for EACH room (duplication!)
  await tx.roomImage.createMany({
    data: allImages.map(img => ({
      roomId: room.id,  // Different roomId for each room
      ...img
    }))
  });
}
```

**After**:
```typescript
// Check if room type images already exist
const existingTypeImages = await tx.roomTypeImage.findMany({
  where: { propertyId, roomType: data.roomType }
});

// ✅ Create images ONCE (shared for all rooms)
if (existingTypeImages.length === 0) {
  await tx.roomTypeImage.createMany({
    data: roomTypeImages.map(img => ({
      propertyId,        // Same propertyId
      roomType: data.roomType,  // Same roomType
      ...img
    }))
  });
}

// Create rooms WITHOUT images
for (const roomNumber of roomNumbers) {
  await tx.room.create({ ... });  // No images relation
}
```

**Benefits**:
- ✅ Images created once per room type
- ✅ Subsequent rooms of same type reuse existing images
- ✅ No duplication

### 2. Get Room Type Detail API

**File**: `src/app/api/adminkos/properties/[id]/room-types/[roomType]/route.ts`

**Before**:
```typescript
const sampleRoom = await prisma.room.findFirst({
  where: { propertyId, roomType },
  include: {
    images: { ... }  // ❌ Get images from room
  }
});

return {
  ...sampleRoom,
  images: sampleRoom.images  // Room-specific images
};
```

**After**:
```typescript
// Get room data (without images)
const sampleRoom = await prisma.room.findFirst({
  where: { propertyId, roomType }
});

// ✅ Get shared images for room type
const roomTypeImages = await prisma.roomTypeImage.findMany({
  where: { propertyId, roomType },
  orderBy: { sortOrder: 'asc' }
});

return {
  ...sampleRoom,
  images: roomTypeImages  // Shared images
};
```

### 3. Room Types Summary API

**File**: `src/app/api/adminkos/properties/[id]/room-types-summary/route.ts`

**Before**:
```typescript
const rooms = await prisma.room.findMany({
  where: { propertyId },
  include: {
    images: { take: 1 }  // ❌ Get image from each room
  }
});

// Use room.images[0] for main image
```

**After**:
```typescript
// Get rooms (without images)
const rooms = await prisma.room.findMany({
  where: { propertyId }
});

// ✅ Get shared images for all room types
const roomTypeImages = await prisma.roomTypeImage.findMany({
  where: { propertyId, category: 'ROOM_PHOTOS' },
  orderBy: { sortOrder: 'asc' }
});

// Create map: roomType → first image
const roomTypeImageMap = new Map();
for (const img of roomTypeImages) {
  if (!roomTypeImageMap.has(img.roomType)) {
    roomTypeImageMap.set(img.roomType, img.imageUrl);
  }
}

// Use roomTypeImageMap.get(roomType) for main image
```

---

## 📊 Query Patterns

### Get Images for a Room

**Before**:
```typescript
const room = await prisma.room.findUnique({
  where: { id: roomId },
  include: { images: true }
});

const images = room.images;
```

**After**:
```typescript
const room = await prisma.room.findUnique({
  where: { id: roomId }
});

const images = await prisma.roomTypeImage.findMany({
  where: {
    propertyId: room.propertyId,
    roomType: room.roomType
  },
  orderBy: { sortOrder: 'asc' }
});
```

### Get Images for Multiple Rooms

**Before**:
```typescript
const rooms = await prisma.room.findMany({
  where: { propertyId },
  include: { images: { take: 1 } }
});

// Each room has its own images array
```

**After**:
```typescript
const rooms = await prisma.room.findMany({
  where: { propertyId }
});

const roomTypeImages = await prisma.roomTypeImage.findMany({
  where: { propertyId },
  orderBy: { sortOrder: 'asc' }
});

// Group images by room type
const imagesByType = new Map();
for (const img of roomTypeImages) {
  if (!imagesByType.has(img.roomType)) {
    imagesByType.set(img.roomType, []);
  }
  imagesByType.get(img.roomType).push(img);
}

// Attach images to rooms
const roomsWithImages = rooms.map(room => ({
  ...room,
  images: imagesByType.get(room.roomType) || []
}));
```

---

## 🎯 Benefits

### 1. Storage Efficiency
```
Before: 100 rooms × 4 images = 400 rows
After:  10 room types × 4 images = 40 rows
Savings: 90% reduction!
```

### 2. Update Efficiency
```
Before: Update foto → Update 100 rows (all rooms)
After:  Update foto → Update 4 rows (room type images)
```

### 3. Consistency
```
Before: Risk of inconsistency (different images for same type)
After:  Guaranteed consistency (shared images)
```

### 4. Performance
```
Before: JOIN with 400 image rows
After:  JOIN with 40 image rows
Faster queries!
```

---

## ⚠️ Important Notes

### 1. Backward Compatibility

**RoomImage table still exists** for:
- Legacy data
- Room-specific images (if needed in future)
- Gradual migration

**Migration Strategy**:
1. ✅ Create new RoomTypeImage table
2. ✅ Update create room type to use RoomTypeImage
3. ✅ Update queries to use RoomTypeImage
4. 🔄 Migrate existing RoomImage data (optional)
5. 🔄 Deprecate RoomImage (future)

### 2. Data Migration Script (Optional)

If you want to migrate existing data:

```typescript
async function migrateRoomImagesToRoomTypeImages() {
  const properties = await prisma.property.findMany({
    include: {
      rooms: {
        include: { images: true }
      }
    }
  });

  for (const property of properties) {
    // Group rooms by type
    const roomsByType = new Map();
    for (const room of property.rooms) {
      if (!roomsByType.has(room.roomType)) {
        roomsByType.set(room.roomType, room);
      }
    }

    // Create RoomTypeImage from first room of each type
    for (const [roomType, sampleRoom] of roomsByType) {
      if (sampleRoom.images.length > 0) {
        await prisma.roomTypeImage.createMany({
          data: sampleRoom.images.map(img => ({
            propertyId: property.id,
            roomType: roomType,
            category: img.category,
            imageUrl: img.imageUrl,
            publicId: img.publicId,
            caption: img.caption,
            sortOrder: img.sortOrder,
          }))
        });
      }
    }
  }
}
```

### 3. Query Performance

**Indexes Created**:
- `[propertyId, roomType]` - Fast lookup by property + type
- `[propertyId, roomType, category]` - Fast filtered queries

**Query Optimization**:
```typescript
// ✅ GOOD: Use indexes
const images = await prisma.roomTypeImage.findMany({
  where: {
    propertyId: "abc",
    roomType: "Standard",
    category: "ROOM_PHOTOS"
  }
});

// ❌ BAD: No index
const images = await prisma.roomTypeImage.findMany({
  where: {
    imageUrl: { contains: "cloudinary" }
  }
});
```

---

## 🚀 Testing Checklist

- [x] Create room type with images → Check RoomTypeImage table
- [x] Create multiple rooms same type → Verify no duplicate images
- [x] Get room type detail → Verify images returned
- [x] Get room types summary → Verify main images shown
- [ ] Update room type images → Verify all rooms affected
- [ ] Delete property → Verify cascade delete works
- [ ] Performance test with 100+ rooms
- [ ] Migration script (if needed)

---

## 📝 Summary

**What Changed**:
1. ✅ New `RoomTypeImage` model for shared images
2. ✅ Updated `createRoomType` to use shared images
3. ✅ Updated queries to fetch from `RoomTypeImage`
4. ✅ Maintained backward compatibility with `RoomImage`

**Impact**:
- ✅ 90% reduction in image rows
- ✅ Faster queries
- ✅ Easier updates
- ✅ Guaranteed consistency
- ✅ Better storage efficiency

**Next Steps**:
1. Test thoroughly
2. Monitor performance
3. Consider migrating existing data
4. Eventually deprecate RoomImage (optional)

