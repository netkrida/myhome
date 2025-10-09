# AdminKos Bookings - Export CSV & Manual Booking

Dokumentasi untuk fitur Export CSV dan Manual Booking Creation pada halaman AdminKos Bookings.

## 📦 Dependencies

```json
{
  "papaparse": "^5.4.1",
  "@types/papaparse": "^5.3.14"
}
```

## 🔧 Export CSV Feature

### Overview
Fitur export CSV memungkinkan AdminKos untuk mengekspor data bookings ke file CSV dengan format yang rapi dan siap dibuka di Excel.

### Features
- ✅ Export semua bookings atau filtered bookings
- ✅ Format currency Indonesia (Rp)
- ✅ Format tanggal Indonesia (dd/MM/yyyy)
- ✅ Translated status labels (Indonesia)
- ✅ UTF-8 BOM untuk kompatibilitas Excel
- ✅ Loading state saat export
- ✅ Max 1000 records per export

### Implementation

#### Export Utility (`src/lib/export-csv.ts`)
```typescript
import Papa from "papaparse";

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string; format?: (value: any) => string }[]
) {
  // Transform data if columns specified
  let csvData: any[] = data;
  
  if (columns) {
    csvData = data.map((row) => {
      const transformedRow: Record<string, any> = {};
      columns.forEach((col) => {
        const value = row[col.key];
        transformedRow[col.label] = col.format ? col.format(value) : value;
      });
      return transformedRow;
    });
  }

  // Convert to CSV with UTF-8 BOM
  const csv = Papa.unparse(csvData, {
    quotes: true,
    delimiter: ",",
    header: true,
  });

  // Download file
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

#### Usage in Component
```typescript
const handleExport = async () => {
  setIsExporting(true);
  try {
    // Fetch all bookings
    const response = await fetch(`/api/adminkos/bookings?limit=1000&...filters`);
    const data = await response.json();

    if (data.success && data.data.bookings.length > 0) {
      exportToCSV(
        data.data.bookings,
        `bookings-${new Date().toISOString().split("T")[0]}.csv`,
        [
          { key: "bookingCode", label: "Kode Booking" },
          { key: "customerName", label: "Nama Penyewa" },
          { 
            key: "checkInDate", 
            label: "Check-in", 
            format: formatDateForCSV 
          },
          { 
            key: "totalAmount", 
            label: "Total (Rp)", 
            format: formatCurrencyForCSV 
          },
          // ... more columns
        ]
      );
    }
  } catch (error) {
    alert("Gagal mengekspor data");
  } finally {
    setIsExporting(false);
  }
};
```

### CSV Output Format

```csv
Kode Booking,Nama Penyewa,Email Penyewa,Properti,Nomor Kamar,Tipe Kamar,Check-in,Check-out,Tipe Sewa,Total (Rp),Deposit (Rp),Status Pembayaran,Status Booking,Tanggal Dibuat
BK1234567890,John Doe,john@example.com,Kos Mawar,101,Standard,01/01/2024,31/01/2024,Bulanan,1500000.00,500000.00,Berhasil,Terkonfirmasi,01/01/2024 10:30
```

### Format Functions

#### Currency Format
```typescript
export function formatCurrencyForCSV(amount: number): string {
  return amount.toFixed(2);
}
```

#### Date Format
```typescript
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: idLocale });
}
```

#### DateTime Format
```typescript
export function formatDateTimeForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: idLocale });
}
```

---

## 🆕 Manual Booking Creation

### Overview
Fitur manual booking memungkinkan AdminKos untuk membuat booking secara manual untuk customer, berguna untuk booking offline atau walk-in.

### Features
- ✅ Auto-create customer jika email belum terdaftar
- ✅ Property & room selection dengan filter
- ✅ Customer information input
- ✅ Booking details configuration
- ✅ Room availability validation
- ✅ Automatic booking code generation
- ✅ Payment record creation
- ✅ Form validation

### Flow Diagram

```
1. AdminKos opens "Tambah Booking" dialog
   ↓
2. Select Property
   ↓
3. System loads available rooms for selected property
   ↓
4. Select Room
   ↓
5. Enter Customer Info (email, name, phone)
   ↓
6. Enter Booking Details (check-in, lease type, payment option)
   ↓
7. Submit Form
   ↓
