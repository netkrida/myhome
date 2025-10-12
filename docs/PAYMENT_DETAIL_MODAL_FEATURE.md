# Payment Detail Modal Feature

## 📋 Overview
Fitur modal untuk menampilkan detail pembayaran dari halaman Buku Kas (Ledger) di dashboard Admin Kos. Ketika admin melihat transaksi dengan referensi "Pembayaran Kos", mereka dapat mengklik tombol panah untuk melihat detail lengkap pembayaran dalam modal popup.

## 🎯 Fitur Utama

### 1. **Modal Detail Pembayaran**
- Menampilkan informasi lengkap pembayaran
- Status pembayaran dengan ikon yang sesuai (Success, Pending, Failed, Expired)
- Detail booking terkait
- Desain responsif dengan scroll area untuk konten panjang

### 2. **Integrasi Buku Kas**
- Tombol panah (ExternalLink icon) muncul di kolom Referensi
- Hanya muncul untuk transaksi dengan tipe "PAYMENT"
- Klik tombol akan membuka modal dengan order ID

### 3. **Status Pembayaran**
Modal menampilkan berbagai status pembayaran:
- ✅ **SUCCESS**: Pembayaran berhasil (ikon hijau)
- ⏳ **PENDING**: Sedang diproses (ikon biru, animasi loading)
- ❌ **FAILED**: Pembayaran gagal (ikon merah)
- ⏰ **EXPIRED**: Pembayaran kadaluarsa (ikon merah)

## 📁 File yang Diubah/Ditambah

### 1. **Komponen Baru**
```
src/components/dashboard/adminkos/transaction/payment-detail-modal.tsx
```
- Komponen modal utama
- Mengambil data dari `/api/payments/status`
- Menampilkan detail pembayaran dan booking

### 2. **API Endpoint Baru**
```
src/app/api/payments/[paymentId]/route.ts
```
- Endpoint baru untuk mengambil payment details by payment ID (UUID)
- Digunakan untuk integrasi dengan ledger system
- Melakukan authorization check (customer atau property admin)
- Return payment + booking details

### 3. **Repository Method Baru**
```
src/server/repositories/payment.repository.ts
```
- Method `findByIdWithBooking(paymentId: string)` ditambahkan
- Mirip dengan `findByOrderIdWithBooking` tapi menggunakan payment.id
- Include booking, room, user, dan property relations

### 4. **File yang Diupdate**

#### `src/components/dashboard/adminkos/transaction/ledger-table.tsx`
- Menambah prop `onViewPayment?: (paymentId: string) => void`
- Update tombol ExternalLink dengan kondisi `entry.refType === "PAYMENT"`
- Menambahkan onClick handler untuk membuka modal
- Pass `entry.refId` (yang berisi payment.id) ke handler

#### `src/app/(protected-pages)/dashboard/adminkos/transaction/transaction-page-client.tsx`
- Import `PaymentDetailModal` component
- Menambah state `showPaymentDetail` dan `selectedPaymentId`
- Menambah handler `handleViewPayment(paymentId: string)`
- Render `PaymentDetailModal` di bagian bawah

#### `src/components/dashboard/adminkos/transaction/index.ts`
- Export `PaymentDetailModal` component

## 🔧 Cara Penggunaan

### Dari Sisi Admin:

1. Buka halaman **Dashboard → Transaction**
2. Pada tab **Buku Kas**, lihat daftar transaksi
3. Cari transaksi dengan badge "Pembayaran" yang memiliki referensi
4. Klik tombol panah (→) di kolom Referensi
5. Modal akan terbuka menampilkan:
   - Status pembayaran dengan ikon
   - Order ID dan detail pembayaran
   - Metode pembayaran yang digunakan
   - Waktu transaksi
   - Detail booking (kode booking, properti, kamar, check-in date)
6. Klik "Tutup" untuk menutup modal

### Flow Teknis:

```
User Click Arrow Button (on PAYMENT refType entry)
    ↓
handleViewPayment(paymentId) // paymentId from entry.refId
    ↓
setSelectedPaymentId(paymentId)
setShowPaymentDetail(true)
    ↓
PaymentDetailModal opens
    ↓
Fetch: GET /api/payments/[paymentId]
    ↓
Display payment & booking details
```

**Note**: Ledger entry's `refId` untuk tipe `PAYMENT` adalah `payment.id` (UUID), bukan `midtransOrderId`. Oleh karena itu, digunakan endpoint `/api/payments/[paymentId]` yang baru dibuat, bukan endpoint `/api/payments/status` yang menggunakan `orderId`.

## 🎨 UI/UX Features

### Modal Design:
- **Max width**: 2xl (672px)
- **Max height**: 90vh dengan scroll area
- **Sections**:
  1. Header dengan status icon dan judul
  2. Detail Pembayaran (2 kolom grid)
  3. Detail Booking (2 kolom grid)
  4. Info banner (berbeda sesuai status)
  5. Footer dengan tombol tutup

