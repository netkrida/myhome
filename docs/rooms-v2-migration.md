# Rooms V2 - Modern Room Management System

## Overview

Halaman **Rooms V2** adalah sistem manajemen kamar yang modern dan intuitif untuk AdminKos, menggantikan halaman rooms lama dengan fitur-fitur yang lebih lengkap dan user experience yang lebih baik.

## Key Features

### 1. Summary Cards
- **Total Kamar**: Jumlah total kamar pada properti yang dipilih
- **Kamar Tersedia**: Jumlah kamar yang tersedia untuk disewa
- **Kamar Terisi**: Jumlah kamar yang sedang ditempati
- **Occupancy Rate**: Persentase tingkat hunian

### 2. Property Slider
- Slider horizontal untuk memilih properti
- Chip "Semua Properti" untuk melihat agregat semua properti
- Menampilkan ringkasan per properti (total, tersedia, terisi)
- Responsive dengan swipe support di mobile

### 3. Rooms Grid (Maps List)
- Grid card untuk setiap kamar dengan status warna:
  - **Hijau**: Tersedia (available)
  - **Ungu/Biru**: Terisi (occupied)
  - **Abu-abu**: Nonaktif (unavailable)
- Informasi per card:
  - Nomor kamar
  - Tipe kamar
  - Lantai
  - Harga bulanan
  - Status booking
- Filter & Sort:
  - Search by room number/type
  - Filter by status (available/occupied/unavailable)
  - Filter by floor
  - Sort by room number/floor/price

### 4. Booking Detail Modal
- Tampil saat klik kamar yang terisi
- Center modal dengan backdrop blur
- Informasi lengkap:
  - Kode booking
  - Status booking & payment
  - Informasi penyewa (nama, email, telepon)
  - Informasi kamar
  - Periode sewa (check-in, check-out)
  - Ringkasan pembayaran (total, terbayar, sisa)

### 5. Room Edit Modal
- Edit tipe kamar
- Edit lantai
- Edit harga (monthly, daily, weekly, quarterly, yearly)
- Toggle untuk menampilkan opsi harga lain

### 6. Add Room Modal
- Pilih properti
- Input nomor kamar (unique per property)
- Input tipe kamar
- Input lantai
- Input harga bulanan (required)
- Opsi harga lain (daily, weekly, quarterly, yearly)
- Deskripsi & ukuran (optional)

## Architecture

### Components (`src/components/dashboard/adminkos/rooms-v2/`)

1. **summary-cards.tsx**
   - Menampilkan 4 kartu ringkasan
   - Props: totalRooms, availableRooms, occupiedRooms, occupancyRate, propertyName, isLoading

2. **property-slider.tsx**
   - Slider horizontal untuk memilih properti
   - Props: properties, selectedPropertyId, onPropertySelect, isLoading
   - Features: scroll arrows, snap scrolling, keyboard support

3. **rooms-grid.tsx**
   - Grid kamar dengan filter & sort
   - Props: rooms, isLoading, onRoomClick, onRoomEdit, onViewBooking
   - Features: search, filter by status/floor, sort by number/floor/price

4. **room-card.tsx**
   - Card individual untuk setiap kamar
   - Props: id, roomNumber, roomType, floor, monthlyPrice, status, hasActiveBooking, mainImageUrl, onClick, onEdit, onViewBooking
   - Features: status color coding, dropdown menu, active booking indicator

5. **booking-detail-modal.tsx**
   - Modal untuk menampilkan detail booking aktif
   - Props: roomId, isOpen, onClose
   - Features: center modal, backdrop blur, ESC to close

6. **room-edit-modal.tsx**
   - Modal untuk edit kamar
   - Props: isOpen, onClose, onSuccess, room
   - Features: form validation, toggle for additional prices

7. **add-room-modal.tsx**
   - Modal untuk tambah kamar baru
   - Props: isOpen, onClose, onSuccess, properties, preselectedPropertyId
   - Features: property selection, unique room number validation

### API Endpoints

All endpoints follow 3-tier architecture:

1. **GET /api/adminkos/rooms/summary**
   - Query: `propertyId` (optional)
   - Returns: RoomsSummaryDTO

2. **GET /api/adminkos/properties**
   - Returns: MyPropertiesDTO (list of properties with stats)

3. **GET /api/adminkos/rooms/grid**
   - Query: `propertyId` (required)
   - Returns: RoomGridItemDTO[]

4. **GET /api/adminkos/rooms/[id]/booking-active**
   - Returns: ActiveBookingDetailDTO | null

5. **PATCH /api/adminkos/rooms/[id]/edit**
   - Body: EditRoomDTO
   - Returns: success message

6. **POST /api/adminkos/rooms/add**
   - Body: AddRoomDTO
   - Returns: { id: string }

### Types (`src/server/types/adminkos.ts`)

```typescript
interface RoomsSummaryDTO {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  propertyName?: string;
}

interface RoomGridItemDTO {
  id: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  hasActiveBooking: boolean;
  mainImageUrl: string | null;
  status: 'available' | 'occupied' | 'unavailable';
}

interface ActiveBookingDetailDTO {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  leaseType: LeaseType;
  checkInDate: Date;
  checkOutDate: Date | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    floor: number;
    propertyName: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
}

interface EditRoomDTO {
  roomType?: string;
  floor?: number;
  monthlyPrice?: number;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  quarterlyPrice?: number | null;
  yearlyPrice?: number | null;
}

interface AddRoomDTO {
  propertyId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  quarterlyPrice?: number | null;
  yearlyPrice?: number | null;
  isAvailable?: boolean;
  description?: string;
  size?: string;
}
```

## Migration Notes

### Old Components (Archived)
- `src/app/(protected-pages)/dashboard/adminkos/rooms/page.old.tsx` - Old rooms page (backup)
- `src/components/dashboard/adminkos/room/*` - Old room components (still available for reference)

### New Components
- `src/app/(protected-pages)/dashboard/adminkos/rooms/page.tsx` - New rooms page
- `src/components/dashboard/adminkos/rooms-v2/*` - New room components

### Breaking Changes
- None - old components are still available but not used in the main page

### Benefits of V2
1. **Better UX**: Modern, clean interface with intuitive navigation
2. **Visual Status**: Color-coded room cards for quick status identification
3. **Efficient Navigation**: Property slider for quick switching between properties
4. **Detailed Information**: Comprehensive booking details in modal
5. **Quick Actions**: Edit and view booking directly from room card
6. **Responsive Design**: Works seamlessly on mobile and desktop
7. **Performance**: Optimized data fetching and rendering

## Usage

### For Developers

1. **Import components**:
```typescript
import {
  SummaryCards,
  PropertySlider,
  RoomsGrid,
  BookingDetailModal,
  RoomEditModal,
  AddRoomModal,
} from "@/components/dashboard/adminkos/rooms-v2";
```

2. **Use in page**:
```typescript
<SummaryCards {...summaryData} />
<PropertySlider {...propertyData} />
<RoomsGrid {...roomsData} />
```

### For Users (AdminKos)

1. Navigate to **Dashboard > Rooms**
2. View summary cards at the top
3. Select property from slider
4. Browse rooms in grid view
5. Click room to view booking details (if occupied)
6. Use dropdown menu to edit room
7. Click "Tambah Kamar" to add new room

## Future Enhancements

- [ ] Bulk room operations (edit multiple rooms at once)
- [ ] Room availability calendar
- [ ] Room maintenance tracking
- [ ] Room revenue analytics
- [ ] Export room data to CSV/Excel
- [ ] Room image gallery in detail view
- [ ] Room booking history
- [ ] Room notes/comments

