/**
 * Receptionist API
 * Tier 2: Application Service Layer for Receptionist Management
 */

import { UserRole } from "@/server/types/rbac";
import { UserRepository } from "@/server/repositories/user.repository";
import { ReceptionistRepository } from "@/server/repositories/adminkos/receptionist.repository";
import { ReceptionistService } from "@/server/services/receptionist.service";
import type { Result } from "@/server/types/result";
import { internalError, conflict, badRequest, ok } from "@/server/types/result";
import type {
  ReceptionistListQuery,
  ReceptionistListResponse,
  ReceptionistDetail,
  CreateReceptionistDTO,
  UpdateReceptionistDTO,
} from "@/server/types/receptionist";
import bcrypt from "bcryptjs";

export class ReceptionistAPI {
  /**
   * Get list of receptionists for AdminKos
   */
  static async getList(
    query: ReceptionistListQuery,
    ownerId: string
  ): Promise<Result<ReceptionistListResponse>> {
    try {
      return await ReceptionistRepository.getList(query, ownerId);
    } catch (error) {
      console.error("Error in ReceptionistAPI.getList:", error);
      return internalError("Failed to get receptionists");
    }
  }

  /**
   * Get receptionist details
   */
  static async getById(
    id: string,
    ownerId: string
  ): Promise<Result<ReceptionistDetail>> {
    try {
      return await ReceptionistRepository.getById(id, ownerId);
    } catch (error) {
      console.error("Error in ReceptionistAPI.getById:", error);
      return internalError("Failed to get receptionist details");
    }
  }

  /**
   * Create new receptionist
   */
  static async create(
    data: CreateReceptionistDTO,
    ownerId: string
  ): Promise<Result<{ id: string; userId: string; password?: string }>> {
    try {
      // Validate data
      const validation = ReceptionistService.validateCreate(data);
      if (!validation.isValid) {
        return badRequest(validation.errors.join(", "));
      }

      // Check if email already exists
      const existingUser = await UserRepository.getByEmail(data.email);
      if (existingUser.success && existingUser.data) {
        return conflict("Email already registered");
      }

      // Generate password if not provided
      const password = data.password || ReceptionistService.generatePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Sanitize phone number if provided
      const phoneNumber = data.phoneNumber
        ? ReceptionistService.sanitizePhoneNumber(data.phoneNumber)
        : undefined;

      // Create user
      const userResult = await UserRepository.create({
        email: data.email,
        name: ReceptionistService.formatName(data.name),
        role: UserRole.RECEPTIONIST,
        password: hashedPassword,
        phoneNumber,
        isActive: true,
      });

      // fix: discriminated union Result type - guard before accessing error
      if (!userResult.success) {
        return internalError(userResult.error.message || "Failed to create user");
      }

      const userId = userResult.data.id;

      // Create receptionist profile
      const profileResult = await ReceptionistRepository.create(userId, {
        propertyId: data.propertyId,
        defaultShift: data.defaultShift,
        gender: data.gender,
        startDate: data.startDate,
      });

      if (!profileResult.success) {
        // Rollback: delete user
        await UserRepository.delete(userId);
        return internalError(profileResult.error.message || "Failed to create receptionist profile");
      }

      // TODO: Send invitation email if requested
      // if (data.sendInvitation) {
      //   const emailContent = ReceptionistService.generateInvitationEmail(
      //     data.name,
      //     data.email,
      //     password,
      //     propertyName
      //   );
      //   await EmailService.send(data.email, emailContent);
      // }

      return ok({
        id: profileResult.data.id,
        userId,
        password: data.sendInvitation ? undefined : password, // Only return password if not sending email
      });
    } catch (error) {
      console.error("Error in ReceptionistAPI.create:", error);
      return internalError("Failed to create receptionist");
    }
  }

  /**
   * Update receptionist
   */
  static async update(
    id: string,
    data: UpdateReceptionistDTO,
    ownerId: string
  ): Promise<Result<void>> {
    try {
      // Validate data
      const validation = ReceptionistService.validateUpdate(data);
      if (!validation.isValid) {
        return badRequest(validation.errors.join(", "));
      }

      // Sanitize phone number if provided
      if (data.phoneNumber) {
        data.phoneNumber = ReceptionistService.sanitizePhoneNumber(data.phoneNumber);
      }

      // Format name if provided
      if (data.name) {
        data.name = ReceptionistService.formatName(data.name);
      }

      return await ReceptionistRepository.update(id, data, ownerId);
    } catch (error) {
      console.error("Error in ReceptionistAPI.update:", error);
      return internalError("Failed to update receptionist");
    }
  }

  /**
   * Delete receptionist (soft delete)
   */
  static async delete(id: string, ownerId: string): Promise<Result<void>> {
    try {
      return await ReceptionistRepository.delete(id, ownerId);
    } catch (error) {
      console.error("Error in ReceptionistAPI.delete:", error);
      return internalError("Failed to delete receptionist");
    }
  }

  /**
   * Toggle receptionist active status
   */
  static async toggleStatus(
    id: string,
    isActive: boolean,
    ownerId: string
  ): Promise<Result<void>> {
    try {
      return await ReceptionistRepository.update(
        id,
        { isActive },
        ownerId
      );
    } catch (error) {
      console.error("Error in ReceptionistAPI.toggleStatus:", error);
      return internalError("Failed to toggle receptionist status");
    }
  }
}

