import { requireRole } from "@/server/lib/auth";
import { RoleSpecificUsersPage } from "@/components/users/role-specific-users-page";
import { UserRole } from "@/server/types/rbac";

export default async function AdminKosUsersPage() {
  // Ensure user has superadmin role
  await requireRole(["SUPERADMIN"]);

  return (
    <RoleSpecificUsersPage
      role={UserRole.ADMINKOS}
      title="Admin Kos Management"
      description="Manage Admin Kos users who own and operate boarding house properties"
      allowRoleChange={true}
      allowCreate={true}
    />
  );
}