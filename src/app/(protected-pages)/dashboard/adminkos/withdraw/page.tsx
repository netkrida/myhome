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

  // Fetch withdrawable balance from new withdraw API
  // This only counts automatic "Pembayaran Kos" transactions
  let balance = null;
  try {
    const { WithdrawAPI } = await import("@/server/api/withdraw.api");
    const withdrawSummaryResult = await WithdrawAPI.getSummary(profileId);

    if (withdrawSummaryResult.success && withdrawSummaryResult.data) {
      const withdrawSummary = withdrawSummaryResult.data;
      balance = {
        totalBalance: Number(withdrawSummary.withdrawableBalance ?? 0),
        availableBalance: Number(withdrawSummary.availableBalance ?? 0),
        depositBalance: 0, // Not used
        pendingPayouts: Number(withdrawSummary.pendingWithdrawals ?? 0),
        lastCalculated: withdrawSummary.asOf.toISOString(), // Convert Date to ISO string for serialization
        // Additional info for display
        totalPaymentIncome: Number(withdrawSummary.totalPaymentIncome ?? 0),
        totalWithdrawals: Number(withdrawSummary.totalWithdrawals ?? 0),
      };
    }
  } catch (error) {
    console.error("Error fetching withdrawable balance:", error);
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

