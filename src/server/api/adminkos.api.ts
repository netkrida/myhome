/**
 * AdminKos Dashboard API (Tier 2)
 * Application service layer for AdminKos dashboard operations
 */

import { withAuth } from "../lib/auth";
import { UserRole } from "../types/rbac";
import type { UserContext } from "../types/rbac";
import type { Result } from "../types/result";
import { ok, forbidden, internalError } from "../types/result";
import { prisma } from "../db/client";
import type {
  AdminKosSummaryDTO,
  TodayActivityDTO,
  RevenueChartDTO,
  PaymentTypeBreakdownDTO,
  RecentBookingsDTO,
  AdminKosRoomsDTO,
  MyPropertiesDTO,
  AdminKosDashboardQuery,
  AdminKosBookingsQuery,
  AdminKosRoomsQuery,
  BookingActivityDTO,
  PendingPaymentDTO,
  MonthlyRevenueDTO,
  BookingTableItemDTO,
  RoomTableItemDTO,
  PropertyCardDTO,
  // New types
  RoomsSummaryDTO,
  RoomGridItemDTO,
  ActiveBookingDetailDTO,
  RoomDetailDTO,
  EditRoomDTO,
  AddRoomDTO,
} from "../types/adminkos";
import { BookingStatus, PaymentStatus, PaymentType } from "../types/booking";

/**
 * AdminKos Dashboard API
 */
export class AdminKosAPI {
  /**
   * Get dashboard summary (KPIs)
   * Only accessible by ADMINKOS role
   */
  static getSummary = withAuth(
    async (userContext: UserContext, query?: AdminKosDashboardQuery): Promise<Result<AdminKosSummaryDTO>> => {
      try {
        // Check permissions
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this dashboard");
        }

        // Get user's property IDs
        const propertyIds = query?.propertyIds || await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          // No properties yet
          return ok({
            totalActiveProperties: 0,
            totalRooms: 0,
            availableRooms: 0,
            occupancyRate: 0,
            activeBookings: 0,
            revenueThisMonth: 0,
            depositReceivedThisMonth: 0,
            pendingPayments: 0,
          });
        }

        // Get current month range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Execute all queries in parallel
        const [
          totalActiveProperties,
          totalRooms,
          availableRooms,
          activeBookings,
          revenueThisMonth,
          depositReceivedThisMonth,
          pendingPayments,
        ] = await Promise.all([
          // Total Active Properties (APPROVED)
          prisma.property.count({
            where: {
              ownerId: userContext.id,
              status: "APPROVED",
            },
          }),

          // Total Rooms
          prisma.room.count({
            where: {
              propertyId: { in: propertyIds },
            },
          }),

          // Available Rooms
          prisma.room.count({
            where: {
              propertyId: { in: propertyIds },
              isAvailable: true,
            },
          }),

          // Active Bookings (UNPAID, DEPOSIT_PAID, CONFIRMED, CHECKED_IN)
          prisma.booking.count({
            where: {
              propertyId: { in: propertyIds },
              status: {
                in: [
                  BookingStatus.UNPAID,
                  BookingStatus.DEPOSIT_PAID,
                  BookingStatus.CONFIRMED,
                  BookingStatus.CHECKED_IN,
                ],
              },
            },
          }),

          // Revenue This Month (SUCCESS payments)
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: PaymentStatus.SUCCESS,
              transactionTime: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
              booking: {
                propertyId: { in: propertyIds },
              },
            },
          }),

