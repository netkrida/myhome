import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DirectBookingForm } from "@/components/dashboard/receptionist/bookings/direct-booking-form"

export default async function ReceptionistDirectBookingPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Direct Booking">
      <div className="px-4 lg:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Langsung</h1>
          <p className="text-muted-foreground">Catat walk-in customer dan pembayaran offline</p>
        </div>

        <DirectBookingForm />
      </div>
    </DashboardLayout>
  )
}
