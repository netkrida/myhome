# Booking Detail Page - Documentation

## 📄 Overview

Halaman detail booking untuk menampilkan informasi lengkap tentang booking berdasarkan ID.

**URL:** `/dashboard/customer/bookings/[id]`

**File:** `src/app/(protected-pages)/dashboard/customer/bookings/[id]/page.tsx`

**Access:** Protected - Customer Dashboard Only

---

## 🎯 Features

### **1. Informasi Booking Lengkap** ✅

- Booking code (unique identifier)
- Status booking (UNPAID, CONFIRMED, CHECKED_IN, dll)
- Status pembayaran (PENDING, SUCCESS, FAILED, EXPIRED)
- Properti dan kamar
- Tanggal check-in dan check-out
- Informasi penyewa
- Total pembayaran dan deposit

---

### **2. Riwayat Pembayaran** ✅

- Daftar semua transaksi pembayaran
- Tipe pembayaran (DEPOSIT / FULL)
- Metode pembayaran
- Status pembayaran
- Waktu transaksi
- Transaction ID

---

### **3. UI/UX Features** ✅

- Loading skeleton saat fetch data
- Error handling dengan pesan yang jelas
- Responsive design (mobile & desktop)
- Badge untuk status (color-coded)
- Format currency Indonesia (Rp)
- Format tanggal Indonesia
- Back button untuk navigasi

---

## 🔧 Technical Implementation

### **API Endpoint**

**GET** `/api/bookings/[id]`

**Authentication:** Required

**Response:**
```json
{
  "id": "clxxx...",
  "bookingCode": "BK-20250107-001",
  "userId": "clxxx...",
  "propertyId": "clxxx...",
  "roomId": "clxxx...",
  "checkInDate": "2025-01-15T00:00:00.000Z",
  "checkOutDate": "2025-02-15T00:00:00.000Z",
  "leaseType": "MONTHLY",
  "totalAmount": 3000000,
  "depositAmount": 1000000,
  "paymentStatus": "SUCCESS",
  "status": "CONFIRMED",
  "createdAt": "2025-01-07T10:00:00.000Z",
  "updatedAt": "2025-01-07T10:30:00.000Z",
  "user": {
    "id": "clxxx...",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "property": {
    "id": "clxxx...",
    "name": "Kos Mawar"
  },
  "room": {
    "id": "clxxx...",
    "roomNumber": "A101",
    "roomType": "Standard",
    "monthlyPrice": 1500000
  },
  "payments": [
    {
      "id": "clxxx...",
      "paymentType": "DEPOSIT",
      "paymentMethod": "gopay",
      "amount": 1000000,
      "status": "SUCCESS",
      "transactionTime": "2025-01-07T10:15:00.000Z",
      "transactionId": "TRX-123456"
    }
  ]
}
```

---

### **Components Used**

**shadcn/ui:**
- `Card` - Container untuk sections
- `Badge` - Status indicators
- `Button` - Navigation & actions
- `Separator` - Visual dividers
- `Skeleton` - Loading states

**Icons (lucide-react):**
- `ArrowLeft` - Back button
- `Calendar` - Dates
- `Home` - Property
- `User` - User info
- `CreditCard` - Payment
- `MapPin` - Location
- `Clock` - Pending status
- `CheckCircle2` - Success status
- `XCircle` - Failed status
- `AlertCircle` - Alert status

---

