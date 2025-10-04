# Postman Import Guide - Public Rooms API

## 📋 Overview

Panduan untuk mengimport dan menggunakan Postman collection untuk testing Public Rooms API.

## 📁 Available Collections

### 1. Public Rooms API Collection
**File**: `postman-collection-public-rooms-api.json`  
**Description**: Collection untuk testing room detail dan property rooms endpoints  

### 2. Public Properties API Collection (Existing)
**File**: `postman-collection-public-properties-api.json`  
**Description**: Collection untuk testing property listing dan detail endpoints  

## 🚀 Import Instructions

### Step 1: Import Collection
1. Buka Postman
2. Click **Import** button
3. Pilih **File** tab
4. Upload file `postman-collection-public-rooms-api.json`
5. Click **Import**

### Step 2: Set Environment Variables
Setelah import, set variables berikut:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000` | Base URL untuk development |
| `property_id` | `{actual_property_id}` | ID properti yang valid untuk testing |
| `room_id` | `{actual_room_id}` | ID room yang valid untuk testing |

### Step 3: Get Valid IDs for Testing

#### Option A: Menggunakan Database Query
```sql
-- Get approved property ID
SELECT id, name, status FROM "Property" WHERE status = 'APPROVED' LIMIT 1;

-- Get room ID from approved property
SELECT r.id, r.roomNumber, r.roomType, p.name as propertyName 
FROM "Room" r 
JOIN "Property" p ON r.propertyId = p.id 
WHERE p.status = 'APPROVED' 
LIMIT 1;
```

#### Option B: Menggunakan Existing API
```bash
# Get properties list
curl "http://localhost:3000/api/public/properties?limit=1"

# Copy property ID, then get rooms
curl "http://localhost:3000/api/public/properties/{property_id}/rooms?limit=1"
```

## 🧪 Test Scenarios

### 1. Room Detail Tests

#### Test Case: Valid Room Detail
- **Request**: `GET /api/public/rooms/{{room_id}}`
- **Expected**: 200 OK with complete room data
- **Validates**: Room structure, property info, images, facilities

#### Test Case: Invalid Room ID
- **Request**: `GET /api/public/rooms/invalid_id`
- **Expected**: 404 Not Found
- **Validates**: Error handling for non-existent rooms

### 2. Property Rooms Tests

#### Test Case: Basic Room List
- **Request**: `GET /api/public/properties/{{property_id}}/rooms`
- **Expected**: 200 OK with rooms array and pagination
- **Validates**: Default pagination, room cards structure

#### Test Case: Pagination
- **Request**: `GET /api/public/properties/{{property_id}}/rooms?page=1&limit=5`
- **Expected**: 200 OK with 5 rooms max
- **Validates**: Pagination parameters working

#### Test Case: Filtering
- **Request**: `GET /api/public/properties/{{property_id}}/rooms?roomType=AC&isAvailable=true`
- **Expected**: 200 OK with filtered results
- **Validates**: Filter functionality

#### Test Case: Sorting
- **Request**: `GET /api/public/properties/{{property_id}}/rooms?sortBy=monthlyPrice&sortOrder=asc`
- **Expected**: 200 OK with sorted results
- **Validates**: Sorting functionality

#### Test Case: Price Range Filter
- **Request**: `GET /api/public/properties/{{property_id}}/rooms?minPrice=1000000&maxPrice=2000000`
- **Expected**: 200 OK with rooms in price range
- **Validates**: Price filtering

#### Test Case: Invalid Property
- **Request**: `GET /api/public/properties/invalid_id/rooms`
- **Expected**: 404 Not Found
- **Validates**: Error handling for non-existent properties

## 🔧 Troubleshooting

### Common Issues

#### 1. 404 Not Found Errors
**Cause**: Invalid property_id atau room_id  
**Solution**: 
- Pastikan menggunakan ID dari properti dengan status APPROVED
- Check database untuk ID yang valid
- Gunakan API properties list untuk mendapatkan ID yang valid

#### 2. Empty Results
**Cause**: Property tidak memiliki room atau semua room tidak available  
**Solution**:
- Check apakah property memiliki room di database
- Coba tanpa filter isAvailable
- Gunakan property lain yang memiliki room

#### 3. Validation Errors
**Cause**: Parameter query tidak valid  
**Solution**:
- Check format parameter (number untuk page, limit, prices)
- Pastikan sortBy menggunakan nilai yang valid
- Check minPrice tidak lebih besar dari maxPrice

### Debug Steps

1. **Check Server Logs**:
   ```bash
   # Monitor server logs untuk error details
   npm run dev
   ```

2. **Validate Database**:
   ```sql
   -- Check property status
   SELECT id, name, status FROM "Property" WHERE id = 'your_property_id';
   
   -- Check rooms count
   SELECT COUNT(*) FROM "Room" WHERE propertyId = 'your_property_id';
   ```

3. **Test with curl**:
   ```bash
   # Test basic endpoint
   curl -v "http://localhost:3000/api/public/properties/{property_id}/rooms"
   ```

## 📊 Expected Response Formats

### Room Detail Response
```json
{
  "success": true,
  "data": {
    "id": "room_id",
    "roomNumber": "A101",
    "roomType": "Kamar AC",
    "monthlyPrice": 1200000,
    "property": {
      "id": "property_id",
      "name": "Kos Name",
      "location": {...},
      "owner": {...}
    },
    "images": [...],
    "facilities": [...]
  }
}
```

### Property Rooms Response
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "room_id",
        "roomNumber": "A101",
        "monthlyPrice": 1200000,
        "mainImage": "image_url"
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

## 🎯 Testing Checklist

- [ ] Import collection successfully
- [ ] Set environment variables
- [ ] Get valid property_id and room_id
- [ ] Test room detail endpoint
- [ ] Test property rooms endpoint
- [ ] Test pagination
- [ ] Test filtering
- [ ] Test sorting
- [ ] Test error cases
- [ ] Validate response structures
- [ ] Check performance (response times)
