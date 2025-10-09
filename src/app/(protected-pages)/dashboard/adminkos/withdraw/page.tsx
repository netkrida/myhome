/**
 * AdminKos Withdraw Page
 * Page for AdminKos to manage bank accounts and withdraw funds
 */

import { requireRole } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { WithdrawPageClient } from "./withdraw-page-client";
import { BankAccountAPI } from "@/server/api/bank-account.api";
import { PayoutAPI } from "@/server/api/payout.api";

export default async function AdminKosWithdrawPage() {
  const userContext = await requireRole([UserRole.ADMINKOS]);

  // Get AdminKosProfile ID from User ID
  const profileId = userContext.profileId;
  if (!profileId) {
    throw new Error("AdminKos profile not found");
  }

  // Fetch approved bank account
  const bankAccountResult = await BankAccountAPI.getApprovedByAdminKosId(profileId);
  const approvedBankAccount = bankAccountResult.success ? bankAccountResult.data : null;

  // Fetch balance from ledger system (integrated approach)
  let balance = null;
  try {
    const { AdminKosLedgerAPI } = await import("@/server/api/adminkos.ledger");
    const ledgerBalanceResult = await AdminKosLedgerAPI.getBalanceInfo();

    if (ledgerBalanceResult.success && ledgerBalanceResult.data) {
      const ledgerBalance = ledgerBalanceResult.data;
      balance = {
        totalBalance: ledgerBalance.totalBalance,
        availableBalance: ledgerBalance.availableBalance,
        depositBalance: 0,
        pendingPayouts: ledgerBalance.totalBalance - ledgerBalance.availableBalance,
        lastCalculated: new Date(),
      };
    }
  } catch (error) {
    console.warn("Ledger system not available, falling back to old balance calculation:", error);
  }

  // Fallback to old balance calculation if ledger not available
  if (!balance) {
    const balanceResult = await PayoutAPI.getBalance(profileId);
    balance = balanceResult.success ? balanceResult.data : null;
  }

  // Fetch payout history
  const payoutsResult = await PayoutAPI.getByAdminKosId(profileId);
  const payouts = payoutsResult.success && payoutsResult.data ? payoutsResult.data : [];

  // Fetch all bank accounts (for status display)
  const bankAccountsResult = await BankAccountAPI.getByAdminKosId(profileId);
  const bankAccounts = bankAccountsResult.success && bankAccountsResult.data ? bankAccountsResult.data : [];

  return (
    <DashboardLayout title="Penarikan Dana">
      <div className="px-4 lg:px-6">
        <WithdrawPageClient
          approvedBankAccount={approvedBankAccount ?? null}
          balance={balance ?? null}
          payouts={payouts}
          bankAccounts={bankAccounts}
        />
      </div>
    </DashboardLayout>
  );
}

