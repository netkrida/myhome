/**
 * Shift API
 * Tier 2: Application Service Layer for Shift Management
 */

import { ShiftRepository } from "@/server/repositories/adminkos/shift.repository";
import { ShiftService } from "@/server/services/shift.service";
import type { Result } from "@/server/types/result";
import { internalError, badRequest, conflict } from "@/server/types/result";
import type {
  ShiftAssignmentQuery,
  ShiftAssignmentResponse,
  ShiftAssignmentItem,
  CreateShiftAssignmentDTO,
  UpdateShiftAssignmentDTO,
  WeeklyShiftCalendar,
  BulkShiftAssignmentDTO,
  BulkShiftAssignmentResult,
  ShiftConflict,
} from "@/server/types/receptionist";

export class ShiftAPI {
  /**
   * Get shift assignments list
   */
  static async getList(
    query: ShiftAssignmentQuery,
    ownerId: string
  ): Promise<Result<ShiftAssignmentResponse>> {
    try {
      return await ShiftRepository.getList(query, ownerId);
    } catch (error) {
      console.error("Error in ShiftAPI.getList:", error);
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
      return await ShiftRepository.getById(id, ownerId);
    } catch (error) {
      console.error("Error in ShiftAPI.getById:", error);
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
      // Validate data
      const validation = ShiftService.validateShiftAssignment(data);
      if (!validation.isValid) {
        return badRequest(validation.errors.join(", "));
      }

      // Set default time range if not provided
      if (!data.startTime || !data.endTime) {
        const timeRange = ShiftService.getDefaultTimeRange(data.shiftType);
        data.startTime = data.startTime || timeRange.start;
        data.endTime = data.endTime || timeRange.end;
      }

      // Check for conflicts
      const hasConflict = await ShiftRepository.checkConflict(
        data.receptionistId,
        data.date,
        data.shiftType
      );

      if (hasConflict) {
        return conflict("Receptionist already has a shift assigned for this date and shift type");
      }

      return await ShiftRepository.create(data, createdBy);
    } catch (error) {
      console.error("Error in ShiftAPI.create:", error);
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
      // Validate time format if provided
      if (data.startTime && !ShiftService.isValidTimeFormat(data.startTime)) {
        return badRequest("Invalid start time format (use HH:mm)");
      }

      if (data.endTime && !ShiftService.isValidTimeFormat(data.endTime)) {
        return badRequest("Invalid end time format (use HH:mm)");
      }

      return await ShiftRepository.update(id, data, ownerId);
    } catch (error) {
      console.error("Error in ShiftAPI.update:", error);
      return internalError("Failed to update shift assignment");
    }
  }

  /**
   * Delete shift assignment
   */
  static async delete(id: string, ownerId: string): Promise<Result<void>> {
    try {
      return await ShiftRepository.delete(id, ownerId);
    } catch (error) {
      console.error("Error in ShiftAPI.delete:", error);
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
      return await ShiftRepository.getWeeklyCalendar(propertyId, weekStart, ownerId);
    } catch (error) {
      console.error("Error in ShiftAPI.getWeeklyCalendar:", error);
      return internalError("Failed to get weekly calendar");
    }
  }

  /**
   * Bulk create shift assignments
   */
  static async bulkCreate(
    data: BulkShiftAssignmentDTO,
    createdBy: string
  ): Promise<Result<BulkShiftAssignmentResult>> {
    try {
      const result: BulkShiftAssignmentResult = {
        success: 0,
        failed: 0,
        conflicts: [],
        createdAssignments: [],
      };

      for (const assignment of data.assignments) {
        // Validate
        const validation = ShiftService.validateShiftAssignment(assignment);
        if (!validation.isValid) {
          result.failed++;
          continue;
        }

        // Set default time range
        if (!assignment.startTime || !assignment.endTime) {
          const timeRange = ShiftService.getDefaultTimeRange(assignment.shiftType);
          assignment.startTime = assignment.startTime || timeRange.start;
          assignment.endTime = assignment.endTime || timeRange.end;
        }

        // Check conflict
        const hasConflict = await ShiftRepository.checkConflict(
          assignment.receptionistId,
          assignment.date,
          assignment.shiftType
        );

        if (hasConflict) {
          if (data.skipConflicts) {
            result.failed++;
            continue;
          } else {
            // Get existing shift for conflict details
            const existingResult = await ShiftRepository.getList(
              {
                receptionistId: assignment.receptionistId,
                dateFrom: assignment.date,
                dateTo: assignment.date,
                shiftType: assignment.shiftType,
              },
              createdBy // Using createdBy as ownerId for now
            );

            // fix(api): add guards for existingResult.data
            if (existingResult.success && existingResult.data && existingResult.data.shifts.length > 0) {
              const existing = existingResult.data.shifts[0];
              if (existing) {
                result.conflicts.push({
                  receptionistId: assignment.receptionistId,
                  receptionistName: existing.receptionistName,
                  date: assignment.date,
                  existingShift: {
                    id: existing.id,
                    shiftType: existing.shiftType,
                    startTime: existing.startTime,
                    endTime: existing.endTime,
                  },
                  conflictingShift: {
                    shiftType: assignment.shiftType,
                    startTime: assignment.startTime!,
                    endTime: assignment.endTime!,
                  },
                  message: ShiftService.generateConflictMessage({
                    receptionistId: assignment.receptionistId,
                    receptionistName: existing.receptionistName,
                    date: assignment.date,
                    existingShift: {
                      id: existing.id,
                      shiftType: existing.shiftType,
                      startTime: existing.startTime,
                      endTime: existing.endTime,
                    },
                    conflictingShift: {
                      shiftType: assignment.shiftType,
                      startTime: assignment.startTime!,
                      endTime: assignment.endTime!,
                    },
                    message: "",
                  }),
                });
              }
            }
            result.failed++;
            continue;
          }
        }

        // Create assignment
        const createResult = await ShiftRepository.create(assignment, createdBy);
        if (createResult.success && createResult.data) {
          result.success++;
          result.createdAssignments.push(createResult.data);
        } else {
          result.failed++;
        }
      }

      // fix(api): use ok() helper with statusCode
      return {
        success: true,
        data: result,
        statusCode: 200,
      };
    } catch (error) {
      console.error("Error in ShiftAPI.bulkCreate:", error);
      return internalError("Failed to bulk create shift assignments");
    }
  }
}

