import { requireRole } from "@/server/lib/auth";
import { RoleSpecificUsersPage } from "@/components/users/role-specific-users-page";
import { UserRole } from "@/server/types/rbac";

export default async function CustomerUsersPage() {
  // Ensure user has superadmin role
  await requireRole(["SUPERADMIN"]);

  return (
    <RoleSpecificUsersPage
      role={UserRole.CUSTOMER}
      title="Customer Management"
      description="Manage customer users who rent boarding house rooms"
      allowRoleChange={true}
      allowCreate={true}
    />
  );
}
