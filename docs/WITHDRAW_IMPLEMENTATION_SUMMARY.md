# Withdraw Balance Implementation Summary

## ✅ Implementation Complete

The Withdraw Balance feature has been successfully implemented following the 3-tier architecture.

## 📦 Files Created

### Types (Tier 3)
- ✅ `src/server/types/withdraw.ts` - Type definitions for withdraw feature

### Services (Tier 3)
- ✅ `src/server/services/withdraw.service.ts` - Domain service for withdraw balance calculations
  - `getWithdrawableBalance()` - Calculate balance from "Pembayaran Kos" only
  - `validateWithdrawRequest()` - Validate withdraw requests
  - `getBalanceBreakdown()` - Get detailed breakdown
  - `getPembayaranKosAccountId()` - Get system account ID

### Application Services (Tier 2)
- ✅ `src/server/api/withdraw.api.ts` - Application service for withdraw operations
  - `getSummary()` - Get withdrawable balance summary
  - `getBreakdown()` - Get detailed breakdown
  - `createWithdrawRequest()` - Create withdraw request with validation

### API Routes (Tier 1)
- ✅ `src/app/api/adminkos/withdraw/summary/route.ts` - GET withdrawable balance
- ✅ `src/app/api/adminkos/withdraw/breakdown/route.ts` - GET detailed breakdown
- ✅ `src/app/api/adminkos/withdraw/route.ts` - POST create withdraw request

### Documentation
- ✅ `docs/WITHDRAW_BALANCE_SYSTEM.md` - Comprehensive system documentation
- ✅ `docs/WITHDRAW_IMPLEMENTATION_SUMMARY.md` - This file

## 🔄 Files Modified

### Services (Tier 3)
- ✅ `src/server/services/ledger.service.ts`
  - **CRITICAL CHANGE**: `syncPayoutToLedger()` now uses "Pembayaran Kos" instead of "Penarikan Dana"
  - This ensures payout withdrawals reduce the same account that receives payment income

### Application Services (Tier 2)
- ✅ `src/server/api/payout.api.ts`
  - Added documentation note that `create()` uses general ledger balance
  - For withdraw feature, use `WithdrawAPI.createWithdrawRequest()` instead

## 🎯 Key Features Implemented

### 1. Withdrawable Balance Calculation
- ✅ Only counts automatic payment transactions (refType=PAYMENT)
- ✅ Only counts automatic payout transactions (refType=PAYOUT)
- ✅ Excludes manual entries (refType=MANUAL)
- ✅ Excludes adjustment entries (refType=ADJUSTMENT)
- ✅ Uses "Pembayaran Kos" system account exclusively

### 2. Balance Components
- ✅ `totalPaymentIncome` - Sum of IN from PAYMENT
- ✅ `totalWithdrawals` - Sum of OUT from PAYOUT
- ✅ `withdrawableBalance` - Net balance (income - withdrawals)
- ✅ `pendingWithdrawals` - Pending payout requests
- ✅ `availableBalance` - Withdrawable balance minus pending

### 3. Validation
- ✅ Bank account validation (exists, belongs to AdminKos, approved)
- ✅ Amount validation (positive, <= availableBalance)
- ✅ Source locked to "Pembayaran Kos" (SALES)

### 4. Idempotency
- ✅ Payment hook checks for existing entry before creating
- ✅ Payout hook checks for existing entry before creating
- ✅ Safe to call multiple times (e.g., Midtrans callback retries)

## 🔧 How It Works

### Payment Flow
```
1. Customer pays → Payment.status = SUCCESS
2. PaymentHooks.onPaymentSuccess() triggered
3. LedgerService.syncPaymentToLedger() creates entry:
   - account: "Pembayaran Kos"
   - direction: IN
   - refType: PAYMENT
4. Withdrawable balance INCREASES
```

### Payout Flow
```
1. AdminKos requests withdraw
2. WithdrawAPI.createWithdrawRequest() validates balance
3. Creates Payout with status: PENDING
4. Superadmin approves → Payout.status = APPROVED
5. PayoutHooks.onPayoutApproved() triggered
6. LedgerService.syncPayoutToLedger() creates entry:
   - account: "Pembayaran Kos" (CHANGED from "Penarikan Dana")
   - direction: OUT
   - refType: PAYOUT
7. Withdrawable balance DECREASES
```

## 📊 API Endpoints

### GET /api/adminkos/withdraw/summary
Get withdrawable balance summary for current AdminKos.

**Response:**
```json
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

### GET /api/adminkos/withdraw/breakdown
Get detailed breakdown of payment and withdrawal entries.

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentEntries": [...],
    "withdrawalEntries": [...],
    "summary": { ... }
  }
}
```

### POST /api/adminkos/withdraw
Create new withdraw request.

**Request:**
```json
{
  "amount": 1000000,
  "bankAccountId": "bank_xxx",
  "notes": "Penarikan bulanan"
}
```

**Response:**
```json
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

## 🎨 UI Integration Guide

### 1. Display Withdrawable Balance

```typescript
// Fetch balance
const response = await fetch('/api/adminkos/withdraw/summary');
const { data } = await response.json();

