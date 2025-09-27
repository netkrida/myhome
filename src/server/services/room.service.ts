import type {
  CreateRoomDTO,
  UpdateRoomDTO,
  RoomListQuery,
  RoomStatsDTO,
  RoomDetailItem,
  RoomListItem,
  RoomPricing,
  BulkUpdateRoomAvailabilityDTO,
  BulkUpdateRoomPricingDTO,
  DepositPercentage
} from "../types";

/**
 * Room Domain Service
 * Pure business logic for room management
 */
export class RoomService {
  /**
   * Convert DepositPercentage enum to number
   */
  private static getDepositPercentageValue(percentage: DepositPercentage): number {
    switch (percentage) {
      case DepositPercentage.TEN_PERCENT:
        return 10;
      case DepositPercentage.TWENTY_PERCENT:
        return 20;
      case DepositPercentage.THIRTY_PERCENT:
        return 30;
      case DepositPercentage.FORTY_PERCENT:
        return 40;
      case DepositPercentage.FIFTY_PERCENT:
        return 50;
      default:
        return 20; // Default to 20%
    }
  }
  /**
   * Validate room creation data
   */
  static validateRoomCreation(roomData: CreateRoomDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Property ID validation
    if (!roomData.propertyId?.trim()) {
      errors.push("Property ID is required");
    }

    // Step 1 validation
    if (!roomData.step1.roomType?.trim()) {
      errors.push("Room type is required");
    }

    if (!roomData.step1.images?.roomPhotos || roomData.step1.images.roomPhotos.length === 0) {
      errors.push("At least one room photo is required");
    }

    // Step 2 validation
    if (!roomData.step2.facilities || roomData.step2.facilities.length === 0) {
      errors.push("At least one facility is required");
    }

    // Step 3 validation (pricing)
    const pricingValidation = this.validateRoomPricing(roomData.step3.pricing);
    if (!pricingValidation.isValid) {
      errors.push(...pricingValidation.errors);
    }

    // Step 4 validation (room configurations)
    if (!roomData.step4.rooms || roomData.step4.rooms.length === 0) {
      errors.push("At least one room configuration is required");
    }

    // Validate each room configuration
    roomData.step4.rooms.forEach((room, index) => {
      if (!room.roomNumber?.trim()) {
        errors.push(`Room ${index + 1}: Room number is required`);
      }

      if (room.floor < 1) {
        errors.push(`Room ${index + 1}: Floor must be at least 1`);
      }

      if (!room.roomType?.trim()) {
        errors.push(`Room ${index + 1}: Room type is required`);
      }
    });

    // Check for duplicate room numbers
    const roomNumbers = roomData.step4.rooms.map(r => r.roomNumber);
    const duplicates = roomNumbers.filter((num, index) => roomNumbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate room numbers found: ${duplicates.join(", ")}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate room pricing data
   */
  static validateRoomPricing(pricing: RoomPricing): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!pricing.monthlyPrice || pricing.monthlyPrice <= 0) {
      errors.push("Monthly price is required and must be greater than 0");
    }

    if (pricing.dailyPrice && pricing.dailyPrice <= 0) {
      errors.push("Daily price must be greater than 0 if provided");
    }

    if (pricing.weeklyPrice && pricing.weeklyPrice <= 0) {
      errors.push("Weekly price must be greater than 0 if provided");
    }

    if (pricing.quarterlyPrice && pricing.quarterlyPrice <= 0) {
      errors.push("Quarterly price must be greater than 0 if provided");
    }

    if (pricing.yearlyPrice && pricing.yearlyPrice <= 0) {
      errors.push("Yearly price must be greater than 0 if provided");
    }

    if (pricing.hasDeposit && !pricing.depositPercentage) {
      errors.push("Deposit percentage is required when deposit is enabled");
    }

    if (pricing.depositPercentage && !Object.values(DepositPercentage).includes(pricing.depositPercentage)) {
      errors.push("Invalid deposit percentage");
    }

    // Validate price relationships
    if (pricing.dailyPrice && pricing.monthlyPrice) {
      const expectedMonthlyFromDaily = pricing.dailyPrice * 30;
      if (pricing.monthlyPrice > expectedMonthlyFromDaily * 1.2) {
        errors.push("Monthly price seems too high compared to daily price");
      }
    }

    if (pricing.weeklyPrice && pricing.monthlyPrice) {
      const expectedMonthlyFromWeekly = pricing.weeklyPrice * 4;
      if (pricing.monthlyPrice > expectedMonthlyFromWeekly * 1.2) {
        errors.push("Monthly price seems too high compared to weekly price");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate room update data
   */
  static validateRoomUpdate(updateData: UpdateRoomDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (updateData.floor && updateData.floor < 1) {
      errors.push("Floor must be at least 1");
    }

    if (updateData.pricing) {
      const pricingValidation = this.validateRoomPricing(updateData.pricing as RoomPricing);
      if (!pricingValidation.isValid) {
        errors.push(...pricingValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate deposit amount
   */
  static calculateDepositAmount(monthlyPrice: number, depositPercentage: DepositPercentage): number {
    const percentValue = this.getDepositPercentageValue(depositPercentage);
    return (monthlyPrice * percentValue) / 100;
  }

  /**
   * Calculate total cost for different periods
   */
  static calculateTotalCost(pricing: RoomPricing, period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'): {
    baseCost: number;
    depositAmount: number;
    totalCost: number;
  } {
    let baseCost = 0;

    switch (period) {
      case 'daily':
        baseCost = pricing.dailyPrice || 0;
        break;
      case 'weekly':
        baseCost = pricing.weeklyPrice || 0;
        break;
      case 'monthly':
        baseCost = pricing.monthlyPrice;
        break;
      case 'quarterly':
        baseCost = pricing.quarterlyPrice || 0;
        break;
      case 'yearly':
        baseCost = pricing.yearlyPrice || 0;
        break;
    }

    const depositAmount = pricing.hasDeposit && pricing.depositPercentage
      ? this.calculateDepositAmount(pricing.monthlyPrice, pricing.depositPercentage)
      : 0;

    return {
      baseCost,
      depositAmount,
      totalCost: baseCost + depositAmount,
    };
  }

  /**
   * Check if user can manage room
   */
  static canManageRoom(userId: string, room: RoomDetailItem, userRole: string): boolean {
    // Superadmin can manage all rooms
    if (userRole === 'SUPERADMIN') {
      return true;
    }

    // AdminKos can only manage rooms in their properties
    if (userRole === 'ADMINKOS') {
      return room.property?.owner?.id === userId;
    }

    return false;
  }

  /**
   * Validate room search filters
   */
  static validateSearchFilters(filters: RoomListQuery): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (filters.page && filters.page < 1) {
      errors.push("Page must be at least 1");
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      errors.push("Limit must be between 1 and 100");
    }

    if (filters.minPrice && filters.minPrice < 0) {
      errors.push("Minimum price cannot be negative");
    }

    if (filters.maxPrice && filters.maxPrice < 0) {
      errors.push("Maximum price cannot be negative");
    }

    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      errors.push("Minimum price cannot exceed maximum price");
    }

    if (filters.floor && filters.floor < 1) {
      errors.push("Floor must be at least 1");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate room summary for listings
   */
  static generateRoomSummary(room: RoomDetailItem): string {
    const parts = [];
    
    parts.push(`Lantai ${room.floor}`);
    parts.push(room.roomType);
    
    if (room.size) {
      parts.push(room.size);
    }
    
    parts.push(`Rp ${room.pricing.monthlyPrice.toLocaleString('id-ID')}/bulan`);
    
    if (room.pricing.hasDeposit && room.pricing.depositPercentage) {
      const percentValue = this.getDepositPercentageValue(room.pricing.depositPercentage);
      parts.push(`DP ${percentValue}%`);
    }

    return parts.join(" • ");
  }

  /**
   * Check if room is bookable
   */
  static isRoomBookable(room: RoomDetailItem): boolean {
    return room.isAvailable && room.pricing.monthlyPrice > 0;
  }

  /**
   * Validate bulk operations
   */
  static validateBulkAvailabilityUpdate(data: BulkUpdateRoomAvailabilityDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.roomIds || data.roomIds.length === 0) {
      errors.push("At least one room must be selected");
    }

    if (typeof data.isAvailable !== 'boolean') {
      errors.push("Availability status must be specified");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate bulk pricing update
   */
  static validateBulkPricingUpdate(data: BulkUpdateRoomPricingDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.roomIds || data.roomIds.length === 0) {
      errors.push("At least one room must be selected");
    }

    if (!data.pricing || Object.keys(data.pricing).length === 0) {
      errors.push("At least one pricing field must be updated");
    }

    // Validate pricing data if provided
    if (data.pricing) {
      const pricingValidation = this.validateRoomPricing(data.pricing as RoomPricing);
      if (!pricingValidation.isValid) {
        errors.push(...pricingValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate room occupancy rate for a property
   */
  static calculateOccupancyRate(totalRooms: number, availableRooms: number): number {
    if (totalRooms === 0) return 0;
    return ((totalRooms - availableRooms) / totalRooms) * 100;
  }

  /**
   * Format room pricing for display
   */
  static formatPricing(pricing: RoomPricing): {
    monthly: string;
    daily?: string;
    weekly?: string;
    quarterly?: string;
    yearly?: string;
    deposit?: string;
  } {
    const result: any = {
      monthly: `Rp ${pricing.monthlyPrice.toLocaleString('id-ID')}/bulan`,
    };

    if (pricing.dailyPrice) {
      result.daily = `Rp ${pricing.dailyPrice.toLocaleString('id-ID')}/hari`;
    }

    if (pricing.weeklyPrice) {
      result.weekly = `Rp ${pricing.weeklyPrice.toLocaleString('id-ID')}/minggu`;
    }

    if (pricing.quarterlyPrice) {
      result.quarterly = `Rp ${pricing.quarterlyPrice.toLocaleString('id-ID')}/3 bulan`;
    }

    if (pricing.yearlyPrice) {
      result.yearly = `Rp ${pricing.yearlyPrice.toLocaleString('id-ID')}/tahun`;
    }

    if (pricing.hasDeposit && pricing.depositPercentage) {
      const depositAmount = this.calculateDepositAmount(pricing.monthlyPrice, pricing.depositPercentage);
      const percentValue = this.getDepositPercentageValue(pricing.depositPercentage);
      result.deposit = `Rp ${depositAmount.toLocaleString('id-ID')} (${percentValue}%)`;
    }

    return result;
  }

  /**
   * Get room availability status text
   */
  static getAvailabilityStatusText(isAvailable: boolean): string {
    return isAvailable ? "Tersedia" : "Tidak Tersedia";
  }
}
