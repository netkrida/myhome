import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SuperadminDashboard() {
  // Ensure user has superadmin role
  await requireRole(["SUPERADMIN"])

  return (
    <DashboardLayout title="Superadmin Dashboard">
      <div className="px-4 lg:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Superadmin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of the entire MultiKost platform
          </p>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Superadmin Dashboard</CardTitle>
            <CardDescription>
              Platform management features will be implemented here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This dashboard will contain platform statistics, user management, and system administration features.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
