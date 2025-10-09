# Superadmin Transactions Dashboard

## 📋 Overview

Halaman **Transactions** di dashboard SUPERADMIN untuk monitoring dan analisis seluruh transaksi pembayaran lintas properti & akun.

**URL**: `/dashboard/superadmin/transactions`

**Role**: SUPERADMIN only

---

## 🎯 Features

### 1. Summary Cards (KPIs)

6 kartu ringkasan yang menampilkan metrik penting:

- **Total Transaksi**: Jumlah semua transaksi dalam rentang filter
- **Total Omzet**: Total revenue dari transaksi SUCCESS
- **Pending**: Jumlah & total amount transaksi PENDING
- **Failed/Expired**: Jumlah & total amount transaksi FAILED/EXPIRED
- **Refunded**: Total amount yang dikembalikan
- **AOV (Average Order Value)**: Rata-rata nilai per transaksi sukses

### 2. Line Chart - Tren Transaksi

Grafik garis yang menampilkan:
- **X-axis**: Tanggal (granularity: harian/mingguan/bulanan)
- **Y-axis Left**: Revenue (Rp) dari transaksi SUCCESS
- **Y-axis Right**: Jumlah transaksi
- **Granularity**: Auto-adjust atau manual (day/week/month)

### 3. Pie Chart - Metode Pembayaran

Grafik pie yang menampilkan:
- Breakdown metode pembayaran (bank_transfer, credit_card, gopay, qris, dll)
- Persentase dari total transaksi SUCCESS
- Jumlah transaksi per metode
- Total amount per metode

### 4. Filters Global

Filter yang mempengaruhi semua data (KPI, charts, table):

**Quick Filters**:
- Search (Order ID, Booking Code, Email, Room Number)
- Date From
- Date To

**Advanced Filters** (collapsible):
- Status (ALL, PENDING, SUCCESS, FAILED, EXPIRED, REFUNDED)
- Payment Type (DEPOSIT, FULL)
- Payment Method (dropdown dari distinct DB)
- Property (autocomplete - future)
- Owner (autocomplete - future)

**Default**: 30 hari terakhir

### 5. Transactions Table

Tabel lengkap dengan kolom:

| Kolom | Deskripsi |
|-------|-----------|
| Waktu | transactionTime atau createdAt |
| Order ID | midtransOrderId |
| Status | Badge dengan warna (SUCCESS, PENDING, FAILED, EXPIRED, REFUNDED) |
| Type | DEPOSIT atau FULL |
| Method | Metode pembayaran |
| Amount | Total amount (Rp) |
| Payer | Nama & email pembayar |
| Booking | Booking code & lease type |
| Room | Room number, type, floor |
| Property | Nama properti |
| Owner | Nama & email pemilik kos |
| Actions | View detail |

**Features**:
- Server-side pagination (25 per page, max 200)
- Sorting (future)
- Row actions (View Detail)

### 6. Transaction Detail Dialog

Modal center dengan backdrop blur yang menampilkan:

**Payment Info**:
- Midtrans Order ID
- Transaction ID
- Payment Type & Method
- Transaction Time
- Expiry Time
- Total Amount (highlighted)

**Payer Info**:
- Name
- Email
- Phone Number

**Booking Info**:
- Booking Code
- Lease Type

**Room & Property Info**:
- Room Number, Type, Floor
- Property Name
- Owner Name & Email

**⚠️ IMPORTANT**: Tidak menampilkan `paymentToken` (security)

---

## 🏗️ Architecture (3-Tier)

### Tier 3: Data Layer

**File**: `src/server/repositories/payment.repository.ts`

**Methods**:
```typescript
// Build where clause from filters
buildTransactionWhereClause(filters: TransactionFilters): Prisma.PaymentWhereInput

// Get summary KPIs
getTransactionSummary(filters: TransactionFilters): Promise<TransactionSummaryDTO>

// Get time series for line chart
getTransactionTimeSeries(
  filters: TransactionFilters,
  granularity: "day" | "week" | "month"
): Promise<TimeSeriesDataPoint[]>

// Get payment method breakdown for pie chart
getPaymentMethodBreakdown(filters: TransactionFilters): Promise<PaymentMethodBreakdown[]>

// Get paginated transaction list
getTransactionList(
  filters: TransactionFilters,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: "asc" | "desc"
): Promise<TransactionListResponse>

// Get transaction detail by ID
getTransactionDetail(id: string): Promise<TransactionDetailDTO | null>

// Get distinct payment methods
getDistinctPaymentMethods(): Promise<string[]>
```

**Key Features**:
- Complex JOIN: Payment → Booking → Room → Property → Owner, User
- Date range filtering (transactionTime || createdAt)
- Full-text search (Order ID, Booking Code, Email, Room Number)
- Aggregations (SUM, COUNT, AVG)
- Raw SQL for time series grouping (date_trunc)

---

### Tier 2: Application Layer

**File**: `src/server/api/superadmin.transactions.ts`

