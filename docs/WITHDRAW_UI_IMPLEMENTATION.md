# Withdraw Balance UI Implementation

## ✅ UI Implementation Complete

The withdraw balance UI has been successfully updated to use the new withdraw API that only counts automatic "Pembayaran Kos" transactions.

## 📦 Files Updated

### Server-Side Pages
- ✅ `src/app/(protected-pages)/dashboard/adminkos/withdraw/page.tsx`
  - Changed from `AdminKosLedgerAPI.getBalanceInfo()` to `WithdrawAPI.getSummary()`
  - Now fetches withdrawable balance instead of general ledger balance

### Client Components
- ✅ `src/app/(protected-pages)/dashboard/adminkos/withdraw/withdraw-page-client.tsx`
  - Updated `refreshData()` to use `/api/adminkos/withdraw/summary`
  - Added info banner explaining "Saldo Tarik dari Pembayaran Kos"
  - Updated balance cards to show 4 metrics:
    1. Total Pemasukan (from payments)
    2. Total Penarikan (from payouts)
    3. Saldo Tarik (withdrawable balance)
    4. Saldo Tersedia (available balance)
  - Added pending withdrawals warning card

- ✅ `src/components/dashboard/adminkos/withdraw/withdraw-dialog.tsx`
  - Changed API endpoint from `/api/adminkos/payouts` to `/api/adminkos/withdraw`
  - Locked source selection to "Pembayaran Kos (Sistem)"
  - Updated balance info section to show detailed breakdown
  - Removed source dropdown, replaced with read-only display

### API Routes
- ✅ `src/app/api/adminkos/withdraw/breakdown/route.ts`
  - Fixed unused import warning

## 🎨 UI Changes

### 1. Info Banner
Added blue info banner at the top explaining that withdrawable balance only comes from automatic payment transactions:

```
ℹ️ Saldo Tarik dari Pembayaran Kos
Saldo yang dapat ditarik hanya berasal dari transaksi pembayaran kos otomatis. 
Pemasukan manual tidak termasuk dalam saldo tarik.
```

### 2. Balance Cards (4 Cards)

**Before (3 cards):**
- Total Saldo
- Saldo Tersedia
- Total Penarikan

**After (4 cards):**
1. **Total Pemasukan** (Blue) - From automatic payments
2. **Total Penarikan** (Orange) - From approved payouts
3. **Saldo Tarik** (Default) - Withdrawable balance (income - withdrawals)
4. **Saldo Tersedia** (Green) - Available balance (withdrawable - pending)

### 3. Pending Withdrawals Warning
Added yellow warning card when there are pending withdrawals:

```
⏰ Penarikan Pending
Anda memiliki penarikan pending sebesar Rp X.XXX.XXX.
Saldo ini akan tersedia kembali jika pengajuan ditolak.
```

### 4. Withdraw Dialog Updates

**Balance Info Section:**
- Shows 4 metrics in 2x2 grid:
  - Total Pemasukan (blue)
  - Total Penarikan (orange)
  - Saldo Tersedia (green)
  - Penarikan Pending (yellow)
- Added info text: "Hanya dari transaksi pembayaran kos otomatis"

**Source Selection:**
- **Before:** Dropdown with 3 options (Hasil Penjualan, Deposit, Lainnya)
- **After:** Read-only display showing "Pembayaran Kos (Sistem)"
- Added explanation: "Saldo dari transaksi pembayaran kos otomatis"
- Added info: "Sumber penarikan terkunci ke akun 'Pembayaran Kos'"

## 🔄 Data Flow

### Page Load
```
1. Server fetches withdrawable balance via WithdrawAPI.getSummary()
2. Returns WithdrawSummaryDTO with:
   - totalPaymentIncome
   - totalWithdrawals
   - withdrawableBalance
   - pendingWithdrawals
   - availableBalance
3. Client displays 4 balance cards + info banner
```

### Refresh Data
```
1. Client calls GET /api/adminkos/withdraw/summary
2. Updates balance state with new data
3. Re-renders balance cards
4. Reloads page to get updated bank account
```

### Create Withdraw Request
```
1. User opens withdraw dialog
2. Dialog shows detailed balance breakdown
3. Source is locked to "Pembayaran Kos"
4. User enters amount and notes
5. Client calls POST /api/adminkos/withdraw
6. Backend validates against withdrawable balance
7. Creates payout with source=SALES
8. Success → refresh data and close dialog
```

## 📊 Visual Comparison

### Balance Display

