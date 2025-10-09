import { requireRole } from "@/server/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransactionPageClient } from "./transaction-page-client";

export default async function TransactionPage() {
  // Ensure user has adminkos role
  await requireRole(["ADMINKOS"]);

  return (
    <DashboardLayout title="Pembukuan Keuangan">
      <TransactionPageClient />
    </DashboardLayout>
  );
}