**Methods**:
```typescript
// All methods use withAuth middleware
// All methods check role === SUPERADMIN

getSummary(filters: TransactionFilters): Promise<Result<TransactionSummaryDTO>>

getChartData(
  filters: TransactionFilters,
  granularity: "day" | "week" | "month"
): Promise<Result<TransactionChartData>>

getTransactionList(
  filters: TransactionFilters,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: "asc" | "desc"
): Promise<Result<TransactionListResponse>>

getTransactionDetail(transactionId: string): Promise<Result<TransactionDetailDTO>>

getPaymentMethods(): Promise<Result<string[]>>
```

---

### Tier 1: API Routes

**Files**:
1. `src/app/api/superadmin/transactions/summary/route.ts`
   - GET: Summary KPIs
   - Query params: filters

2. `src/app/api/superadmin/transactions/chart/route.ts`
   - GET: Time series + method breakdown
   - Query params: filters + granularity

3. `src/app/api/superadmin/transactions/list/route.ts`
   - GET: Paginated transaction list
   - Query params: filters + page + pageSize + sortBy + sortOrder

4. `src/app/api/superadmin/transactions/[id]/route.ts`
   - GET: Transaction detail by ID

**Query Parameters**:
```
dateFrom: ISO date string
dateTo: ISO date string
status: PENDING | SUCCESS | FAILED | EXPIRED | REFUNDED
paymentType: DEPOSIT | FULL
paymentMethod: string
propertyId: string (future)
ownerId: string (future)
search: string
page: number
pageSize: number (max 200)
sortBy: string
sortOrder: asc | desc
granularity: day | week | month
```

---

### Tier 1: UI Components

**Files**:
1. `src/components/dashboard/superadmin/transactions/filters-bar.tsx`
   - Search input
   - Date range pickers
   - Advanced filters (collapsible)
   - Export button
   - Clear filters

2. `src/components/dashboard/superadmin/transactions/summary-cards.tsx`
   - 6 KPI cards
   - Icons & colors
   - Loading skeletons

3. `src/components/dashboard/superadmin/transactions/line-chart.tsx`
   - Recharts LineChart
   - Dual Y-axis (revenue + count)
   - Granularity selector
   - Custom tooltip

4. `src/components/dashboard/superadmin/transactions/pie-chart.tsx`
   - Recharts PieChart
   - Method breakdown
   - Percentage labels
   - Summary list

5. `src/components/dashboard/superadmin/transactions/transactions-table.tsx`
   - Full transaction table
   - Pagination controls
   - Status badges
   - Row actions

6. `src/components/dashboard/superadmin/transactions/transaction-detail-dialog.tsx`
   - Modal with backdrop blur
   - Complete transaction details
   - Organized sections
   - No paymentToken

7. `src/app/(protected-pages)/dashboard/superadmin/transactions/page.tsx`
   - Main page
   - State management
   - Data fetching
   - Component integration

---

## 🔒 Security

### Role Guard

**All API endpoints** check:
```typescript
if (userContext.role !== UserRole.SUPERADMIN) {
  return forbidden("Only SUPERADMIN can access transaction data");
}
```

### Sensitive Data

**Never expose**:
- ❌ `paymentToken` - Excluded from all queries
- ✅ All other payment fields are safe to display

### Pagination Limits

- Default: 25 per page
- Maximum: 200 per page
- Prevents excessive data loading

---

## 📊 Database Queries

### Summary Query

```typescript
const where = buildTransactionWhereClause(filters);

const totalTransactions = await prisma.payment.count({ where });

const successRevenue = await prisma.payment.aggregate({
  where: { ...where, status: "SUCCESS" },
  _sum: { amount: true },
  _count: { _all: true },
});

// Similar for pending, failed, refunded
```

### Time Series Query (Raw SQL)

```sql
SELECT 
  DATE(COALESCE("transactionTime", "createdAt")) AS bucket,
  SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) AS revenue,
  COUNT(*) AS count
FROM "Payment"
WHERE [filters]
GROUP BY 1
ORDER BY 1 ASC
```

### Transaction List Query

```typescript
const transactions = await prisma.payment.findMany({
  where,
  orderBy: { transactionTime: 'desc' },
  take: pageSize,
  skip: (page - 1) * pageSize,
  select: {
    // All fields except paymentToken
    booking: {
      select: {
        bookingCode: true,
        leaseType: true,
        room: { select: { roomNumber, roomType, floor } },
        property: {
          select: {
            id, name,
            owner: { select: { id, name, email } }
          }
        }
      }
    },
    user: { select: { id, name, email, phoneNumber } }
  }
});
```

---

## 🎨 UI/UX

### Design System

- **shadcn/ui** components
- **Recharts** for charts
- **date-fns** for date formatting
- **Responsive** grid layout

### Color Coding

**Status Badges**:
- SUCCESS: Emerald (green)
- PENDING: Amber (yellow)
- FAILED: Rose (red)
- EXPIRED: Zinc (gray)
- REFUNDED: Cyan (blue)

