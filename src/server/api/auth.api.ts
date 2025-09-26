import { UserRepository } from "../repositories/user.repository";
import { withAuth } from "../lib/auth";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import { ErrorCode } from "../types/result";
import bcrypt from "bcryptjs";

/**
 * Tier-2: Authentication Application Services
 * Orchestrates authentication-related use cases
 */
export class AuthAPI {
  /**
   * Authenticate user with credentials
   */
  static async authenticateUser(
    email: string,
    password: string
  ): Promise<Result<{ id: string; email: string; name?: string; role: string }>> {
    try {
      console.log("🔍 AuthAPI - Authenticating user:", email);

      // Find user by email
      const user = await UserRepository.findByEmail(email);

      console.log("🔍 AuthAPI - User lookup result:", {
        found: !!user,
        isActive: user?.isActive,
        hasPassword: !!user?.password,
        role: user?.role,
      });

      if (!user) {
        console.log("❌ AuthAPI - User not found");
        return {
          success: false,
          error: {
            code: ErrorCode.INVALID_CREDENTIALS,
            message: "Invalid credentials",
          },
          statusCode: 401,
        };
      }

      if (!user.isActive) {
        console.log("❌ AuthAPI - User is inactive");
        return {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: "Account is inactive",
          },
          statusCode: 401,
        };
      }

      // For OAuth users without password, deny credential login
      if (!user.password) {
        console.log("❌ AuthAPI - User has no password (OAuth user)");
        return {
          success: false,
          error: {
            code: ErrorCode.INVALID_CREDENTIALS,
            message: "Please use OAuth login",
          },
          statusCode: 401,
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      console.log("🔍 AuthAPI - Password verification:", {
        isValid: isValidPassword,
      });

      if (!isValidPassword) {
        console.log("❌ AuthAPI - Invalid password");
        return {
          success: false,
          error: {
            code: ErrorCode.INVALID_CREDENTIALS,
            message: "Invalid credentials",
          },
          statusCode: 401,
        };
      }

      // Return user data for session
      const userData = {
        id: user.id,
        email: user.email!,
        name: user.name || undefined,
        role: user.role as string,
      };

      console.log("✅ AuthAPI - Authentication successful:", {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });

      return {
        success: true,
        data: userData,
        statusCode: 200,
      };
    } catch (error) {
      console.error("❌ AuthAPI - Authentication error:", error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: "Authentication failed",
        },
        statusCode: 500,
      };
    }
  }

  /**
   * Get user profile data
   */
  static getUserProfile = withAuth(
    async (userContext: UserContext) => {
      try {
        const user = await UserRepository.findById(userContext.id, true) as any;
        
        if (!user) {
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found",
            },
            statusCode: 404,
          } as Result<never>;
        }

        return {
          success: true,
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            // Include role-specific profile data
            adminKosProfile: user.adminKosProfile || undefined,
            receptionistProfile: user.receptionistProfile || undefined,
            customerProfile: user.customerProfile || undefined,
          },
        };
      } catch (error) {
        console.error("Error getting user profile:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to get user profile",
          },
          statusCode: 500,
        } as Result<never>;
      }
    }
  );

  /**
   * Update user profile
   */
  static updateUserProfile = withAuth(
    async (
      userContext: UserContext,
      updateData: {
        name?: string;
        image?: string;
        // Role-specific profile updates can be added here
      }
    ) => {
      try {
        const updatedUser = await UserRepository.update(userContext.id, updateData);
        
        return {
          success: true,
          data: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            image: updatedUser.image,
            updatedAt: updatedUser.updatedAt,
          },
        };
      } catch (error) {
        console.error("Error updating user profile:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update user profile",
          },
          statusCode: 500,
        } as Result<never>;
      }
    }
  );

  /**
   * Change user password
   */
  static changePassword = withAuth(
    async (
      userContext: UserContext,
      currentPassword: string,
      newPassword: string
    ) => {
      try {
        const user = await UserRepository.findById(userContext.id);
        
        if (!user || !user.password) {
          return {
            success: false,
            error: {
              code: "OPERATION_NOT_ALLOWED",
              message: "Cannot change password for OAuth users",
            },
            statusCode: 400,
          } as Result<never>;
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
          return {
            success: false,
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Current password is incorrect",
            },
            statusCode: 400,
          } as Result<never>;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Update password
        await UserRepository.updatePassword(userContext.id, hashedPassword);

        return {
          success: true,
          data: { message: "Password updated successfully" },
        };
      } catch (error) {
        console.error("Error changing password:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to change password",
          },
          statusCode: 500,
        } as Result<never>;
      }
    }
  );
}
