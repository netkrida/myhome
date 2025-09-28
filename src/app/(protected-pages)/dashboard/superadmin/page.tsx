import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SuperadminDashboard() {
  // Ensure user has superadmin role
  await requireRole(["SUPERADMIN"])

  return (
    <DashboardLayout title="Superadmin Dashboard">
      <div className="px-4 lg:px-6">
      </div>
    </DashboardLayout>
  )
}
