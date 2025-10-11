import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ReceptionistCheckinPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Check-in">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="text-muted-foreground">Process customer check-ins</p>
        </div>

        {/* Check-in Form */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Check-in form will be displayed here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
