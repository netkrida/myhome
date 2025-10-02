# Public Rooms API - Backend Implementation

## 📋 Overview

Backend implementation untuk detail room dari properties untuk public access. API ini menyediakan endpoint untuk mengambil detail room individual dan daftar room dari properti tertentu tanpa memerlukan autentikasi.

## 🏗️ Architecture (3-Tier)

### Tier 1: HTTP API Controllers
- `src/app/api/public/rooms/[id]/route.ts` - Room detail endpoint
- `src/app/api/public/properties/[id]/rooms/route.ts` - Property rooms list endpoint

### Tier 2: Application Services
Tidak diperlukan untuk API public sederhana ini.

### Tier 3: Domain Layer
- **Repository**: `src/server/repositories/room.repository.ts`
  - `getPublicRoomDetail()` - Mengambil detail room
  - `getPublicPropertyRooms()` - Mengambil daftar room property
- **Types**: `src/server/types/room.ts`
  - `PublicRoomDetailDTO`
  - `PublicPropertyRoomsQuery`
  - `PublicPropertyRoomsResponse`
  - `PublicRoomCardDTO`
- **Schemas**: `src/server/schemas/room.schemas.ts`
  - `publicRoomDetailIdSchema`
  - `publicPropertyRoomsQuerySchema`

## 🔗 API Endpoints

### 1. GET /api/public/rooms/{id}
**Purpose**: Mengambil detail lengkap room berdasarkan ID  
**Access**: Public (no authentication)  
**Response**: Detail room dengan informasi property dan owner  

### 2. GET /api/public/properties/{id}/rooms
**Purpose**: Mengambil daftar room dari property dengan filtering dan pagination  
**Access**: Public (no authentication)  
**Features**: 
- Pagination (default: page=1, limit=12)
- Filtering (roomType, isAvailable, price range, floor)
- Sorting (roomNumber, floor, monthlyPrice)

## 🔒 Security Features

- **Approved Properties Only**: Hanya menampilkan room dari properti dengan status `APPROVED`
- **Data Validation**: Semua input divalidasi menggunakan Zod schemas
- **Error Handling**: Comprehensive error handling dengan logging
- **No Authentication Required**: API bersifat public untuk akses umum

## 📊 Data Models

### PublicRoomDetailDTO
```typescript
interface PublicRoomDetailDTO {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  description?: string;
  size?: string;
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  depositRequired: boolean;
  depositType?: 'PERCENTAGE' | 'FIXED';
  depositValue?: number;
  facilities: RoomFacility[];
  isAvailable: boolean;
  images: RoomImageDTO[];
  property: {
    id: string;
    name: string;
    propertyType: string;
    location: LocationData;
    owner: OwnerData;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### PublicRoomCardDTO
```typescript
interface PublicRoomCardDTO {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  description?: string;
  size?: string;
  monthlyPrice: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
  depositRequired: boolean;
  depositType?: 'PERCENTAGE' | 'FIXED';
  depositValue?: number;
  facilities: RoomFacility[];
  isAvailable: boolean;
  mainImage?: string;
}
```

## 🧪 Testing

### Postman Collection
File: `postman-collection-public-rooms-api.json`

**Test Cases Included**:
1. **Room Detail Tests**:
   - Get valid room detail
   - Handle room not found
   - Handle invalid room ID

2. **Property Rooms Tests**:
   - Basic room list
   - Pagination testing
   - Filtering by various criteria
   - Sorting options
   - Property not found handling

### Manual Testing Commands
```bash
# Get room detail
curl "http://localhost:3000/api/public/rooms/{room_id}"

# Get property rooms (basic)
curl "http://localhost:3000/api/public/properties/{property_id}/rooms"

# Get property rooms (with filters)
curl "http://localhost:3000/api/public/properties/{property_id}/rooms?page=1&limit=10&roomType=AC&isAvailable=true&minPrice=1000000&maxPrice=2000000&sortBy=monthlyPrice&sortOrder=asc"
```

## 📝 Implementation Notes

### Database Queries
- Menggunakan Prisma ORM dengan optimized queries
- Include images dan property data dalam single query
- Proper indexing pada field yang sering diquery

### Performance Optimizations
- Pagination untuk mengurangi load
- Hanya mengambil main image untuk card view
- Selective field inclusion berdasarkan use case

### Error Handling
- Comprehensive validation menggunakan Zod
- Proper HTTP status codes
- Detailed logging untuk debugging
- User-friendly error messages

### Data Transformation
- Decimal to Number conversion untuk pricing
- Optional field handling
- Image URL optimization
- Consistent response format

## 🚀 Deployment Checklist

- [x] Types dan interfaces defined
- [x] Validation schemas implemented
- [x] Repository methods created
- [x] API routes implemented
- [x] Error handling added
- [x] Logging implemented
- [x] Documentation created
- [x] Postman collection prepared
- [ ] Unit tests (future enhancement)
- [ ] Integration tests (future enhancement)

## 🔄 Future Enhancements

1. **Caching**: Implement Redis caching untuk performance
2. **Rate Limiting**: Add rate limiting untuk public endpoints
3. **Search**: Full-text search untuk room descriptions
4. **Favorites**: User favorites functionality
5. **Reviews**: Room reviews dan ratings
6. **Availability Calendar**: Real-time availability checking

## 📚 Related Documentation

- [PUBLIC_ROOM_DETAIL_API.md](./PUBLIC_ROOM_DETAIL_API.md) - Detailed API documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick testing commands
