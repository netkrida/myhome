import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { withAuth } from "../lib/auth";
import { UserRole } from "../types/rbac";
import { prisma } from "../db";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import type { 
  CreateUserDTO, 
  UpdateUserDTO, 
  UserListQuery, 
  UserListResponse,
  UserListItem,
  UserDetailItem,
  UserFilterParams,
  ChangeUserStatusDTO,
  ChangeUserRoleDTO
} from "../types/user";

/**
 * Tier-2: Users Application Services
 * Orchestrates user management use cases
 */
export class UsersAPI {
  /**
   * Get paginated list of users with filters
   * Only accessible by SUPERADMIN
   */
  static getAllUsers = withAuth(
    async (userContext: UserContext, query: UserListQuery): Promise<Result<UserListResponse>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can view user list.",
            },
            statusCode: 403,
          };
        }

        // Build search filters from query parameters
        const filters: UserFilterParams = {
          role: query.role,
          search: query.search,
          status: query.status,
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        };

        console.log('=== USERS API: Applied filters ===', {
          filters,
          originalQuery: query
        });

        // Get paginated users
        const result = await UserRepository.findMany(filters);

        // Transform to list items
        const users: UserListItem[] = result.users.map(user => ({
          id: user.id,
          name: user.name || undefined,
          email: user.email || undefined,
          role: user.role as UserRole,
          isActive: user.isActive,
          phoneNumber: user.phoneNumber || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

        return {
          success: true,
          data: {
            users,
            pagination: result.pagination,
          },
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting users:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve users",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get single user by ID
   * Only accessible by SUPERADMIN
   */
  static getUserById = withAuth(
    async (userContext: UserContext, userId: string): Promise<Result<UserDetailItem>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can view user details.",
            },
            statusCode: 403,
          };
        }

        const user = await UserRepository.findById(userId, true); // Include profile data
        
        if (!user) {
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found",
            },
            statusCode: 404,
          };
        }

        const userWithProfiles = user as any; // Cast to get profile properties

        return {
          success: true,
          data: {
            id: user.id,
            name: user.name || undefined,
            email: user.email || undefined,
            emailVerified: user.emailVerified,
            role: user.role as UserRole,
            isActive: user.isActive,
            phoneNumber: user.phoneNumber || undefined,
            provinceCode: user.provinceCode || undefined,
            provinceName: user.provinceName || undefined,
            regencyCode: user.regencyCode || undefined,
            regencyName: user.regencyName || undefined,
            districtCode: user.districtCode || undefined,
            districtName: user.districtName || undefined,
            streetAddress: user.streetAddress || undefined,
            adminKosProfile: userWithProfiles.adminKosProfile,
            receptionistProfile: userWithProfiles.receptionistProfile,
            customerProfile: userWithProfiles.customerProfile,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          } as UserDetailItem,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting user:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve user",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Create new user
   * Only accessible by SUPERADMIN
   */
  static createUser = withAuth(
    async (userContext: UserContext, userData: CreateUserDTO): Promise<Result<UserListItem>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can create users.",
            },
            statusCode: 403,
          };
        }

        // Validate user data
        const validation = UserService.validateUserCreation(userData);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: validation.errors.join(", "),
            },
            statusCode: 400,
          };
        }

        // Check if email already exists
        const emailExists = await UserRepository.emailExists(userData.email);
        if (emailExists) {
          return {
            success: false,
            error: {
              code: "EMAIL_EXISTS",
              message: "Email already exists",
            },
            statusCode: 409,
          };
        }

        // Hash password
        const hashedPassword = await UserService.hashPassword(userData.password!);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            phoneNumber: userData.phoneNumber,
            password: hashedPassword,
          },
        });

        return {
          success: true,
          data: {
            id: user.id,
            name: user.name || undefined,
            email: user.email || undefined,
            role: user.role as UserRole,
            isActive: user.isActive,
            phoneNumber: user.phoneNumber || undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          statusCode: 201,
        };
      } catch (error) {
        console.error("Error creating user:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to create user",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Update existing user
   * Only accessible by SUPERADMIN
   */
  static updateUser = withAuth(
    async (userContext: UserContext, userId: string, updateData: UpdateUserDTO): Promise<Result<UserListItem>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can update users.",
            },
            statusCode: 403,
          };
        }

        // Get existing user
        const existingUser = await UserRepository.findById(userId);
        if (!existingUser) {
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found",
            },
            statusCode: 404,
          };
        }

        // Check if email already exists (excluding current user)
        if (updateData.email && updateData.email !== existingUser.email) {
          const emailExists = await UserRepository.emailExists(updateData.email, userId);
          if (emailExists) {
            return {
              success: false,
              error: {
                code: "EMAIL_EXISTS",
                message: "Email already exists",
              },
              statusCode: 409,
            };
          }
        }

        // Update user
        const user = await UserRepository.update(userId, updateData);

        return {
          success: true,
          data: {
            id: user.id,
            name: user.name || undefined,
            email: user.email || undefined,
            role: user.role as UserRole,
            isActive: user.isActive,
            phoneNumber: user.phoneNumber || undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error updating user:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update user",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Soft delete user
   * Only accessible by SUPERADMIN
   */
  static deleteUser = withAuth(
    async (userContext: UserContext, userId: string): Promise<Result<void>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can delete users.",
            },
            statusCode: 403,
          };
        }

        // Get target user
        const targetUser = await UserRepository.findById(userId);
        if (!targetUser) {
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found",
            },
            statusCode: 404,
          };
        }

        // Validate deletion
        const validation = UserService.validateUserDeletion(
          userContext.role,
          targetUser.role as UserRole,
          userId,
          userContext.id
        );

        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: validation.errors.join(", "),
            },
            statusCode: 400,
          };
        }

        // Hard delete user
        await UserRepository.delete(userId);

        return {
          success: true,
          data: undefined,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error deleting user:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to delete user",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Change user status (active/inactive)
   * Only accessible by SUPERADMIN
   */
  static changeUserStatus = withAuth(
    async (userContext: UserContext, userId: string, statusData: ChangeUserStatusDTO): Promise<Result<UserListItem>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can change user status.",
            },
            statusCode: 403,
          };
        }

        // Validate status change
        const validation = UserService.validateStatusChange(
          userContext.role,
          userId,
          userContext.id
        );

        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: validation.errors.join(", "),
            },
            statusCode: 400,
          };
        }

        // Change status
        const user = await UserRepository.changeStatus(userId, statusData.isActive);

        return {
          success: true,
          data: {
            id: user.id,
            name: user.name || undefined,
            email: user.email || undefined,
            role: user.role as UserRole,
            isActive: user.isActive,
            phoneNumber: user.phoneNumber || undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error changing user status:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to change user status",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Change user role
   * Only accessible by SUPERADMIN
   */
  static changeUserRole = withAuth(
    async (userContext: UserContext, userId: string, roleData: ChangeUserRoleDTO): Promise<Result<UserListItem>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can change user roles.",
            },
            statusCode: 403,
          };
        }

        // Get target user
        const targetUser = await UserRepository.findById(userId);
        if (!targetUser) {
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found",
            },
            statusCode: 404,
          };
        }

        // Validate role change
        const validation = UserService.validateRoleChange(
          userContext.role,
          targetUser.role as UserRole,
          roleData.role
        );

        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: validation.errors.join(", "),
            },
            statusCode: 400,
          };
        }

        // Change role
        const user = await UserRepository.changeRole(userId, roleData.role);

        return {
          success: true,
          data: {
            id: user.id,
            name: user.name || undefined,
            email: user.email || undefined,
            role: user.role as UserRole,
            isActive: user.isActive,
            phoneNumber: user.phoneNumber || undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error changing user role:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to change user role",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get user statistics
   * Only accessible by SUPERADMIN
   */
  static getUserStats = withAuth(
    async (userContext: UserContext) => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.SUPERADMIN) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can view user statistics.",
            },
            statusCode: 403,
          };
        }

        const stats = await UserRepository.getUserStats();

        return {
          success: true,
          data: stats,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting user stats:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve user statistics",
          },
          statusCode: 500,
        };
      }
    }
  );
}
