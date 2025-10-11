import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ReceptionistReportsPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Reports">
      <div className="px-4 lg:px-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View and generate property reports</p>
        </div>

        {/* Report Options */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-2">Daily Report</h3>
            <p className="text-sm text-muted-foreground mb-4">View today's activities and transactions</p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Generate Report
            </button>
          </div>
          
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-2">Monthly Report</h3>
            <p className="text-sm text-muted-foreground mb-4">View monthly performance summary</p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Generate Report
            </button>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No reports generated yet</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
