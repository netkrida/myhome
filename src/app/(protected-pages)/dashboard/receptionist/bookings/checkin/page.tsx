import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CheckInForm } from "@/components/dashboard/receptionist/bookings/check-in-form"
import { ReceptionistBookingsList } from "@/components/dashboard/receptionist/bookings/receptionist-bookings-list"

export default async function ReceptionistCheckinPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Check-in">
      <div className="px-4 lg:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="text-muted-foreground">Cari booking dan proses check-in tamu</p>
        </div>

        <CheckInForm />

        <ReceptionistBookingsList
          status="CHECKED_IN"
          showCheckOutAction
          title="Tamu yang Sudah Check-in"
          description="Checkout tamu yang sudah menyelesaikan masa inapnya."
        />
      </div>
    </DashboardLayout>
  )
}
