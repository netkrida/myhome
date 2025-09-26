import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/server/lib/auth";

/**
 * Dashboard root page - redirects to role-specific dashboard
 */
export default async function DashboardPage() {
  console.log("🏠 Dashboard - Getting user context...");

  const userContext = await getCurrentUserContext();

  console.log("🏠 Dashboard - User context:", {
    hasUser: !!userContext,
    role: userContext?.role,
    email: userContext?.email
  });

  if (!userContext) {
    console.log("🔄 Dashboard - No user context, redirecting to login");
    redirect("/login");
  }

  // Redirect to role-specific dashboard
  const dashboardUrl = getDashboardUrlForRole(userContext.role);
  console.log("🔄 Dashboard - Redirecting to role dashboard:", {
    role: userContext.role,
    dashboardUrl
  });
  redirect(dashboardUrl);
}

function getDashboardUrlForRole(role: string): string {
  const normalizedRole = role.toLowerCase();
  
  switch (normalizedRole) {
    case "superadmin":
      return "/dashboard/superadmin";
    case "adminkos":
      return "/dashboard/adminkos";
    case "receptionist":
      return "/dashboard/receptionist";
    case "customer":
      return "/dashboard/customer";
    default:
      return "/";
  }
}
