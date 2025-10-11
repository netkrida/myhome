import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ReceptionistDashboardPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Receptionist Dashboard">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receptionist Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola booking, check-in, check-out, dan status kamar
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Bookings Today</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Check-in</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Check-out</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Available Rooms</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
          <p className="text-muted-foreground">No activities yet</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
