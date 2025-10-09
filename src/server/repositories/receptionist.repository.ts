/**
 * Receptionist Repository
 * Tier 3: Data Access Layer for Receptionist Management
 */

import { prisma } from "@/server/db";
import { Shift } from "@prisma/client";
import type { Result } from "@/server/types/result";
import { ok, internalError } from "@/server/types/result";
import type {
  ReceptionistListItem,
  ReceptionistDetail,
  CreateReceptionistDTO,
  UpdateReceptionistDTO,
  ReceptionistListQuery,
  ReceptionistListResponse,
} from "@/server/types/receptionist";

export class ReceptionistRepository {
  /**
   * Get list of receptionists with pagination and filters
   */
  static async getList(
    query: ReceptionistListQuery,
    ownerId: string
  ): Promise<Result<ReceptionistListResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        propertyId,
        shift,
        status,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        user: {
          role: "RECEPTIONIST",
        },
      };

      // Filter by property (only receptionists assigned to AdminKos's properties)
      if (propertyId) {
        where.propertyId = propertyId;
        where.property = {
          ownerId,
        };
      } else {
        where.property = {
          ownerId,
        };
      }

      // Filter by shift
      if (shift) {
        where.defaultShift = shift;
      }

      // Filter by status
      if (status) {
        where.user = {
          ...where.user,
          isActive: status === "active",
        };
      }

      // Search by name or email
      if (search) {
        where.user = {
          ...where.user,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      // Get total count
      const total = await prisma.receptionistProfile.count({ where });

      // Get receptionists
      const receptionists = await prisma.receptionistProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
            },
          },
          shiftAssignments: {
            where: {
              date: {
                gte: new Date(),
              },
            },
            orderBy: {
              date: "asc",
            },
            take: 1,
            select: {
              shiftType: true,
              date: true,
              startTime: true,
              endTime: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: sortBy === "name" || sortBy === "email" 
          ? { user: { [sortBy]: sortOrder } }
          : { [sortBy]: sortOrder },
      });

      // Map to DTO
      const items: ReceptionistListItem[] = receptionists.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: r.user.name || "",
        email: r.user.email || "",
        phoneNumber: r.user.phoneNumber || undefined,
        gender: r.gender || undefined,
        propertyId: r.propertyId || undefined,
        propertyName: r.property?.name || undefined,
        defaultShift: r.defaultShift || undefined,
        isActive: r.user.isActive,
        startDate: r.startDate || undefined,
        currentShift: r.shiftAssignments[0]
          ? {
              shiftType: r.shiftAssignments[0].shiftType,
              date: r.shiftAssignments[0].date,
              startTime: r.shiftAssignments[0].startTime,
              endTime: r.shiftAssignments[0].endTime,
            }
          : undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      const totalPages = Math.ceil(total / limit);

      return ok({
        receptionists: items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error in ReceptionistRepository.getList:", error);
      return internalError("Failed to get receptionists list");
    }
  }

  /**
   * Get receptionist by ID
   */
  static async getById(
    id: string,
    ownerId: string
  ): Promise<Result<ReceptionistDetail>> {
    try {
      const receptionist = await prisma.receptionistProfile.findFirst({
        where: {
          id,
          property: {
            ownerId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              image: true,
              emailVerified: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              fullAddress: true,
            },
          },
          shiftAssignments: {
            where: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
            orderBy: {
              date: "desc",
            },
            include: {
              property: {
                select: {
                  name: true,
                },
              },
              creator: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!receptionist) {
        return internalError("Receptionist not found");
      }

      // Calculate total hours this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyShifts = await prisma.shiftAssignment.count({
        where: {
          receptionistId: receptionist.id,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      // Assuming 8 hours per shift
      const totalHoursThisMonth = monthlyShifts * 8;

      const detail: ReceptionistDetail = {
        id: receptionist.id,
        userId: receptionist.userId,
        name: receptionist.user.name || "",
        email: receptionist.user.email || "",
        phoneNumber: receptionist.user.phoneNumber || undefined,
        gender: receptionist.gender || undefined,
        propertyId: receptionist.propertyId || undefined,
        propertyName: receptionist.property?.name || undefined,
        propertyAddress: receptionist.property?.fullAddress || undefined,
        defaultShift: receptionist.defaultShift || undefined,
        isActive: receptionist.user.isActive,
        startDate: receptionist.startDate || undefined,
        image: receptionist.user.image || undefined,
        emailVerified: receptionist.user.emailVerified || undefined,
        currentShift: undefined,
        recentShifts: receptionist.shiftAssignments.map((s) => ({
          id: s.id,
          receptionistId: s.receptionistId,
          receptionistName: receptionist.user.name || "",
          propertyId: s.propertyId,
          propertyName: s.property.name,
          shiftType: s.shiftType,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          notes: s.notes || undefined,
          createdAt: s.createdAt,
          createdBy: s.createdBy,
          createdByName: s.creator.name || "",
        })),
        totalHoursThisMonth,
        totalShiftsThisMonth: monthlyShifts,
        createdAt: receptionist.createdAt,
        updatedAt: receptionist.updatedAt,
      };

      return ok(detail);
    } catch (error) {
      console.error("Error in ReceptionistRepository.getById:", error);
      return internalError("Failed to get receptionist details");
    }
  }

  /**
   * Create receptionist profile (user must already exist)
   */
  static async create(
    userId: string,
    data: Partial<CreateReceptionistDTO>
  ): Promise<Result<{ id: string }>> {
    try {
      const profile = await prisma.receptionistProfile.create({
        data: {
          userId,
          propertyId: data.propertyId,
          defaultShift: data.defaultShift,
          gender: data.gender,
          startDate: data.startDate,
        },
      });

      return ok({ id: profile.id });
    } catch (error) {
      console.error("Error in ReceptionistRepository.create:", error);
      return internalError("Failed to create receptionist profile");
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
      // Verify ownership
      const existing = await prisma.receptionistProfile.findFirst({
        where: {
          id,
          property: {
            ownerId,
          },
        },
      });

      if (!existing) {
        return internalError("Receptionist not found");
      }

      // Update profile
      await prisma.receptionistProfile.update({
        where: { id },
        data: {
          propertyId: data.propertyId,
          defaultShift: data.defaultShift,
          gender: data.gender,
          startDate: data.startDate,
        },
      });

      // Update user if needed
      if (data.name || data.phoneNumber || data.isActive !== undefined) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: {
            name: data.name,
            phoneNumber: data.phoneNumber,
            isActive: data.isActive,
          },
        });
      }

      return ok(undefined);
    } catch (error) {
      console.error("Error in ReceptionistRepository.update:", error);
      return internalError("Failed to update receptionist");
    }
  }

  /**
   * Delete receptionist (soft delete by deactivating user)
   */
  static async delete(id: string, ownerId: string): Promise<Result<void>> {
    try {
      const receptionist = await prisma.receptionistProfile.findFirst({
        where: {
          id,
          property: {
            ownerId,
          },
        },
      });

      if (!receptionist) {
        return internalError("Receptionist not found");
      }

      // Soft delete by deactivating user
      await prisma.user.update({
        where: { id: receptionist.userId },
        data: { isActive: false },
      });

      return ok(undefined);
    } catch (error) {
      console.error("Error in ReceptionistRepository.delete:", error);
      return internalError("Failed to delete receptionist");
    }
  }
}

