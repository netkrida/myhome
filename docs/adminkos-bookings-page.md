# AdminKos Bookings Page - Data Master Booking

Halaman Data Master Booking untuk AdminKos yang menampilkan daftar lengkap penyewa (bookings) dengan fitur filter, pencarian, dan detail view.

## 📍 Route

```
/dashboard/adminkos/bookings
```

## 🎯 Fitur Utama

### 1. Header & Toolbar
- **Judul**: "Daftar Penyewa / Bookings"
- **Tombol Aksi**:
  - `+ Tambah Booking` - Manual booking creation (placeholder)
  - `Export CSV` - Export data bookings (placeholder)

### 2. Filter Global
Filter yang tersedia:
- **Pencarian Global**: Cari berdasarkan booking code, nama penyewa, email, atau nomor kamar
- **Status Booking**: UNPAID, DEPOSIT_PAID, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, EXPIRED
- **Status Pembayaran**: PENDING, SUCCESS, FAILED, EXPIRED, REFUNDED
- **Tipe Sewa**: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
- **Properti**: Dropdown filter (jika punya >1 properti)
- **Tanggal**: Range picker untuk check-in/check-out date

### 3. Tabel Data Master Bookings

#### Kolom Tabel:
1. **Kode Booking** - Short unique code (font mono)
2. **Penyewa** - Nama + email customer
3. **Properti & Kamar** - Nama properti, nomor kamar + tipe
4. **Check-in** - Tanggal check-in + check-out (jika ada)
5. **Tipe Sewa** - Daily/Monthly/Yearly
6. **Total** - Total amount + deposit (jika ada)
7. **Status Bayar** - Badge dengan warna:
   - PENDING: Amber
   - SUCCESS: Green
   - FAILED: Red
   - EXPIRED: Gray
   - REFUNDED: Cyan
8. **Status Booking** - Badge dengan warna:
   - UNPAID: Gray
   - DEPOSIT_PAID: Indigo
   - CONFIRMED: Blue
   - CHECKED_IN: Emerald
   - COMPLETED: Slate
   - CANCELLED: Rose
   - EXPIRED: Zinc
9. **Aksi** - Tombol "Lihat Detail"

#### Fitur Tabel:
- Responsive (scroll horizontal di mobile)
- Pagination dengan navigasi halaman
- Loading state saat fetch data
- Empty state jika tidak ada data

### 4. Detail Drawer

Drawer yang muncul saat klik "Lihat Detail" menampilkan:

#### Customer Info
- Nama lengkap
- Email
- No. HP
- Jenis Kelamin
- Institusi (jika ada)

#### Booking Info
- Kode Booking
- Tanggal Check-in
- Tanggal Check-out (jika ada)
- Tipe Sewa
- Waktu dibuat

#### Property & Room Info
- Nama Properti
- Tipe Properti
- Alamat lengkap
- Nomor Kamar
- Tipe Kamar
- Lantai
- Harga Bulanan

#### Payment Info
- Total Tagihan
- Deposit (jika ada)
- **Riwayat Pembayaran**:
  - Tipe pembayaran (Deposit/Pelunasan)
  - Status pembayaran
  - Jumlah
  - Metode pembayaran
  - Waktu transaksi

#### Status Timeline
Visual timeline menampilkan progress booking:
1. Belum Bayar (UNPAID)
2. DP Dibayar (DEPOSIT_PAID)
3. Terkonfirmasi (CONFIRMED)
4. Check-in (CHECKED_IN)
5. Selesai (COMPLETED)

## 🏗️ Arsitektur

### File Structure

