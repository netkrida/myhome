import bcrypt from "bcryptjs";
import { UserRole } from "../types/rbac";
import type {
  CreateUserDTO,
  UpdateUserDTO,
  UserListQuery
} from "../types/user";

/**
 * User Domain Service
 * Pure business logic for user management
 */
export class UserService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate user creation data based on role
   */
  static validateUserCreation(userData: CreateUserDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!userData.email) {
      errors.push("Email is required");
    }

    if (!userData.role) {
      errors.push("Role is required");
    }

    // Role-specific validation
    switch (userData.role) {
      case UserRole.SUPERADMIN:
        // Only system can create superadmin
        errors.push("Superadmin accounts can only be created by the system");
        break;

      case UserRole.ADMINKOS:
        // AdminKos needs business information
        if (!userData.name) {
          errors.push("Name is required for AdminKos accounts");
        }
        break;

      case UserRole.RECEPTIONIST:
        // Receptionist needs assignment information
        if (!userData.name) {
          errors.push("Name is required for Receptionist accounts");
        }
        break;

      case UserRole.CUSTOMER:
        // Customer has minimal requirements
        break;

      default:
        errors.push("Invalid role specified");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user update data
   */
  static validateUserUpdate(
    currentUser: { role: UserRole; id: string },
    updateData: UpdateUserDTO,
    updatingUserId: string,
    updatingUserRole: UserRole
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Users can update their own basic information
    if (currentUser.id === updatingUserId) {
      // Self-update is allowed for basic fields
      return { isValid: true, errors: [] };
    }

    // Role-based update permissions
    switch (updatingUserRole) {
      case UserRole.SUPERADMIN:
        // Superadmin can update any user
        break;

      case UserRole.ADMINKOS:
        // AdminKos can update receptionist and customer accounts they manage
        if (currentUser.role === UserRole.RECEPTIONIST || currentUser.role === UserRole.CUSTOMER) {
          // Additional validation would check if the user is actually managed by this AdminKos
          break;
        }
        errors.push("AdminKos can only update receptionist and customer accounts they manage");
        break;

      case UserRole.RECEPTIONIST:
        // Receptionist cannot update other users
        errors.push("Receptionist cannot update other user accounts");
        break;

      case UserRole.CUSTOMER:
        // Customer cannot update other users
        errors.push("Customer cannot update other user accounts");
        break;

      default:
        errors.push("Invalid updating user role");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }



  /**
   * Generate a secure random password
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one character from each required type
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Validate email format and domain restrictions
   */
  static validateEmail(email: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }

    // Additional domain restrictions could be added here
    // For example, blocking certain domains or requiring specific domains

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user role change permissions
   */
  static validateRoleChange(
    currentUserRole: UserRole,
    targetUserRole: UserRole,
    newRole: UserRole
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Only SUPERADMIN can change roles
    if (currentUserRole !== UserRole.SUPERADMIN) {
      errors.push("Only superadmin can change user roles");
      return { isValid: false, errors };
    }

    // Cannot change own role
    if (currentUserRole === targetUserRole && currentUserRole === UserRole.SUPERADMIN) {
      errors.push("Cannot change your own role");
    }

    // Validate role transitions
    if (targetUserRole === UserRole.SUPERADMIN && newRole !== UserRole.SUPERADMIN) {
      errors.push("Cannot demote superadmin users");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user status change permissions
   */
  static validateStatusChange(
    currentUserRole: UserRole,
    targetUserId: string,
    currentUserId: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Only SUPERADMIN can change user status
    if (currentUserRole !== UserRole.SUPERADMIN) {
      errors.push("Only superadmin can change user status");
      return { isValid: false, errors };
    }

    // Cannot change own status
    if (targetUserId === currentUserId) {
      errors.push("Cannot change your own status");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user deletion permissions (hard delete)
   */
  static validateUserDeletion(
    currentUserRole: UserRole,
    targetUserRole: UserRole,
    targetUserId: string,
    currentUserId: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Only SUPERADMIN can permanently delete users
    if (currentUserRole !== UserRole.SUPERADMIN) {
      errors.push("Only superadmin can permanently delete users");
      return { isValid: false, errors };
    }

    // Cannot delete own account
    if (targetUserId === currentUserId) {
      errors.push("Cannot delete your own account");
    }

    // Cannot delete other superadmin accounts
    if (targetUserRole === UserRole.SUPERADMIN && targetUserId !== currentUserId) {
      errors.push("Cannot delete other superadmin accounts");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build search filters for user queries
   */
  static buildUserSearchFilters(query: UserListQuery) {
    const where: any = {};

    // Search by name or email
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (query.role) {
      where.role = query.role;
    }

    // Filter by status
    if (query.status) {
      where.isActive = query.status === 'active';
    }

    return where;
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic phone number validation (Indonesian format)
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if user can be deactivated
   */
  static canDeactivateUser(
    userToDeactivate: { role: UserRole; id: string },
    deactivatingUserRole: UserRole
  ): {
    canDeactivate: boolean;
    reason?: string;
  } {
    // Cannot deactivate superadmin
    if (userToDeactivate.role === UserRole.SUPERADMIN) {
      return {
        canDeactivate: false,
        reason: "Superadmin accounts cannot be deactivated",
      };
    }

    // Only superadmin and adminkos can deactivate users
    if (deactivatingUserRole === UserRole.SUPERADMIN) {
      return { canDeactivate: true };
    }

    if (deactivatingUserRole === UserRole.ADMINKOS) {
      // AdminKos can deactivate receptionist and customer accounts they manage
      if (userToDeactivate.role === UserRole.RECEPTIONIST || userToDeactivate.role === UserRole.CUSTOMER) {
        return { canDeactivate: true };
      }
      return {
        canDeactivate: false,
        reason: "AdminKos can only deactivate receptionist and customer accounts they manage",
      };
    }

    return {
      canDeactivate: false,
      reason: "Insufficient permissions to deactivate user",
    };
  }
}