          // Deposit Received This Month
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: PaymentStatus.SUCCESS,
              paymentType: PaymentType.DEPOSIT,
              transactionTime: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
              booking: {
                propertyId: { in: propertyIds },
              },
            },
          }),

          // Pending Payments
          prisma.payment.count({
            where: {
              status: PaymentStatus.PENDING,
              booking: {
                propertyId: { in: propertyIds },
              },
            },
          }),
        ]);

        // Calculate occupancy rate
        const occupancyRate = totalRooms > 0
          ? Math.round((1 - (availableRooms / totalRooms)) * 100)
          : 0;

        return ok({
          totalActiveProperties,
          totalRooms,
          availableRooms,
          occupancyRate,
          activeBookings,
          revenueThisMonth: Number(revenueThisMonth._sum.amount || 0),
          depositReceivedThisMonth: Number(depositReceivedThisMonth._sum.amount || 0),
          pendingPayments,
        });
      } catch (error) {
        console.error("Error getting AdminKos summary:", error);
        return internalError("Failed to get dashboard summary");
      }
    }
  );

  /**
   * Get today's activities (check-ins, check-outs, pending payments)
   */
  static getTodayActivity = withAuth(
    async (userContext: UserContext): Promise<Result<TodayActivityDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          return ok({
            checkInsToday: [],
            checkOutsToday: [],
            pendingPayments: [],
          });
        }

        // Get today's date range
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // Get check-ins today (CONFIRMED status, checkInDate = today)
        const checkInsToday = await prisma.booking.findMany({
          where: {
            propertyId: { in: propertyIds },
            status: BookingStatus.CONFIRMED,
            checkInDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            user: { select: { name: true } },
            property: { select: { name: true } },
            room: { select: { roomNumber: true } },
          },
          orderBy: { checkInDate: "asc" },
        });

        // Get check-outs today (CHECKED_IN status, checkOutDate = today)
        const checkOutsToday = await prisma.booking.findMany({
          where: {
            propertyId: { in: propertyIds },
            status: BookingStatus.CHECKED_IN,
            checkOutDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            user: { select: { name: true } },
            property: { select: { name: true } },
            room: { select: { roomNumber: true } },
          },
          orderBy: { checkOutDate: "asc" },
        });

        // Get pending payments expiring within 24 hours
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const pendingPayments = await prisma.payment.findMany({
          where: {
            status: PaymentStatus.PENDING,
            expiryTime: {
              lte: next24Hours,
              gte: now,
            },
            booking: {
              propertyId: { in: propertyIds },
            },
          },
          include: {
            booking: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
          orderBy: { expiryTime: "asc" },
        });

        return ok({
          checkInsToday: checkInsToday.map((booking): BookingActivityDTO => ({
            id: booking.id,
            bookingCode: booking.bookingCode,
            customerName: booking.user.name || "Unknown",
            propertyName: booking.property.name,
            roomNumber: booking.room.roomNumber,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            status: booking.status as BookingStatus,
          })),
          checkOutsToday: checkOutsToday.map((booking): BookingActivityDTO => ({
            id: booking.id,
            bookingCode: booking.bookingCode,
            customerName: booking.user.name || "Unknown",
            propertyName: booking.property.name,
            roomNumber: booking.room.roomNumber,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            status: booking.status as BookingStatus,
          })),
          pendingPayments: pendingPayments.map((payment): PendingPaymentDTO => {
            const hoursUntilExpiry = payment.expiryTime
              ? Math.max(0, Math.floor((payment.expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60)))
              : null;

            return {
              id: payment.id,
              bookingCode: payment.booking.bookingCode,
              customerName: payment.booking.user.name || "Unknown",
              amount: Number(payment.amount),
              paymentType: payment.paymentType as PaymentType,
              expiryTime: payment.expiryTime,
              status: payment.status as PaymentStatus,
              hoursUntilExpiry,
            };
          }),
        });
      } catch (error) {
        console.error("Error getting today's activity:", error);
        return internalError("Failed to get today's activity");
      }
    }
  );

  /**
   * Get revenue chart data (12 months)
   */
  static getRevenueChart = withAuth(
    async (userContext: UserContext): Promise<Result<RevenueChartDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          return ok({ months: [] });
        }

        // Get last 12 months
        const months: MonthlyRevenueDTO[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

          // Get payments for this month
          const [totalRevenue, depositRevenue, fullRevenue, transactionCount] = await Promise.all([
            prisma.payment.aggregate({
              _sum: { amount: true },
              where: {
                status: PaymentStatus.SUCCESS,
                transactionTime: { gte: startOfMonth, lte: endOfMonth },
                booking: { propertyId: { in: propertyIds } },
              },
            }),
            prisma.payment.aggregate({
              _sum: { amount: true },
              where: {
                status: PaymentStatus.SUCCESS,
                paymentType: PaymentType.DEPOSIT,
                transactionTime: { gte: startOfMonth, lte: endOfMonth },
                booking: { propertyId: { in: propertyIds } },
              },
            }),
            prisma.payment.aggregate({
              _sum: { amount: true },
              where: {
                status: PaymentStatus.SUCCESS,
                paymentType: PaymentType.FULL,
                transactionTime: { gte: startOfMonth, lte: endOfMonth },
                booking: { propertyId: { in: propertyIds } },
              },
            }),
            prisma.payment.count({
              where: {
                status: PaymentStatus.SUCCESS,
                transactionTime: { gte: startOfMonth, lte: endOfMonth },
                booking: { propertyId: { in: propertyIds } },
              },
            }),
          ]);

          months.push({
            month: monthDate.toISOString().slice(0, 7), // "2024-01"
            totalRevenue: Number(totalRevenue._sum.amount || 0),
            depositRevenue: Number(depositRevenue._sum.amount || 0),
            fullRevenue: Number(fullRevenue._sum.amount || 0),
            transactionCount,
          });
        }

        return ok({ months });
      } catch (error) {
        console.error("Error getting revenue chart:", error);
        return internalError("Failed to get revenue chart");
      }
    }
  );

  /**
   * Get payment type breakdown for current month
   */
  static getPaymentTypeBreakdown = withAuth(
    async (userContext: UserContext): Promise<Result<PaymentTypeBreakdownDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          return ok({ deposit: 0, full: 0, totalAmount: 0 });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const [depositPayments, fullPayments] = await Promise.all([
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: PaymentStatus.SUCCESS,
              paymentType: PaymentType.DEPOSIT,
              transactionTime: { gte: startOfMonth, lte: endOfMonth },
              booking: { propertyId: { in: propertyIds } },
            },
          }),
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
              status: PaymentStatus.SUCCESS,
              paymentType: PaymentType.FULL,
              transactionTime: { gte: startOfMonth, lte: endOfMonth },
              booking: { propertyId: { in: propertyIds } },
            },
          }),
        ]);

        const deposit = Number(depositPayments._sum.amount || 0);
        const full = Number(fullPayments._sum.amount || 0);

        return ok({
          deposit,
          full,
          totalAmount: deposit + full,
        });
      } catch (error) {
        console.error("Error getting payment type breakdown:", error);
        return internalError("Failed to get payment type breakdown");
      }
    }
  );

  /**
   * Get recent bookings with pagination and filtering
   */
  static getRecentBookings = withAuth(
    async (userContext: UserContext, query: AdminKosBookingsQuery): Promise<Result<RecentBookingsDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          return ok({
            bookings: [],
            pagination: { page: 1, limit: query.limit || 10, total: 0, totalPages: 0 },
          });
        }

        const {
          page = 1,
          limit = 10,
          propertyId,
          status,
          paymentStatus,
          leaseType,
          search,
          dateFrom,
          dateTo,
          sortBy = "createdAt",
          sortOrder = "desc",
          overdue,
        } = query;

        // Build where clause
        const where: any = {
          propertyId: propertyId ? propertyId : { in: propertyIds },
        };

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (leaseType) where.leaseType = leaseType;

        // Filter overdue: booking yang checkOutDate sudah lewat dan status masih aktif
        if (overdue) {
          const now = new Date();
          where.checkOutDate = { lt: now };
          where.status = {
            notIn: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
          };
        }

        if (search) {
          where.OR = [
            { bookingCode: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { room: { roomNumber: { contains: search, mode: "insensitive" } } },
          ];
        }

        if (dateFrom || dateTo) {
          where.createdAt = {};
          if (dateFrom) where.createdAt.gte = dateFrom;
          if (dateTo) where.createdAt.lte = dateTo;
        }

        // Get total count
        const total = await prisma.booking.count({ where });

        // Get bookings
        const skip = (page - 1) * limit;
        const bookings = await prisma.booking.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            user: { select: { name: true, email: true, phoneNumber: true } },
            property: { select: { name: true } },
            room: { select: { roomNumber: true, roomType: true } },
          },
        });

        const totalPages = Math.ceil(total / limit);
        const now = new Date();

        return ok({
          bookings: bookings.map((booking): BookingTableItemDTO => {
            // Calculate lease duration based on checkIn and checkOut dates
            const checkInDate = new Date(booking.checkInDate);
            const checkOutDate = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
            const leaseDuration = checkOutDate
              ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            // Calculate remaining days until checkout
            let remainingDays = 0;
            if (checkOutDate && booking.status !== BookingStatus.COMPLETED && booking.status !== BookingStatus.CANCELLED) {
              remainingDays = Math.ceil((checkOutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (remainingDays < 0) remainingDays = 0;
            }

            return {
              id: booking.id,
              bookingCode: booking.bookingCode,
              createdAt: booking.createdAt,
              customerName: booking.user.name || "Unknown",
              customerEmail: booking.user.email || "",
              customerPhone: booking.user.phoneNumber || null,
              propertyName: booking.property.name,
              roomNumber: booking.room.roomNumber,
              roomType: booking.room.roomType,
              leaseType: booking.leaseType as any,
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkOutDate,
              actualCheckInAt: booking.actualCheckInAt,
              actualCheckOutAt: booking.actualCheckOutAt,
              leaseDuration,
              remainingDays,
              totalAmount: Number(booking.totalAmount),
              discountAmount: booking.discountAmount ? Number(booking.discountAmount) : null,
              discountNote: booking.discountNote ?? null,
              finalAmount: booking.finalAmount ? Number(booking.finalAmount) : null,
              depositAmount: booking.depositAmount ? Number(booking.depositAmount) : null,
              paymentStatus: booking.paymentStatus as PaymentStatus,
              status: booking.status as BookingStatus,
            };
          }),
          pagination: { page, limit, total, totalPages },
        });
      } catch (error) {
        console.error("Error getting recent bookings:", error);
        return internalError("Failed to get recent bookings");
      }
    }
  );

  /**
   * Get rooms with pagination and filtering
   */
  static getRooms = withAuth(
    async (userContext: UserContext, query: AdminKosRoomsQuery): Promise<Result<AdminKosRoomsDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          return ok({
            rooms: [],
            pagination: { page: 1, limit: query.limit || 10, total: 0, totalPages: 0 },
          });
        }

        const {
          page = 1,
          limit = 10,
          propertyId,
          isAvailable,
          roomType,
          minPrice,
          maxPrice,
          sortBy = "roomNumber",
          sortOrder = "asc",
        } = query;

        // Build where clause
        const where: any = {
          propertyId: propertyId ? propertyId : { in: propertyIds },
        };

        if (isAvailable !== undefined) where.isAvailable = isAvailable;
        if (roomType) where.roomType = { contains: roomType, mode: "insensitive" };
        if (minPrice || maxPrice) {
          where.monthlyPrice = {};
          if (minPrice) where.monthlyPrice.gte = minPrice;
          if (maxPrice) where.monthlyPrice.lte = maxPrice;
        }

        // Get total count
        const total = await prisma.room.count({ where });

        // Get rooms
        const skip = (page - 1) * limit;
        const rooms = await prisma.room.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            property: { select: { name: true } },
          },
        });

        const totalPages = Math.ceil(total / limit);

        return ok({
          rooms: rooms.map((room): RoomTableItemDTO => ({
            id: room.id,
            propertyId: room.propertyId,
            propertyName: room.property.name,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            floor: room.floor,
            monthlyPrice: Number(room.monthlyPrice),
            dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : null,
            weeklyPrice: room.weeklyPrice ? Number(room.weeklyPrice) : null,
            quarterlyPrice: room.quarterlyPrice ? Number(room.quarterlyPrice) : null,
            yearlyPrice: room.yearlyPrice ? Number(room.yearlyPrice) : null,
            isAvailable: room.isAvailable,
            updatedAt: room.updatedAt,
            mainImageUrl: null,
          })),
          pagination: { page, limit, total, totalPages },
        });
      } catch (error) {
        console.error("Error getting rooms:", error);
        return internalError("Failed to get rooms");
      }
    }
  );

  /**
   * Get my properties with stats
   */
  static getMyProperties = withAuth(
    async (userContext: UserContext): Promise<Result<MyPropertiesDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        // Get all properties owned by user
        const properties = await prisma.property.findMany({
          where: { ownerId: userContext.id },
          include: {
            images: {
              where: { category: "BUILDING_PHOTOS" },
              orderBy: { sortOrder: "asc" },
              take: 1,
            },
            rooms: {
              select: {
                id: true,
                isAvailable: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Get current month range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Get revenue for each property
        const propertiesWithStats = await Promise.all(
          properties.map(async (property): Promise<PropertyCardDTO> => {
            const totalRooms = property.rooms.length;
            const availableRooms = property.rooms.filter((r) => r.isAvailable).length;
            const occupancyRate = totalRooms > 0
              ? Math.round((1 - (availableRooms / totalRooms)) * 100)
              : 0;

            // Get revenue for this property this month
            const revenueResult = await prisma.payment.aggregate({
              _sum: { amount: true },
              where: {
                status: PaymentStatus.SUCCESS,
                transactionTime: { gte: startOfMonth, lte: endOfMonth },
                booking: { propertyId: property.id },
              },
            });

            return {
              id: property.id,
              name: property.name,
              status: property.status,
              totalRooms,
              availableRooms,
              occupancyRate,
              revenueThisMonth: Number(revenueResult._sum.amount || 0),
              propertyType: property.propertyType,
              mainImageUrl: property.images[0]?.imageUrl || null,
            };
          })
        );

        return ok({ properties: propertiesWithStats });
      } catch (error) {
        console.error("Error getting my properties:", error);
        return internalError("Failed to get my properties");
      }
    }
  );

  /**
   * Get rooms for grid view (new rooms page)
   */
  static getRoomsGrid = withAuth(
    async (userContext: UserContext, propertyId: string): Promise<Result<RoomGridItemDTO[]>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        // Verify property ownership
        if (!propertyIds.includes(propertyId)) {
          return forbidden("Property not found or access denied");
        }

        // Get rooms with booking status
        const rooms = await prisma.room.findMany({
          where: { propertyId },
          include: {
            property: {
              select: { name: true }
            },
            bookings: {
              where: {
                status: {
                  in: [BookingStatus.DEPOSIT_PAID, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                },
                OR: [
                  { checkOutDate: null },
                  { checkOutDate: { gte: new Date() } }
                ]
              },
              take: 1,
              orderBy: { checkInDate: 'desc' }
            }
          },
          orderBy: [
            { floor: 'asc' },
            { roomNumber: 'asc' }
          ]
        });

        // Get shared room type images for this property
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

        const roomGridItems: RoomGridItemDTO[] = rooms.map(room => {
          const hasActiveBooking = room.bookings.length > 0;
          let status: 'available' | 'occupied' | 'unavailable';

          if (!room.isAvailable) {
            status = 'unavailable';
          } else if (hasActiveBooking) {
            status = 'occupied';
          } else {
            status = 'available';
          }

          return {
            id: room.id,
            propertyId: room.propertyId,
            propertyName: room.property.name,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            floor: room.floor,
            monthlyPrice: Number(room.monthlyPrice),
            dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : null,
            weeklyPrice: room.weeklyPrice ? Number(room.weeklyPrice) : null,
            quarterlyPrice: room.quarterlyPrice ? Number(room.quarterlyPrice) : null,
            yearlyPrice: room.yearlyPrice ? Number(room.yearlyPrice) : null,
            isAvailable: room.isAvailable,
            hasActiveBooking,
            mainImageUrl: roomTypeImageMap.get(room.roomType) || null,
            status,
          };
        });

        return ok(roomGridItems);
      } catch (error) {
        console.error("Error getting rooms grid:", error);
        return internalError("Failed to get rooms grid");
      }
    }
  );

  /**
   * Get rooms summary for new rooms page
   */
  static getRoomsSummary = withAuth(
    async (userContext: UserContext, propertyId?: string): Promise<Result<RoomsSummaryDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        const propertyIds = await AdminKosAPI.getUserPropertyIds(userContext.id);

        if (propertyIds.length === 0) {
          return ok({
            totalRooms: 0,
            availableRooms: 0,
            occupiedRooms: 0,
            occupancyRate: 0,
          });
        }

        // Filter by specific property if provided
        const targetPropertyIds = propertyId ? [propertyId] : propertyIds;

        // Verify property ownership if specific property requested
        if (propertyId && !propertyIds.includes(propertyId)) {
          return forbidden("Property not found or access denied");
        }

        // Get total rooms count
        const totalRooms = await prisma.room.count({
          where: { propertyId: { in: targetPropertyIds } },
        });

        // Get available rooms count (isAvailable: true AND no active bookings)
        const availableRooms = await prisma.room.count({
          where: {
            propertyId: { in: targetPropertyIds },
            isAvailable: true,
            bookings: {
              none: {
                status: {
                  in: [BookingStatus.DEPOSIT_PAID, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                },
                OR: [
                  { checkOutDate: null },
                  { checkOutDate: { gte: new Date() } }
                ]
              }
            }
          },
        });

        // Get occupied rooms count (isAvailable: true AND has active bookings)
        const occupiedRooms = await prisma.room.count({
          where: {
            propertyId: { in: targetPropertyIds },
            isAvailable: true,
            bookings: {
              some: {
                status: {
                  in: [BookingStatus.DEPOSIT_PAID, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                },
                OR: [
                  { checkOutDate: null }, // Monthly/long-term bookings
                  { checkOutDate: { gte: new Date() } } // Bookings that haven't ended
                ]
              }
            }
          }
        });

        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        // Get property name if specific property
        let propertyName: string | undefined;
        if (propertyId) {
          const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { name: true },
          });
          propertyName = property?.name;
        }

        return ok({
          totalRooms,
          availableRooms,
          occupiedRooms,
          occupancyRate,
          propertyName,
        });
      } catch (error) {
        console.error("Error getting rooms summary:", error);
        return internalError("Failed to get rooms summary");
      }
    }
  );

  /**
   * Get active booking detail for a room
   */
  static getActiveBookingDetail = withAuth(
    async (userContext: UserContext, roomId: string): Promise<Result<ActiveBookingDetailDTO | null>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        // First verify room ownership
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            property: {
              select: { ownerId: true, name: true }
            }
          }
        });

        if (!room || room.property.ownerId !== userContext.id) {
          return forbidden("Room not found or access denied");
        }

        // Get active booking
        const booking = await prisma.booking.findFirst({
          where: {
            roomId,
            status: {
              in: [BookingStatus.DEPOSIT_PAID, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
            },
            OR: [
              { checkOutDate: null },
              { checkOutDate: { gte: new Date() } }
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              }
            },
            payments: {
              where: { status: PaymentStatus.SUCCESS },
              select: { amount: true }
            }
          },
          orderBy: { checkInDate: 'desc' }
        });

        if (!booking) {
          return ok(null);
        }

        const paidAmount = booking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingAmount = Number(booking.totalAmount) - paidAmount;

        return ok({
          id: booking.id,
          bookingCode: booking.bookingCode,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          leaseType: booking.leaseType,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalAmount: Number(booking.totalAmount),
          paidAmount,
          remainingAmount,
          room: {
            id: room.id,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            floor: room.floor,
            propertyName: room.property.name,
          },
          user: {
            id: booking.user.id,
            name: booking.user.name || "Unknown",
            email: booking.user.email || "",
            phoneNumber: booking.user.phoneNumber,
          },
        });
      } catch (error) {
        console.error("Error getting active booking detail:", error);
        return internalError("Failed to get active booking detail");
      }
    }
  );

  /**
   * Get room detail with booking information
   */
  static getRoomDetail = withAuth(
    async (userContext: UserContext, roomId: string): Promise<Result<RoomDetailDTO>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can access this data");
        }

        // Get room with all related data
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            property: {
              select: {
                id: true,
                name: true,
                fullAddress: true,
                ownerId: true,
              }
            }
          }
        });

        if (!room || room.property.ownerId !== userContext.id) {
          return forbidden("Room not found or access denied");
        }

        // Get shared room type images
        const roomTypeImages = await prisma.roomTypeImage.findMany({
          where: {
            propertyId: room.propertyId,
            roomType: room.roomType,
          },
          select: {
            id: true,
            imageUrl: true,
            category: true,
          },
          orderBy: { sortOrder: 'asc' }
        });

        // Get active booking if exists
        const activeBooking = await prisma.booking.findFirst({
          where: {
            roomId: room.id,
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              }
            },
            payments: {
              select: {
                amount: true,
              }
            }
          }
        });

        let activeBookingData = null;
        if (activeBooking) {
          const paidAmount = activeBooking.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
          const remainingAmount = Number(activeBooking.totalAmount) - paidAmount;

          activeBookingData = {
            id: activeBooking.id,
            bookingCode: activeBooking.bookingCode,
            status: activeBooking.status,
            paymentStatus: activeBooking.paymentStatus,
            leaseType: activeBooking.leaseType,
            checkInDate: activeBooking.checkInDate,
            checkOutDate: activeBooking.checkOutDate,
            totalAmount: Number(activeBooking.totalAmount),
            paidAmount,
            remainingAmount,
            user: {
              id: activeBooking.user.id,
              name: activeBooking.user.name || "Unknown",
              email: activeBooking.user.email || "",
              phoneNumber: activeBooking.user.phoneNumber,
            },
          };
        }

        return ok({
          id: room.id,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          floor: room.floor,
          description: room.description,
          size: room.size,
          monthlyPrice: Number(room.monthlyPrice),
          dailyPrice: room.dailyPrice ? Number(room.dailyPrice) : null,
          weeklyPrice: room.weeklyPrice ? Number(room.weeklyPrice) : null,
          quarterlyPrice: room.quarterlyPrice ? Number(room.quarterlyPrice) : null,
          yearlyPrice: room.yearlyPrice ? Number(room.yearlyPrice) : null,
          isAvailable: room.isAvailable,
          facilities: room.facilities,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
          property: {
            id: room.property.id,
            name: room.property.name,
            fullAddress: room.property.fullAddress,
          },
          images: roomTypeImages,
          activeBooking: activeBookingData,
        });
      } catch (error) {
        console.error("Error getting room detail:", error);
        return internalError("Failed to get room detail");
      }
    }
  );

  /**
   * Edit room details
   */
  static editRoom = withAuth(
    async (userContext: UserContext, roomId: string, updateData: EditRoomDTO): Promise<Result<void>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can edit rooms");
        }

        // First verify room ownership
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            property: {
              select: { ownerId: true }
            }
          }
        });

        if (!room || room.property.ownerId !== userContext.id) {
          return forbidden("Room not found or access denied");
        }

        // Update room
        await prisma.room.update({
          where: { id: roomId },
          data: updateData,
        });

        return ok(undefined);
      } catch (error) {
        console.error("Error editing room:", error);
        return internalError("Failed to edit room");
      }
    }
  );

  /**
   * Add new room
   */
  static addRoom = withAuth(
    async (userContext: UserContext, roomData: AddRoomDTO): Promise<Result<{ id: string }>> => {
      try {
        if (userContext.role !== UserRole.ADMINKOS) {
          return forbidden("Only AdminKos can add rooms");
        }

        // Verify property ownership
        const property = await prisma.property.findUnique({
          where: { id: roomData.propertyId },
          select: { ownerId: true, totalRooms: true },
        });

        if (!property || property.ownerId !== userContext.id) {
          return forbidden("Property not found or access denied");
        }

        // Check if room number already exists in this property
        const existingRoom = await prisma.room.findFirst({
          where: {
            propertyId: roomData.propertyId,
            roomNumber: roomData.roomNumber,
          },
        });

        if (existingRoom) {
          return {
            success: false,
            error: {
              code: "ROOM_NUMBER_EXISTS",
              message: "Room number already exists in this property",
            },
            statusCode: 400,
          };
        }

        // Create room
        const newRoom = await prisma.$transaction(async (tx) => {
          // Create the room
          const room = await tx.room.create({
            data: {
              propertyId: roomData.propertyId,
              roomNumber: roomData.roomNumber,
              roomType: roomData.roomType,
              floor: roomData.floor,
              monthlyPrice: roomData.monthlyPrice,
              dailyPrice: roomData.dailyPrice,
              weeklyPrice: roomData.weeklyPrice,
              quarterlyPrice: roomData.quarterlyPrice,
              yearlyPrice: roomData.yearlyPrice,
              isAvailable: roomData.isAvailable ?? true,
              description: roomData.description,
              size: roomData.size,
              facilities: roomData.facilities || [],
            },
          });

          // Update property total rooms count
          await tx.property.update({
            where: { id: roomData.propertyId },
            data: {
              totalRooms: property.totalRooms + 1,
              availableRooms: roomData.isAvailable !== false
                ? { increment: 1 }
                : undefined,
            },
          });

          return room;
        });

        return ok({ id: newRoom.id });
      } catch (error) {
        console.error("Error adding room:", error);
        return internalError("Failed to add room");
      }
    }
  );

  /**
   * Helper: Get user's property IDs
   */
  private static async getUserPropertyIds(userId: string): Promise<string[]> {
    const properties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    return properties.map((p) => p.id);
  }
}