**Before:**
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total Saldo     │ Saldo Tersedia  │ Total Penarikan │
│ Rp 5.000.000    │ Rp 3.500.000    │ Rp 500.000      │
└─────────────────┴─────────────────┴─────────────────┘
```

**After:**
```
┌────────────────────────────────────────────────────────┐
│ ℹ️ Saldo Tarik dari Pembayaran Kos                     │
│ Hanya dari transaksi pembayaran kos otomatis           │
└────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Total        │ Saldo        │ Saldo        │
│ Pemasukan    │ Penarikan    │ Tarik        │ Tersedia     │
│ Rp 5.000.000 │ Rp 1.000.000 │ Rp 4.000.000 │ Rp 3.500.000 │
│ (Blue)       │ (Orange)     │ (Default)    │ (Green)      │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌────────────────────────────────────────────────────────┐
│ ⏰ Penarikan Pending                                    │
│ Anda memiliki penarikan pending sebesar Rp 500.000     │
└────────────────────────────────────────────────────────┘
```

### Withdraw Dialog

**Before:**
```
Sumber Penarikan: [Dropdown ▼]
  - Hasil Penjualan
  - Deposit
  - Lainnya
```

**After:**
```
Sumber Penarikan:
┌────────────────────────────────────────┐
│ 💰 Pembayaran Kos (Sistem)             │
│ Saldo dari transaksi pembayaran kos    │
└────────────────────────────────────────┘
ℹ️ Sumber penarikan terkunci ke akun "Pembayaran Kos"
```

## 🧪 Testing Checklist

### Visual Testing
- [ ] Info banner displays correctly at top
- [ ] 4 balance cards show correct values
- [ ] Pending withdrawals warning appears when pending > 0
- [ ] Withdraw dialog shows detailed balance breakdown
- [ ] Source selection is read-only (no dropdown)
- [ ] All currency formatting is correct (Rp X.XXX.XXX)

### Functional Testing
- [ ] Balance updates after payment success
- [ ] Balance updates after payout approval
- [ ] Manual ledger entries don't affect displayed balance
- [ ] Withdraw request uses new API endpoint
- [ ] Validation prevents withdrawing more than available
- [ ] Success message appears after creating withdraw request
- [ ] Page refreshes and shows new pending withdrawal

### Integration Testing
- [ ] Server-side balance calculation matches client display
- [ ] API responses have correct format
- [ ] Error messages display properly
- [ ] Loading states work correctly

## 🎯 Key Features

### 1. Clear Information Hierarchy
- Info banner explains the concept upfront
- 4 cards show progression: Income → Withdrawals → Balance → Available
- Color coding helps distinguish different metrics

### 2. Locked Source Selection
- Users cannot accidentally select wrong source
- Clear explanation that it's locked to "Pembayaran Kos"
- Prevents confusion and errors

### 3. Detailed Balance Breakdown
- Shows both total income and total withdrawals
- Calculates net withdrawable balance
- Displays available balance after pending
- All information visible at a glance

### 4. Pending Withdrawals Warning
- Only shows when there are pending withdrawals
- Clear explanation that balance will return if rejected
- Yellow color indicates "waiting" state

## 🚨 Important Notes

1. **Balance Source**: All displayed balances come from `/api/adminkos/withdraw/summary`, NOT from general ledger balance

2. **Manual Entries Excluded**: The UI clearly communicates that manual entries are not included in withdrawable balance

3. **Source Locked**: Users cannot change the source - it's always "Pembayaran Kos"

4. **Backward Compatible**: Old payouts (before this implementation) are not counted, but this is expected behavior

5. **Real-time Updates**: Balance is recalculated on every page load and refresh

## 📱 Responsive Design

All components are responsive:
- Balance cards: 4 columns on desktop, 2 on tablet, 1 on mobile
- Info banners: Full width with proper padding
- Dialog: Adapts to screen size
- Grid layouts: Use responsive breakpoints

## 🔗 Related Files

**Server:**
- `src/server/api/withdraw.api.ts` - Application service
- `src/server/services/withdraw.service.ts` - Domain service
- `src/app/api/adminkos/withdraw/summary/route.ts` - API endpoint

**Client:**
- `src/app/(protected-pages)/dashboard/adminkos/withdraw/page.tsx` - Server page
- `src/app/(protected-pages)/dashboard/adminkos/withdraw/withdraw-page-client.tsx` - Client component
- `src/components/dashboard/adminkos/withdraw/withdraw-dialog.tsx` - Dialog component

**Documentation:**
- `docs/WITHDRAW_BALANCE_SYSTEM.md` - System documentation
- `docs/WITHDRAW_QUICK_REFERENCE.md` - Quick reference
- `docs/WITHDRAW_UI_IMPLEMENTATION.md` - This file

## ✨ Summary

The UI has been successfully updated to:
- ✅ Use new withdraw API endpoints
- ✅ Display withdrawable balance from "Pembayaran Kos" only
- ✅ Lock source selection to prevent errors
- ✅ Show detailed balance breakdown
- ✅ Provide clear information about what's included
- ✅ Maintain responsive design
- ✅ Follow existing UI patterns

The implementation is complete and ready for testing! 🎉

