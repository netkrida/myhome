import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReceptionistBookingsList } from "@/components/dashboard/receptionist/bookings/receptionist-bookings-list"

export default async function ReceptionistBookingsPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="All Bookings">
      <div className="px-4 lg:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Semua Booking</h1>
          <p className="text-muted-foreground">Pantau seluruh booking aktif dan proses check-in tamu dari satu tempat.</p>
        </div>

        <ReceptionistBookingsList
          showCheckInAction
          title="Daftar Booking"
          description="Tekan tombol check-in ketika tamu sudah tiba di properti."
        />
      </div>
    </DashboardLayout>
  )
}
