import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/server/lib/auth";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for protected pages - ensures user is authenticated
 */
export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  console.log("🔍 Protected Layout - Checking authentication...");

  const userContext = await getCurrentUserContext();

  console.log("🔍 Protected Layout - User context:", {
    hasContext: !!userContext,
    role: userContext?.role,
    email: userContext?.email,
  });

  if (!userContext) {
    console.log("❌ Protected Layout - No user context, redirecting to login");
    redirect("/login");
  }

  console.log("✅ Protected Layout - Authentication successful");
  return <>{children}</>;
}