### Layout

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Filters Bar (sticky)                │
├─────────────────────────────────────┤
│ Summary Cards (6 cards grid)        │
├─────────────────────────────────────┤
│ Charts Row                          │
│ ┌──────────────┬──────────────┐     │
│ │ Line Chart   │ Pie Chart    │     │
│ └──────────────┴──────────────┘     │
├─────────────────────────────────────┤
│ Transactions Table                  │
│ (with pagination)                   │
└─────────────────────────────────────┘
```

---

## 🚀 Future Enhancements

### Export Feature

- CSV export
- Excel export
- Respect active filters
- Streaming for large datasets

### Advanced Filters

- Property autocomplete
- Owner autocomplete
- Date presets (Today, This Week, This Month, etc.)

### Table Features

- Column sorting
- Column visibility toggle
- Bulk actions

### Analytics

- Trend indicators (↑↓)
- Comparison with previous period
- Forecasting

---

## 📥 Export Feature

### CSV Export

**Endpoint**: `GET /api/superadmin/transactions/export`

**Query Parameters**:
- All filter parameters (dateFrom, dateTo, status, etc.)
- `format`: "csv" (default) or "excel"

**Features**:
- ✅ Exports up to 10,000 transactions (safety limit)
- ✅ Respects all active filters
- ✅ Includes all transaction details
- ✅ Formatted dates (dd/MM/yyyy HH:mm:ss)
- ✅ Proper CSV escaping
- ✅ Auto-download with timestamp filename

**CSV Columns**:
1. Waktu Transaksi
2. Order ID
3. Transaction ID
4. Status
5. Tipe Pembayaran
6. Metode Pembayaran
7. Amount (Rp)
8. Nama Pembayar
9. Email Pembayar
10. No. HP Pembayar
11. Booking Code
12. Lease Type
13. Room Number
14. Room Type
15. Floor
16. Property Name
17. Owner Name
18. Owner Email

**Filename Format**: `transactions_YYYYMMDD_HHmmss.csv`

**Example**:
```
GET /api/superadmin/transactions/export?dateFrom=2024-01-01&dateTo=2024-12-31&status=SUCCESS&format=csv
```

**Response**:
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="transactions_20241009_143022.csv"`

**Implementation**:

**Repository Layer** (`payment.repository.ts`):
```typescript
static async getTransactionsForExport(
  filters: TransactionFilters
): Promise<TransactionListItem[]> {
  // Returns up to 10,000 transactions with full details
  // No pagination, ordered by transactionTime DESC
}
```

**Application Layer** (`superadmin.transactions.ts`):
```typescript
static exportTransactions = withAuth(
  async (
    userContext: UserContext,
    filters: TransactionFilters,
    format: "csv" | "excel"
  ): Promise<Result<{ data: string; filename: string; mimeType: string }>> => {
    // Generate CSV with proper escaping
    // Return file data with metadata
  }
);
```

**API Route** (`/api/superadmin/transactions/export/route.ts`):
```typescript
export async function GET(request: NextRequest) {
  // Parse filters from query params
  // Call SuperadminTransactionsAPI.exportTransactions()
  // Return file as download with proper headers
}
```

**UI** (`page.tsx`):
```typescript
const handleExport = async () => {
  // Show loading toast
  // Fetch export endpoint
  // Download file using Blob API
  // Show success toast
};
```

---

## 📝 Testing Checklist

- [ ] SUPERADMIN can access page
- [ ] Non-SUPERADMIN gets 403
- [ ] Summary cards display correctly
- [ ] Line chart renders with data
- [ ] Pie chart renders with data
- [ ] Filters update all sections
- [ ] Search works (Order ID, Email, etc.)
- [ ] Date range filtering works
- [ ] Status filter works
- [ ] Payment type filter works
- [ ] Payment method filter works
- [ ] Table pagination works
- [ ] View detail opens modal
- [ ] Detail modal shows complete data
- [ ] paymentToken is never exposed
- [ ] **CSV export works**
- [ ] **Export respects active filters**
- [ ] **Export filename has timestamp**
- [ ] **CSV data is properly formatted**
- [ ] Loading states work
- [ ] Empty states work
- [ ] Error handling works
- [ ] Responsive on mobile

---

## 🎯 Summary

Halaman Transactions SUPERADMIN adalah dashboard analytics lengkap untuk monitoring seluruh transaksi pembayaran dengan:

✅ **6 KPI cards** untuk quick insights
✅ **Line chart** untuk tren revenue & volume
✅ **Pie chart** untuk breakdown metode pembayaran
✅ **Advanced filters** untuk analisis mendalam
✅ **Complete table** dengan full transaction details
✅ **Detail modal** untuk investigasi individual
✅ **CSV Export** - Download transaksi dengan filter aktif
✅ **Security** - No paymentToken exposure
✅ **Performance** - Pagination & optimized queries
✅ **3-tier architecture** - Clean separation of concerns

**Ready for production!** 🚀

