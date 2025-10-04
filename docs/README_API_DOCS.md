# 📚 MultiKost API Documentation Package

Paket dokumentasi lengkap untuk semua API endpoints dalam sistem MultiKost. Dokumentasi ini mencakup semua fitur dari authentication hingga booking management dengan role-based access control.

## 📁 File yang Disediakan

### 1. **Postman Collection**
- **`multikost-complete-api-collection.json`** - Collection lengkap dengan 50+ endpoints
- **`postman-environment.json`** - Environment variables untuk testing

### 2. **Dokumentasi**
- **`API_DOCUMENTATION.md`** - Dokumentasi lengkap semua endpoints
- **`QUICK_REFERENCE.md`** - Panduan cepat dan cheat sheet
- **`README_API_DOCS.md`** - File ini (panduan penggunaan)

## 🚀 Quick Start

### Step 1: Import ke Postman
1. Buka Postman
2. Import `multikost-complete-api-collection.json`
3. Import `postman-environment.json`
4. Pilih environment "MultiKost - Complete API Environment"

### Step 2: Setup Base URL
- Development: `http://localhost:3000`
- Production: Sesuaikan dengan deployment URL

### Step 3: Authentication (Optional)
- Set `auth_token` variable untuk authenticated endpoints
- Token akan otomatis digunakan untuk semua protected routes

## 📊 API Coverage

### ✅ Implemented Endpoints (50+)

#### 🔐 Authentication (8 endpoints)
- NextAuth.js integration
- AdminKos registration
- Session management
- Email validation

#### 👥 User Management (8 endpoints)
- CRUD operations (SUPERADMIN only)
- Role and status management
- User statistics

#### 🏠 Property Management (9 endpoints)
- Property CRUD with approval workflow
- Map coordinates for Leaflet integration
- Statistics and analytics

#### 🛏️ Room Management (7 endpoints)
- Room CRUD operations
- Availability management
- Room statistics

#### 📅 Booking Management (6 endpoints)
- Booking lifecycle management
- Price calculation
- Status updates and cancellation

#### 🌐 Public APIs (1 endpoint)
- Homepage property listings
- No authentication required

#### 🗺️ Location & Geocoding (4 endpoints)
- Indonesian administrative data
- Reverse geocoding with OpenStreetMap

#### 📊 Dashboard & Analytics (4 endpoints)
- Role-based dashboard data
- Statistics and analytics
- Activity logs

#### 📁 File Upload (1 endpoint)
- Cloudinary integration
- Multi-category image management

#### 🔧 System & Health (2 endpoints)
- Health monitoring
- Cron job endpoints

## 🎯 Role-Based Access Control

### SUPERADMIN
- Full system access
- User management
- Property approval
- System analytics

### ADMINKOS
- Property and room management
- Booking management for own properties
- Image upload

### RECEPTIONIST
- Front desk operations
- Booking management
- Customer service

### CUSTOMER
- Browse properties
- Create bookings
- View booking history

## 🔧 Technical Features

### 3-Tier Architecture
- **Tier 1**: HTTP API Controllers
- **Tier 2**: Application Services
- **Tier 3**: Domain Services & Repositories

### Security
- JWT-based authentication
- Role-based route protection
- Input validation with Zod
- SQL injection prevention with Prisma

### Data Management
- PostgreSQL with Prisma ORM
- Soft delete patterns
- Audit trails
- Data validation

### External Integrations
- **Cloudinary**: Image management
- **OpenStreetMap**: Geocoding
- **Midtrans**: Payment processing (planned)
- **Email/WhatsApp**: Notifications (planned)

## 📋 Testing Scenarios

### 1. Public Access
```bash
# Test public endpoints (no auth required)
GET /api/public/properties
GET /api/wilayah/provinces
GET /api/health
```

### 2. Authentication Flow
```bash
# Register new AdminKos
POST /api/auth/register/adminkos

# Check email availability
POST /api/auth/check-email

# Get session info
GET /api/auth/session
```

### 3. Property Management
```bash
# List properties (role-based)
GET /api/properties

# Create property (ADMINKOS)
POST /api/properties

# Approve property (SUPERADMIN)
PATCH /api/properties/{id}/status
```

### 4. Booking Flow
```bash
# Calculate booking price
POST /api/bookings/calculate

# Create booking
POST /api/bookings

# Update booking status
PATCH /api/bookings/{id}/status
```

## 🔍 Error Handling

### Standard Response Format
```json
{
  "success": boolean,
  "data": object | array,
  "error": string | object,
  "statusCode": number
}
```

### Common Status Codes
- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## 📝 Environment Variables

### Required for Testing
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (for image upload)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## 🎯 Next Steps

### For Developers
1. Import collection ke Postman
2. Setup environment variables
3. Test public endpoints first
4. Setup authentication untuk protected routes
5. Explore role-based features

### For QA Testing
1. Test all CRUD operations
2. Verify role-based access control
3. Test error scenarios
4. Validate data integrity
5. Performance testing

### For Frontend Integration
1. Use collection sebagai reference
2. Implement authentication flow
3. Handle role-based UI rendering
4. Implement error handling
5. Add loading states

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi lengkap di `API_DOCUMENTATION.md`
2. Lihat quick reference di `QUICK_REFERENCE.md`
3. Test dengan Postman collection
4. Periksa console logs untuk debugging

---

**Happy Testing! 🚀**
