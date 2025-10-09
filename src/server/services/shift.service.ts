/**
 * Shift Service
 * Tier 3: Business Logic for Shift Management
 */

import { Shift } from "@prisma/client";
import { ShiftTimeRanges } from "@/server/types/receptionist";
import type {
  CreateShiftAssignmentDTO,
  ShiftConflict,
} from "@/server/types/receptionist";

export class ShiftService {
  /**
   * Get default time range for shift type
   */
  static getDefaultTimeRange(shiftType: Shift): { start: string; end: string } {
    return ShiftTimeRanges[shiftType];
  }

  /**
   * Validate shift assignment
   */
  static validateShiftAssignment(data: CreateShiftAssignmentDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const assignmentDate = new Date(data.date);
    assignmentDate.setHours(0, 0, 0, 0);

    if (assignmentDate < today) {
      errors.push("Cannot assign shift for past dates");
    }

    // Validate time format if provided
    if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
      errors.push("Invalid start time format (use HH:mm)");
    }

    if (data.endTime && !this.isValidTimeFormat(data.endTime)) {
      errors.push("Invalid end time format (use HH:mm)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if time format is valid (HH:mm)
   */
  static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Calculate shift duration in hours
   * fix(services): add time-part guards before math
   */
  static calculateShiftDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    if (
      endHour == null || endMin == null ||
      startHour == null || startMin == null
    ) {
      return 0; // Invalid time
    }

    let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Handle overnight shifts
    if (minutes < 0) {
      minutes += 24 * 60;
    }

    return minutes / 60;
  }

  /**
   * Check if two time ranges overlap
   * fix(services): add time-part guards before math
   */
  static doTimeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [s1h, s1m] = start1.split(":").map(Number);
    const [e1h, e1m] = end1.split(":").map(Number);
    const [s2h, s2m] = start2.split(":").map(Number);
    const [e2h, e2m] = end2.split(":").map(Number);

    if (
      s1h == null || s1m == null ||
      e1h == null || e1m == null ||
      s2h == null || s2m == null ||
      e2h == null || e2m == null
    ) {
      return false; // Invalid time
    }

    const s1 = s1h * 60 + s1m;
    let e1 = e1h * 60 + e1m;
    const s2 = s2h * 60 + s2m;
    let e2 = e2h * 60 + e2m;

    // Handle overnight shifts
    if (e1 < s1) e1 += 24 * 60;
    if (e2 < s2) e2 += 24 * 60;

    return s1 < e2 && s2 < e1;
  }

  /**
   * Generate shift conflict message
   */
  static generateConflictMessage(conflict: ShiftConflict): string {
    const dateStr = conflict.date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `${conflict.receptionistName} sudah memiliki shift ${conflict.existingShift.shiftType} pada ${dateStr} (${conflict.existingShift.startTime} - ${conflict.existingShift.endTime})`;
  }

  /**
   * Get shift color for UI
   */
  static getShiftColor(shiftType: Shift): string {
    const colors: Record<Shift, string> = {
      MORNING: "emerald",
      EVENING: "blue",
      NIGHT: "purple",
    };
    return colors[shiftType];
  }

  /**
   * Get shift label in Indonesian
   */
  static getShiftLabel(shiftType: Shift): string {
    const labels: Record<Shift, string> = {
      MORNING: "Pagi",
      EVENING: "Siang",
      NIGHT: "Malam",
    };
    return labels[shiftType];
  }

  /**
   * Get shift full label with time
   */
  static getShiftFullLabel(shiftType: Shift): string {
    const timeRange = ShiftTimeRanges[shiftType];
    const label = this.getShiftLabel(shiftType);
    return `${label} (${timeRange.start} - ${timeRange.end})`;
  }

  /**
   * Format time for display
   */
  static formatTime(time: string): string {
    return time; // Already in HH:mm format
  }

  /**
   * Get week start date (Monday)
   */
  static getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Get week end date (Sunday)
   */
  static getWeekEnd(date: Date = new Date()): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return weekEnd;
  }

  /**
   * Get dates for a week
   */
  static getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Check if date is in the past
   */
  static isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date, format: "short" | "long" = "short"): string {
    if (format === "short") {
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } else {
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }

  /**
   * Get day name in Indonesian
   * fix(async): date string guards
   */
  static getDayName(date: Date): string {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[date.getDay()] || "";
  }

  /**
   * Get month name in Indonesian
   * fix(async): date string guards
   */
  static getMonthName(date: Date): string {
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return months[date.getMonth()] || "";
  }

  /**
   * Calculate total shifts for a period
   */
  static calculateTotalShifts(
    shifts: Array<{ date: Date }>,
    dateFrom: Date,
    dateTo: Date
  ): number {
    return shifts.filter((s) => {
      const shiftDate = new Date(s.date);
      return shiftDate >= dateFrom && shiftDate <= dateTo;
    }).length;
  }

  /**
   * Calculate total hours for a period
   */
  static calculateTotalHours(
    shifts: Array<{ startTime: string; endTime: string; date: Date }>,
    dateFrom: Date,
    dateTo: Date
  ): number {
    const filteredShifts = shifts.filter((s) => {
      const shiftDate = new Date(s.date);
      return shiftDate >= dateFrom && shiftDate <= dateTo;
    });

    let totalMinutes = 0;
    for (const shift of filteredShifts) {
      const duration = this.calculateShiftDuration(shift.startTime, shift.endTime);
      totalMinutes += duration * 60;
    }

    return totalMinutes / 60;
  }

  /**
   * Group shifts by type
   */
  static groupShiftsByType(
    shifts: Array<{ shiftType: Shift }>
  ): Record<Shift, number> {
    const grouped: Record<Shift, number> = {
      MORNING: 0,
      EVENING: 0,
      NIGHT: 0,
    };

    for (const shift of shifts) {
      grouped[shift.shiftType]++;
    }

    return grouped;
  }
}

