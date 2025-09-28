import {
  UserRole,
  type Permission,
  type PermissionCheck,
  type UserContext,
  type AuthorizationResult,
  PermissionResource,
  PermissionAction,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY,
} from "../types/rbac";

/**
 * RBAC Domain Service
 * Pure business logic for role-based access control
 */
export class RBACService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(
    userRole: UserRole,
    resource: PermissionResource,
    action: PermissionAction
  ): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    return rolePermissions.some(permission => 
      permission.resource === resource && 
      (permission.action === action || permission.action === PermissionAction.MANAGE)
    );
  }

  /**
   * Check if a user can perform an action on a specific resource
   * with additional context (e.g., ownership, property assignment)
   */
  static authorize(
    userContext: UserContext,
    permissionCheck: PermissionCheck
  ): AuthorizationResult {
    const { role } = userContext;
    const { resource, action, userId, resourceId } = permissionCheck;

    // Check basic role permission
    if (!this.hasPermission(role, resource, action)) {
      return {
        allowed: false,
        reason: `Role ${role} does not have ${action} permission for ${resource}`,
      };
    }

    // Additional context-based checks
    switch (role) {
      case UserRole.SUPERADMIN:
        // Superadmin has access to everything they have permissions for
        return { allowed: true };

      case UserRole.ADMINKOS:
        return this.authorizeAdminKos(userContext, permissionCheck);

      case UserRole.RECEPTIONIST:
        return this.authorizeReceptionist(userContext, permissionCheck);

      case UserRole.CUSTOMER:
        return this.authorizeCustomer(userContext, permissionCheck);

      default:
        return {
          allowed: false,
          reason: "Unknown role",
        };
    }
  }

  /**
   * Authorization logic for AdminKos role
   */
  private static authorizeAdminKos(
    userContext: UserContext,
    permissionCheck: PermissionCheck
  ): AuthorizationResult {
    const { resource, action, userId, resourceId } = permissionCheck;

    switch (resource) {
      case PermissionResource.KOS_PROPERTIES:
      case PermissionResource.ROOMS:
        // AdminKos can only manage their own properties and rooms
        if (resourceId) {
          // TODO: Validate against actual property ownership using userContext.id
          // For now, we assume the resourceId validation happens at the repository level
          return { allowed: true };
        }
        return { allowed: true }; // Allow for creation (no resourceId yet)

      case PermissionResource.RECEPTIONIST_ACCOUNTS:
      case PermissionResource.CUSTOMER_ACCOUNTS:
        // AdminKos can manage accounts for their properties
        return { allowed: true };

      case PermissionResource.BOOKINGS:
        // AdminKos can view/update bookings for their properties
        if (action === PermissionAction.READ || action === PermissionAction.UPDATE) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: "AdminKos cannot create or delete bookings directly",
        };

      default:
        return {
          allowed: false,
          reason: `AdminKos role does not have access to ${resource}`,
        };
    }
  }

  /**
   * Authorization logic for Receptionist role
   */
  private static authorizeReceptionist(
    userContext: UserContext,
    permissionCheck: PermissionCheck
  ): AuthorizationResult {
    const { resource, action, resourceId } = permissionCheck;

    switch (resource) {
      case PermissionResource.DIRECT_BOOKINGS:
      case PermissionResource.BOOKING_VALIDATION:
        // Receptionist can handle bookings for assigned properties
        // TODO: Check assigned properties when relationship is implemented
        // For now, allow all receptionists
        return { allowed: true };
        return {
          allowed: false,
          reason: "Receptionist is not assigned to any properties",
        };

      case PermissionResource.BOOKINGS:
        // Can read and update bookings for assigned properties
        if (action === PermissionAction.READ || action === PermissionAction.UPDATE) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: "Receptionist can only read and update bookings",
        };

      case PermissionResource.ROOMS:
        // Can view rooms for assigned properties
        if (action === PermissionAction.READ) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: "Receptionist can only view rooms",
        };

      default:
        return {
          allowed: false,
          reason: `Receptionist role does not have access to ${resource}`,
        };
    }
  }

  /**
   * Authorization logic for Customer role
   */
  private static authorizeCustomer(
    userContext: UserContext,
    permissionCheck: PermissionCheck
  ): AuthorizationResult {
    const { resource, action, userId } = permissionCheck;

    switch (resource) {
      case PermissionResource.BOOKINGS:
        if (action === PermissionAction.CREATE) {
          return { allowed: true };
        }
        if (action === PermissionAction.READ) {
          // Customers can only view their own bookings
          if (userId && userId === userContext.id) {
            return { allowed: true };
          }
          return {
            allowed: false,
            reason: "Customers can only view their own bookings",
          };
        }
        return {
          allowed: false,
          reason: "Customers can only create and view their own bookings",
        };

      case PermissionResource.ROOMS:
        // Customers can view available rooms
        if (action === PermissionAction.READ) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: "Customers can only view rooms",
        };

      default:
        return {
          allowed: false,
          reason: `Customer role does not have access to ${resource}`,
        };
    }
  }

  /**
   * Check if a role can manage another role
   */
  static canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    const managerLevel = ROLE_HIERARCHY[managerRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];

    // Can only manage roles at lower hierarchy levels
    return managerLevel > targetLevel;
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if a role has any permissions for a resource
   */
  static hasResourceAccess(role: UserRole, resource: PermissionResource): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.some(permission => permission.resource === resource);
  }

  /**
   * Get allowed actions for a role on a specific resource
   */
  static getAllowedActions(role: UserRole, resource: PermissionResource): PermissionAction[] {
    const permissions = this.getRolePermissions(role);
    const resourcePermissions = permissions.filter(p => p.resource === resource);
    
    const actions: PermissionAction[] = [];
    
    resourcePermissions.forEach(permission => {
      if (permission.action === PermissionAction.MANAGE) {
        // MANAGE includes all CRUD operations
        actions.push(
          PermissionAction.CREATE,
          PermissionAction.READ,
          PermissionAction.UPDATE,
          PermissionAction.DELETE
        );
      } else {
        actions.push(permission.action);
      }
    });

    // Remove duplicates
    return [...new Set(actions)];
  }
}
