/**
 * Role-Based Access Control (RBAC) Types
 * Defines the core RBAC structure for the multikost application
 */

// Core role definitions
export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMINKOS = "ADMINKOS",
  RECEPTIONIST = "RECEPTIONIST",
  CUSTOMER = "CUSTOMER",
}

// Permission categories for different resources
export enum PermissionResource {
  // User management
  USERS = "users",
  ADMINKOS_ACCOUNTS = "adminkos_accounts",
  RECEPTIONIST_ACCOUNTS = "receptionist_accounts",
  CUSTOMER_ACCOUNTS = "customer_accounts",

  // System administration
  SYSTEM_SETTINGS = "system_settings",
}

// CRUD operations
export enum PermissionAction {
  CREATE = "create",
  READ = "read", 
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage", // Full CRUD access
}

// Permission structure
export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
}

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPERADMIN]: [
    // Can manage all adminkos accounts
    { resource: PermissionResource.ADMINKOS_ACCOUNTS, action: PermissionAction.MANAGE },
    { resource: PermissionResource.USERS, action: PermissionAction.READ },
    { resource: PermissionResource.SYSTEM_SETTINGS, action: PermissionAction.MANAGE },
  ],
  
  [UserRole.ADMINKOS]: [
    // Can manage receptionist accounts
    { resource: PermissionResource.RECEPTIONIST_ACCOUNTS, action: PermissionAction.MANAGE },

    // Can register and manage customer accounts
    { resource: PermissionResource.CUSTOMER_ACCOUNTS, action: PermissionAction.MANAGE },
  ],
  
  [UserRole.RECEPTIONIST]: [
    // Basic receptionist permissions (to be defined later)
  ],
  
  [UserRole.CUSTOMER]: [
    // Basic customer permissions (to be defined later)
  ],
};

// Helper type for checking permissions
export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
  userId?: string; // For resource ownership checks
  resourceId?: string; // For specific resource access
}

// User context for authorization
export interface UserContext {
  id: string;
  role: UserRole;
  email: string;
  name?: string;
  // Additional context for role-specific data (to be defined later)
}

// Authorization result
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

// Role hierarchy for inheritance (higher roles inherit lower role permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 1,
  [UserRole.RECEPTIONIST]: 2, 
  [UserRole.ADMINKOS]: 3,
  [UserRole.SUPERADMIN]: 4,
};