/**
 * Create Room Type - Create multiple rooms with same type
 * Standalone function (not in class)
 */
export async function createRoomType(
  userId: string,
  propertyId: string,
  data: {
    roomType: string;
    totalRooms: number;
    floor: number;
    size?: string;
    description?: string;
    frontPhotos: Array<{ url: string; publicId: string }>;
    insidePhotos: Array<{ url: string; publicId: string }>;
    bathroomPhotos: Array<{ url: string; publicId: string }>;
    facilities: any[];
    monthlyPrice: number;
    dailyPrice?: number;
    weeklyPrice?: number;
    quarterlyPrice?: number;
    yearlyPrice?: number;
  }
): Promise<Result<{ roomsCreated: number; roomIds: string[] }>> {
  try {
    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property || property.ownerId !== userId) {
      return forbidden("Property not found or access denied");
    }

    // Get existing room numbers for this property to avoid duplicates
    const existingRooms = await prisma.room.findMany({
      where: { propertyId },
      select: { roomNumber: true },
      orderBy: { roomNumber: "asc" },
    });

    const existingNumbers = new Set(existingRooms.map(r => r.roomNumber));

    // Generate room numbers
    const roomNumbers: string[] = [];
    let counter = 1;
    while (roomNumbers.length < data.totalRooms) {
      const roomNumber = `${data.floor}${counter.toString().padStart(2, '0')}`;
      if (!existingNumbers.has(roomNumber)) {
        roomNumbers.push(roomNumber);
      }
      counter++;

      // Safety check to prevent infinite loop
      if (counter > 1000) {
        return internalError("Could not generate unique room numbers");
      }
    }

    // Create rooms and shared images in transaction
    const createdRoomIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      // First, check if room type images already exist for this property + room type
      const existingTypeImages = await tx.roomTypeImage.findMany({
        where: {
          propertyId,
          roomType: data.roomType,
        },
      });

      // If no images exist for this room type, create them (shared for all rooms)
      if (existingTypeImages.length === 0) {
        const roomTypeImages = [
          ...data.frontPhotos.map((img, idx) => ({
            propertyId,
            roomType: data.roomType,
            category: 'ROOM_PHOTOS' as const,
            imageUrl: img.url,
            publicId: img.publicId,
            sortOrder: idx,
          })),
          ...data.insidePhotos.map((img, idx) => ({
            propertyId,
            roomType: data.roomType,
            category: 'ROOM_PHOTOS' as const,
            imageUrl: img.url,
            publicId: img.publicId,
            sortOrder: data.frontPhotos.length + idx,
          })),
          ...data.bathroomPhotos.map((img, idx) => ({
            propertyId,
            roomType: data.roomType,
            category: 'BATHROOM_PHOTOS' as const,
            imageUrl: img.url,
            publicId: img.publicId,
            sortOrder: idx,
          })),
        ];

        if (roomTypeImages.length > 0) {
          await tx.roomTypeImage.createMany({
            data: roomTypeImages,
          });
        }
      }

      // Create all rooms (without individual images)
      for (const roomNumber of roomNumbers) {
        const room = await tx.room.create({
          data: {
            propertyId,
            roomNumber,
            floor: data.floor,
            roomType: data.roomType,
            description: data.description || null,
            size: data.size || null,
            monthlyPrice: data.monthlyPrice,
            dailyPrice: data.dailyPrice || null,
            weeklyPrice: data.weeklyPrice || null,
            quarterlyPrice: data.quarterlyPrice || null,
            yearlyPrice: data.yearlyPrice || null,
            facilities: data.facilities,
            isAvailable: true,
          },
        });

        createdRoomIds.push(room.id);
      }
    });

    return ok({
      roomsCreated: createdRoomIds.length,
      roomIds: createdRoomIds,
    });
  } catch (error) {
    console.error("Error creating room type:", error);
    return internalError("Failed to create room type");
  }
}

