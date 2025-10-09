# Sistem Pembukuan Keuangan (Ledger System)

## Ringkasan

Modul Pembukuan Keuangan adalah sistem pencatatan dan pelaporan keuangan untuk AdminKos yang terintegrasi dengan sistem pembayaran dan penarikan dana. Sistem ini menggunakan pendekatan **single-entry bookkeeping** dengan arah transaksi (IN/OUT) untuk kemudahan penggunaan.

## Fitur Utama

### 1. Pencatatan Otomatis
- **Sinkronisasi Payment**: Setiap pembayaran dengan status SUCCESS otomatis tercatat sebagai pemasukan ke akun "Pembayaran Kos"
- **Sinkronisasi Payout**: Setiap penarikan dana dengan status APPROVED/COMPLETED otomatis tercatat sebagai pengeluaran ke akun "Penarikan Dana"
- **Idempotent**: Sistem mencegah duplikasi entry dengan memeriksa referensi transaksi

### 2. Akun/Kategori Kustom
- AdminKos dapat membuat akun kustom untuk kategorisasi transaksi
- Tipe akun: INCOME (pemasukan), EXPENSE (pengeluaran), OTHER (lainnya)
- Akun sistem (Pembayaran Kos, Penarikan Dana) tidak dapat dihapus
- Fitur arsip untuk akun yang tidak digunakan

### 3. Transaksi Manual
- Input transaksi manual untuk pencatatan di luar sistem otomatis
- Validasi kompatibilitas akun dengan arah transaksi
- Catatan opsional untuk setiap transaksi

### 4. Dashboard & Analitik
- **Summary Cards**: Uang Masuk, Uang Keluar, Total Saldo, Saldo Tersedia, Pembayaran Kos, Total Penarikan
- **Cash Flow Chart**: Grafik line chart untuk tren arus kas
- **Breakdown Charts**: Pie chart komposisi pemasukan/pengeluaran per akun
- **Ledger Table**: Tabel buku kas dengan filter dan pagination
- **Export**: Ekspor data ke CSV/Excel (planned)

### 5. Integrasi dengan Withdraw
- Perhitungan saldo konsisten antara halaman transaction dan withdraw
- Saldo Tersedia = Total Saldo - Penarikan Pending
- Validasi saldo sebelum pengajuan penarikan

## Arsitektur

### Database Schema

```prisma
model LedgerAccount {
  id          String   @id @default(cuid())
  adminKosId  String
  code        String?  // Kode akun (opsional)
  name        String   // Nama akun
  type        LedgerAccountType
  isSystem    Boolean  @default(false)
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  adminKos    AdminKosProfile @relation(fields: [adminKosId], references: [id])
  entries     LedgerEntry[]
}

model LedgerEntry {
  id          String   @id @default(cuid())
  adminKosId  String
  accountId   String
  direction   String   // "IN" atau "OUT"
  amount      Decimal  @db.Decimal(15, 2)
  date        DateTime @default(now())
  note        String?
  refType     LedgerRefType
  refId       String?  // ID referensi (Payment/Payout)
  propertyId  String?
  createdBy   String?
  createdAt   DateTime @default(now())
  
  adminKos    AdminKosProfile @relation(fields: [adminKosId], references: [id])
  account     LedgerAccount @relation(fields: [accountId], references: [id])
  property    Property? @relation(fields: [propertyId], references: [id])
}

enum LedgerAccountType {
  INCOME   // Pemasukan
  EXPENSE  // Pengeluaran
  OTHER    // Lainnya
}

enum LedgerRefType {
  PAYMENT     // Otomatis dari Payment SUCCESS
  PAYOUT      // Otomatis dari Payout APPROVED/COMPLETED
  MANUAL      // Input manual admin
  ADJUSTMENT  // Penyesuaian saldo
}
```

### 3-Tier Architecture

#### Tier 1: API Routes (`app/api/adminkos/ledger/`)
- `summary/route.ts` - GET ringkasan keuangan
- `timeseries/route.ts` - GET data time series untuk chart
- `breakdown/route.ts` - GET breakdown per akun
- `entries/route.ts` - GET list entries, POST create manual entry
- `accounts/route.ts` - GET list accounts, POST create account
- `accounts/[id]/route.ts` - PATCH archive/unarchive account
- `balance/route.ts` - GET balance info untuk withdraw integration
- `sync/route.ts` - GET sync status, POST sync actions

#### Tier 2: Application Services (`server/api/`)
- `adminkos.ledger.ts` - Orchestrates ledger use cases
  - `getSummary()` - Get financial summary
  - `getTimeSeries()` - Get time series data
  - `getBreakdown()` - Get breakdown by account
  - `listEntries()` - List ledger entries with filters
  - `createManualEntry()` - Create manual entry
  - `listAccounts()` - List accounts
  - `createAccount()` - Create new account
  - `archiveAccount()` / `unarchiveAccount()` - Archive management
  - `getBalanceInfo()` - Get balance for withdraw