```
src/
├── app/(protected-pages)/dashboard/adminkos/bookings/
│   ├── page.tsx                    # Server component (data fetching)
│   └── bookings-page-client.tsx    # Client component (UI & interactions)
│
├── components/adminkos/bookings/
│   ├── index.ts                    # Central export
│   ├── booking-status-badge.tsx    # Status badges
│   ├── booking-filters.tsx         # Filter component
│   ├── bookings-table.tsx          # Table component
│   └── booking-detail-drawer.tsx   # Detail drawer
│
├── server/
│   ├── api/adminkos.api.ts         # AdminKosAPI.getRecentBookings()
│   ├── types/adminkos.ts           # BookingTableItemDTO, RecentBookingsDTO
│   └── schemas/adminkos.schemas.ts # adminKosBookingsQuerySchema
│
└── app/api/adminkos/bookings/
    └── route.ts                    # GET /api/adminkos/bookings
```

### 3-Tier Architecture

#### Tier 1: API Routes
```typescript
// app/api/adminkos/bookings/route.ts
GET /api/adminkos/bookings
Query params: page, limit, status, paymentStatus, leaseType, propertyId, search, dateFrom, dateTo

// app/api/adminkos/bookings/customer/route.ts
POST /api/adminkos/bookings/customer
Body: { email, name?, phoneNumber? }
Response: { userId, email, name, isNew }

// app/api/adminkos/bookings/manual/route.ts
POST /api/adminkos/bookings/manual
Body: { userId, roomId, checkInDate, leaseType, depositOption }
Response: { bookingId, bookingCode, totalAmount, paymentAmount, ... }
```

#### Tier 2: Application Service
```typescript
// server/api/adminkos.api.ts
AdminKosAPI.getRecentBookings(query: AdminKosBookingsQuery)
```

#### Tier 3: Repositories & Services
```typescript
// server/repositories/booking.repository.ts
BookingRepository.getList() with includes:
- user (customer)
- property
- room
- payments

// server/repositories/user.repository.ts
UserRepository.getByEmail()
UserRepository.create()

// server/services/booking.service.ts
BookingService.generateBookingCode()
BookingService.calculateCheckOutDate()
BookingService.calculateBookingAmount()
BookingService.validateBookingCreation()

// server/services/payment.service.ts
PaymentService.generateOrderId()
```

## 🎨 UI/UX Design

### Color Scheme

#### Booking Status Colors
```typescript
UNPAID: "bg-zinc-100 text-zinc-800 border-zinc-300"
DEPOSIT_PAID: "bg-indigo-100 text-indigo-800 border-indigo-300"
CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300"
CHECKED_IN: "bg-emerald-100 text-emerald-800 border-emerald-300"
COMPLETED: "bg-slate-100 text-slate-800 border-slate-300"
CANCELLED: "bg-rose-100 text-rose-800 border-rose-300"
EXPIRED: "bg-zinc-100 text-zinc-800 border-zinc-300"
```

#### Payment Status Colors
```typescript
PENDING: "bg-amber-100 text-amber-800 border-amber-300"
SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-300"
FAILED: "bg-rose-100 text-rose-800 border-rose-300"
EXPIRED: "bg-zinc-100 text-zinc-800 border-zinc-300"
REFUNDED: "bg-cyan-100 text-cyan-800 border-cyan-300"
```

### Responsive Design
- **Mobile** (< 768px): Tabel scroll horizontal, filter stacked
- **Tablet** (768px - 1024px): 2-column filter grid
- **Desktop** (> 1024px): 5-column filter grid, full table view

## 📊 Data Flow

### Initial Load
```
1. Server Component (page.tsx)
   ↓
2. AdminKosAPI.getRecentBookings() + getMyProperties()
   ↓
3. Pass initialData to Client Component
   ↓
4. Client Component renders table
```

### Filter/Search
```
1. User changes filter
   ↓
2. Client Component updates filters state
   ↓
3. useEffect triggers fetchBookings()
   ↓
4. Fetch /api/adminkos/bookings with query params
   ↓
5. Update bookings & pagination state
```

### View Details
```
1. User clicks "Lihat Detail"
   ↓
2. Set selectedBooking state
   ↓
3. Open drawer (setIsDrawerOpen(true))
   ↓
4. Drawer displays full booking info
```

