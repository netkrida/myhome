import type {
  CreatePropertyDTO,
  UpdatePropertyDTO,
  PropertyApprovalDTO,
  PropertyListQuery,
  PropertyStatsDTO,
  PropertyDetailItem,
  PropertyListItem,
  PaginationDTO
} from "../types";
import { PropertyStatus, PropertyType } from "../types/property";
import { PropertyRepository } from "../repositories/global/property.repository";
import { normalizePhoneToE164ID } from "@/lib/phone";

/**
 * Property Domain Service
 * Pure business logic for property management
 */
export class PropertyService {
  /**
   * Validate property creation data
   */
  static validatePropertyCreation(propertyData: CreatePropertyDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Step 1 validation
    if (!propertyData.step1.name?.trim()) {
      errors.push("Property name is required");
    }

    if (propertyData.step1.buildYear < 1900 || propertyData.step1.buildYear > new Date().getFullYear()) {
      errors.push("Invalid build year");
    }

    if (!Object.values(PropertyType).includes(propertyData.step1.propertyType)) {
      errors.push("Invalid property type");
    }

    if (!propertyData.step1.roomTypes || propertyData.step1.roomTypes.length === 0) {
      errors.push("At least one room type is required");
    }

    if (propertyData.step1.totalRooms < 1) {
      errors.push("Total rooms must be at least 1");
    }

    if (propertyData.step1.availableRooms > propertyData.step1.totalRooms) {
      errors.push("Available rooms cannot exceed total rooms");
    }

    // Step 2 validation
    if (!propertyData.step2.location.fullAddress?.trim()) {
      errors.push("Full address is required");
    }

    if (!propertyData.step2.location.latitude || !propertyData.step2.location.longitude) {
      errors.push("Location coordinates are required");
    }

    // Step 4 validation
    if (!propertyData.step4.facilities || propertyData.step4.facilities.length === 0) {
      errors.push("At least one facility is required");
    }

    if (!propertyData.step4.rules || propertyData.step4.rules.length === 0) {
      errors.push("At least one rule is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate property update data
   */
  static validatePropertyUpdate(updateData: UpdatePropertyDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (updateData.buildYear && (updateData.buildYear < 1900 || updateData.buildYear > new Date().getFullYear())) {
      errors.push("Invalid build year");
    }

    if (updateData.propertyType && !Object.values(PropertyType).includes(updateData.propertyType)) {
      errors.push("Invalid property type");
    }

    if (updateData.totalRooms && updateData.totalRooms < 1) {
      errors.push("Total rooms must be at least 1");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate property approval data
   */
  static validatePropertyApproval(approvalData: PropertyApprovalDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Object.values(PropertyStatus).includes(approvalData.status)) {
      errors.push("Invalid status");
    }

    if (approvalData.status === PropertyStatus.REJECTED && !approvalData.rejectionReason?.trim()) {
      errors.push("Rejection reason is required when rejecting a property");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if user can manage property
   */
  static canManageProperty(userId: string, property: PropertyDetailItem, userRole: string): boolean {
    console.log("🔍 canManageProperty check:", {
      userId,
      userRole,
      propertyId: property.id,
      propertyOwnerId: property.owner?.id,
      propertyOwnerIdFallback: (property as any).ownerId,
      hasOwner: !!property.owner,
      ownerObject: property.owner
    });

    // Superadmin can manage all properties
    if (userRole === 'SUPERADMIN') {
      return true;
    }

    // AdminKos can only manage their own properties
    if (userRole === 'ADMINKOS') {
      // Use owner.id if available, fallback to ownerId
      const propertyOwnerId = property.owner?.id || (property as any).ownerId;
      const canManage = propertyOwnerId === userId;
      console.log("🔍 canManageProperty result:", {
        propertyOwnerId,
        userId,
        canManage,
        comparison: `${propertyOwnerId} === ${userId}`
      });
      return canManage;
    }

    return false;
  }

  /**
   * Check if user can approve property
   */
  static canApproveProperty(userRole: string): boolean {
    return userRole === 'SUPERADMIN';
  }

  /**
   * Get property status display text
   */
  static getStatusDisplayText(status: PropertyStatus): string {
    switch (status) {
      case PropertyStatus.PENDING:
        return "Menunggu Persetujuan";
      case PropertyStatus.APPROVED:
        return "Disetujui";
      case PropertyStatus.REJECTED:
        return "Ditolak";
      case PropertyStatus.SUSPENDED:
        return "Disuspend";
      default:
        return "Unknown";
    }
  }

  /**
   * Get property type display text
   */
  static getPropertyTypeDisplayText(type: PropertyType): string {
    switch (type) {
      case PropertyType.MALE_ONLY:
        return "Kos Putra";
      case PropertyType.FEMALE_ONLY:
        return "Kos Putri";
      case PropertyType.MIXED:
        return "Kos Campur";
      default:
        return "Unknown";
    }
  }

  /**
   * Calculate property occupancy rate
   */
  static calculateOccupancyRate(totalRooms: number, availableRooms: number): number {
    if (totalRooms === 0) return 0;
    return ((totalRooms - availableRooms) / totalRooms) * 100;
  }

  /**
   * Validate property search filters
   */
  static validateSearchFilters(filters: PropertyListQuery): {
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

    if (filters.propertyType && !Object.values(PropertyType).includes(filters.propertyType)) {
      errors.push("Invalid property type");
    }

    if (filters.status && !Object.values(PropertyStatus).includes(filters.status)) {
      errors.push("Invalid status");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process property images for different categories
   */
  static processPropertyImages(images: any): {
    buildingPhotos: string[];
    sharedFacilitiesPhotos: string[];
    floorPlanPhotos: string[];
  } {
    const result = {
      buildingPhotos: [] as string[],
      sharedFacilitiesPhotos: [] as string[],
      floorPlanPhotos: [] as string[],
    };

    if (!images || !Array.isArray(images)) {
      return result;
    }

    images.forEach((image: any) => {
      switch (image.category) {
        case 'BUILDING_PHOTOS':
          result.buildingPhotos.push(image.imageUrl);
          break;
        case 'SHARED_FACILITIES_PHOTOS':
          result.sharedFacilitiesPhotos.push(image.imageUrl);
          break;
        case 'FLOOR_PLAN_PHOTOS':
          result.floorPlanPhotos.push(image.imageUrl);
          break;
      }
    });

    return result;
  }

  /**
   * Generate property summary for listings
   */
  static generatePropertySummary(property: PropertyDetailItem): string {
    const parts = [];
    
    parts.push(`${property.totalRooms} kamar`);
    parts.push(`${property.availableRooms} tersedia`);
    parts.push(this.getPropertyTypeDisplayText(property.propertyType));
    
    if (property.location) {
      parts.push(`${property.location.districtName}, ${property.location.regencyName}`);
    }

    return parts.join(" • ");
  }

  /**
   * Check if property can be edited
   */
  static canEditProperty(property: PropertyDetailItem): boolean {
    // Only pending properties can be edited
    return property.status === PropertyStatus.PENDING;
  }

  /**
   * Check if property can be deleted
   */
  static canDeleteProperty(property: PropertyDetailItem): boolean {
    // Only pending or rejected properties can be deleted
    return [PropertyStatus.PENDING, PropertyStatus.REJECTED].includes(property.status);
  }

  /**
   * Validate bulk operations
   */
  static validateBulkOperation(propertyIds: string[], operation: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!propertyIds || propertyIds.length === 0) {
      errors.push("At least one property must be selected");
    }

    if (!['approve', 'reject', 'suspend', 'delete'].includes(operation)) {
      errors.push("Invalid operation");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format property address for display
   */
  static formatAddress(location: any): string {
    if (!location) return "";
    
    const parts = [];
    if (location.fullAddress) parts.push(location.fullAddress);
    if (location.districtName) parts.push(location.districtName);
    if (location.regencyName) parts.push(location.regencyName);
    if (location.provinceName) parts.push(location.provinceName);
    
    return parts.join(", ");
  }

  /**
   * Calculate property rating based on facilities and rules
   */
  static calculatePropertyRating(facilities: any[], rules: any[]): number {
    // Simple rating calculation based on number of facilities and rules
    const facilityScore = Math.min(facilities.length * 0.1, 3); // Max 3 points
    const ruleScore = Math.min(rules.length * 0.05, 2); // Max 2 points
    const baseScore = 3; // Base score

    return Math.min(baseScore + facilityScore + ruleScore, 5);
  }

  /**
   * Get property with admin WhatsApp contact information
   * Used for public property detail page to enable WhatsApp contact
   */
  static async getPublicPropertyWithAdminWA(id: string): Promise<{
    property: {
      id: string;
      name: string;
    };
    adminWa: string | null;
  } | null> {
    const ownerContact = await PropertyRepository.getPropertyOwnerContact(id);

    if (!ownerContact) {
      return null;
    }

    // Normalize phone number to E.164 format
    const adminWa = normalizePhoneToE164ID(ownerContact.ownerPhoneNumber);

    return {
      property: {
        id: ownerContact.propertyId,
        name: ownerContact.propertyName,
      },
      adminWa,
    };
  }
}
