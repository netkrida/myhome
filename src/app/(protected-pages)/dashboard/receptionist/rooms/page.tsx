import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ReceptionistRoomsPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Room Status">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Status</h1>
          <p className="text-muted-foreground">View and manage room availability</p>
        </div>

        {/* Room Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Available Rooms</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Occupied Rooms</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Under Maintenance</h3>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>
        </div>

        {/* Room List */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Room List</h2>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Room list will be displayed here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
