import { requireRole } from "@/server/lib/auth";
import { RoleSpecificUsersPage } from "@/components/users/role-specific-users-page";
import { UserRole } from "@/server/types/rbac";

export default async function ReceptionistUsersPage() {
  // Ensure user has superadmin role
  await requireRole(["SUPERADMIN"]);

  return (
    <RoleSpecificUsersPage
      role={UserRole.RECEPTIONIST}
      title="Receptionist Management"
      description="Manage receptionist users who handle day-to-day operations"
      allowRoleChange={true}
      allowCreate={true}
    />
  );
}