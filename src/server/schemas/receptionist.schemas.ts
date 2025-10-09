/**
 * Receptionist Management Validation Schemas
 * Zod schemas for validating receptionist and shift management requests
 */

import { z } from "zod";
import { Shift } from "@prisma/client";

/**
 * Receptionist Schemas
 */

export const createReceptionistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phoneNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  propertyId: z.string().cuid("Invalid property ID").optional(),
  defaultShift: z.nativeEnum(Shift).optional(),
  startDate: z.coerce.date().optional(),
  sendInvitation: z.boolean().default(false),
});

export type CreateReceptionistInput = z.infer<typeof createReceptionistSchema>;

export const updateReceptionistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phoneNumber: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  propertyId: z.string().cuid("Invalid property ID").optional(),
  defaultShift: z.nativeEnum(Shift).optional(),
  startDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateReceptionistInput = z.infer<typeof updateReceptionistSchema>;

export const receptionistListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  propertyId: z.string().cuid().optional(),
  shift: z.nativeEnum(Shift).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt", "startDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ReceptionistListQueryInput = z.infer<typeof receptionistListQuerySchema>;

/**
 * Shift Assignment Schemas
 */

export const createShiftAssignmentSchema = z.object({
  receptionistId: z.string().cuid("Invalid receptionist ID"),
  propertyId: z.string().cuid("Invalid property ID"),
  shiftType: z.nativeEnum(Shift),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type CreateShiftAssignmentInput = z.infer<typeof createShiftAssignmentSchema>;

export const updateShiftAssignmentSchema = z.object({
  shiftType: z.nativeEnum(Shift).optional(),
  date: z.coerce.date().optional(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type UpdateShiftAssignmentInput = z.infer<typeof updateShiftAssignmentSchema>;

export const shiftAssignmentQuerySchema = z.object({
  receptionistId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  shiftType: z.nativeEnum(Shift).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export type ShiftAssignmentQueryInput = z.infer<typeof shiftAssignmentQuerySchema>;

export const bulkShiftAssignmentSchema = z.object({
  assignments: z.array(createShiftAssignmentSchema).min(1, "At least one assignment required"),
  skipConflicts: z.boolean().default(false),
});

export type BulkShiftAssignmentInput = z.infer<typeof bulkShiftAssignmentSchema>;

/**
 * Weekly calendar query schema
 */
export const weeklyCalendarQuerySchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  weekStart: z.coerce.date(),
});

export type WeeklyCalendarQueryInput = z.infer<typeof weeklyCalendarQuerySchema>;

/**
 * Shift statistics query schema
 */
export const shiftStatisticsQuerySchema = z.object({
  receptionistId: z.string().cuid("Invalid receptionist ID"),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
});

export type ShiftStatisticsQueryInput = z.infer<typeof shiftStatisticsQuerySchema>;

