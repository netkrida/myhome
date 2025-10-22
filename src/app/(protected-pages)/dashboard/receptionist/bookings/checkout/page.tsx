import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CheckOutForm } from "@/components/dashboard/receptionist/bookings/check-out-form"

export default async function ReceptionistCheckoutPage() {
  // Ensure user has receptionist role
  await requireRole(["RECEPTIONIST"])

  return (
    <DashboardLayout title="Check-out">
      <div className="px-4 lg:px-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-out</h1>
          <p className="text-muted-foreground">Selesaikan booking dan tandai kamar sebagai kosong</p>
        </div>

        <CheckOutForm />
      </div>
    </DashboardLayout>
  )
}
