import { PropertyRepository } from "../repositories/property.repository";
import { PropertyService } from "../services/property.service";
import { withAuth } from "../lib/auth";
import { UserRole } from "../types/rbac";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import type { 
  CreatePropertyDTO,
  UpdatePropertyDTO,
  PropertyListQuery,
  PropertyListResponse,
  PropertyDetailItem,
  PropertyApprovalDTO,
  PropertyStatsDTO
} from "../types";

/**
 * Tier-2: Properties Application Services
 * Orchestrates property management use cases
 */
export class PropertiesAPI {
  /**
   * Get paginated list of properties with filters
   * Accessible by SUPERADMIN (all properties) and ADMINKOS (own properties)
   */
  static getAllProperties = withAuth(
    async (userContext: UserContext, query: PropertyListQuery): Promise<Result<PropertyListResponse>> => {
      try {
        // Check permissions
        if (![UserRole.SUPERADMIN, UserRole.ADMINKOS].includes(userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin and adminkos can view properties.",
            },
            statusCode: 403,
          };
        }

        // Validate search filters
        const validation = PropertyService.validateSearchFilters(query);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid search filters",
              details: validation.errors,
            },
            statusCode: 400,
          };
        }

        // AdminKos can only see their own properties
        const filters = { ...query };
        if (userContext.role === UserRole.ADMINKOS) {
          filters.ownerId = userContext.userId;
        }

        // Get properties from repository
        const result = await PropertyRepository.findMany(filters);

        return {
          success: true,
          data: result,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting properties:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve properties",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get property by ID
   * Accessible by SUPERADMIN (all properties) and ADMINKOS (own properties)
   */
  static getPropertyById = withAuth(
    async (userContext: UserContext, propertyId: string): Promise<Result<PropertyDetailItem>> => {
      try {
        // Check permissions
        if (![UserRole.SUPERADMIN, UserRole.ADMINKOS].includes(userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied.",
            },
            statusCode: 403,
          };
        }

        // Get property from repository
        const property = await PropertyRepository.findById(propertyId, true, true, true);
        
        if (!property) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Property not found",
            },
            statusCode: 404,
          };
        }

        // Check if user can access this property
        if (!PropertyService.canManageProperty(userContext.userId, property, userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. You can only view your own properties.",
            },
            statusCode: 403,
          };
        }

        return {
          success: true,
          data: property,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting property:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve property",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Create new property
   * Only accessible by ADMINKOS
   */
  static createProperty = withAuth(
    async (userContext: UserContext, propertyData: CreatePropertyDTO): Promise<Result<PropertyDetailItem>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.ADMINKOS) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only adminkos can create properties.",
            },
            statusCode: 403,
          };
        }

        // Validate property data
        const validation = PropertyService.validatePropertyCreation(propertyData);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid property data",
              details: validation.errors,
            },
            statusCode: 400,
          };
        }

        // Create property
        const property = await PropertyRepository.create(propertyData, userContext.userId);

        // Get full property details
        const fullProperty = await PropertyRepository.findById(property.id, true, true, true);

        return {
          success: true,
          data: fullProperty!,
          statusCode: 201,
        };
      } catch (error) {
        console.error("Error creating property:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to create property",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Update property
   * Only accessible by property owner (ADMINKOS) and SUPERADMIN
   */
  static updateProperty = withAuth(
    async (userContext: UserContext, propertyId: string, updateData: UpdatePropertyDTO): Promise<Result<PropertyDetailItem>> => {
      try {
        // Check permissions
        if (![UserRole.SUPERADMIN, UserRole.ADMINKOS].includes(userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied.",
            },
            statusCode: 403,
          };
        }

        // Get existing property
        const existingProperty = await PropertyRepository.findById(propertyId, false, false, true);
        
        if (!existingProperty) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Property not found",
            },
            statusCode: 404,
          };
        }

        // Check if user can manage this property
        if (!PropertyService.canManageProperty(userContext.userId, existingProperty, userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. You can only update your own properties.",
            },
            statusCode: 403,
          };
        }

        // Check if property can be edited
        if (!PropertyService.canEditProperty(existingProperty)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Property cannot be edited in its current status.",
            },
            statusCode: 403,
          };
        }

        // Validate update data
        const validation = PropertyService.validatePropertyUpdate(updateData);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid update data",
              details: validation.errors,
            },
            statusCode: 400,
          };
        }

        // Update property
        await PropertyRepository.update(propertyId, updateData);

        // Get updated property details
        const updatedProperty = await PropertyRepository.findById(propertyId, true, true, true);

        return {
          success: true,
          data: updatedProperty!,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error updating property:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update property",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Approve or reject property
   * Only accessible by SUPERADMIN
   */
  static approveProperty = withAuth(
    async (userContext: UserContext, propertyId: string, approvalData: PropertyApprovalDTO): Promise<Result<PropertyDetailItem>> => {
      try {
        // Check permissions
        if (!PropertyService.canApproveProperty(userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin can approve properties.",
            },
            statusCode: 403,
          };
        }

        // Validate approval data
        const validation = PropertyService.validatePropertyApproval(approvalData);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid approval data",
              details: validation.errors,
            },
            statusCode: 400,
          };
        }

        // Get existing property
        const existingProperty = await PropertyRepository.findById(propertyId);
        
        if (!existingProperty) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Property not found",
            },
            statusCode: 404,
          };
        }

        // Update property status
        await PropertyRepository.updateStatus(propertyId, approvalData, userContext.userId);

        // Get updated property details
        const updatedProperty = await PropertyRepository.findById(propertyId, true, true, true);

        return {
          success: true,
          data: updatedProperty!,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error approving property:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to approve property",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get property statistics
   * Accessible by SUPERADMIN (all properties) and ADMINKOS (own properties)
   */
  static getPropertyStats = withAuth(
    async (userContext: UserContext): Promise<Result<PropertyStatsDTO>> => {
      try {
        // Check permissions
        if (![UserRole.SUPERADMIN, UserRole.ADMINKOS].includes(userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied.",
            },
            statusCode: 403,
          };
        }

        // AdminKos can only see stats for their own properties
        const ownerId = userContext.role === UserRole.ADMINKOS ? userContext.userId : undefined;

        // Get statistics from repository
        const stats = await PropertyRepository.getStatistics(ownerId);

        return {
          success: true,
          data: stats,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting property stats:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve property statistics",
          },
          statusCode: 500,
        };
      }
    }
  );
}
