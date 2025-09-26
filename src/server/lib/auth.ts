import { auth } from "../auth";
import { UserRepository } from "../repositories/user.repository";
import { RBACService } from "../services/rbac.service";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { UserContext, PermissionCheck, UserRole } from "../types/rbac";
import type { Session } from "next-auth";

/**
 * Server-side authentication utilities
 */

/**
 * Get the current user session
 */
export async function getCurrentSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Validate session against database and return detailed validation result
 */
export async function validateSessionUser(session: Session): Promise<{
  valid: boolean;
  user?: UserContext;
  reason?: string;
  shouldClearSession?: boolean;
}> {
  try {
    if (!session?.user?.id) {
      return {
        valid: false,
        reason: "No session or user ID",
        shouldClearSession: true
      };
    }

    console.log("🔍 Auth Validation - Validating session for user:", session.user.id);

    // Get full user data from database
    const dbUser = await UserRepository.findById(session.user.id, true);

    if (!dbUser) {
      console.log("❌ Auth Validation - User not found in database:", session.user.id);
      return {
        valid: false,
        reason: "User not found in database",
        shouldClearSession: true
      };
    }

    if (!dbUser.isActive) {
      console.log("❌ Auth Validation - User account is inactive:", session.user.id);
      return {
        valid: false,
        reason: "User account is inactive",
        shouldClearSession: true
      };
    }

    // Check for role mismatch
    if (dbUser.role !== session.user.role) {
      console.log("⚠️ Auth Validation - Role mismatch:", {
        sessionRole: session.user.role,
        dbRole: dbUser.role
      });
      return {
        valid: false,
        reason: "Role mismatch - session needs refresh",
        shouldClearSession: true
      };
    }

    // Build validated user context
    const userContext: UserContext = {
      id: dbUser.id,
      role: dbUser.role as UserRole,
      email: dbUser.email!,
      name: dbUser.name || undefined,
    };

    // Add role-specific context
    if (dbUser.role === "ADMINKOS") {
      // TODO: Add adminKosProfile relation when available
      userContext.adminKosId = dbUser.id; // Placeholder
    }

    if (dbUser.role === "RECEPTIONIST") {
      // TODO: Add managedProperties relation when available
      userContext.assignedPropertyIds = []; // Placeholder
    }

    console.log("✅ Auth Validation - Session validated successfully:", {
      id: userContext.id,
      role: userContext.role,
      email: userContext.email,
    });

    return {
      valid: true,
      user: userContext
    };

  } catch (error) {
    console.error("❌ Auth Validation - Error validating session:", error);
    return {
      valid: false,
      reason: "Database error during validation",
      shouldClearSession: false // Don't clear on DB errors
    };
  }
}

/**
 * Get the current user context with role information
 * Now includes automatic session validation
 */
export async function getCurrentUserContext(): Promise<UserContext | null> {
  try {
    const session = await getCurrentSession();

    // Debug logging
    console.log("🔍 Auth Debug - Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!session?.user?.id) {
      console.log("❌ Auth Debug - No session or user ID");
      return null;
    }

    // Validate session against database
    const validation = await validateSessionUser(session);

    if (!validation.valid) {
      console.log("❌ Auth Debug - Session validation failed:", validation.reason);

      // If session should be cleared, we could trigger cleanup here
      // For now, just return null to let the calling code handle it
      return null;
    }

    console.log("✅ Auth Debug - User context retrieved and validated");
    return validation.user!;

  } catch (error) {
    console.error("❌ Auth Debug - Error getting user context:", error);
    return null;
  }
}

/**
 * Check if the current user has permission for an action
 */
export async function checkPermission(
  permissionCheck: PermissionCheck
): Promise<{ allowed: boolean; reason?: string }> {
  const userContext = await getCurrentUserContext();
  if (!userContext) {
    return { allowed: false, reason: "Not authenticated" };
  }

  return RBACService.authorize(userContext, permissionCheck);
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<UserContext> {
  const userContext = await getCurrentUserContext();
  if (!userContext) {
    console.log("❌ Auth Debug - requireAuth failed: No user context, redirecting to login");
    redirect("/login");
  }
  console.log("✅ Auth Debug - requireAuth success for user:", userContext.email);
  return userContext;
}

/**
 * Require specific role - throws if not authenticated or wrong role
 */
export async function requireRole(allowedRoles: string[]): Promise<UserContext> {
  const userContext = await requireAuth();
  
  if (!allowedRoles.includes(userContext.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
  }
  
  return userContext;
}

/**
 * Require specific permission - throws if not authorized
 */
export async function requirePermission(
  permissionCheck: PermissionCheck
): Promise<UserContext> {
  const userContext = await requireAuth();
  
  const authResult = RBACService.authorize(userContext, permissionCheck);
  if (!authResult.allowed) {
    throw new Error(authResult.reason || "Access denied");
  }
  
  return userContext;
}

/**
 * Create a protected API handler that requires authentication
 * This version is safe for API routes and doesn't use redirect()
 * Optionally accepts allowed roles as second parameter
 */
export function withAuth<T extends any[], R>(
  handler: (userContext: UserContext, ...args: T) => Promise<R>,
  allowedRoles?: string[]
) {
  return async (...args: T): Promise<R> => {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      throw new Error("Authentication required");
    }

    // If roles are specified, check them
    if (allowedRoles && !allowedRoles.includes(userContext.role)) {
      throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
    }

    return handler(userContext, ...args);
  };
}

/**
 * Create a protected API handler that requires specific roles
 * This version is safe for API routes and doesn't use redirect()
 */
export function withRole<T extends any[], R>(
  allowedRoles: string[],
  handler: (userContext: UserContext, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      throw new Error("Authentication required");
    }
    if (!allowedRoles.includes(userContext.role)) {
      throw new Error(`Access denied. Required roles: ${allowedRoles.join(", ")}`);
    }
    return handler(userContext, ...args);
  };
}

/**
 * Create a protected API handler that requires specific permission
 * This version is safe for API routes and doesn't use redirect()
 */
export function withPermission<T extends any[], R>(
  permissionCheck: PermissionCheck,
  handler: (userContext: UserContext, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const userContext = await getCurrentUserContext();
    if (!userContext) {
      throw new Error("Authentication required");
    }
    const authResult = RBACService.authorize(userContext, permissionCheck);
    if (!authResult.allowed) {
      throw new Error(authResult.reason || "Access denied");
    }
    return handler(userContext, ...args);
  };
}

/**
 * Get user by session (for NextAuth callbacks)
 */
export async function getUserBySession(session: Session): Promise<UserContext | null> {
  if (!session.user?.id) {
    return null;
  }

  try {
    const user = await UserRepository.findById(session.user.id);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      role: user.role as UserRole,
      email: user.email!,
      name: user.name || undefined,
    };
  } catch (error) {
    console.error("Error getting user by session:", error);
    return null;
  }
}
