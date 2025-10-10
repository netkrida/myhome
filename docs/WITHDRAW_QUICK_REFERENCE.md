# Withdraw Balance - Quick Reference

## 🎯 Goal

Implement withdraw balance that ONLY counts automatic "Pembayaran Kos" transactions (from successful payments), excluding all manual entries.

## ✅ What's Implemented

### Backend (Complete ✅)

1. **Types** - `src/server/types/withdraw.ts`
   - `WithdrawSummaryDTO`
   - `CreateWithdrawRequestDTO`
   - `WithdrawBalanceBreakdownDTO`

2. **Services** - `src/server/services/withdraw.service.ts`
   - `getWithdrawableBalance()` - Calculate balance from "Pembayaran Kos" only
   - `validateWithdrawRequest()` - Validate amount and balance
   - `getBalanceBreakdown()` - Get detailed entries
   - `getPembayaranKosAccountId()` - Get system account ID

3. **Application Service** - `src/server/api/withdraw.api.ts`
   - `getSummary()` - Get balance summary
   - `getBreakdown()` - Get detailed breakdown
   - `createWithdrawRequest()` - Create withdraw with validation

4. **API Routes**
   - `GET /api/adminkos/withdraw/summary` - Get balance
   - `GET /api/adminkos/withdraw/breakdown` - Get breakdown
   - `POST /api/adminkos/withdraw` - Create withdraw request

5. **Updated Files**
   - `src/server/services/ledger.service.ts` - Payout now uses "Pembayaran Kos"
   - `src/server/api/payout.api.ts` - Added documentation notes

## 📊 Balance Calculation

```typescript
Withdrawable Balance = 
  SUM(LedgerEntry WHERE {
    account.name = "Pembayaran Kos"
    direction = "IN"
    refType = "PAYMENT"
  })
  -
  SUM(LedgerEntry WHERE {
    account.name = "Pembayaran Kos"
    direction = "OUT"
    refType = "PAYOUT"
  })
```

## 🔑 Key Rules

### ✅ Included in Balance
- Automatic payment entries (refType=PAYMENT, direction=IN)
- Automatic payout entries (refType=PAYOUT, direction=OUT)
- Only from "Pembayaran Kos" system account

### ❌ Excluded from Balance
- Manual entries (refType=MANUAL)
- Adjustment entries (refType=ADJUSTMENT)
- Entries to other accounts
- Entries to old "Penarikan Dana" account

## 🔄 Critical Change

**Payout Ledger Entry Account Changed:**

```typescript
// BEFORE (Old System)
account: "Penarikan Dana" (type: OTHER)

// AFTER (New System)
account: "Pembayaran Kos" (type: INCOME)
```

This ensures payouts reduce the same account that receives payment income.

## 📡 API Usage

### Get Withdrawable Balance

```typescript
const response = await fetch('/api/adminkos/withdraw/summary');
const { data } = await response.json();

console.log(data);
// {
//   totalPaymentIncome: 5000000,
//   totalWithdrawals: 1000000,
//   withdrawableBalance: 4000000,
//   pendingWithdrawals: 500000,
//   availableBalance: 3500000,
//   asOf: "2025-01-10T10:00:00Z",
//   pembayaranKosAccountId: "acc_xxx"
// }
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

const { data } = await response.json();
// Returns PayoutDTO with status: PENDING
```

## 🎨 UI Requirements

### 1. Display Balance

```tsx
<div>
  <h3>Saldo Tarik dari Pembayaran Kos</h3>
  <p>Total Pemasukan: Rp {totalPaymentIncome}</p>
  <p>Total Penarikan: Rp {totalWithdrawals}</p>
  <p>Pending: Rp {pendingWithdrawals}</p>
  <p className="text-xl font-bold">
    Saldo Tersedia: Rp {availableBalance}
  </p>
</div>
```

### 2. Lock Source Selection

```tsx
<Select disabled value="SALES">
  <option value="SALES">
    Pembayaran Kos (Sistem) - Tidak dapat diubah
  </option>
</Select>
<p className="text-sm text-muted-foreground">
  Penarikan hanya dari saldo pembayaran kos otomatis
</p>
```

