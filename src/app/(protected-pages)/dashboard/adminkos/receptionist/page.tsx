import { requireRole, getCurrentUserContext } from "@/server/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReceptionistAPI } from "@/server/api/receptionist.api";
import { AdminKosAPI } from "@/server/api/adminkos.api";
import { ReceptionistPageClient } from "./receptionist-page-client";

async function getInitialReceptionists(ownerId: string) {
  try {
    const result = await ReceptionistAPI.getList(
      {
        page: 1,
        limit: 20,
      },
      ownerId
    );

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch receptionists");
    }

    return {
      receptionists: result.data!.receptionists,
      pagination: result.data!.pagination,
    };
  } catch (error) {
    console.error("Error fetching receptionists:", error);
    return {
      receptionists: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
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

export default async function AdminKosReceptionistPage() {
  await requireRole(["ADMINKOS"]);

  const userContext = await getCurrentUserContext();
  if (!userContext) {
    throw new Error("Unauthorized");
  }

  const [initialData, properties] = await Promise.all([
    getInitialReceptionists(userContext.id),
    getMyProperties(),
  ]);

  return (
    <DashboardLayout title="Manajemen Receptionist">
      <div className="px-4 lg:px-6">
        <ReceptionistPageClient
          initialReceptionists={initialData.receptionists}
          initialPagination={initialData.pagination}
          properties={properties}
        />
      </div>
    </DashboardLayout>
  );
}

