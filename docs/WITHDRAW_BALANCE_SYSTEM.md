# Withdraw Balance System

## 🎯 Overview

The Withdraw Balance System allows AdminKos to withdraw funds **ONLY** from automatic payment transactions (Pembayaran Kos). Manual ledger entries are excluded from the withdrawable balance calculation.

## 📐 Key Rules

### Balance Calculation

**Withdrawable Balance** = SUM(IN from PAYMENT) - SUM(OUT from PAYOUT)

Where:
- **IN from PAYMENT**: Automatic ledger entries created when `Payment.status = SUCCESS`
  - `refType = PAYMENT`
  - `direction = IN`
  - `account.name = "Pembayaran Kos"`
  - `account.isSystem = true`

- **OUT from PAYOUT**: Automatic ledger entries created when `Payout.status = APPROVED/COMPLETED`
  - `refType = PAYOUT`
  - `direction = OUT`
  - `account.name = "Pembayaran Kos"`
  - `account.isSystem = true`

### Excluded from Withdrawable Balance

- ❌ Manual entries (`refType = MANUAL`)
- ❌ Adjustment entries (`refType = ADJUSTMENT`)
- ❌ Entries to other accounts (not "Pembayaran Kos")
- ❌ Entries to "Penarikan Dana" account (old system)

## 🏗️ Architecture (3-Tier)

### Tier 3: Services & Repositories

#### `server/services/withdraw.service.ts`
Domain service for withdraw balance calculations.

**Key Methods:**
- `getWithdrawableBalance(adminKosId)`: Calculate withdrawable balance
- `validateWithdrawRequest(adminKosId, amount)`: Validate withdraw request
- `getBalanceBreakdown(adminKosId)`: Get detailed breakdown
- `getPembayaranKosAccountId(adminKosId)`: Get system account ID

#### `server/services/ledger.service.ts`
**UPDATED**: `syncPayoutToLedger()` now uses "Pembayaran Kos" instead of "Penarikan Dana"

```typescript
// OLD (before this feature):
const withdrawalAccount = await LedgerRepository.findSystemAccount(
  adminKosId,
  "Penarikan Dana",  // ❌ Old account
  "OTHER"
);

// NEW (after this feature):
const paymentAccount = await LedgerRepository.findSystemAccount(
  adminKosId,
  "Pembayaran Kos",  // ✅ New account
  "INCOME"
);
```

### Tier 2: Application Services

#### `server/api/withdraw.api.ts`
Application service for withdraw operations.

**Key Methods:**
- `getSummary(adminKosId)`: Get withdrawable balance summary
- `getBreakdown(adminKosId)`: Get detailed balance breakdown
- `createWithdrawRequest(adminKosId, data)`: Create withdraw request with validation
- `getPembayaranKosAccountId(adminKosId)`: Get locked account ID

### Tier 1: API Routes

#### `app/api/adminkos/withdraw/summary/route.ts`
- **GET**: Get withdrawable balance summary
- **Auth**: AdminKos only
- **Response**: `WithdrawSummaryDTO`

#### `app/api/adminkos/withdraw/breakdown/route.ts`
- **GET**: Get detailed balance breakdown
- **Auth**: AdminKos only
- **Response**: `WithdrawBalanceBreakdownDTO`

#### `app/api/adminkos/withdraw/route.ts`
- **POST**: Create new withdraw request
- **Auth**: AdminKos only
- **Body**: `CreateWithdrawRequestDTO`
- **Response**: `PayoutDTO`

## 📊 Data Types

### `WithdrawSummaryDTO`

```typescript
interface WithdrawSummaryDTO {
  totalPaymentIncome: number;      // Total IN from PAYMENT
  totalWithdrawals: number;        // Total OUT from PAYOUT
  withdrawableBalance: number;     // Net balance
  pendingWithdrawals: number;      // Pending payout requests
  availableBalance: number;        // withdrawableBalance - pendingWithdrawals
  asOf: Date;                      // Calculation timestamp
  pembayaranKosAccountId: string;  // System account ID
}
```

### `CreateWithdrawRequestDTO`

```typescript
interface CreateWithdrawRequestDTO {
  amount: number;           // Amount to withdraw
  bankAccountId: string;    // Bank account ID
  notes?: string;           // Optional notes
}
```

## 🔄 Flow Diagram

### Payment Success Flow

```
Payment.status = SUCCESS
    ↓
PaymentHooks.onPaymentSuccess()
    ↓
LedgerService.syncPaymentToLedger()
    ↓
Create LedgerEntry:
  - account: "Pembayaran Kos"
  - direction: IN
  - refType: PAYMENT
  - refId: payment.id
    ↓
Withdrawable Balance INCREASES
```

### Payout Approval Flow

```
Payout.status = APPROVED
    ↓
PayoutHooks.onPayoutApproved()
    ↓
LedgerService.syncPayoutToLedger()
    ↓
Create LedgerEntry:
  - account: "Pembayaran Kos" (CHANGED!)
  - direction: OUT
  - refType: PAYOUT
  - refId: payout.id
    ↓
Withdrawable Balance DECREASES
```

### Withdraw Request Flow

```
User submits withdraw request
    ↓
WithdrawAPI.createWithdrawRequest()
    ↓
1. Validate bank account
2. Check withdrawable balance
3. Validate amount <= availableBalance
    ↓
Create Payout:
  - source: SALES (locked)
  - status: PENDING
    ↓
Superadmin approves
    ↓
Payout.status = APPROVED
    ↓
PayoutHooks creates LedgerEntry OUT
    ↓
Withdrawable Balance DECREASES
```

