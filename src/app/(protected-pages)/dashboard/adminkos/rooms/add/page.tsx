import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RoomCreationForm } from "@/components/dashboard/adminkos/room"

export default async function AddRoomPage() {
  // Ensure user has adminkos role
  await requireRole(["ADMINKOS"])

  return (
    <DashboardLayout title="Tambah Kamar Baru">
      <div className="container mx-auto px-4 lg:px-6 space-y-6">
        <RoomCreationForm />
      </div>
    </DashboardLayout>
  )
}