### Icons by Status:
- `CheckCircle2`: Success (hijau)
- `Loader2`: Pending (biru, spinning)
- `XCircle`: Failed/Expired (merah)
- `AlertCircle`: Warning/Error (kuning)

### Color Coding:
- **Success**: Green-600
- **Pending**: Blue-500
- **Failed/Expired**: Red-600
- **Warning**: Yellow-500

## 📊 Data yang Ditampilkan

### Payment Details:
- Order ID (Midtrans Order ID)
- Tipe Pembayaran (Deposit/Full Payment)
- Jumlah pembayaran (formatted currency)
- Status pembayaran
- Metode pembayaran
- Waktu transaksi

### Booking Details:
- Kode booking
- Status booking
- Nama properti
- Tipe & nomor kamar
- Tanggal check-in
- Total pembayaran

## 🔐 Security & Permissions

- Modal hanya bisa diakses dari halaman Admin Kos (protected)
- Data diambil dari API yang sudah ter-autentikasi
- Hanya menampilkan data milik property yang dikelola admin

## 🚀 Future Enhancements

Potensi pengembangan:
- [ ] Download receipt/invoice dari modal
- [ ] Refund button untuk admin
- [ ] Link langsung ke detail booking
- [ ] History pembayaran untuk booking yang sama
- [ ] Export single payment detail ke PDF

## 🐛 Error Handling

Modal menangani berbagai error state:
- **Loading state**: Spinner dengan pesan "Memuat Data..."
- **Network error**: Pesan error dengan tombol "Coba Lagi"
- **Data not found**: Pesan "Data pembayaran tidak ditemukan"
- **API error**: Menampilkan pesan error dari server

## 📝 Notes

- Tombol panah **hanya muncul** untuk transaksi dengan `refType === "PAYMENT"`
- Modal menggunakan `ScrollArea` dari shadcn/ui untuk konten panjang
- Format currency menggunakan `formatCurrency` dari `@/lib/utils`
- Format tanggal menggunakan `date-fns` library

## 🔧 Technical Notes

### Payment ID vs Order ID
Ada dua identifier berbeda untuk payment:
1. **payment.id** (UUID): Primary key di database
   - Digunakan sebagai `refId` di ledger entries
   - Format: `clxxxxx...` (CUID)
   - Endpoint: `GET /api/payments/[paymentId]`

2. **midtransOrderId** (String): Order ID dari Midtrans
   - Digunakan untuk integrasi dengan Midtrans
   - Format: `ORDER-{bookingCode}-{timestamp}`
   - Endpoint: `GET /api/payments/status?orderId=xxx`

### Ledger Integration
Ketika payment berhasil, `LedgerService.syncPaymentToLedger()` dipanggil untuk mencatat transaksi:
```typescript
{
  refType: "PAYMENT",
  refId: paymentData.paymentId, // payment.id (UUID), BUKAN midtransOrderId
  direction: "IN",
  amount: paymentData.amount,
  note: `Pembayaran booking dari Payment ID: ${paymentData.paymentId}`
}
```

### Authorization Model
Endpoint `/api/payments/[paymentId]` mengizinkan akses dari (dalam urutan prioritas):
1. **SUPERADMIN**: Dapat mengakses semua payment
2. **Property Owner (ADMINKOS)**: Pemilik properti terkait (`property.ownerId === session.user.id`)
3. **Customer**: User yang membuat booking (`booking.userId === session.user.id`)

**Authorization Logic:**
```typescript
const isAuthorized = 
  userRole === "SUPERADMIN" || 
  booking.property?.ownerId === userId || 
  booking.userId === userId;
```

**Important Note:**
- Property menggunakan field `ownerId` (bukan `adminKosId`)
- `ownerId` adalah User ID yang membuat property (dengan role ADMINKOS)
- Satu ADMINKOS dapat memiliki banyak property

Ini berbeda dengan `/api/payments/status` yang hanya mengizinkan customer owner booking.

**Debug Logging:**
Endpoint ini mencatat detail authorization check untuk memudahkan debugging:
- User ID dan Role
- Booking User ID
- Property ID dan Admin Kos ID
- Status setiap authorization check

## 🔗 Related Files & APIs

### API Endpoints:
- `GET /api/payments/[paymentId]` - **NEW**: Fetch payment details by payment ID (UUID)
  - Used by ledger integration
  - Authorization: customer or property admin
  - Returns: payment + booking details
- `GET /api/payments/status?orderId={orderId}` - Fetch payment by Midtrans order ID
  - Used by public payment success page
  - Authorization: booking customer only

### Components:
- `@/components/ui/dialog` - Modal wrapper
- `@/components/ui/scroll-area` - Scrollable content
- `@/components/ui/button` - Action buttons

### Types:
- `LedgerEntryDTO` - Ledger entry type
- `PaymentData` - Payment & booking data structure

---

**Created**: October 12, 2025  
**Author**: GitHub Copilot  
**Version**: 1.0.0
