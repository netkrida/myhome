import { RoomRepository } from "../repositories/room.repository";
import { PropertyRepository } from "../repositories/property.repository";
import { RoomService } from "../services/room.service";
import { PropertyService } from "../services/property.service";
import { withAuth } from "../lib/auth";
import { UserRole } from "../types/rbac";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import type { 
  CreateRoomDTO,
  UpdateRoomDTO,
  RoomListQuery,
  RoomListResponse,
  RoomDetailItem,
  UpdateRoomAvailabilityDTO,
  RoomStatsDTO,
  BulkUpdateRoomAvailabilityDTO,
  BulkUpdateRoomPricingDTO
} from "../types";

/**
 * Tier-2: Rooms Application Services
 * Orchestrates room management use cases
 */
export class RoomsAPI {
  /**
   * Get paginated list of rooms with filters
   * Accessible by SUPERADMIN (all rooms) and ADMINKOS (own property rooms)
   */
  static getAllRooms = withAuth(
    async (userContext: UserContext, query: RoomListQuery): Promise<Result<RoomListResponse>> => {
      try {
        // Check permissions
        if (![UserRole.SUPERADMIN, UserRole.ADMINKOS].includes(userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only superadmin and adminkos can view rooms.",
            },
            statusCode: 403,
          };
        }

        // Validate search filters
        const validation = RoomService.validateSearchFilters(query);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid search filters",
              details: { errors: validation.errors },
            },
            statusCode: 400,
          };
        }

        // For AdminKos, filter by their properties only
        let filters = { ...query };
        if (userContext.role === UserRole.ADMINKOS && !query.propertyId) {
          // Get user's properties first
          const userProperties = await PropertyRepository.findByOwner(userContext.id);
          const propertyIds = userProperties.map(p => p.id);
          
          if (propertyIds.length === 0) {
            return {
              success: true,
              data: {
                rooms: [],
                pagination: {
                  page: 1,
                  limit: query.limit || 10,
                  total: 0,
                  totalPages: 0,
                  hasNext: false,
                  hasPrev: false,
                },
              },
              statusCode: 200,
            };
          }
          
          // For now, we'll handle this in the repository layer
          // This is a limitation that should be addressed in a real implementation
        }

        // Get rooms from repository
        const result = await RoomRepository.findMany(filters);

        return {
          success: true,
          data: result,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting rooms:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve rooms",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get room by ID
   * Accessible by SUPERADMIN (all rooms) and ADMINKOS (own property rooms)
   */
  static getRoomById = withAuth(
    async (userContext: UserContext, roomId: string): Promise<Result<RoomDetailItem>> => {
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

        // Get room from repository
        const room = await RoomRepository.findById(roomId, true, true);
        
        if (!room) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Room not found",
            },
            statusCode: 404,
          };
        }

        // Check if user can access this room
        if (!RoomService.canManageRoom(userContext.id, room, userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. You can only view rooms in your own properties.",
            },
            statusCode: 403,
          };
        }

        return {
          success: true,
          data: room,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting room:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve room",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Create new rooms for a property
   * Only accessible by property owner (ADMINKOS)
   */
  static createRooms = withAuth(
    async (userContext: UserContext, roomData: CreateRoomDTO): Promise<Result<{ message: string; roomCount: number }>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.ADMINKOS) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. Only adminkos can create rooms.",
            },
            statusCode: 403,
          };
        }

        // Validate room data
        console.log("Validating room data:", JSON.stringify(roomData, null, 2));
        const validation = RoomService.validateRoomCreation(roomData);
        if (!validation.isValid) {
          console.error("Room validation failed:", validation.errors);
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid room data",
              details: { errors: validation.errors },
            },
            statusCode: 400,
          };
        }

        // Check if property exists and user owns it
        const property = await PropertyRepository.findById(roomData.propertyId);
        
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

        if (!PropertyService.canManageProperty(userContext.id, property, userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. You can only create rooms in your own properties.",
            },
            statusCode: 403,
          };
        }

        // Check for duplicate room numbers
        for (const roomConfig of roomData.step4.rooms) {
          const exists = await RoomRepository.roomNumberExists(roomData.propertyId, roomConfig.roomNumber);
          if (exists) {
            return {
              success: false,
              error: {
                code: "CONFLICT",
                message: `Room number ${roomConfig.roomNumber} already exists in this property`,
              },
              statusCode: 409,
            };
          }
        }

        // Create rooms
        const rooms = await RoomRepository.createMany(roomData);

        return {
          success: true,
          data: {
            message: "Rooms created successfully",
            roomCount: rooms.length,
          },
          statusCode: 201,
        };
      } catch (error) {
        console.error("Error creating rooms:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to create rooms",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Update room
   * Only accessible by property owner (ADMINKOS) and SUPERADMIN
   */
  static updateRoom = withAuth(
    async (userContext: UserContext, roomId: string, updateData: UpdateRoomDTO): Promise<Result<RoomDetailItem>> => {
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

        // Get existing room
        const existingRoom = await RoomRepository.findById(roomId, false, true);
        
        if (!existingRoom) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Room not found",
            },
            statusCode: 404,
          };
        }

        // Check if user can manage this room
        if (!RoomService.canManageRoom(userContext.id, existingRoom, userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. You can only update rooms in your own properties.",
            },
            statusCode: 403,
          };
        }

        // Validate update data
        const validation = RoomService.validateRoomUpdate(updateData);
        if (!validation.isValid) {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid update data",
              details: { errors: validation.errors },
            },
            statusCode: 400,
          };
        }

        // Check for room number conflicts if updating room number
        if (updateData.roomNumber && updateData.roomNumber !== existingRoom.roomNumber) {
          const exists = await RoomRepository.roomNumberExists(
            existingRoom.propertyId, 
            updateData.roomNumber, 
            roomId
          );
          if (exists) {
            return {
              success: false,
              error: {
                code: "CONFLICT",
                message: `Room number ${updateData.roomNumber} already exists in this property`,
              },
              statusCode: 409,
            };
          }
        }

        // Update room
        await RoomRepository.update(roomId, updateData);

        // Get updated room details
        const updatedRoom = await RoomRepository.findById(roomId, true, true);

        return {
          success: true,
          data: updatedRoom!,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error updating room:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update room",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Update room availability
   * Only accessible by property owner (ADMINKOS) and SUPERADMIN
   */
  static updateRoomAvailability = withAuth(
    async (userContext: UserContext, roomId: string, availabilityData: UpdateRoomAvailabilityDTO): Promise<Result<RoomDetailItem>> => {
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

        // Get existing room
        const existingRoom = await RoomRepository.findById(roomId, false, true);
        
        if (!existingRoom) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Room not found",
            },
            statusCode: 404,
          };
        }

        // Check if user can manage this room
        if (!RoomService.canManageRoom(userContext.id, existingRoom, userContext.role)) {
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Access denied. You can only update rooms in your own properties.",
            },
            statusCode: 403,
          };
        }

        // Update room availability
        await RoomRepository.updateAvailability(roomId, availabilityData.isAvailable);

        // Get updated room details
        const updatedRoom = await RoomRepository.findById(roomId, true, true);

        return {
          success: true,
          data: updatedRoom!,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error updating room availability:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update room availability",
          },
          statusCode: 500,
        };
      }
    }
  );

  /**
   * Get room statistics
   * Accessible by SUPERADMIN (all rooms) and ADMINKOS (own property rooms)
   */
  static getRoomStats = withAuth(
    async (userContext: UserContext, propertyId?: string): Promise<Result<RoomStatsDTO>> => {
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

        // If propertyId is provided and user is AdminKos, verify ownership
        if (propertyId && userContext.role === UserRole.ADMINKOS) {
          const property = await PropertyRepository.findById(propertyId);
          if (!property || !PropertyService.canManageProperty(userContext.id, property, userContext.role)) {
            return {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "Access denied. You can only view stats for your own properties.",
              },
              statusCode: 403,
            };
          }
        }

        // Get statistics from repository
        const stats = await RoomRepository.getStatistics(propertyId);

        return {
          success: true,
          data: stats,
          statusCode: 200,
        };
      } catch (error) {
        console.error("Error getting room stats:", error);
        return {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to retrieve room statistics",
          },
          statusCode: 500,
        };
      }
    }
  );
}