// Display in UI
<Card>
  <CardHeader>
    <CardTitle>Saldo Tarik dari Pembayaran Kos</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Total Pemasukan:</span>
        <span className="font-semibold">
          Rp {data.totalPaymentIncome.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Total Penarikan:</span>
        <span className="font-semibold">
          Rp {data.totalWithdrawals.toLocaleString('id-ID')}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Penarikan Pending:</span>
        <span className="font-semibold text-yellow-600">
          Rp {data.pendingWithdrawals.toLocaleString('id-ID')}
        </span>
      </div>
      <Separator />
      <div className="flex justify-between text-lg">
        <span className="font-bold">Saldo Tersedia:</span>
        <span className="font-bold text-green-600">
          Rp {data.availableBalance.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. Lock Source Selection

```typescript
// Source is always locked to "Pembayaran Kos"
<div className="space-y-2">
  <Label>Sumber Penarikan</Label>
  <Select disabled value="SALES">
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="SALES">
        Pembayaran Kos (Sistem) - Tidak dapat diubah
      </SelectItem>
    </SelectContent>
  </Select>
  <p className="text-sm text-muted-foreground">
    Penarikan hanya dapat dilakukan dari saldo pembayaran kos otomatis
  </p>
</div>
```

### 3. Create Withdraw Request

```typescript
const handleSubmit = async (values: FormValues) => {
  try {
    const response = await fetch('/api/adminkos/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: values.amount,
        bankAccountId: values.bankAccountId,
        notes: values.notes
      })
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Pengajuan penarikan berhasil dibuat');
      router.push('/dashboard/adminkos/withdraw');
    } else {
      toast.error(result.error || 'Gagal membuat pengajuan');
    }
  } catch (error) {
    toast.error('Terjadi kesalahan');
  }
};
```

## ✅ Testing Checklist

### Manual Testing

- [ ] GET /api/adminkos/withdraw/summary returns correct balance
- [ ] Balance only counts PAYMENT entries (not MANUAL)
- [ ] Balance only counts PAYOUT entries (not MANUAL)
- [ ] POST /api/adminkos/withdraw creates payout successfully
- [ ] Validation rejects amount > availableBalance
- [ ] Validation rejects unapproved bank account
- [ ] Source is locked to SALES
- [ ] Payout approval creates LedgerEntry OUT to "Pembayaran Kos"

### Integration Testing

- [ ] Payment SUCCESS → withdrawable balance increases
- [ ] Payout APPROVED → withdrawable balance decreases
- [ ] Manual ledger entry → withdrawable balance unchanged
- [ ] Pending payout → reduces available balance
- [ ] Double callback → no duplicate ledger entries

## 🚨 Important Notes

1. **Breaking Change**: Payout sync now uses "Pembayaran Kos" instead of "Penarikan Dana"
   - Old payouts in "Penarikan Dana" are NOT counted in withdrawable balance
   - This is intentional - it's a new feature for future payouts

2. **Source is Locked**: All withdraw requests use `source: "SALES"` automatically
   - UI should disable/hide source selection
   - Backend enforces this in WithdrawAPI

3. **Manual Entries Excluded**: Even manual entries to "Pembayaran Kos" are excluded
   - Only automatic entries (refType=PAYMENT or PAYOUT) are counted
   - This ensures withdrawable balance only reflects actual payment transactions

4. **Use Correct API**: 
   - For withdraw feature: Use `WithdrawAPI.createWithdrawRequest()`
   - For general payout: Use `PayoutAPI.create()`
   - They use different balance calculations

## 🔗 Next Steps

### UI Implementation
1. Update withdraw page to use new API endpoints
2. Display withdrawable balance prominently
3. Lock source selection to "Pembayaran Kos"
4. Show breakdown of payment and withdrawal entries
5. Add validation messages for insufficient balance

### Testing
1. Write unit tests for WithdrawService
2. Write integration tests for withdraw flow
3. Test edge cases (concurrent requests, insufficient balance)
4. Test idempotency (double callbacks)

### Monitoring
1. Add logging for withdraw requests
2. Monitor balance calculation performance
3. Track withdraw request success/failure rates
4. Alert on balance discrepancies

## 📚 References

- Full documentation: `docs/WITHDRAW_BALANCE_SYSTEM.md`
- Ledger system: `docs/LEDGER_SYSTEM.md`
- Payment system: `docs/PAYMENT_SYSTEM_OVERVIEW.md`
- 3-tier architecture: Project memories

## 🎉 Summary

The Withdraw Balance feature is now fully implemented and ready for UI integration. The system:

✅ Only counts automatic payment transactions  
✅ Excludes manual ledger entries  
✅ Uses "Pembayaran Kos" system account exclusively  
✅ Validates balance before creating withdraw requests  
✅ Follows 3-tier architecture  
✅ Is idempotent and safe for retries  
✅ Provides detailed balance breakdown  
✅ Locks source to prevent user errors  

All backend logic is complete. The next step is to update the UI to use these new endpoints.

