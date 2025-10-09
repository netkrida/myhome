# AdminKos Dashboard Documentation

## Overview

Dashboard AdminKos adalah halaman utama untuk pemilik properti kos (AdminKos) yang menyediakan overview lengkap tentang bisnis mereka, termasuk KPI, aktivitas harian, pendapatan, dan manajemen properti.

## Features

### 1. Summary Cards (KPI)
Menampilkan 8 metrik utama:
- **Total Properti Aktif**: Jumlah properti dengan status APPROVED
- **Total Kamar**: Jumlah semua kamar di semua properti
- **Kamar Tersedia**: Kamar dengan `isAvailable = true`
- **Tingkat Hunian**: Occupancy rate dalam persentase (1 - (kamar tersedia / total kamar))
- **Booking Aktif**: Booking dengan status UNPAID, DEPOSIT_PAID, CONFIRMED, atau CHECKED_IN
- **Pendapatan Bulan Ini**: Total payment SUCCESS dalam bulan berjalan
- **Deposit Diterima**: Total payment DEPOSIT yang SUCCESS bulan ini
- **Tagihan Tertunda**: Jumlah payment dengan status PENDING

### 2. Today's Activity Panel
Menampilkan aktivitas hari ini dalam 3 kategori:
- **Check-in Hari Ini**: Booking dengan status CONFIRMED dan checkInDate = today
- **Check-out Hari Ini**: Booking dengan status CHECKED_IN dan checkOutDate = today
- **Pembayaran Menunggu**: Payment PENDING yang akan kedaluwarsa dalam 24 jam

### 3. Revenue Chart (12 Months)
- Area chart menampilkan pendapatan 12 bulan terakhir
- Breakdown: Deposit vs Full Payment
- Trend indicator (naik/turun dari bulan lalu)
- Total revenue summary

### 4. Payment Type Breakdown
- Pie chart untuk breakdown tipe pembayaran bulan berjalan
- Persentase dan nilai untuk Deposit vs Full Payment
- Summary dengan nilai rupiah

### 5. My Properties
- Card-based layout untuk setiap properti
- Informasi per properti:
  - Gambar properti
  - Status approval (PENDING, APPROVED, REJECTED, SUSPENDED)
  - Tipe properti (Putra, Putri, Campur)
  - Total kamar & kamar tersedia
  - Occupancy rate
  - Pendapatan bulan ini
- Link ke halaman detail properti

## Architecture

### 3-Tier Architecture

#### Tier 1: API Routes (`src/app/api/adminkos/`)
- `GET /api/adminkos/summary` - KPI summary
- `GET /api/adminkos/activity` - Today's activity
- `GET /api/adminkos/revenue` - Revenue chart data
- `GET /api/adminkos/payment-breakdown` - Payment type breakdown
- `GET /api/adminkos/bookings` - Recent bookings (with pagination)
- `GET /api/adminkos/rooms` - Rooms list (with pagination)
- `GET /api/adminkos/properties` - My properties

#### Tier 2: Application Service (`src/server/api/adminkos.api.ts`)
- `AdminKosAPI.getSummary()` - Aggregate KPI data
- `AdminKosAPI.getTodayActivity()` - Get today's activities
- `AdminKosAPI.getRevenueChart()` - Calculate 12-month revenue
- `AdminKosAPI.getPaymentTypeBreakdown()` - Calculate payment breakdown
- `AdminKosAPI.getRecentBookings()` - Get bookings with filters
- `AdminKosAPI.getRooms()` - Get rooms with filters
- `AdminKosAPI.getMyProperties()` - Get properties with stats

#### Tier 3: Repositories (Existing)
- `PropertyRepository` - Property data access
- `RoomRepository` - Room data access
- `BookingRepository` - Booking data access
- `PaymentRepository` - Payment data access

### Types & Schemas

#### Types (`src/server/types/adminkos.ts`)
- `AdminKosSummaryDTO` - KPI summary
- `TodayActivityDTO` - Today's activities
- `RevenueChartDTO` - Revenue chart data
- `PaymentTypeBreakdownDTO` - Payment breakdown
- `RecentBookingsDTO` - Bookings list
- `AdminKosRoomsDTO` - Rooms list
- `MyPropertiesDTO` - Properties list

#### Schemas (`src/server/schemas/adminkos.schemas.ts`)
- `adminKosDashboardQuerySchema` - Dashboard query validation
- `adminKosBookingsQuerySchema` - Bookings query validation
- `adminKosRoomsQuerySchema` - Rooms query validation

## UI Components

### Components (`src/components/adminkos/`)

1. **SummaryCards** (`summary-cards.tsx`)
   - Grid layout (4 columns on desktop)
   - Icon + value + description
   - Responsive design

2. **TodayActivity** (`today-activity.tsx`)
   - 3-column grid
   - Check-ins, Check-outs, Pending Payments
   - Badge untuk booking code
   - Time display dengan date-fns

