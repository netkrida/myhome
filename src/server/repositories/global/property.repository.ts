import { type Property, type PropertyImage, type Prisma } from "@prisma/client";
import { prisma } from "../../db/client";
import type {
  CreatePropertyDTO,
  UpdatePropertyDTO,
  PropertyListQuery,
  PropertyApprovalDTO,
  PropertyStatsDTO,
  PropertyListItem,
  PropertyDetailItem,
  PaginationDTO,
  PropertyCoordinate,
  PublicPropertyCardDTO,
  PublicPropertiesQuery,
  PublicPropertiesResponse,
  PublicPropertyDetailDTO
} from "../../types";
import { PropertyStatus, PropertyType, ImageCategory, type PropertyFacility } from "../../types/property";

/**
 * Property Repository
 * Data access layer for property operations
 */
export class PropertyRepository {
  /**
   * Find property by ID with optional includes
   */
  static async findById(
    id: string, 
    includeImages: boolean = true,
    includeRooms: boolean = false,
    includeOwner: boolean = false
  ): Promise<PropertyDetailItem | null> {
    const include: Prisma.PropertyInclude = {};
    
    if (includeImages) {
      include.images = {
        orderBy: { sortOrder: 'asc' }
      };
    }
    
    if (includeRooms) {
      include.rooms = {
        orderBy: { roomNumber: 'asc' }
      };
      // Note: Room images will be fetched separately using RoomTypeImage
      // to avoid duplication (shared images per room type)
    }
    
    if (includeOwner) {
      include.owner = {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true
        }
      };
      include.approver = {
        select: {
          id: true,
          name: true,
          email: true
        }
      };
    }

    console.log("🔍 PropertyRepository.findById - Query:", {
      id,
      includeImages,
      includeRooms,
      includeOwner,
      include
    });

    const property = await prisma.property.findUnique({
      where: { id },
      include,
    });

    console.log("🔍 PropertyRepository.findById - Result:", {
      found: !!property,
      propertyId: property?.id,
      propertyName: property?.name,
      imagesCount: property?.images?.length || 0,
      roomsCount: property?.rooms?.length || 0,
      hasOwner: !!property?.owner
    });

    if (!property) return null;