#### Tier 3: Domain Services & Repositories (`server/services/`, `server/repositories/`)
- `ledger.service.ts` - Business logic
  - `ensureSystemAccounts()` - Initialize system accounts
  - `syncPaymentToLedger()` - Sync payment to ledger (idempotent)
  - `syncPayoutToLedger()` - Sync payout to ledger (idempotent)
  - `calculateBalance()` - Calculate total and available balance
  - `getLedgerSummary()` - Get summary with date range
  - `getLedgerBreakdown()` - Get breakdown by account
  - `getLedgerTimeSeries()` - Get time series data

- `ledger.repository.ts` - Data access
  - `createAccount()`, `getAccountById()`, `getAccountsByAdminKos()`
  - `ensureSystemAccount()` - Create system account if not exists
  - `createEntry()`, `getEntriesByAdminKos()`, `findEntryByRef()`
  - `getSummaryByAdminKos()` - Aggregate cash in/out

### Hooks & Synchronization

#### Payment Hooks (`server/api/hooks/payment.hooks.ts`)
- `onPaymentSuccess()` - Triggered when Payment.status = SUCCESS
- `syncExistingSuccessPayments()` - Batch sync for migration
- `validatePaymentSync()` - Integrity check

#### Payout Hooks (`server/api/hooks/payout.hooks.ts`)
- `onPayoutApproved()` - Triggered when Payout.status = APPROVED/COMPLETED
- `syncExistingApprovedPayouts()` - Batch sync for migration
- `validatePayoutSync()` - Integrity check

#### Ledger Sync Utils (`server/api/hooks/ledger-sync.utils.ts`)
- `initializeLedgerForAdminKos()` - First-time setup
- `validateLedgerIntegrity()` - Check sync status
- `fixMissingEntries()` - Repair missing syncs
- `getSyncStatus()` - Get sync status summary

## UI Components

### Dashboard Transaction Page (`dashboard/adminkos/transaction`)

#### Components
1. **SummaryCards** - 6 kartu ringkasan
   - Uang Masuk (periode)
   - Uang Keluar (periode)
   - Total Saldo
   - Saldo Tersedia
   - Pembayaran Kos (total)
   - Total Penarikan

2. **CashFlowChart** - Line chart arus kas
   - Uang Masuk (hijau)
   - Uang Keluar (merah)
   - Net Flow (indigo)

3. **BreakdownCharts** - Pie charts
   - Tab: Pemasukan, Pengeluaran, Lainnya
   - Breakdown per akun dengan persentase

4. **LedgerTable** - Tabel buku kas
   - Filter: direction, refType, search, date range
   - Sortable columns
   - Pagination
   - Export (planned)

5. **AccountsPanel** - Panel manajemen akun
   - List akun dengan type badge
   - System account protection
   - Archive/unarchive actions
   - Search dan filter

6. **AddAccountDialog** - Modal tambah akun
   - Validasi nama (3-100 chars)
   - Type selection dengan deskripsi
   - Kode akun opsional

7. **AddTransactionDialog** - Modal tambah transaksi
   - Direction selection (IN/OUT)
   - Account selection (filtered by compatibility)
   - Amount validation
   - Date picker
   - Note (optional)

## API Endpoints

### GET /api/adminkos/ledger/summary
Query params:
- `dateFrom` (optional) - Start date
- `dateTo` (optional) - End date

Response:
```json
{
  "success": true,
  "data": {
    "cashIn": 10000000,
    "cashOut": 2000000,
    "totalBalance": 8000000,
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    }
  }
}
```

### GET /api/adminkos/ledger/timeseries
Query params:
- `dateFrom` (required)
- `dateTo` (required)
- `groupBy` (optional) - "day" | "week" | "month"

