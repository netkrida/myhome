import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ReceptionistBookingsPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="All Bookings">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Bookings</h1>
          <p className="text-muted-foreground">View and manage all property bookings</p>
        </div>

        {/* Bookings List */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Booking list will be displayed here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