    // If includeRooms, fetch shared room type images
    let roomTypeImagesMap = new Map<string, any[]>();
    if (includeRooms && property.rooms && property.rooms.length > 0) {
      const roomTypeImages = await prisma.roomTypeImage.findMany({
        where: {
          propertyId: id,
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Group images by room type
      for (const img of roomTypeImages) {
        if (!roomTypeImagesMap.has(img.roomType)) {
          roomTypeImagesMap.set(img.roomType, []);
        }
        roomTypeImagesMap.get(img.roomType)!.push({
          id: img.id,
          category: img.category,
          imageUrl: img.imageUrl,
          publicId: img.publicId || undefined,
          caption: img.caption || undefined,
          sortOrder: img.sortOrder,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        });
      }
    }

    // Transform to PropertyDetailItem
    return {
      id: property.id,
      name: property.name,
      buildYear: property.buildYear,
      propertyType: property.propertyType as PropertyType,
      description: property.description,
      roomTypes: property.roomTypes as string[],
      totalRooms: property.totalRooms,
      availableRooms: property.availableRooms,
      location: {
        provinceCode: property.provinceCode,
        provinceName: property.provinceName,
        regencyCode: property.regencyCode,
        regencyName: property.regencyName,
        districtCode: property.districtCode,
        districtName: property.districtName,
        fullAddress: property.fullAddress,
        latitude: property.latitude,
        longitude: property.longitude,
      },
      facilities: property.facilities as any[],
      rules: property.rules as any[],
      status: property.status as PropertyStatus,
      ownerId: property.ownerId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      approvedAt: property.approvedAt || undefined,
      approvedBy: property.approvedBy || undefined,
      images: property.images?.map(img => ({
        id: img.id,
        category: img.category as any,
        imageUrl: img.imageUrl,
        publicId: img.publicId || undefined,
        caption: img.caption || undefined,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })) || [],
      owner: property.owner as any,
      approver: property.approver as any,
      rooms: property.rooms?.map(room => ({
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
        hasDeposit: room.hasDeposit,
        depositPercentage: room.depositPercentage || undefined,
        facilities: room.facilities as any[],
        isAvailable: room.isAvailable,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        // Use shared room type images instead of per-room images
        images: roomTypeImagesMap.get(room.roomType) || [],
      })) || [],
    };
  }

  /**
   * Create a new property
   */
  static async create(propertyData: CreatePropertyDTO, ownerId: string): Promise<Property> {
    console.log("🔍 PropertyRepository.create called with ownerId:", ownerId);
    const { step1, step2, step3, step4 } = propertyData;

    // Create property in a transaction to ensure consistency
    return prisma.$transaction(async (tx) => {
      // Create the property
      const property = await tx.property.create({
        data: {
          name: step1.name,
          buildYear: step1.buildYear,
          propertyType: step1.propertyType,
          description: step1.description,
          roomTypes: step1.roomTypes,
          totalRooms: step1.totalRooms,
          availableRooms: step1.availableRooms,
          provinceCode: step2.location.provinceCode || 'UNKNOWN',
          provinceName: step2.location.provinceName,
          regencyCode: step2.location.regencyCode || 'UNKNOWN',
          regencyName: step2.location.regencyName,
          districtCode: step2.location.districtCode || 'UNKNOWN',
          districtName: step2.location.districtName,
          fullAddress: step2.location.fullAddress,
          latitude: step2.location.latitude,
          longitude: step2.location.longitude,
          facilities: step4.facilities as any,
          rules: step4.rules as any,
          ownerId,
          status: PropertyStatus.PENDING,
        },
      });

      // Create property images if provided
      if (step3?.images) {
        const imageData: Prisma.PropertyImageCreateManyInput[] = [];
        let sortOrder = 0;

        // Building photos
        if (step3.images.buildingPhotos) {
          step3.images.buildingPhotos.forEach((imageUrl: string) => {
            imageData.push({
              propertyId: property.id,
              category: ImageCategory.BUILDING_PHOTOS,
              imageUrl,
              sortOrder: sortOrder++,
            });
          });
        }

        // Shared facilities photos
        if (step3.images.sharedFacilitiesPhotos) {
          step3.images.sharedFacilitiesPhotos.forEach((imageUrl: string) => {
            imageData.push({
              propertyId: property.id,
              category: ImageCategory.SHARED_FACILITIES_PHOTOS,
              imageUrl,
              sortOrder: sortOrder++,
            });
          });
        }

        // Floor plan photos
        if (step3.images.floorPlanPhotos) {
          step3.images.floorPlanPhotos.forEach((imageUrl: string) => {
            imageData.push({
              propertyId: property.id,
              category: ImageCategory.FLOOR_PLAN_PHOTOS,
              imageUrl,
              sortOrder: sortOrder++,
            });
          });
        }

        // Create all images at once
        if (imageData.length > 0) {
          await tx.propertyImage.createMany({
            data: imageData,
          });
        }
      }

      return property;
    });
  }

  /**
   * Update property
   */
  static async update(id: string, updateData: UpdatePropertyDTO): Promise<Property> {
    const data: Prisma.PropertyUpdateInput = {};
    
    if (updateData.name) data.name = updateData.name;
    if (updateData.buildYear) data.buildYear = updateData.buildYear;
    if (updateData.propertyType) data.propertyType = updateData.propertyType;
    if (updateData.description) data.description = updateData.description;
    if (updateData.roomTypes) data.roomTypes = updateData.roomTypes;
    if (updateData.totalRooms) data.totalRooms = updateData.totalRooms;
    if (updateData.facilities) data.facilities = updateData.facilities as any;
    if (updateData.rules) data.rules = updateData.rules as any;
    
    if (updateData.location) {
      if (updateData.location.provinceCode) data.provinceCode = updateData.location.provinceCode;
      if (updateData.location.provinceName) data.provinceName = updateData.location.provinceName;
      if (updateData.location.regencyCode) data.regencyCode = updateData.location.regencyCode;
      if (updateData.location.regencyName) data.regencyName = updateData.location.regencyName;
      if (updateData.location.districtCode) data.districtCode = updateData.location.districtCode;
      if (updateData.location.districtName) data.districtName = updateData.location.districtName;
      if (updateData.location.fullAddress) data.fullAddress = updateData.location.fullAddress;
      if (updateData.location.latitude) data.latitude = updateData.location.latitude;
      if (updateData.location.longitude) data.longitude = updateData.location.longitude;
    }

    return prisma.property.update({
      where: { id },
      data,
    });
  }

  /**
   * Update property status (approval/rejection)
   */
  static async updateStatus(
    id: string, 
    approval: PropertyApprovalDTO, 
    approverId: string
  ): Promise<Property> {
    const data: any = {
      status: approval.status,
      approvedBy: approverId,
      approvedAt: new Date(),
    };

    return prisma.property.update({
      where: { id },
      data,
    });
  }

  /**
   * Update available rooms count
   */
  static async updateAvailableRooms(id: string, availableRooms: number): Promise<Property> {
    return prisma.property.update({
      where: { id },
      data: { availableRooms },
    });
  }

  /**
   * Delete property
   */
  static async delete(id: string): Promise<Property> {
    return prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Find properties with filtering and pagination
   */
  static async findMany(filters: PropertyListQuery): Promise<{
    properties: PropertyListItem[];
    pagination: PaginationDTO;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      propertyType,
      status,
      ownerId,
      provinceCode,
      regencyCode,
      districtCode,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: Prisma.PropertyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { fullAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    if (propertyType) where.propertyType = propertyType;
    if (status) where.status = status;
    if (ownerId) where.ownerId = ownerId;
    if (provinceCode) where.provinceCode = provinceCode;
    if (regencyCode) where.regencyCode = regencyCode;
    if (districtCode) where.districtCode = districtCode;

    // Get total count
    const total = await prisma.property.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get properties
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          where: { category: 'BUILDING_PHOTOS' },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    const propertyListItems: PropertyListItem[] = properties.map(property => ({
      id: property.id,
      name: property.name,
      propertyType: property.propertyType as PropertyType,
      status: property.status as PropertyStatus,
      totalRooms: property.totalRooms,
      availableRooms: property.availableRooms,
      location: {
        provinceName: property.provinceName,
        regencyName: property.regencyName,
        districtName: property.districtName,
      },
      owner: {
        id: property.owner.id,
        name: property.owner.name || undefined,
        email: property.owner.email || undefined,
      },
      facilities: property.facilities as unknown as PropertyFacility[],
      createdAt: property.createdAt,
      mainImage: property.images[0]?.imageUrl,
    }));

    return {
      properties: propertyListItems,
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
   * Get property statistics
   */
  static async getStatistics(ownerId?: string): Promise<PropertyStatsDTO> {
    const where: Prisma.PropertyWhereInput = ownerId ? { ownerId } : {};

    const [
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      roomStats
    ] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.count({ where: { ...where, status: PropertyStatus.PENDING } }),
      prisma.property.count({ where: { ...where, status: PropertyStatus.APPROVED } }),
      prisma.property.count({ where: { ...where, status: PropertyStatus.REJECTED } }),
      prisma.property.aggregate({
        where,
        _sum: {
          totalRooms: true,
          availableRooms: true,
        },
      }),
    ]);

    const totalRooms = roomStats._sum.totalRooms || 0;
    const availableRooms = roomStats._sum.availableRooms || 0;
    const occupancyRate = totalRooms > 0 ? ((totalRooms - availableRooms) / totalRooms) * 100 : 0;

    return {
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      totalRooms,
      availableRooms,
      occupancyRate,
    };
  }

  /**
   * Find properties by owner
   */
  static async findByOwner(ownerId: string): Promise<Property[]> {
    return prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find approved properties for public listing
   */
  static async findApproved(filters: Omit<PropertyListQuery, 'status'>): Promise<{
    properties: PropertyListItem[];
    pagination: PaginationDTO;
  }> {
    return this.findMany({ ...filters, status: PropertyStatus.APPROVED });
  }

  /**
   * Bulk update property status
   */
  static async bulkUpdateStatus(
    propertyIds: string[],
    status: PropertyStatus,
    approverId: string
  ): Promise<{ count: number }> {
    return prisma.property.updateMany({
      where: { id: { in: propertyIds } },
      data: {
        status,
        approvedBy: approverId,
        approvedAt: new Date()
      },
    });
  }

  /**
   * Get property coordinates for map display
   * Returns approved properties with valid coordinates
   */
  static async getPropertyCoordinates(): Promise<PropertyCoordinate[]> {
    const properties = await prisma.property.findMany({
      where: {
        status: PropertyStatus.APPROVED,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        propertyType: true,
        districtName: true,
        regencyName: true,
        provinceName: true,
        images: {
          where: { category: ImageCategory.BUILDING_PHOTOS },
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { imageUrl: true }
        },
        rooms: {
          select: {
            id: true,
            isAvailable: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return properties.map(property => ({
      id: property.id,
      name: property.name,
      latitude: property.latitude!,
      longitude: property.longitude!,
      propertyType: property.propertyType as PropertyType,
      location: {
        districtName: property.districtName,
        regencyName: property.regencyName,
        provinceName: property.provinceName,
      },
      totalRooms: property.rooms.length,
      availableRooms: property.rooms.filter(room => room.isAvailable).length,
      mainImage: property.images[0]?.imageUrl,
    }));
  }

  /**
   * Get public properties for homepage with filtering and pagination
   */
  static async getPublicProperties(filters: PublicPropertiesQuery): Promise<PublicPropertiesResponse> {
    const {
      page = 1,
      limit = 12,
      propertyType,
      provinceName,
      regencyName,
      districtName,
      minPrice,
      maxPrice,
      sortBy = "newest",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where: Prisma.PropertyWhereInput = {
      status: PropertyStatus.APPROVED, // Only approved properties
    };

    if (propertyType) where.propertyType = propertyType;
    if (provinceName) {
      where.provinceName = {
        contains: provinceName,
        mode: 'insensitive' // Case-insensitive partial match
      };
    }
    if (regencyName) {
      // Clean regency name: remove prefix like "KABUPATEN ", "KOTA ", "KAB. ", etc
      const cleanRegencyName = regencyName
        .replace(/^(KABUPATEN|KOTA|KAB\.|KOTA)\s+/i, '')
        .trim();

      console.log("🧹 Cleaning regency name:", {
        original: regencyName,
        cleaned: cleanRegencyName
      });

      where.regencyName = {
        contains: cleanRegencyName,
        mode: 'insensitive' // Case-insensitive partial match
      };
    }
    if (districtName) {
      where.districtName = {
        contains: districtName,
        mode: 'insensitive' // Case-insensitive partial match
      };
    }

    // Debug logging
    console.log("🔍 Repository Filter - WHERE clause:", JSON.stringify(where, null, 2));
    console.log("📍 Filter values:", { provinceName, regencyName, districtName });

    // Get total count
    const total = await prisma.property.count({ where });
    console.log("📊 Total properties found:", total);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Build orderBy clause
    let orderBy: Prisma.PropertyOrderByWithRelationInput = {};
    if (sortBy === "newest") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "price") {
      // For price sorting, we'll sort after getting the data since Prisma doesn't support
      // sorting by aggregated fields in findMany. We'll sort in memory after transformation.
      orderBy = { createdAt: 'desc' }; // Default sort, will be overridden later
    }

    // Get properties with rooms and images
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        rooms: {
          select: {
            monthlyPrice: true,
            isAvailable: true,
          },
          where: {
            isAvailable: true, // Only available rooms for price calculation
          },
          orderBy: {
            monthlyPrice: 'asc', // Get cheapest first
          }
        },
        images: {
          where: {
            category: ImageCategory.BUILDING_PHOTOS
          },
          orderBy: {
            sortOrder: 'asc'
          },
          take: 1, // Only get the main image
        },
      },
    });

    // Transform to DTO and apply price filtering if needed
    let transformedProperties: PublicPropertyCardDTO[] = properties
      .map(property => {
        // Get cheapest monthly price from available rooms
        const cheapestPrice = property.rooms.length > 0
          ? Math.min(...property.rooms.map(room => Number(room.monthlyPrice)))
          : 0;

        return {
          id: property.id,
          name: property.name,
          propertyType: property.propertyType as PropertyType,
          availableRooms: property.availableRooms,
          facilities: property.facilities as unknown as PropertyFacility[],
          cheapestMonthlyPrice: cheapestPrice,
          mainImage: property.images[0]?.imageUrl,
          location: {
            districtName: property.districtName,
            regencyName: property.regencyName,
          },
        };
      });

    // Apply price filtering after transformation
    if (minPrice !== undefined) {
      transformedProperties = transformedProperties.filter(
        property => property.cheapestMonthlyPrice >= minPrice
      );
    }
    if (maxPrice !== undefined) {
      transformedProperties = transformedProperties.filter(
        property => property.cheapestMonthlyPrice <= maxPrice
      );
    }

    // Apply price sorting after transformation if needed
    if (sortBy === "price") {
      transformedProperties.sort((a, b) => {
        if (sortOrder === "asc") {
          return a.cheapestMonthlyPrice - b.cheapestMonthlyPrice;
        } else {
          return b.cheapestMonthlyPrice - a.cheapestMonthlyPrice;
        }
      });
    }

    // If we applied price filtering, we need to recalculate pagination
    const filteredTotal = transformedProperties.length;
    const filteredTotalPages = Math.ceil(filteredTotal / limit);

    return {
      properties: transformedProperties,
      pagination: {
        page,
        limit,
        total: minPrice !== undefined || maxPrice !== undefined ? filteredTotal : total,
        totalPages: minPrice !== undefined || maxPrice !== undefined ? filteredTotalPages : totalPages,
        hasNext: page < (minPrice !== undefined || maxPrice !== undefined ? filteredTotalPages : totalPages),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get public property detail by ID
   * Only returns APPROVED properties with all related data
   */
  static async getPublicPropertyDetail(id: string): Promise<PublicPropertyDetailDTO | null> {
    console.log("🔍 PropertyRepository.getPublicPropertyDetail - Query:", { id });

    const property = await prisma.property.findUnique({
      where: {
        id,
        status: PropertyStatus.APPROVED // Only approved properties are public
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        rooms: {
          orderBy: { roomNumber: 'asc' }
        },
        owner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          }
        }
      },
    });

    console.log("🔍 PropertyRepository.getPublicPropertyDetail - Result:", {
      found: !!property,
      propertyId: property?.id,
      propertyName: property?.name,
      status: property?.status,
      imagesCount: property?.images?.length || 0,
      roomsCount: property?.rooms?.length || 0,
      hasOwner: !!property?.owner,
      ownerPhone: property?.owner?.phoneNumber ? "***" : null
    });

    if (!property) return null;

    // Get shared room type images for all rooms
    let roomTypeImagesMap = new Map<string, any[]>();
    if (property.rooms && property.rooms.length > 0) {
      const roomTypeImages = await prisma.roomTypeImage.findMany({
        where: {
          propertyId: id,
        },
        orderBy: { sortOrder: 'asc' },
      });

      // Group images by room type
      for (const img of roomTypeImages) {
        if (!roomTypeImagesMap.has(img.roomType)) {
          roomTypeImagesMap.set(img.roomType, []);
        }
        roomTypeImagesMap.get(img.roomType)!.push({
          id: img.id,
          category: img.category,
          imageUrl: img.imageUrl,
          publicId: img.publicId || undefined,
          caption: img.caption || undefined,
          sortOrder: img.sortOrder,
          createdAt: img.createdAt,
          updatedAt: img.updatedAt,
        });
      }
    }

    // Transform to PublicPropertyDetailDTO
    return {
      id: property.id,
      name: property.name,
      buildYear: property.buildYear,
      propertyType: property.propertyType as PropertyType,
      description: property.description,
      roomTypes: property.roomTypes as string[],
      totalRooms: property.totalRooms,
      availableRooms: property.availableRooms,
      location: {
        provinceCode: property.provinceCode,
        provinceName: property.provinceName,
        regencyCode: property.regencyCode,
        regencyName: property.regencyName,
        districtCode: property.districtCode,
        districtName: property.districtName,
        fullAddress: property.fullAddress,
        latitude: property.latitude,
        longitude: property.longitude,
      },
      facilities: property.facilities as any[],
      rules: property.rules as any[],
      images: property.images?.map(img => ({
        id: img.id,
        category: img.category as any,
        imageUrl: img.imageUrl,
        publicId: img.publicId || undefined,
        caption: img.caption || undefined,
        sortOrder: img.sortOrder,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })) || [],
      rooms: property.rooms?.map(room => ({
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
        // Use shared room type images
        images: roomTypeImagesMap.get(room.roomType) || [],
      })) || [],
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };
  }

  /**
   * Get property owner contact information by property ID
   * Used for WhatsApp contact feature on public property detail page
   */
  static async getPropertyOwnerContact(id: string): Promise<{
    propertyId: string;
    propertyName: string;
    ownerId: string;
    ownerName: string | null;
    ownerPhoneNumber: string | null;
  } | null> {
    const property = await prisma.property.findUnique({
      where: {
        id,
        status: PropertyStatus.APPROVED // Only approved properties
      },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          }
        }
      },
    });

    if (!property) return null;

    return {
      propertyId: property.id,
      propertyName: property.name,
      ownerId: property.owner.id,
      ownerName: property.owner.name,
      ownerPhoneNumber: property.owner.phoneNumber,
    };
  }
}
