import type {
  CreateBookingDTO,
  BookingDTO,
  BookingCalculation,
  BookingValidation,
  RoomAvailabilityCheck,
  RoomAvailabilityResult,
  BookingStatsDTO
} from "../types/booking";
import {
  LeaseType,
  BookingStatus,
  PaymentStatus,
  DepositType
} from "../types/booking";

/**
 * Booking Domain Service
 * Pure business logic for booking management
 */
export class BookingService {

  /**
   * Generate unique booking code
   */
  static generateBookingCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `BK${timestamp}${random}`.toUpperCase();
  }

  /**
   * Calculate lease duration in days based on lease type
   */
  static calculateLeaseDuration(leaseType: LeaseType, checkInDate: Date): number {
    switch (leaseType) {
      case LeaseType.DAILY:
        return 1;
      case LeaseType.WEEKLY:
        return 7;
      case LeaseType.MONTHLY:
        return 30; // Simplified to 30 days
      case LeaseType.QUARTERLY:
        return 90; // 3 months
      case LeaseType.YEARLY:
        return 365;
      default:
        throw new Error(`Unsupported lease type: ${leaseType}`);
    }
  }

  /**
   * Calculate check-out date based on lease type
   */
  static calculateCheckOutDate(checkInDate: Date, leaseType: LeaseType): Date {
    const duration = this.calculateLeaseDuration(leaseType, checkInDate);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + duration);
    return checkOutDate;
  }

  private static normalizePrice(value: unknown): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    if (typeof value === "object") {
      const decimalLike = value as { toNumber?: () => number; valueOf?: () => unknown };
      if (decimalLike) {
        if (typeof decimalLike.toNumber === "function") {
          const parsed = decimalLike.toNumber();
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }

        if (typeof decimalLike.valueOf === "function") {
          const primitive = decimalLike.valueOf();
          if (typeof primitive === "number" && Number.isFinite(primitive)) {
            return primitive;
          }
          if (typeof primitive === "string") {
            const parsed = Number(primitive);
            if (Number.isFinite(parsed)) {
              return parsed;
            }
          }
        }
      }
    }

    const fallback = Number(value);
    return Number.isFinite(fallback) ? fallback : undefined;
  }
  /**
   * Get price per unit based on lease type
   */
  static getPricePerUnit(room: any, leaseType: LeaseType): number {
    const pricing = room?.pricing ?? room;

    const monthlyPrice = this.normalizePrice(pricing?.monthlyPrice ?? room?.monthlyPrice);
    const dailyPrice = this.normalizePrice(pricing?.dailyPrice ?? room?.dailyPrice);
    const weeklyPrice = this.normalizePrice(pricing?.weeklyPrice ?? room?.weeklyPrice);
    const quarterlyPrice = this.normalizePrice(pricing?.quarterlyPrice ?? room?.quarterlyPrice);
    const yearlyPrice = this.normalizePrice(pricing?.yearlyPrice ?? room?.yearlyPrice);

    const baseMonthly = monthlyPrice;

    switch (leaseType) {
      case LeaseType.DAILY:
        return dailyPrice ?? (baseMonthly !== undefined ? baseMonthly / 30 : Number.NaN);
      case LeaseType.WEEKLY:
        return weeklyPrice ?? (baseMonthly !== undefined ? (baseMonthly / 30) * 7 : Number.NaN);
      case LeaseType.MONTHLY:
        return baseMonthly ?? Number.NaN;
      case LeaseType.QUARTERLY:
        return quarterlyPrice ?? (baseMonthly !== undefined ? baseMonthly * 3 : Number.NaN);
      case LeaseType.YEARLY:
        return yearlyPrice ?? (baseMonthly !== undefined ? baseMonthly * 12 : Number.NaN);
      default:
        throw new Error(`Unsupported lease type: ${leaseType}`);
    }
  }

  /**
   * Calculate booking amounts
   */
  static calculateBookingAmount(
    room: any,
    leaseType: LeaseType,
    checkInDate: Date
  ): BookingCalculation {
    const duration = this.calculateLeaseDuration(leaseType, checkInDate);
    const pricePerUnit = this.getPricePerUnit(room, leaseType);

    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
      throw new Error(`Invalid pricing data for ${leaseType} lease type`);
    }

    let baseAmount: number;
    let totalAmount: number;
    
    switch (leaseType) {
      case LeaseType.DAILY:
        baseAmount = pricePerUnit * duration;
        break;
      case LeaseType.WEEKLY:
        baseAmount = pricePerUnit * Math.ceil(duration / 7);
        break;
      case LeaseType.MONTHLY:
        baseAmount = pricePerUnit * Math.ceil(duration / 30);
        break;
      case LeaseType.QUARTERLY:
        baseAmount = pricePerUnit * Math.ceil(duration / 90);
        break;
      case LeaseType.YEARLY:
        baseAmount = pricePerUnit * Math.ceil(duration / 365);
        break;
      default:
        baseAmount = pricePerUnit;
    }

    totalAmount = baseAmount;

    // Calculate deposit amount if required
    let depositAmount: number | undefined;
    const depositRequired = room.depositRequired || room.hasDeposit;
    const depositType = room.depositType;
    const depositValue = room.depositValue;
    const depositPercentage = room.depositPercentage;

    if (depositRequired) {
      if (depositType === DepositType.FIXED && depositValue) {
        depositAmount = Number(depositValue);
      } else if (depositType === DepositType.PERCENTAGE && depositValue) {
        depositAmount = (totalAmount * Number(depositValue)) / 100;
      } else if (depositPercentage) {
        // Legacy support
        const percentageMap = {
          'TEN_PERCENT': 10,
          'TWENTY_PERCENT': 20,
          'THIRTY_PERCENT': 30,
          'FORTY_PERCENT': 40,
          'FIFTY_PERCENT': 50
        };
        const percentage = percentageMap[depositPercentage as keyof typeof percentageMap] || 20;
        depositAmount = (totalAmount * percentage) / 100;
      }
    }

    return {
      baseAmount,
      totalAmount,
      depositAmount,
      leaseType,
      duration,
      pricePerUnit
    };
  }

  /**
   * Validate booking creation data
   */
  static validateBookingCreation(
    bookingData: CreateBookingDTO,
    room: any,
    existingBookings: any[] = []
  ): BookingValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if room is available
    if (!room.isAvailable) {
      errors.push("Room is not available for booking");
    }

    // Check if room has pricing for the lease type
    const pricePerUnit = this.getPricePerUnit(room, bookingData.leaseType);
    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
      errors.push(`Room does not have pricing for ${bookingData.leaseType} lease type`);
    }

    // Check for overlapping bookings
    const checkOutDate = this.calculateCheckOutDate(bookingData.checkInDate, bookingData.leaseType);
    const hasOverlap = existingBookings.some(booking => {
      if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) {
        return false;
      }
      
      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
      
      if (!existingCheckOut) {
        // If no check-out date, assume it's ongoing
        return bookingData.checkInDate >= existingCheckIn;
      }
      
      return (
        (bookingData.checkInDate >= existingCheckIn && bookingData.checkInDate < existingCheckOut) ||
        (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) ||
        (bookingData.checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut)
      );
    });

    if (hasOverlap) {
      errors.push("Room is already booked for the selected dates");
    }

    // Check if deposit is required but user chose full payment when deposit is mandatory
    if (room.depositRequired && bookingData.depositOption === 'full') {
      // Allow full payment even if deposit is required
      warnings.push("Deposit is recommended for this room, but full payment is accepted");
    }

    // Check if check-in date is not too far in the future (e.g., 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    if (bookingData.checkInDate > oneYearFromNow) {
      warnings.push("Check-in date is more than 1 year in the future");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Check room availability for specific dates
   */
  static checkRoomAvailability(
    availabilityCheck: RoomAvailabilityCheck,
    existingBookings: any[]
  ): RoomAvailabilityResult {
    const checkOutDate = availabilityCheck.checkOutDate || 
      this.calculateCheckOutDate(availabilityCheck.checkInDate, availabilityCheck.leaseType);

    const conflictingBookings = existingBookings.filter(booking => {
      if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.EXPIRED) {
        return false;
      }
      
      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
      
      if (!existingCheckOut) {
        return availabilityCheck.checkInDate >= existingCheckIn;
      }
      
      return (
        (availabilityCheck.checkInDate >= existingCheckIn && availabilityCheck.checkInDate < existingCheckOut) ||
        (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) ||
        (availabilityCheck.checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut)
      );
    });

    return {
      isAvailable: conflictingBookings.length === 0,
      conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings.map(booking => ({
        id: booking.id,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        status: booking.status
      })) : undefined
    };
  }

  /**
   * Validate booking status transition
   * fix(enum): sync BookingStatus UNPAID
   */
  static validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): boolean {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.UNPAID]: [BookingStatus.DEPOSIT_PAID, BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
      [BookingStatus.DEPOSIT_PAID]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
      [BookingStatus.CHECKED_IN]: [BookingStatus.COMPLETED],
      [BookingStatus.COMPLETED]: [], // Final state
      [BookingStatus.CANCELLED]: [], // Final state
      [BookingStatus.EXPIRED]: [] // Final state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Calculate booking statistics
   */
  static calculateBookingStats(bookings: BookingDTO[]): BookingStatsDTO {
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      monthlyRevenue: 0
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    bookings.forEach(booking => {
      // Count by status
      switch (booking.status) {
        case BookingStatus.UNPAID:
        case BookingStatus.DEPOSIT_PAID:
          stats.pendingBookings++;
          break;
        case BookingStatus.CONFIRMED:
        case BookingStatus.CHECKED_IN:
          stats.confirmedBookings++;
          break;
        case BookingStatus.COMPLETED:
          stats.completedBookings++;
          break;
        case BookingStatus.CANCELLED:
        case BookingStatus.EXPIRED:
          stats.cancelledBookings++;
          break;
      }

      // Calculate revenue for completed bookings
      if (booking.status === BookingStatus.COMPLETED || booking.paymentStatus === PaymentStatus.SUCCESS) {
        stats.totalRevenue += booking.totalAmount;
        
        // Monthly revenue
        const bookingMonth = booking.createdAt.getMonth();
        const bookingYear = booking.createdAt.getFullYear();
        if (bookingMonth === currentMonth && bookingYear === currentYear) {
          stats.monthlyRevenue += booking.totalAmount;
        }
      }
    });

    return stats;
  }

  /**
   * Check if booking can be cancelled
   */
  static canCancelBooking(booking: BookingDTO): boolean {
    const cancellableStatuses = [
      BookingStatus.UNPAID,
      BookingStatus.DEPOSIT_PAID,
      BookingStatus.CONFIRMED
    ] as const;

    return cancellableStatuses.includes(booking.status as any);
  }

  /**
   * Check if booking requires deposit payment
   */
  static requiresDepositPayment(room: any): boolean {
    return room.depositRequired || room.hasDeposit;
  }
}
