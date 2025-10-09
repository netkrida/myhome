/**
 * Receptionist and Shift Management Types
 * Types for receptionist management and shift scheduling
 */

import { Shift } from "@prisma/client";

// Shift Type (re-export from Prisma)
export { Shift } from "@prisma/client";

// Shift labels in Indonesian
export const ShiftLabels: Record<Shift, string> = {
  MORNING: "Pagi (07:00 - 15:00)",
  EVENING: "Siang (15:00 - 23:00)",
  NIGHT: "Malam (23:00 - 07:00)",
};

// Shift time ranges
export const ShiftTimeRanges: Record<Shift, { start: string; end: string }> = {
  MORNING: { start: "07:00", end: "15:00" },
  EVENING: { start: "15:00", end: "23:00" },
  NIGHT: { start: "23:00", end: "07:00" },
};

// Shift colors for UI
export const ShiftColors: Record<Shift, string> = {
  MORNING: "emerald", // Green
  EVENING: "blue",    // Blue
  NIGHT: "purple",    // Purple
};

/**
 * Receptionist DTOs
 */

// Receptionist list item (for table display)
export interface ReceptionistListItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  propertyId?: string;
  propertyName?: string;
  defaultShift?: Shift;
  isActive: boolean;
  startDate?: Date;
  currentShift?: {
    shiftType: Shift;
    date: Date;
    startTime: string;
    endTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Receptionist detail (for detail view)
export interface ReceptionistDetail extends ReceptionistListItem {
  image?: string;
  emailVerified?: Date;
  propertyAddress?: string;
  recentShifts: ShiftAssignmentItem[];
  totalHoursThisMonth: number;
  totalShiftsThisMonth: number;
}

// Create receptionist DTO
export interface CreateReceptionistDTO {
  name: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  password?: string; // Optional, will be auto-generated if not provided
  propertyId?: string;
  defaultShift?: Shift;
  startDate?: Date;
  sendInvitation?: boolean; // Send email invitation
}

// Update receptionist DTO
export interface UpdateReceptionistDTO {
  name?: string;
  phoneNumber?: string;
  gender?: string;
  propertyId?: string;
  defaultShift?: Shift;
  startDate?: Date;
  isActive?: boolean;
}

// Receptionist list query
export interface ReceptionistListQuery {
  page?: number;
  limit?: number;
  search?: string; // Search by name or email
  propertyId?: string;
  shift?: Shift;
  status?: "active" | "inactive";
  sortBy?: "name" | "email" | "createdAt" | "startDate";
  sortOrder?: "asc" | "desc";
}

// Receptionist list response
export interface ReceptionistListResponse {
  receptionists: ReceptionistListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Shift Assignment DTOs
 */

// Shift assignment item
export interface ShiftAssignmentItem {
  id: string;
  receptionistId: string;
  receptionistName: string;
  propertyId: string;
  propertyName: string;
  shiftType: Shift;
  date: Date;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

// Create shift assignment DTO
export interface CreateShiftAssignmentDTO {
  receptionistId: string;
  propertyId: string;
  shiftType: Shift;
  date: Date;
  startTime?: string; // Optional, will use default from ShiftTimeRanges
  endTime?: string;   // Optional, will use default from ShiftTimeRanges
  notes?: string;
}

// Update shift assignment DTO
export interface UpdateShiftAssignmentDTO {
  shiftType?: Shift;
  date?: Date;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

// Shift assignment query
export interface ShiftAssignmentQuery {
  receptionistId?: string;
  propertyId?: string;
  shiftType?: Shift;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// Shift assignment response
export interface ShiftAssignmentResponse {
  shifts: ShiftAssignmentItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Calendar view data (for weekly/monthly view)
export interface ShiftCalendarData {
  date: Date;
  shifts: {
    [key in Shift]?: {
      id: string;
      receptionistId: string;
      receptionistName: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }[];
  };
}

// Weekly calendar view
export interface WeeklyShiftCalendar {
  weekStart: Date;
  weekEnd: Date;
  days: ShiftCalendarData[];
}

// Shift statistics
export interface ShiftStatistics {
  receptionistId: string;
  receptionistName: string;
  totalShifts: number;
  totalHours: number;
  shiftBreakdown: {
    [key in Shift]: number;
  };
  period: {
    from: Date;
    to: Date;
  };
}

// Shift conflict detection
export interface ShiftConflict {
  receptionistId: string;
  receptionistName: string;
  date: Date;
  existingShift: {
    id: string;
    shiftType: Shift;
    startTime: string;
    endTime: string;
  };
  conflictingShift: {
    shiftType: Shift;
    startTime: string;
    endTime: string;
  };
  message: string;
}

// Bulk shift assignment
export interface BulkShiftAssignmentDTO {
  assignments: CreateShiftAssignmentDTO[];
  skipConflicts?: boolean; // Skip assignments that have conflicts
}

export interface BulkShiftAssignmentResult {
  success: number;
  failed: number;
  conflicts: ShiftConflict[];
  createdAssignments: ShiftAssignmentItem[];
}

