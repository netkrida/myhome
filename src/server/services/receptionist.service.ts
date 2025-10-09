/**
 * Receptionist Service
 * Tier 3: Business Logic for Receptionist Management
 */

import { Shift } from "@prisma/client";
import { ShiftTimeRanges } from "@/server/types/receptionist";
import type {
  CreateReceptionistDTO,
  UpdateReceptionistDTO,
} from "@/server/types/receptionist";

export class ReceptionistService {
  /**
   * Generate random password for receptionist
   */
  static generatePassword(length: number = 12): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Validate receptionist creation data
   */
  static validateCreate(data: CreateReceptionistDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name || data.name.length < 2) {
      errors.push("Name must be at least 2 characters");
    }

    if (!data.email || !data.email.includes("@")) {
      errors.push("Valid email is required");
    }

    if (data.password && data.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (data.phoneNumber && !/^[0-9+\-\s()]+$/.test(data.phoneNumber)) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate receptionist update data
   */
  static validateUpdate(data: UpdateReceptionistDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.name && data.name.length < 2) {
      errors.push("Name must be at least 2 characters");
    }

    if (data.phoneNumber && !/^[0-9+\-\s()]+$/.test(data.phoneNumber)) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format receptionist name for display
   */
  static formatName(name: string): string {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Get shift label in Indonesian
   */
  static getShiftLabel(shift: Shift): string {
    const labels: Record<Shift, string> = {
      MORNING: "Pagi",
      EVENING: "Siang",
      NIGHT: "Malam",
    };
    return labels[shift];
  }

  /**
   * Get shift time range
   */
  static getShiftTimeRange(shift: Shift): { start: string; end: string } {
    return ShiftTimeRanges[shift];
  }

  /**
   * Calculate total working hours from shift assignments
   */
  static calculateTotalHours(shifts: Array<{ startTime: string; endTime: string }>): number {
    let totalMinutes = 0;

    // fix(services): add time-part guards before math
    for (const shift of shifts) {
      const [startHour, startMin] = shift.startTime.split(":").map(Number);
      const [endHour, endMin] = shift.endTime.split(":").map(Number);

      if (
        endHour == null || endMin == null ||
        startHour == null || startMin == null
      ) {
        continue; // Skip invalid time
      }

      let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

      // Handle overnight shifts
      if (minutes < 0) {
        minutes += 24 * 60;
      }

      totalMinutes += minutes;
    }

    return totalMinutes / 60; // Convert to hours
  }

  /**
   * Check if email is valid format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let sanitized = phone.replace(/[^\d+]/g, "");
    
    // If starts with 0, replace with +62
    if (sanitized.startsWith("0")) {
      sanitized = "+62" + sanitized.slice(1);
    }
    
    // If doesn't start with +, add +62
    if (!sanitized.startsWith("+")) {
      sanitized = "+62" + sanitized;
    }

    return sanitized;
  }

  /**
   * Generate email invitation content
   */
  static generateInvitationEmail(
    receptionistName: string,
    email: string,
    password: string,
    propertyName?: string
  ): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = "Undangan Bergabung sebagai Receptionist";
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Selamat Datang, ${receptionistName}!</h2>
        <p>Anda telah didaftarkan sebagai Receptionist${propertyName ? ` di ${propertyName}` : ""}.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Informasi Login Anda:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        
        <p>Silakan login ke sistem untuk memulai bekerja.</p>
        <p><strong>Catatan:</strong> Harap ubah password Anda setelah login pertama kali.</p>
        
        <p>Terima kasih,<br>Tim Management</p>
      </div>
    `;

    const text = `
Selamat Datang, ${receptionistName}!

Anda telah didaftarkan sebagai Receptionist${propertyName ? ` di ${propertyName}` : ""}.

Informasi Login Anda:
Email: ${email}
Password: ${password}

Silakan login ke sistem untuk memulai bekerja.
Catatan: Harap ubah password Anda setelah login pertama kali.

Terima kasih,
Tim Management
    `;

    return { subject, html, text };
  }
}

