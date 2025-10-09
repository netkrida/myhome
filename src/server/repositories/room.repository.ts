// fix(prisma): RoomImage tidak ada di schema, hapus import
import { type Room, type Prisma } from "@prisma/client";
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
  PublicRoomCardDTO,
  PropertyRoomTypesResponse,
  PropertyRoomTypesQuery,
  RoomTypeDetailDTO,
  RoomAvailabilityInfo,
  PropertyBasicInfo
} from "../types";
import type { Result } from "../types/result";
import { ok, fail, notFound, internalError } from "../types/result";

/**
 * Room Repository
 * Data access layer for room operations
 */
export class RoomRepository {
  /**
   * Helper: Get images for a room from RoomTypeImage (shared images)
   */
  private static async getRoomImages(room: { propertyId: string; roomType: string }) {
    // Get shared images from RoomTypeImage
    const roomTypeImages = await prisma.roomTypeImage.findMany({
      where: {
        propertyId: room.propertyId,
        roomType: room.roomType,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return roomTypeImages.map(img => ({
      id: img.id,
      category: img.category as any,
      imageUrl: img.imageUrl,
      publicId: img.publicId || undefined,
      caption: img.caption || undefined,
      sortOrder: img.sortOrder,
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
    }));
  }

  /**
   * Find room by ID with optional includes
   */
  static async findById(
    id: string,
    includeImages: boolean = true,
    includeProperty: boolean = false
  ): Promise<RoomDetailItem | null> {
    const include: Prisma.RoomInclude = {};

    // Don't include images in query, we'll fetch separately
    // if (includeImages) {
    //   include.images = {
    //     orderBy: { sortOrder: 'asc' }
    //   };
    // }
    
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

    // Get images using helper (with fallback)
    const images = includeImages ? await this.getRoomImages(room) : [];

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
      images,
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
      }

      // Create shared room type images (ONCE per room type, not per room)
      // This prevents duplication - all rooms of same type share same images
      const processedRoomTypes = new Set<string>();

      for (const roomConfig of step4.rooms) {
        const roomType = roomConfig.roomType;

        // Skip if we already processed this room type
        if (processedRoomTypes.has(roomType)) {
          continue;
        }
        processedRoomTypes.add(roomType);

        // Check if images already exist for this room type
        const existingTypeImages = await tx.roomTypeImage.findFirst({
          where: {
            propertyId,
            roomType,
          },
        });

        // Only create images if they don't exist yet
        if (!existingTypeImages) {
          const roomTypePhotos = step1.roomTypePhotos[roomType];
          if (roomTypePhotos) {
            const imageData: any[] = [];

            // Front view photos - use ROOM_PHOTOS category
            roomTypePhotos.frontViewPhotos.forEach((url, index) => {
              imageData.push({
                propertyId,
                roomType,
                category: ImageCategory.ROOM_PHOTOS,
                imageUrl: url,
                sortOrder: index,
              });
            });

            // Interior photos - use ROOM_PHOTOS category
            roomTypePhotos.interiorPhotos.forEach((url, index) => {
              imageData.push({
                propertyId,
                roomType,
                category: ImageCategory.ROOM_PHOTOS,
                imageUrl: url,
                sortOrder: roomTypePhotos.frontViewPhotos.length + index,
              });
            });

            // Bathroom photos - use BATHROOM_PHOTOS category
            roomTypePhotos.bathroomPhotos.forEach((url, index) => {
              imageData.push({
                propertyId,
                roomType,
                category: ImageCategory.BATHROOM_PHOTOS,
                imageUrl: url,
                sortOrder: index,
              });
            });

            if (imageData.length > 0) {
              await tx.roomTypeImage.createMany({
                data: imageData,
              });
            }
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
      },
    });

    // Get unique room types from results
    const uniqueRoomTypes = new Set(rooms.map(r => ({ propertyId: r.propertyId, roomType: r.roomType })));

    // Get shared images for all room types (efficient batch query)
    const roomTypeImages = await prisma.roomTypeImage.findMany({
      where: {
        OR: Array.from(uniqueRoomTypes).map(({ propertyId, roomType }) => ({
          propertyId,
          roomType,
          category: 'ROOM_PHOTOS',
        })),
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Create map: propertyId_roomType -> first image
    const imageMap = new Map<string, string>();
    for (const img of roomTypeImages) {
      const key = `${img.propertyId}_${img.roomType}`;
      if (!imageMap.has(key)) {
        imageMap.set(key, img.imageUrl);
      }
    }

    const roomListItems: RoomListItem[] = rooms.map(room => {
      const imageKey = `${room.propertyId}_${room.roomType}`;
      return {
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
        mainImage: imageMap.get(imageKey),
        createdAt: room.createdAt,
      };
    });

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

    // Check if room exists and property is approved
    if (!room || !room.property || room.property.status !== 'APPROVED') {
      return null;
    }

    // Get images using helper (with fallback)
    const images = await this.getRoomImages(room);

    console.log("🔍 RoomRepository.getPublicRoomDetail - Result:", {
      found: !!room,
      roomId: room?.id,
      roomNumber: room?.roomNumber,
      propertyStatus: room?.property?.status,
      imagesCount: images.length
    });

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
      images,
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
      sortBy = "monthlyPrice",
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
    });

    console.log("🔍 RoomRepository.getPublicPropertyRooms - Result:", {
      propertyId,
      roomsCount: rooms.length,
      total,
      pagination: { page, limit, totalPages }
    });

    // Get shared images for all room types in this property
    const roomTypeImages = await prisma.roomTypeImage.findMany({
      where: {
        propertyId,
        category: 'ROOM_PHOTOS',
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Create map: roomType -> first image
    const imageMap = new Map<string, string>();
    for (const img of roomTypeImages) {
      if (!imageMap.has(img.roomType)) {
        imageMap.set(img.roomType, img.imageUrl);
      }
    }

    const roomCards: PublicRoomCardDTO[] = rooms.map(room => ({
      id: room.id,
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
      mainImage: imageMap.get(room.roomType),
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

  /**
   * Get property room types with availability information
   * Only returns data from APPROVED properties
   */
  static async getPropertyRoomTypes(
    propertyId: string,
    filters: PropertyRoomTypesQuery = {}
  ): Promise<PropertyRoomTypesResponse | null> {
    console.log("🔍 RoomRepository.getPropertyRoomTypes - Query:", { propertyId, filters });

    // First check if property exists and is approved
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
        status: 'APPROVED' // Only approved properties are public
      },
      select: {
        id: true,
        name: true,
        propertyType: true,
        fullAddress: true,
        totalRooms: true,
        availableRooms: true
      }
    });

    if (!property) {
      console.log("🔍 RoomRepository.getPropertyRoomTypes - Property not found or not approved:", { propertyId });
      return null;
    }

    // Build room filter
    const roomWhere: Prisma.RoomWhereInput = {
      propertyId,
    };

    if (filters.roomType) {
      roomWhere.roomType = filters.roomType;
    }

    // Get all rooms with their current bookings
    const rooms = await prisma.room.findMany({
      where: roomWhere,
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'CHECKED_IN', 'DEPOSIT_PAID'] // Active booking statuses
            },
            OR: [
              {
                checkOutDate: null // Monthly/long-term bookings without checkout date
              },
              {
                checkOutDate: {
                  gte: new Date() // Bookings that haven't ended yet
                }
              }
            ]
          },
          include: {
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: { checkInDate: 'desc' },
          take: 1 // Only current/latest booking
        }
      },
      orderBy: [
        { roomType: 'asc' },
        { roomNumber: 'asc' }
      ]
    });

    console.log("🔍 RoomRepository.getPropertyRoomTypes - Rooms found:", {
      propertyId,
      roomsCount: rooms.length
    });

    // Get shared images for all room types in this property
    const roomTypeImages = await prisma.roomTypeImage.findMany({
      where: {
        propertyId,
        category: 'ROOM_PHOTOS',
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Create map: roomType -> first image
    const roomTypeImageMap = new Map<string, string>();
    for (const img of roomTypeImages) {
      if (!roomTypeImageMap.has(img.roomType)) {
        roomTypeImageMap.set(img.roomType, img.imageUrl);
      }
    }

    // Group rooms by room type
    const roomTypeMap = new Map<string, any[]>();

    rooms.forEach(room => {
      if (!roomTypeMap.has(room.roomType)) {
        roomTypeMap.set(room.roomType, []);
      }
      roomTypeMap.get(room.roomType)!.push(room);
    });

    // Build room type details
    const roomTypes: RoomTypeDetailDTO[] = [];
    let totalAvailable = 0;
    let totalOccupied = 0;

    for (const [roomType, roomsInType] of roomTypeMap) {
      const firstRoom = roomsInType[0]; // Use first room for pricing and facilities

      const roomAvailabilityInfos: RoomAvailabilityInfo[] = [];
      let availableCount = 0;
      let occupiedCount = 0;

      roomsInType.forEach(room => {
        const hasActiveBooking = room.bookings && room.bookings.length > 0;
        const isOccupied = hasActiveBooking;
        const isAvailable = room.isAvailable && !isOccupied;

        if (isAvailable) availableCount++;
        if (isOccupied) occupiedCount++;

        const roomInfo: RoomAvailabilityInfo = {
          id: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          isAvailable,
          isOccupied,
          mainImage: roomTypeImageMap.get(room.roomType),
        };

        // Add current booking info if exists
        if (hasActiveBooking) {
          const booking = room.bookings[0];
          roomInfo.currentBooking = {
            id: booking.id,
            bookingCode: booking.bookingCode,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate || undefined,
            status: booking.status,
            customerName: booking.user.name || 'Unknown'
          };
        }

        // Include room based on filter
        if (!filters.includeOccupied && isOccupied) {
          return; // Skip occupied rooms if not requested
        }

        roomAvailabilityInfos.push(roomInfo);
      });

      totalAvailable += availableCount;
      totalOccupied += occupiedCount;

      const roomTypeDetail: RoomTypeDetailDTO = {
        roomType,
        description: firstRoom.description || undefined,
        totalRooms: roomsInType.length,
        availableRooms: availableCount,
        occupiedRooms: occupiedCount,
        pricing: {
          monthlyPrice: Number(firstRoom.monthlyPrice),
          dailyPrice: firstRoom.dailyPrice ? Number(firstRoom.dailyPrice) : undefined,
          weeklyPrice: firstRoom.weeklyPrice ? Number(firstRoom.weeklyPrice) : undefined,
          quarterlyPrice: firstRoom.quarterlyPrice ? Number(firstRoom.quarterlyPrice) : undefined,
          yearlyPrice: firstRoom.yearlyPrice ? Number(firstRoom.yearlyPrice) : undefined,
        },
        depositInfo: {
          depositRequired: firstRoom.depositRequired,
          depositType: firstRoom.depositType || undefined,
          depositValue: firstRoom.depositValue ? Number(firstRoom.depositValue) : undefined,
        },
        facilities: firstRoom.facilities as any[],
        rooms: roomAvailabilityInfos,
        mainImage: firstRoom.images[0]?.imageUrl,
      };

      roomTypes.push(roomTypeDetail);
    }

    const response: PropertyRoomTypesResponse = {
      property: {
        id: property.id,
        name: property.name,
        propertyType: property.propertyType,
        fullAddress: property.fullAddress,
        totalRooms: property.totalRooms,
        availableRooms: property.availableRooms,
      },
      roomTypes,
      summary: {
        totalRoomTypes: roomTypes.length,
        totalRooms: rooms.length,
        totalAvailable,
        totalOccupied,
      },
    };

    console.log("🔍 RoomRepository.getPropertyRoomTypes - Result:", {
      propertyId,
      roomTypesCount: roomTypes.length,
      summary: response.summary
    });

    return response;
  }
}
