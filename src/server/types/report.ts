/**
 * Report-related DTOs and types for Receptionist Reports
 */

export interface BookingReportItem {
  bookingCode: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  roomNumber: string;
  roomType: string;
  status: string;
  checkInDate: Date;
  checkOutDate: Date | null;
  actualCheckInAt: Date | null;
  actualCheckOutAt: Date | null;
  leaseType: string;
  leaseDuration: number; // in days
  remainingDays: number; // remaining days until checkout
  totalAmount: number;
  createdAt: Date;
}

export interface BookingReportFilters {
  status?: string;
  leaseType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface BookingReportResponse {
  reports: BookingReportItem[];
  summary: {
    total: number;
    checkedIn: number;
    checkedOut: number;
    confirmed: number;
    depositPaid: number;
  };
  generatedAt: Date;
}
