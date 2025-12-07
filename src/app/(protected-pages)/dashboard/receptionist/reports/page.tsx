import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionistReportsClient } from "@/components/dashboard/receptionist/reports/receptionist-reports-client"

export default async function ReceptionistReportsPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Laporan Booking">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Laporan Booking</h1>
          <p className="text-muted-foreground">
            Lihat dan export laporan booking properti. Data meliputi informasi customer, 
            status check-in/check-out, dan sisa waktu sewa.
          </p>
        </div>

        {/* Reports Content */}
        <ReceptionistReportsClient />
      </div>
    </DashboardLayout>
  )
}