Response:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "cashIn": 500000,
      "cashOut": 100000,
      "netFlow": 400000
    }
  ]
}
```

### GET /api/adminkos/ledger/breakdown
Query params:
- `dateFrom` (optional)
- `dateTo` (optional)

Response:
```json
{
  "success": true,
  "data": {
    "income": [
      {
        "accountId": "...",
        "accountName": "Pembayaran Kos",
        "totalAmount": 8000000,
        "entriesCount": 15
      }
    ],
    "expense": [...],
    "other": [...]
  }
}
```

### GET /api/adminkos/ledger/entries
Query params:
- `page` (default: 1)
- `limit` (default: 20)
- `direction` (optional) - "IN" | "OUT"
- `refType` (optional)
- `accountId` (optional)
- `propertyId` (optional)
- `search` (optional)
- `dateFrom` (optional)
- `dateTo` (optional)
- `sortBy` (default: "date")
- `sortOrder` (default: "desc")

### POST /api/adminkos/ledger/entries
Body:
```json
{
  "accountId": "...",
  "direction": "IN",
  "amount": 500000,
  "date": "2025-01-15",
  "note": "Pemasukan lain-lain",
  "propertyId": "..." // optional
}
```

### GET /api/adminkos/ledger/accounts
Query params:
- `type` (optional) - Filter by account type
- `includeArchived` (default: false)
- `search` (optional)

### POST /api/adminkos/ledger/accounts
Body:
```json
{
  "name": "Biaya Listrik",
  "type": "EXPENSE",
  "code": "EXP-001" // optional
}
```

### PATCH /api/adminkos/ledger/accounts/[id]
Body:
```json
{
  "action": "archive" // or "unarchive"
}
```

### GET /api/adminkos/ledger/balance
Response:
```json
{
  "success": true,
  "data": {
    "totalBalance": 8000000,
    "availableBalance": 7500000,
    "totalWithdrawals": 2000000
  }
}
```

### GET /api/adminkos/ledger/sync
Response:
```json
{
  "success": true,
  "data": {
    "isHealthy": true,
    "lastSyncCheck": "2025-01-15T10:00:00Z",
    "summary": {
      "totalEntries": 50,
      "paymentEntries": 30,
      "payoutEntries": 10,
      "manualEntries": 10
    },
    "issues": [] // if any
  }
}
```

### POST /api/adminkos/ledger/sync
Body:
```json
{
  "action": "initialize" // or "validate" or "fix"
}
```

## Testing & Validation

### Manual Testing Checklist
- [ ] Buat payment baru dan verifikasi entry otomatis
- [ ] Buat payout baru dan verifikasi entry otomatis
- [ ] Test idempotency dengan trigger sync berulang
- [ ] Buat akun kustom dan transaksi manual
- [ ] Test filter dan pagination di ledger table
- [ ] Verifikasi konsistensi saldo di halaman withdraw
- [ ] Test archive/unarchive akun
- [ ] Verifikasi system account protection
- [ ] Test export functionality (when implemented)

### Integration Points
1. **Payment Success** → Ledger Entry (IN)
2. **Payout Approved** → Ledger Entry (OUT)
3. **Withdraw Balance** ← Ledger Balance Calculation
4. **Property Filter** → Filter entries by property

## Migration & Setup

### Initial Setup
1. Run migration: `npx prisma migrate dev --name add_ledger_system`
2. System accounts akan dibuat otomatis saat pertama kali akses
3. Untuk sync existing data, gunakan endpoint `/api/adminkos/ledger/sync` dengan action "initialize"

### Data Migration
Jika sudah ada data Payment dan Payout sebelumnya:
```typescript
// Call sync endpoint
POST /api/adminkos/ledger/sync
{
  "action": "initialize"
}
```

Ini akan:
1. Membuat system accounts jika belum ada
2. Sync semua Payment SUCCESS yang belum tercatat
3. Sync semua Payout APPROVED/COMPLETED yang belum tercatat

## Best Practices

1. **Jangan hapus system accounts** - Akun "Pembayaran Kos" dan "Penarikan Dana" adalah akun sistem
2. **Gunakan arsip** - Jangan hapus akun, gunakan fitur arsip
3. **Catatan transaksi** - Selalu tambahkan catatan untuk transaksi manual
4. **Regular validation** - Jalankan sync validation secara berkala
5. **Backup data** - Backup database sebelum migration atau bulk operations

## Troubleshooting

### Saldo tidak sesuai
1. Check sync status: `GET /api/adminkos/ledger/sync`
2. Validate integrity: `POST /api/adminkos/ledger/sync` dengan action "validate"
3. Fix missing entries: `POST /api/adminkos/ledger/sync` dengan action "fix"

### Entry duplikat
Sistem sudah idempotent, tapi jika terjadi:
1. Check `refType` dan `refId` di database
2. Hapus entry duplikat secara manual (planned: auto-fix)

### System account tidak ada
Akses halaman transaction akan otomatis membuat system accounts. Atau call:
```typescript
POST /api/adminkos/ledger/sync
{
  "action": "initialize"
}
```

## Future Enhancements

- [ ] Export to CSV/Excel
- [ ] Recurring transactions
- [ ] Budget planning
- [ ] Financial reports (monthly, yearly)
- [ ] Multi-currency support
- [ ] Attachment upload for manual entries
- [ ] Audit trail
- [ ] Advanced analytics (trends, forecasting)

