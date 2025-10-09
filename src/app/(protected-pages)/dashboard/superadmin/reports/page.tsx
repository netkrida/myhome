/**
 * Superadmin Reports Page
 * Page for Superadmin to approve/reject bank account registrations
 */

import { requireRole } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReportsPageClient } from "./reports-page-client";
import { BankAccountAPI } from "@/server/api/bank-account.api";

export default async function SuperadminReportsPage() {
  await requireRole([UserRole.SUPERADMIN]);

  // Fetch all bank accounts
  const result = await BankAccountAPI.getAll({ page: 1, limit: 100 });
  const accounts = result.success && result.data ? result.data.accounts : [];

  return (
    <DashboardLayout title="Laporan & Persetujuan">
      <div className="px-4 lg:px-6">
        <ReportsPageClient initialAccounts={accounts} />
      </div>
    </DashboardLayout>
  );
}

