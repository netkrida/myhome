import { requireRole } from "@/server/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import { BookingsPageClient } from "./bookings-page-client";
import type { RecentBookingsDTO } from "@/server/types/adminkos";

async function getInitialBookings(): Promise<RecentBookingsDTO> {
  try {
    const result = await AdminKosAPI.getRecentBookings({
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch bookings");
    }

    return result.data!;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      bookings: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

async function getMyProperties() {
  try {
    const result = await AdminKosAPI.getMyProperties();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch properties");
    }

    return result.data!.properties.map(p => ({
      id: p.id,
      name: p.name,
    }));
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

export default async function AdminKosBookingsPage() {
  await requireRole(["ADMINKOS"]);

  const [initialData, properties] = await Promise.all([
    getInitialBookings(),
    getMyProperties(),
  ]);

  return (
    <DashboardLayout title="Manajemen Booking">
      <div className="px-4 lg:px-6">
        <BookingsPageClient initialData={initialData} properties={properties} />
      </div>
    </DashboardLayout>
  );
}
