import { type Room, type RoomImage, type Prisma } from "@prisma/client";
import { prisma } from "../db/client";
import { ImageCategory } from "../types/property";
import type {
  CreateRoomDTO,
  UpdateRoomDTO,
  RoomListQuery,
  RoomStatsDTO,
  RoomListItem,
  RoomDetailItem,
  PaginationDTO,
  BulkUpdateRoomAvailabilityDTO,
  BulkUpdateRoomPricingDTO,
  PublicRoomDetailDTO,
  PublicPropertyRoomsQuery,
  PublicPropertyRoomsResponse,
  PublicRoomCardDTO
} from "../types";
import type { Result } from "../types/result";
import { ok, fail, notFound, internalError } from "../types/result";

/**
 * Room Repository
 * Data access layer for room operations
 */
export class RoomRepository {
  /**
   * Find room by ID with optional includes
   */
  static async findById(
    id: string, 
    includeImages: boolean = true,
    includeProperty: boolean = false
  ): Promise<RoomDetailItem | null> {
    const include: Prisma.RoomInclude = {};
    
    if (includeImages) {
      include.images = {
        orderBy: { sortOrder: 'asc' }
      };
    }
    
    if (includeProperty) {
      include.property = {
        select: {
          id: true,
          name: true,
          propertyType: true,
          provinceCode: true,
          provinceName: true,
          regencyCode: true,
          regencyName: true,
          districtCode: true,
          districtName: true,
          fullAddress: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          }
        }
      };
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include,
    });

    if (!room) return null;

    // Transform to RoomDetailItem
    return {
      id: room.id,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      description: room.description || undefined,
      size: room.size || undefined,
      pricing: {
        monthlyPrice: Number(room.monthlyPrice),
        dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : undefined,
        weeklyPrice: room.weeklyPrice ? Number(room.weeklyPrice) : undefined,
        quarterlyPrice: room.quarterlyPrice ? Number(room.quarterlyPrice) : undefined,
        yearlyPrice: room.yearlyPrice ? Number(room.yearlyPrice) : undefined,
      },
      hasDeposit: room.hasDeposit,
      depositPercentage: room.depositPercentage || undefined,
      facilities: room.facilities as any[],
      isAvailable: room.isAvailable,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      images: room.images?.map(img => ({
        id: img.id,
        category: img.category as any,
        imageUrl: img.imageUrl,
        publicId: img.publicId || undefined,
        caption: img.caption || undefined,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })) || [],
      property: room.property ? {
        id: room.property.id,
        name: room.property.name,
        propertyType: room.property.propertyType,
        location: {
          provinceName: room.property.provinceName,
          regencyName: room.property.regencyName,
          districtName: room.property.districtName,
          fullAddress: room.property.fullAddress,
        },
        owner: (room.property as any).owner,
      } : undefined as any,
    };
  }

  /**
   * Get room by ID with Result wrapper
   */
  static async getById(
    id: string,
    includeImages: boolean = true,
    includeProperty: boolean = false
  ): Promise<Result<RoomDetailItem>> {
    try {
      const room = await this.findById(id, includeImages, includeProperty);
      if (!room) {
        return notFound("Room not found");
      }
      return ok(room);
    } catch (error) {
      console.error("Error getting room by ID:", error);
      return internalError("Failed to get room");
    }
  }

  /**
   * Create multiple rooms from room configuration
   */
  static async createMany(roomData: CreateRoomDTO): Promise<Room[]> {
    const { propertyId, step1, step2, step3, step4 } = roomData;
    
    return prisma.$transaction(async (tx) => {
      const rooms: Room[] = [];
      
      for (const roomConfig of step4.rooms) {
        // Get pricing for this room type
        const roomTypePricing = step3.pricing[roomConfig.roomType];
        if (!roomTypePricing) {
          throw new Error(`Pricing not found for room type: ${roomConfig.roomType}`);
        }

        // Get description for this room type
        const roomTypeData = step1.roomTypePhotos[roomConfig.roomType];
        const description = roomTypeData?.description || "";

        const room = await tx.room.create({
          data: {
            propertyId,
            roomNumber: roomConfig.roomNumber,
            floor: roomConfig.floor,
            roomType: roomConfig.roomType,
            description,
            monthlyPrice: roomTypePricing.monthlyPrice,
            dailyPrice: roomTypePricing.dailyPrice || null,
            weeklyPrice: roomTypePricing.weeklyPrice || null,
            quarterlyPrice: roomTypePricing.quarterlyPrice || null,
            yearlyPrice: roomTypePricing.yearlyPrice || null,
            hasDeposit: step3.hasDeposit,
            depositPercentage: step3.depositPercentage || null,
            facilities: step2.facilities as any,
            isAvailable: roomConfig.isAvailable,
          },
        });
        rooms.push(room);

        // Create room images for this room type
        const roomTypePhotos = step1.roomTypePhotos[roomConfig.roomType];
        if (roomTypePhotos) {
          const imageData: any[] = [];

          // Front view photos - use ROOM_PHOTOS category
          roomTypePhotos.frontViewPhotos.forEach((url, index) => {
            imageData.push({
              roomId: room.id,
              category: ImageCategory.ROOM_PHOTOS,
              imageUrl: url,
              sortOrder: index,
            });
          });

          // Interior photos - use ROOM_PHOTOS category
          roomTypePhotos.interiorPhotos.forEach((url, index) => {
            imageData.push({
              roomId: room.id,
              category: ImageCategory.ROOM_PHOTOS,
              imageUrl: url,
              sortOrder: index + 1000, // Offset to distinguish from front view photos
            });
          });

          // Bathroom photos - use BATHROOM_PHOTOS category
          roomTypePhotos.bathroomPhotos.forEach((url, index) => {
            imageData.push({
              roomId: room.id,
              category: ImageCategory.BATHROOM_PHOTOS,
              imageUrl: url,
              sortOrder: index,
            });
          });

          if (imageData.length > 0) {
            await tx.roomImage.createMany({
              data: imageData,
            });
          }
        }
      }

      // Update property available rooms count
      const availableCount = step4.rooms.filter(r => r.isAvailable).length;
      await tx.property.update({
        where: { id: propertyId },
        data: { availableRooms: availableCount },
      });

      return rooms;
    });
  }

  /**
   * Update room
   */
  static async update(id: string, updateData: UpdateRoomDTO): Promise<Room> {
    const data: Prisma.RoomUpdateInput = {};
    
    if (updateData.roomNumber) data.roomNumber = updateData.roomNumber;
    if (updateData.floor) data.floor = updateData.floor;
    if (updateData.roomType) data.roomType = updateData.roomType;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.size !== undefined) data.size = updateData.size;
    if (updateData.facilities) data.facilities = updateData.facilities as any;
    if (updateData.isAvailable !== undefined) data.isAvailable = updateData.isAvailable;
    
    if (updateData.pricing) {
      if (updateData.pricing.monthlyPrice) data.monthlyPrice = updateData.pricing.monthlyPrice;
      if (updateData.pricing.dailyPrice !== undefined) data.dailyPrice = updateData.pricing.dailyPrice;
      if (updateData.pricing.weeklyPrice !== undefined) data.weeklyPrice = updateData.pricing.weeklyPrice;
      if (updateData.pricing.quarterlyPrice !== undefined) data.quarterlyPrice = updateData.pricing.quarterlyPrice;
      if (updateData.pricing.yearlyPrice !== undefined) data.yearlyPrice = updateData.pricing.yearlyPrice;
      // hasDeposit and depositPercentage are not part of RoomPricing interface
      // They should be handled separately if needed
    }

    return prisma.$transaction(async (tx) => {
      const updatedRoom = await tx.room.update({
        where: { id },
        data,
      });

      // If availability changed, update property available rooms count
      if (updateData.isAvailable !== undefined) {
        await this.updatePropertyAvailableRooms(updatedRoom.propertyId, tx);
      }

      return updatedRoom;
    });
  }

  /**
   * Update property available rooms count based on current room availability
   */
  static async updatePropertyAvailableRooms(
    propertyId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || prisma;

    const availableCount = await client.room.count({
      where: {
        propertyId,
        isAvailable: true,
      },
    });

    await client.property.update({
      where: { id: propertyId },
      data: { availableRooms: availableCount },
    });
  }

  /**
   * Update room availability
   */
  static async updateAvailability(id: string, isAvailable: boolean): Promise<Room> {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.update({
        where: { id },
        data: { isAvailable },
      });

      // Update property available rooms count
      const availableRooms = await tx.room.count({
        where: { 
          propertyId: room.propertyId,
          isAvailable: true 
        },
      });

      await tx.property.update({
        where: { id: room.propertyId },
        data: { availableRooms },
      });

      return room;
    });
  }

  /**
   * Delete room
   */
  static async delete(id: string): Promise<Room> {
    return prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { id } });
      if (!room) throw new Error("Room not found");

      await tx.room.delete({ where: { id } });

      // Update property available rooms count
      const availableRooms = await tx.room.count({
        where: { 
          propertyId: room.propertyId,
          isAvailable: true 
        },
      });

      await tx.property.update({
        where: { id: room.propertyId },
        data: { availableRooms },
      });

      return room;
    });
  }

  /**
   * Find rooms with filtering and pagination
   */
  static async findMany(filters: RoomListQuery): Promise<{
    rooms: RoomListItem[];
    pagination: PaginationDTO;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      propertyId,
      roomType,
      isAvailable,
      minPrice,
      maxPrice,
      floor,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: Prisma.RoomWhereInput = {};

    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: "insensitive" } },
        { roomType: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (propertyId) where.propertyId = propertyId;
    if (roomType) where.roomType = roomType;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;
    if (floor) where.floor = floor;
    
    if (minPrice || maxPrice) {
      where.monthlyPrice = {};
      if (minPrice) where.monthlyPrice.gte = minPrice;
      if (maxPrice) where.monthlyPrice.lte = maxPrice;
    }

    // Get total count
    const total = await prisma.room.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get rooms
    const rooms = await prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          where: { category: 'ROOM_PHOTOS' },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    const roomListItems: RoomListItem[] = rooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      monthlyPrice: Number(room.monthlyPrice),
      isAvailable: room.isAvailable,
      size: room.size || undefined,
      property: {
        id: room.property.id,
        name: room.property.name,
      },
      mainImage: room.images[0]?.imageUrl,
      createdAt: room.createdAt,
    }));

    return {
      rooms: roomListItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Find rooms by property
   */
  static async findByProperty(propertyId: string): Promise<Room[]> {
    return prisma.room.findMany({
      where: { propertyId },
      orderBy: { roomNumber: "asc" },
    });
  }

  /**
   * Get public room detail by ID
   * Only returns rooms from APPROVED properties
   */
  static async getPublicRoomDetail(id: string): Promise<PublicRoomDetailDTO | null> {
    console.log("🔍 RoomRepository.getPublicRoomDetail - Query:", { id });

    const room = await prisma.room.findFirst({
      where: {
        id,
        property: {
          status: 'APPROVED', // Only approved properties are public
        },
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        property: {
          select: {
            id: true,
            name: true,
            propertyType: true,
            status: true,
            provinceCode: true,
            provinceName: true,
            regencyCode: true,
            regencyName: true,
            districtCode: true,
            districtName: true,
            fullAddress: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      },
    });

    console.log("🔍 RoomRepository.getPublicRoomDetail - Result:", {
      found: !!room,
      roomId: room?.id,
      roomNumber: room?.roomNumber,
      propertyStatus: room?.property?.status,
      imagesCount: room?.images?.length || 0
    });

    // Check if room exists and property is approved
    if (!room || !room.property || room.property.status !== 'APPROVED') {
      return null;
    }

    // Transform to PublicRoomDetailDTO
    return {
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      description: room.description || undefined,
      size: room.size || undefined,
      monthlyPrice: Number(room.monthlyPrice),
      dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : undefined,
      weeklyPrice: room.weeklyPrice ? Number(room.weeklyPrice) : undefined,
      quarterlyPrice: room.quarterlyPrice ? Number(room.quarterlyPrice) : undefined,
      yearlyPrice: room.yearlyPrice ? Number(room.yearlyPrice) : undefined,
      depositRequired: room.depositRequired,
      depositType: room.depositType || undefined,
      depositValue: room.depositValue ? Number(room.depositValue) : undefined,
      facilities: room.facilities as any[],
      isAvailable: room.isAvailable,
      images: room.images?.map(img => ({
        id: img.id,
        category: img.category as any,
        imageUrl: img.imageUrl,
        publicId: img.publicId || undefined,
        caption: img.caption || undefined,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })) || [],
      property: {
        id: room.property.id,
        name: room.property.name,
        propertyType: room.property.propertyType,
        location: {
          provinceName: room.property.provinceName,
          regencyName: room.property.regencyName,
          districtName: room.property.districtName,
          fullAddress: room.property.fullAddress,
        },
        owner: {
          id: room.property.owner.id,
          name: room.property.owner.name || undefined,
          email: room.property.owner.email || undefined,
          phoneNumber: room.property.owner.phoneNumber || undefined,
        },
      },
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  /**
   * Get public property rooms with filtering and pagination
   * Only returns rooms from APPROVED properties
   */
  static async getPublicPropertyRooms(
    propertyId: string,
    filters: PublicPropertyRoomsQuery
  ): Promise<PublicPropertyRoomsResponse | null> {
    console.log("🔍 RoomRepository.getPublicPropertyRooms - Query:", { propertyId, filters });

    // First check if property exists and is approved
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
        status: 'APPROVED' // Only approved properties are public
      },
      select: { id: true, name: true, status: true }
    });

    if (!property) {
      console.log("🔍 RoomRepository.getPublicPropertyRooms - Property not found or not approved:", { propertyId });
      return null;
    }

    const {
      page = 1,
      limit = 12,
      roomType,
      isAvailable,
      minPrice,
      maxPrice,
      floor,
      sortBy = "roomNumber",
      sortOrder = "asc",
    } = filters;

    // Build where clause
    const where: Prisma.RoomWhereInput = {
      propertyId,
    };

    if (roomType) {
      where.roomType = { contains: roomType, mode: "insensitive" };
    }

    if (typeof isAvailable === 'boolean') {
      where.isAvailable = isAvailable;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.monthlyPrice = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    if (floor !== undefined) {
      where.floor = floor;
    }

    // Get total count
    const total = await prisma.room.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get rooms
    const rooms = await prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        images: {
          where: { category: 'ROOM_PHOTOS' },
          orderBy: { sortOrder: 'asc' },
          take: 1, // Only main image for card view
        },
      },
    });

    console.log("🔍 RoomRepository.getPublicPropertyRooms - Result:", {
      propertyId,
      roomsCount: rooms.length,
      total,
      pagination: { page, limit, totalPages }
    });

    const roomCards: PublicRoomCardDTO[] = rooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      description: room.description || undefined,
      size: room.size || undefined,
      monthlyPrice: Number(room.monthlyPrice),
      dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : undefined,
      weeklyPrice: room.weeklyPrice ? Number(room.weeklyPrice) : undefined,
      quarterlyPrice: room.quarterlyPrice ? Number(room.quarterlyPrice) : undefined,
      yearlyPrice: room.yearlyPrice ? Number(room.yearlyPrice) : undefined,
      depositRequired: room.depositRequired,
      depositType: room.depositType || undefined,
      depositValue: room.depositValue ? Number(room.depositValue) : undefined,
      facilities: room.facilities as any[],
      isAvailable: room.isAvailable,
      mainImage: room.images[0]?.imageUrl,
    }));

    return {
      rooms: roomCards,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get room statistics
   */
  static async getStatistics(propertyId?: string): Promise<RoomStatsDTO> {
    const where: Prisma.RoomWhereInput = propertyId ? { propertyId } : {};

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      avgPrice,
      roomTypeStats
    ] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.count({ where: { ...where, isAvailable: true } }),
      prisma.room.count({ where: { ...where, isAvailable: false } }),
      prisma.room.aggregate({
        where,
        _avg: { monthlyPrice: true },
      }),
      prisma.room.groupBy({
        by: ['roomType'],
        _count: { roomType: true },
        where,
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const averagePrice = Number(avgPrice._avg.monthlyPrice) || 0;

    const roomTypeDistribution = roomTypeStats.map(stat => ({
      roomType: stat.roomType,
      count: stat._count.roomType,
      percentage: totalRooms > 0 ? (stat._count.roomType / totalRooms) * 100 : 0,
    }));

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate,
      averagePrice,
      roomTypeDistribution,
    };
  }

  /**
   * Bulk update room availability
   */
  static async bulkUpdateAvailability(data: BulkUpdateRoomAvailabilityDTO): Promise<{ count: number }> {
    return prisma.$transaction(async (tx) => {
      const result = await tx.room.updateMany({
        where: { id: { in: data.roomIds } },
        data: { isAvailable: data.isAvailable },
      });

      // Update property available rooms counts for affected properties
      const affectedRooms = await tx.room.findMany({
        where: { id: { in: data.roomIds } },
        select: { propertyId: true },
        distinct: ['propertyId'],
      });

      for (const room of affectedRooms) {
        const availableRooms = await tx.room.count({
          where: { 
            propertyId: room.propertyId,
            isAvailable: true 
          },
        });

        await tx.property.update({
          where: { id: room.propertyId },
          data: { availableRooms },
        });
      }

      return result;
    });
  }

  /**
   * Bulk update room pricing
   */
  static async bulkUpdatePricing(data: BulkUpdateRoomPricingDTO): Promise<{ count: number }> {
    const updateData: Prisma.RoomUpdateManyMutationInput = {};
    
    if (data.pricing.monthlyPrice) updateData.monthlyPrice = data.pricing.monthlyPrice;
    if (data.pricing.dailyPrice !== undefined) updateData.dailyPrice = data.pricing.dailyPrice;
    if (data.pricing.weeklyPrice !== undefined) updateData.weeklyPrice = data.pricing.weeklyPrice;
    if (data.pricing.quarterlyPrice !== undefined) updateData.quarterlyPrice = data.pricing.quarterlyPrice;
    if (data.pricing.yearlyPrice !== undefined) updateData.yearlyPrice = data.pricing.yearlyPrice;
    // hasDeposit and depositPercentage are not part of RoomPricing interface
    // They should be handled separately if needed

    return prisma.room.updateMany({
      where: { id: { in: data.roomIds } },
      data: updateData,
    });
  }

  /**
   * Check if room number exists in property
   */
  static async roomNumberExists(propertyId: string, roomNumber: string, excludeRoomId?: string): Promise<boolean> {
    const where: Prisma.RoomWhereInput = { 
      propertyId, 
      roomNumber 
    };
    
    if (excludeRoomId) {
      where.id = { not: excludeRoomId };
    }

    const room = await prisma.room.findFirst({ where });
    return !!room;
  }
}