### 3. Validation

```tsx
// Before submit
if (amount > availableBalance) {
  toast.error(`Saldo tidak mencukupi. Tersedia: Rp ${availableBalance}`);
  return;
}

// Submit
const result = await createWithdrawRequest({ amount, bankAccountId, notes });
```

## 🧪 Testing

### Test Cases

1. **Payment Success → Balance Increases**
   ```
   1. Create booking
   2. Process payment → status = SUCCESS
   3. Check withdrawable balance → should increase by payment amount
   ```

2. **Payout Approved → Balance Decreases**
   ```
   1. Create withdraw request
   2. Superadmin approves
   3. Check withdrawable balance → should decrease by payout amount
   ```

3. **Manual Entry → Balance Unchanged**
   ```
   1. Create manual ledger entry to "Pembayaran Kos"
   2. Check withdrawable balance → should NOT change
   ```

4. **Insufficient Balance → Validation Error**
   ```
   1. Try to withdraw more than availableBalance
   2. Should return error: "Saldo tidak mencukupi"
   ```

5. **Idempotency → No Duplicates**
   ```
   1. Trigger payment callback twice
   2. Check ledger entries → should only have 1 entry
   ```

## 🚨 Common Issues

### Issue: Balance not updating after payment

**Solution:** Check if PaymentHooks.onPaymentSuccess() is being called. Verify in payment.repository.ts line 180-188.

### Issue: Payout not reducing balance

**Solution:** Check if PayoutHooks.onPayoutApproved() is being called. Verify in payout.repository.ts line 276-282.

### Issue: Manual entries affecting balance

**Solution:** Ensure you're using `WithdrawService.getWithdrawableBalance()` not `LedgerService.calculateBalance()`.

### Issue: Old payouts showing in balance

**Solution:** This is expected. Old payouts used "Penarikan Dana" account and are excluded. Only new payouts (after this implementation) use "Pembayaran Kos".

## 📁 File Locations

```
src/
├── server/
│   ├── types/
│   │   └── withdraw.ts                    ← Types
│   ├── services/
│   │   ├── withdraw.service.ts            ← Domain logic
│   │   └── ledger.service.ts              ← Updated (payout sync)
│   └── api/
│       ├── withdraw.api.ts                ← Application service
│       └── payout.api.ts                  ← Updated (docs)
└── app/
    └── api/
        └── adminkos/
            └── withdraw/
                ├── summary/route.ts       ← GET balance
                ├── breakdown/route.ts     ← GET breakdown
                └── route.ts               ← POST create

docs/
├── WITHDRAW_BALANCE_SYSTEM.md             ← Full documentation
├── WITHDRAW_IMPLEMENTATION_SUMMARY.md     ← Implementation summary
└── WITHDRAW_QUICK_REFERENCE.md            ← This file
```

## 🔗 Related Systems

- **Ledger System**: `docs/LEDGER_SYSTEM.md`
- **Payment System**: `docs/PAYMENT_SYSTEM_OVERVIEW.md`
- **Payment Hooks**: `src/server/api/hooks/payment.hooks.ts`
- **Payout Hooks**: `src/server/api/hooks/payout.hooks.ts`

## 📞 Support

For questions or issues:
1. Check `docs/WITHDRAW_BALANCE_SYSTEM.md` for detailed documentation
2. Review test cases in this file
3. Check common issues section above
4. Verify API responses match expected format

## ✨ Summary

**What Changed:**
- ✅ Created withdraw balance calculation (only from "Pembayaran Kos")
- ✅ Created API endpoints for balance and withdraw requests
- ✅ Updated payout sync to use "Pembayaran Kos" instead of "Penarikan Dana"
- ✅ Added validation for withdraw requests

**What to Do Next:**
- 🎨 Update UI to use new API endpoints
- 🧪 Test the implementation
- 📊 Monitor balance calculations
- 🚀 Deploy to production

**Key Points:**
- Source is ALWAYS locked to "Pembayaran Kos"
- Manual entries are NEVER counted
- Only automatic payment/payout transactions count
- Balance is calculated in real-time from ledger entries