### **State Management**

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [booking, setBooking] = useState<BookingDetail | null>(null);
```

---

### **Data Fetching**

```typescript
const fetchBookingDetail = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to fetch booking details");
    }

    setBooking(result);
  } catch (err: any) {
    console.error("Error fetching booking:", err);
    setError(err.message || "Failed to load booking details");
  } finally {
    setLoading(false);
  }
};
```

---

## 🎨 UI Sections

### **1. Header Section**

- Back button (kembali ke halaman sebelumnya)
- Booking code (large, prominent)
- Status badges (booking status & payment status)

---

### **2. Booking Info Section**

**Property & Room:**
- Nama properti
- Nomor kamar & tipe kamar

**Dates:**
- Check-in date
- Check-out date (jika ada)

**User Info:**
- Nama penyewa
- Email penyewa

**Payment Info:**
- Tipe sewa (Bulanan/Harian)
- Total pembayaran
- Deposit (jika ada)

---

### **3. Payment History Section**

Untuk setiap payment:
- Tipe pembayaran (Deposit/Full)
- Status badge (color-coded)
- Metode pembayaran
- Waktu transaksi
- Transaction ID
- Jumlah pembayaran

---

### **4. Timestamps Section**

- Created at
- Last updated

---

## 🎯 Status Badges

### **Booking Status**

| Status | Label | Variant | Color |
|--------|-------|---------|-------|
| UNPAID | Belum Dibayar | destructive | Red |
| DEPOSIT_PAID | DP Dibayar | secondary | Gray |
| CONFIRMED | Terkonfirmasi | default | Blue |
| CHECKED_IN | Check-in | default | Blue |
| CHECKED_OUT | Check-out | secondary | Gray |
| COMPLETED | Selesai | outline | Gray |
| CANCELLED | Dibatalkan | destructive | Red |
| EXPIRED | Kadaluarsa | destructive | Red |

---

### **Payment Status**

| Status | Label | Variant | Icon | Color |
|--------|-------|---------|------|-------|
| PENDING | Menunggu | secondary | Clock | Gray |
| SUCCESS | Berhasil | default | CheckCircle2 | Green |
| FAILED | Gagal | destructive | XCircle | Red |
| EXPIRED | Kadaluarsa | destructive | AlertCircle | Red |

---

## 📱 Responsive Design

### **Desktop (md+)**

- 2-column grid untuk info sections
- Max width: 4xl (896px)
- Spacious layout

### **Mobile**

- Single column layout
- Full width cards
- Touch-friendly buttons

---

## 🔒 Security

### **Authentication**

- Endpoint require authentication
- User hanya bisa akses booking sendiri (enforced di API)
- Redirect ke login jika tidak authenticated

### **Authorization**

- API validates userId
- Customer: hanya booking sendiri
- Admin: bisa akses semua booking (tergantung role)

---

## 🧪 Usage Examples

### **Navigate to Booking Detail**

```typescript
// From booking list (customer dashboard)
router.push(`/dashboard/customer/bookings/${booking.id}`);

// From payment success page
router.push(`/dashboard/customer/bookings/${bookingId}`);

// Direct link
<Link href={`/dashboard/customer/bookings/${bookingId}`}>
  Lihat Detail
</Link>
```

---

### **Example: Add "View Detail" Button**

```typescript
// In booking list component (customer dashboard)
<Button
  onClick={() => router.push(`/dashboard/customer/bookings/${booking.id}`)}
  variant="outline"
>
  Lihat Detail
</Button>
```

---

## 🎯 Error Handling

### **Loading State**

- Show skeleton loaders
- Prevent layout shift

### **Error State**

- Display error message
- Show error icon
- Provide "Back to Dashboard" button

### **Not Found**

- Show "Booking tidak ditemukan"
- Provide navigation options

---

## 🔄 Future Enhancements

### **Possible Additions:**

1. **Actions:**
   - Cancel booking button
   - Pay remaining balance button
   - Download invoice button

2. **More Info:**
   - Property address & facilities
   - Room photos
   - Booking notes/special requests

3. **Communication:**
   - Chat with property owner
   - Contact information

4. **Timeline:**
   - Booking status history
   - Payment timeline

---

## 📝 Testing Checklist

- [ ] Page loads correctly with valid booking ID
- [ ] Shows error for invalid booking ID
- [ ] Shows error for unauthorized access
- [ ] All booking info displayed correctly
- [ ] Payment history displayed correctly
- [ ] Status badges show correct colors
- [ ] Currency formatted correctly (Rp)
- [ ] Dates formatted correctly (Indonesian)
- [ ] Back button works
- [ ] Responsive on mobile
- [ ] Responsive on desktop
- [ ] Loading skeleton shows while fetching
- [ ] Error state shows when fetch fails

---

## 🎉 Summary

**Halaman detail booking yang:**
- ✅ Menampilkan informasi lengkap
- ✅ Riwayat pembayaran
- ✅ UI/UX yang baik
- ✅ Responsive design
- ✅ Secure (authentication & authorization)
- ✅ Error handling yang baik
- ✅ Loading states
- ✅ Format Indonesia (currency & date)
- ✅ **Protected route** - Customer dashboard only

**URL:** `/dashboard/customer/bookings/[id]`

**Location:** `src/app/(protected-pages)/dashboard/customer/bookings/[id]/page.tsx`

**Siap digunakan!** 🚀

