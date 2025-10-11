import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ReceptionistCheckoutPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Check-out">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-out</h1>
          <p className="text-muted-foreground">Process customer check-outs</p>
        </div>

        {/* Check-out Form */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Check-out form will be displayed here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