## 🔒 Validation Rules

### Before Creating Withdraw Request

1. ✅ Bank account must exist
2. ✅ Bank account must belong to AdminKos
3. ✅ Bank account must be APPROVED
4. ✅ Amount must be > 0
5. ✅ Amount must be <= availableBalance
6. ✅ Source is locked to "Pembayaran Kos" (SALES)

### Idempotency

- Payment hook checks for existing entry before creating (by `refType + refId`)
- Payout hook checks for existing entry before creating (by `refType + refId`)
- No duplicate ledger entries even if callback is called multiple times

## 🎨 UI Integration

### Display Withdrawable Balance

```typescript
// Fetch summary
const response = await fetch('/api/adminkos/withdraw/summary');
const { data } = await response.json();

// Display
<div>
  <h3>Saldo Tarik dari Pembayaran Kos</h3>
  <p>Total Pemasukan: Rp {data.totalPaymentIncome.toLocaleString('id-ID')}</p>
  <p>Total Penarikan: Rp {data.totalWithdrawals.toLocaleString('id-ID')}</p>
  <p>Saldo Tersedia: Rp {data.availableBalance.toLocaleString('id-ID')}</p>
</div>
```

### Lock Source Selection

```typescript
// Source is always locked to "Pembayaran Kos"
<Select disabled value="SALES">
  <option value="SALES">Pembayaran Kos (Sistem)</option>
</Select>
```

### Create Withdraw Request

```typescript
const response = await fetch('/api/adminkos/withdraw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000000,
    bankAccountId: 'bank_xxx',
    notes: 'Penarikan bulanan'
  })
});
```

## 🧪 Testing Checklist

### Unit Tests

- [ ] `WithdrawService.getWithdrawableBalance()` calculates correctly
- [ ] Only PAYMENT entries are counted as income
- [ ] Only PAYOUT entries are counted as withdrawals
- [ ] Manual entries are excluded
- [ ] Pending payouts reduce available balance

### Integration Tests

- [ ] Payment SUCCESS creates LedgerEntry IN to "Pembayaran Kos"
- [ ] Payout APPROVED creates LedgerEntry OUT to "Pembayaran Kos"
- [ ] Withdraw request validates balance correctly
- [ ] Insufficient balance returns error
- [ ] Double callback doesn't create duplicate entries

### E2E Tests

- [ ] Complete payment flow increases withdrawable balance
- [ ] Complete payout flow decreases withdrawable balance
- [ ] UI shows correct balance
- [ ] Source selection is locked
- [ ] Withdraw request succeeds with valid data
- [ ] Withdraw request fails with insufficient balance

## 🔧 Migration Notes

### Existing Data

Existing payouts may have ledger entries in "Penarikan Dana" account. These are **NOT** counted in withdrawable balance calculation.

**Rationale:**
- This is a new feature
- Old payouts are already processed
- Future payouts will use the new system
- No data migration needed

### System Account Setup

The "Pembayaran Kos" system account is automatically created by:
```typescript
await LedgerService.ensureSystemAccounts(adminKosId);
```

This is called:
- When payment is synced to ledger
- When payout is synced to ledger
- When withdrawable balance is calculated

## 📝 API Examples

### Get Withdrawable Balance Summary

```bash
GET /api/adminkos/withdraw/summary
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalPaymentIncome": 5000000,
    "totalWithdrawals": 1000000,
    "withdrawableBalance": 4000000,
    "pendingWithdrawals": 500000,
    "availableBalance": 3500000,
    "asOf": "2025-01-10T10:00:00Z",
    "pembayaranKosAccountId": "acc_xxx"
  }
}
```

### Create Withdraw Request

```bash
POST /api/adminkos/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000000,
  "bankAccountId": "bank_xxx",
  "notes": "Penarikan bulanan"
}

Response:
{
  "success": true,
  "data": {
    "id": "payout_xxx",
    "amount": 1000000,
    "status": "PENDING",
    "source": "SALES",
    ...
  }
}
```

## 🚨 Important Notes

1. **Source is Always SALES**: Withdraw requests always use `source: "SALES"` to indicate they come from "Pembayaran Kos"

2. **Account is Locked**: Users cannot select different accounts for withdraw. It's always "Pembayaran Kos"

3. **Manual Entries Excluded**: Any manual ledger entries (even to "Pembayaran Kos") are NOT counted in withdrawable balance

4. **Idempotent Hooks**: Payment and payout hooks are idempotent - safe to call multiple times

5. **Balance Calculation**: Always use `WithdrawService.getWithdrawableBalance()` for withdraw feature, not `LedgerService.calculateBalance()`

## 🔗 Related Files

- `src/server/types/withdraw.ts` - Type definitions
- `src/server/services/withdraw.service.ts` - Domain service
- `src/server/services/ledger.service.ts` - Updated payout sync
- `src/server/api/withdraw.api.ts` - Application service
- `src/app/api/adminkos/withdraw/summary/route.ts` - Summary API
- `src/app/api/adminkos/withdraw/breakdown/route.ts` - Breakdown API
- `src/app/api/adminkos/withdraw/route.ts` - Create withdraw API
- `src/server/api/hooks/payment.hooks.ts` - Payment sync hook
- `src/server/api/hooks/payout.hooks.ts` - Payout sync hook

