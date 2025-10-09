/**
 * Superadmin Submission Page
 * Page for Superadmin to approve/reject payout requests
 */

import { requireRole } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SubmissionPageClient } from "./submission-page-client";
import { PayoutAPI } from "@/server/api/payout.api";

export default async function SuperadminSubmissionPage() {
  await requireRole([UserRole.SUPERADMIN]);

  // Fetch all payouts
  const result = await PayoutAPI.getAll({ page: 1, limit: 100 });
  const payouts = result.success && result.data ? result.data.payouts : [];

  return (
    <DashboardLayout title="Pengajuan Penarikan Dana">
      <div className="px-4 lg:px-6">
        <SubmissionPageClient initialPayouts={payouts} />
      </div>
    </DashboardLayout>
  );
}