8. System checks/creates customer
   ↓
9. System validates room availability
   ↓
10. System creates booking + payment record
    ↓
11. Success! Booking created with booking code
```

### API Endpoints

#### 1. Find/Create Customer
```
POST /api/adminkos/bookings/customer
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "phoneNumber": "08123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "customer@example.com",
    "name": "John Doe",
    "isNew": false
  }
}
```

**Logic:**
1. Check if user with email exists
2. If exists and is CUSTOMER → return user
3. If exists but not CUSTOMER → error
4. If not exists → create new CUSTOMER user

#### 2. Create Manual Booking
```
POST /api/adminkos/bookings/manual
```

**Request Body:**
```json
{
  "userId": "user_123",
  "roomId": "room_456",
  "checkInDate": "2024-01-01T00:00:00.000Z",
  "leaseType": "MONTHLY",
  "depositOption": "full"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_789",
    "bookingCode": "BK1234567890",
    "totalAmount": 1500000,
    "depositAmount": 500000,
    "paymentAmount": 1500000,
    "paymentType": "FULL",
    "paymentId": "payment_101",
    "orderId": "ORDER-booking_789-FULL"
  }
}
```

**Validation:**
1. Verify room belongs to AdminKos's property
2. Check room availability for date range
3. Validate booking creation rules
4. Calculate amounts
5. Create booking with UNPAID status
6. Create payment record with PENDING status

### Component: AddBookingDialog

#### Props
```typescript
interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  properties: Array<{ id: string; name: string }>;
}
```

#### Form Fields

1. **Property Selection** (required)
   - Dropdown of AdminKos's properties
   - Triggers room loading

2. **Room Selection** (required)
   - Dropdown of available rooms
   - Shows: Room Number - Room Type (Price/month)
   - Disabled until property selected

3. **Customer Information**
   - Email (required) - used to find/create customer
   - Name (optional) - defaults to email prefix if not provided
   - Phone Number (optional)

4. **Booking Details**
   - Check-in Date (required) - date picker, min: today
   - Lease Type (required) - DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
   - Payment Option (required) - Full Payment or Deposit

#### Validation Rules

- All required fields must be filled
- Check-in date must be in the future
- Room must be available for selected date range
- Email must be valid format
- Property must belong to AdminKos

#### Success Flow

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 1. Validate form
  if (!propertyId || !roomId || !customerEmail || !checkInDate) {
    alert("Mohon lengkapi semua field yang wajib diisi");
    return;
  }

  // 2. Find/Create customer
  const customerResponse = await fetch("/api/adminkos/bookings/customer", {
    method: "POST",
    body: JSON.stringify({ email, name, phoneNumber }),
  });
  const customerId = customerData.data.userId;

  // 3. Create booking
  const bookingResponse = await fetch("/api/adminkos/bookings/manual", {
    method: "POST",
    body: JSON.stringify({ userId: customerId, roomId, checkInDate, leaseType, depositOption }),
  });

  // 4. Success
  alert(`Berhasil! Booking ${bookingData.data.bookingCode} berhasil dibuat`);
  resetForm();
  onSuccess(); // Refresh bookings list
  onOpenChange(false);
};
```

### Security & Permissions

#### Authorization
- Only users with role `ADMINKOS` can access these endpoints
- AdminKos can only create bookings for their own properties
- Verified at both API and repository level

#### Validation
- Room ownership verification
- Room availability check
- Booking creation rules validation
- Email format validation
- Date validation (future dates only)

### Error Handling

#### Common Errors

1. **Email already registered with different role**
   ```
   Error: "Email sudah terdaftar dengan role lain. Gunakan email berbeda."
   ```

2. **Room not available**
   ```
   Error: "Room is not available for the selected dates"
   ```

3. **Property not owned by AdminKos**
   ```
   Error: "You can only create bookings for your own properties"
   ```

4. **Invalid date**
   ```
   Error: "Check-in date must be in the future"
   ```

### Future Enhancements

- [ ] Generate Midtrans payment link after booking creation
- [ ] Send email notification to customer
- [ ] Send WhatsApp notification to customer
- [ ] Add customer profile fields (gender, institution)
- [ ] Add special requests/notes field
- [ ] Add discount/promo code support
- [ ] Add bulk booking creation (multiple rooms)
- [ ] Add booking template/preset