## 🔧 Components API

### BookingStatusBadge
```typescript
interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}
```

### PaymentStatusBadge
```typescript
interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}
```

### BookingFiltersComponent
```typescript
interface BookingFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  properties?: Array<{ id: string; name: string }>;
}

interface BookingFilters {
  search?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  leaseType?: LeaseType;
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
```

### BookingsTable
```typescript
interface BookingsTableProps {
  bookings: BookingTableItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onViewDetails: (booking: BookingTableItemDTO) => void;
}
```

### BookingDetailDrawer
```typescript
interface BookingDetailDrawerProps {
  booking: BookingTableItemDTO & ExtendedFields | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### AddBookingDialog
```typescript
interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  properties: Array<{ id: string; name: string }>;
}
```

### Export CSV Utilities
```typescript
// lib/export-csv.ts
exportToCSV<T>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string; format?: (value: any) => string }[]
)

formatCurrencyForCSV(amount: number): string
formatDateForCSV(date: Date | string | null | undefined): string
formatDateTimeForCSV(date: Date | string | null | undefined): string
```

## 🚀 Usage Example

### Server Component
```typescript
// page.tsx
export default async function AdminKosBookingsPage() {
  await requireRole(["ADMINKOS"]);

  const [initialData, properties] = await Promise.all([
    getInitialBookings(),
    getMyProperties(),
  ]);

  return (
    <DashboardLayout title="Manajemen Booking">
      <BookingsPageClient initialData={initialData} properties={properties} />
    </DashboardLayout>
  );
}
```

### Client Component
```typescript
// bookings-page-client.tsx
export function BookingsPageClient({ initialData, properties }) {
  const [filters, setFilters] = useState<BookingFilters>({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  return (
    <>
      <BookingFiltersComponent 
        filters={filters} 
        onFiltersChange={setFilters}
        properties={properties}
      />
      <BookingsTable 
        bookings={bookings}
        onViewDetails={setSelectedBooking}
      />
      <BookingDetailDrawer 
        booking={selectedBooking}
        open={isDrawerOpen}
      />
    </>
  );
}
```

## ✅ Implemented Features

### Export CSV
- ✅ Export bookings to CSV file with Indonesian formatting
- ✅ Includes all filter options (exports filtered data)
- ✅ Formatted currency (Rp)
- ✅ Formatted dates (dd/MM/yyyy)
- ✅ Translated status labels
- ✅ Uses `papaparse` library for CSV generation
- ✅ UTF-8 BOM for Excel compatibility

### Manual Booking Creation
- ✅ AdminKos can create bookings manually
- ✅ Auto-create customer if email doesn't exist
- ✅ Property and room selection
- ✅ Customer information input (email, name, phone)
- ✅ Booking details (check-in date, lease type, payment option)
- ✅ Room availability validation
- ✅ Automatic booking code generation
- ✅ Payment record creation

## 📝 TODO / Future Enhancements

- [ ] Add bulk actions (cancel multiple bookings)
- [ ] Add quick actions (confirm, check-in, check-out)
- [ ] Add send payment link functionality
- [ ] Add booking edit functionality
- [ ] Add booking cancellation with reason
- [ ] Add real-time updates (WebSocket/Polling)
- [ ] Add booking analytics/charts
- [ ] Add print booking details
- [ ] Add Midtrans payment link generation for manual bookings
- [ ] Add email notification after manual booking creation

## 🔐 Security & Permissions

- **Role Required**: `ADMINKOS`
- **Data Scope**: Only bookings from properties owned by the logged-in AdminKos
- **API Protection**: All endpoints use `withAuth` middleware
- **RBAC**: Enforced at both API and UI level

## 📚 Related Documentation

- [AdminKos Dashboard Overview](./adminkos-dashboard.md)
- [Booking System Overview](./PAYMENT_SYSTEM_OVERVIEW.md)
- [3-Tier Architecture](./architecture.md)