3. **RevenueChart** (`revenue-chart.tsx`)
   - Area chart dengan recharts
   - Stacked area (deposit + full)
   - Trend indicator
   - Formatted currency

4. **PaymentTypeChart** (`payment-type-chart.tsx`)
   - Pie chart dengan recharts
   - Percentage labels
   - Summary table

5. **MyProperties** (`my-properties.tsx`)
   - Card-based grid layout
   - Property image
   - Status & type badges
   - Stats grid (rooms, occupancy, revenue)
   - Link to property detail

6. **RecentBookingsTable** (`recent-bookings-table.tsx`)
   - Table dengan pagination
   - Search & filters
   - Status badges dengan warna
   - Action buttons

## Security & Access Control

- **Role-based Access**: Only users with `ADMINKOS` role can access
- **Data Isolation**: AdminKos can only see their own properties and related data
- **Authentication**: Uses NextAuth.js with `withAuth` wrapper
- **Authorization**: Enforced at API level using `requireRole(["ADMINKOS"])`

## Data Flow

1. **Page Load** (`page.tsx`):
   - Server component fetches all data in parallel
   - Uses `Promise.all()` for optimal performance
   - Passes data to client components

2. **API Calls**:
   - All API routes validate authentication
   - Filter data by `ownerId` (user's properties only)
   - Return standardized response format

3. **Error Handling**:
   - Try-catch in all API routes
   - Fallback data on error
   - Loading states with Skeleton components

## Styling & Design

### Design System
- **Framework**: Tailwind CSS
- **Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Formatting**: date-fns with Indonesian locale

### Color Scheme

#### Booking Status
- UNPAID: Gray
- DEPOSIT_PAID: Indigo
- CONFIRMED: Blue
- CHECKED_IN: Emerald
- COMPLETED: Slate
- CANCELLED: Rose
- EXPIRED: Zinc

#### Payment Status
- PENDING: Amber
- SUCCESS: Emerald
- FAILED: Rose
- EXPIRED: Zinc
- REFUNDED: Cyan

### Responsive Design
- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column grid
- **Desktop**: 4-column grid for cards, 2-column for charts

## Performance Optimization

1. **Parallel Data Fetching**: All dashboard data fetched simultaneously
2. **Server-Side Rendering**: Data fetched on server for faster initial load
3. **Suspense Boundaries**: Loading states for each section
4. **No-Store Cache**: Fresh data on every load (`cache: "no-store"`)
5. **Optimized Queries**: Aggregate queries with Prisma

## Future Enhancements

### Planned Features
1. **Filters**: Date range, property selection
2. **Export**: CSV export for bookings and payments
3. **Real-time Updates**: WebSocket for live data
4. **Notifications**: Alert system for pending actions
5. **Rooms Table**: Full rooms management table
6. **Bookings Table**: Full bookings management table with actions

### Possible Improvements
1. **Caching**: Implement stale-while-revalidate strategy
2. **Pagination**: Client-side pagination for tables
3. **Search**: Advanced search with multiple filters
4. **Analytics**: More detailed analytics and insights
5. **Trends**: Occupancy trend chart (weekly/monthly)

## Usage

### Access Dashboard
1. Login as AdminKos user
2. Navigate to `/dashboard/adminkos`
3. View comprehensive dashboard

### Navigation
- Click "Kelola Properti" on property cards to manage specific property
- Use sidebar to navigate to other sections (Properties, Bookings, Rooms, etc.)

## Testing

### Manual Testing Checklist
- [ ] Dashboard loads without errors
- [ ] All KPI cards display correct data
- [ ] Today's activity shows correct bookings
- [ ] Revenue chart displays 12 months
- [ ] Payment breakdown shows correct percentages
- [ ] Properties display with correct stats
- [ ] Loading states work correctly
- [ ] Error states handled gracefully
- [ ] Responsive design works on all screen sizes

### Test Data Requirements
- At least 1 property with APPROVED status
- Multiple rooms with varying availability
- Bookings with different statuses
- Payments with different types and statuses
- Data spanning multiple months for charts

## Troubleshooting

### Common Issues

1. **Empty Dashboard**
   - Ensure user has ADMINKOS role
   - Check if user has created properties
   - Verify properties are APPROVED

2. **No Revenue Data**
   - Check if there are SUCCESS payments
   - Verify payment dates are within range
   - Ensure payments are linked to user's properties

3. **Loading Forever**
   - Check API endpoint responses
   - Verify database connection
   - Check browser console for errors

4. **Permission Denied**
   - Verify user role is ADMINKOS
   - Check authentication token
   - Ensure session is valid

## Related Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [3-Tier Architecture](./README_API_DOCS.md)
- [Property Management](./IMPLEMENTATION_SUMMARY.md)
- [Booking System](./booking-system.md)

