/**
 * Shift Assignment Repository
 * Tier 3: Data Access Layer for Shift Management
 */

import { prisma } from "@/server/db";
import { Shift } from "@prisma/client";
import type { Result } from "@/server/types/result";
import { ok, internalError, notFound } from "@/server/types/result";
import type {
  ShiftAssignmentItem,
  CreateShiftAssignmentDTO,
  UpdateShiftAssignmentDTO,
  ShiftAssignmentQuery,
  ShiftAssignmentResponse,
  WeeklyShiftCalendar,
  ShiftCalendarData,
  ShiftStatistics,
} from "@/server/types/receptionist";

export class ShiftRepository {
  /**
   * Get shift assignments with filters
   */
  static async getList(
    query: ShiftAssignmentQuery,
    ownerId: string
  ): Promise<Result<ShiftAssignmentResponse>> {
    try {
      const {
        receptionistId,
        propertyId,
        shiftType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        property: {
          ownerId,
        },
      };

      if (receptionistId) where.receptionistId = receptionistId;
      if (propertyId) where.propertyId = propertyId;
      if (shiftType) where.shiftType = shiftType;

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) where.date.lte = dateTo;
      }

      // Get total count
      const total = await prisma.shiftAssignment.count({ where });

      // Get shifts
      const shifts = await prisma.shiftAssignment.findMany({
        where,
        include: {
          receptionist: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
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
        skip,
        take: limit,
        orderBy: [{ date: "desc" }, { shiftType: "asc" }],
      });

      const items: ShiftAssignmentItem[] = shifts.map((s) => ({
        id: s.id,
        receptionistId: s.receptionistId,
        receptionistName: s.receptionist.user.name || "",
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
      }));

      const totalPages = Math.ceil(total / limit);

      return ok({
        shifts: items,
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
      console.error("Error in ShiftRepository.getList:", error);
      return internalError("Failed to get shift assignments");
    }
  }

  /**
   * Get shift assignment by ID
   */
  static async getById(
    id: string,
    ownerId: string
  ): Promise<Result<ShiftAssignmentItem>> {
    try {
      const shift = await prisma.shiftAssignment.findFirst({
        where: {
          id,
          property: {
            ownerId,
          },
        },
        include: {
          receptionist: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
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
      });

      if (!shift) {
        return notFound("Shift assignment");
      }

      const item: ShiftAssignmentItem = {
        id: shift.id,
        receptionistId: shift.receptionistId,
        receptionistName: shift.receptionist.user.name || "",
        propertyId: shift.propertyId,
        propertyName: shift.property.name,
        shiftType: shift.shiftType,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        notes: shift.notes || undefined,
        createdAt: shift.createdAt,
        createdBy: shift.createdBy,
        createdByName: shift.creator.name || "",
      };

      return ok(item);
    } catch (error) {
      console.error("Error in ShiftRepository.getById:", error);
      return internalError("Failed to get shift assignment");
    }
  }

  /**
   * Create shift assignment
   */
  static async create(
    data: CreateShiftAssignmentDTO,
    createdBy: string
  ): Promise<Result<ShiftAssignmentItem>> {
    try {
      const shift = await prisma.shiftAssignment.create({
        data: {
          receptionistId: data.receptionistId,
          propertyId: data.propertyId,
          shiftType: data.shiftType,
          date: data.date,
          startTime: data.startTime || "00:00",
          endTime: data.endTime || "00:00",
          notes: data.notes,
          createdBy,
        },
        include: {
          receptionist: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
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
      });

      const item: ShiftAssignmentItem = {
        id: shift.id,
        receptionistId: shift.receptionistId,
        receptionistName: shift.receptionist.user.name || "",
        propertyId: shift.propertyId,
        propertyName: shift.property.name,
        shiftType: shift.shiftType,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        notes: shift.notes || undefined,
        createdAt: shift.createdAt,
        createdBy: shift.createdBy,
        createdByName: shift.creator.name || "",
      };

      return ok(item);
    } catch (error: any) {
      console.error("Error in ShiftRepository.create:", error);

      // Check for unique constraint violation
      if (error.code === "P2002") {
        return internalError("Shift assignment already exists for this receptionist on this date");
      }

      return internalError("Failed to create shift assignment");
    }
  }

  /**
   * Update shift assignment
   */
  static async update(
    id: string,
    data: UpdateShiftAssignmentDTO,
    ownerId: string
  ): Promise<Result<void>> {
    try {
      // Verify ownership
      const existing = await prisma.shiftAssignment.findFirst({
        where: {
          id,
          property: {
            ownerId,
          },
        },
      });

      if (!existing) {
        return notFound("Shift assignment");
      }

      await prisma.shiftAssignment.update({
        where: { id },
        data: {
          shiftType: data.shiftType,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
        },
      });

      return ok(undefined);
    } catch (error) {
      console.error("Error in ShiftRepository.update:", error);
      return internalError("Failed to update shift assignment");
    }
  }

  /**
   * Delete shift assignment
   */
  static async delete(id: string, ownerId: string): Promise<Result<void>> {
    try {
      const shift = await prisma.shiftAssignment.findFirst({
        where: {
          id,
          property: {
            ownerId,
          },
        },
      });

      if (!shift) {
        return notFound("Shift assignment");
      }

      await prisma.shiftAssignment.delete({
        where: { id },
      });

      return ok(undefined);
    } catch (error) {
      console.error("Error in ShiftRepository.delete:", error);
      return internalError("Failed to delete shift assignment");
    }
  }

  /**
   * Get weekly calendar view
   */
  static async getWeeklyCalendar(
    propertyId: string,
    weekStart: Date,
    ownerId: string
  ): Promise<Result<WeeklyShiftCalendar>> {
    try {
      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId,
        },
      });

      if (!property) {
        return notFound("Property");
      }

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Get all shifts for the week
      const shifts = await prisma.shiftAssignment.findMany({
        where: {
          propertyId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          receptionist: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ date: "asc" }, { shiftType: "asc" }],
      });

      // Group by date
      const days: ShiftCalendarData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);

        const dayShifts = shifts.filter(
          (s) => s.date.toDateString() === date.toDateString()
        );

        const shiftsByType: ShiftCalendarData["shifts"] = {};

        dayShifts.forEach((s) => {
          if (!shiftsByType[s.shiftType]) {
            shiftsByType[s.shiftType] = [];
          }

          shiftsByType[s.shiftType]!.push({
            id: s.id,
            receptionistId: s.receptionistId,
            receptionistName: s.receptionist.user.name || "",
            startTime: s.startTime,
            endTime: s.endTime,
            notes: s.notes || undefined,
          });
        });

        days.push({
          date,
          shifts: shiftsByType,
        });
      }

      return ok({
        weekStart,
        weekEnd,
        days,
      });
    } catch (error) {
      console.error("Error in ShiftRepository.getWeeklyCalendar:", error);
      return internalError("Failed to get weekly calendar");
    }
  }

  /**
   * Check for shift conflicts
   */
  static async checkConflict(
    receptionistId: string,
    date: Date,
    shiftType: Shift,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const where: any = {
        receptionistId,
        date,
        shiftType,
      };

      if (excludeId) {
        where.id = { not: excludeId };
      }

      const count = await prisma.shiftAssignment.count({ where });
      return count > 0;
    } catch (error) {
      console.error("Error in ShiftRepository.checkConflict:", error);
      return false;
    }
  }
}

