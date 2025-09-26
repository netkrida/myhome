import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminKosDashboard() {
  // Ensure user has adminkos role
  await requireRole(["ADMINKOS"])

  return (
    <DashboardLayout title="Admin Kos Dashboard">
      <div className="px-4 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Kos Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your business operations
            </p>
          </div>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Admin Kos Dashboard</CardTitle>
            <CardDescription>
              Property management features will be implemented here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This dashboard will contain property management, booking management, and staff management features.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
