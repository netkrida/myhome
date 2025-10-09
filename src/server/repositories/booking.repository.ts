import { prisma } from "../db/client";
import type {
  BookingDTO,
  CreateBookingDTO,
  BookingListQuery,
  BookingListResponse,
  UpdateBookingDTO,
  UpdateBookingStatusDTO
} from "../types/booking";
import {
  BookingStatus,
  PaymentStatus,
  LeaseType
} from "../types/booking";
import type { Result } from "../types/result";
import { ok, fail, notFound, internalError } from "../types/result";

/**
 * Tier-3: Booking Repository
 * Data access layer for booking operations
 */
export class BookingRepository {

  /**
   * Create a new booking
   */
  static async create(
    bookingData: CreateBookingDTO & {
      bookingCode: string;
      propertyId: string;
      checkOutDate?: Date;
      totalAmount: number;
      depositAmount?: number;
      paymentStatus: PaymentStatus;
      status: BookingStatus;
    }
  ): Promise<Result<BookingDTO>> {
    try {
      const booking = await prisma.booking.create({
        data: {
          bookingCode: bookingData.bookingCode,
          userId: bookingData.userId,
          propertyId: bookingData.propertyId,
          roomId: bookingData.roomId,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          leaseType: bookingData.leaseType,
          totalAmount: bookingData.totalAmount,
          depositAmount: bookingData.depositAmount,
          paymentStatus: bookingData.paymentStatus,
          status: bookingData.status
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      return ok(this.mapToDTO(booking));
    } catch (error) {
      console.error("Error creating booking:", error);
      return internalError("Failed to create booking");
    }
  }

  /**
   * Get booking by ID
   */
  static async getById(id: string): Promise<Result<BookingDTO>> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      if (!booking) {
        return notFound("Booking not found");
      }

      return ok(this.mapToDTO(booking));
    } catch (error) {
      console.error("Error getting booking by ID:", error);
      return internalError("Failed to get booking");
    }
  }

  /**
   * Get booking by booking code
   */
  static async getByBookingCode(bookingCode: string): Promise<Result<BookingDTO>> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { bookingCode },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      if (!booking) {
        return notFound("Booking not found");
      }

      return ok(this.mapToDTO(booking));
    } catch (error) {
      console.error("Error getting booking by code:", error);
      return internalError("Failed to get booking");
    }
  }

  /**
   * Get paginated list of bookings with filters
   */
  static async getList(query: BookingListQuery): Promise<Result<BookingListResponse>> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        userId,
        propertyId,
        roomId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status) where.status = status;
      if (paymentStatus) where.paymentStatus = paymentStatus;
      if (userId) where.userId = userId;
      if (propertyId) where.propertyId = propertyId;
      if (roomId) where.roomId = roomId;

      if (search) {
        where.OR = [
          { bookingCode: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { property: { name: { contains: search, mode: 'insensitive' } } },
          { room: { roomNumber: { contains: search, mode: 'insensitive' } } }
        ];
      }

      // Get total count
      const total = await prisma.booking.count({ where });

      // Get bookings
      const bookings = await prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      const totalPages = Math.ceil(total / limit);

      return ok({
        bookings: bookings.map(booking => this.mapToDTO(booking)),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    } catch (error) {
      console.error("Error getting booking list:", error);
      return internalError("Failed to get booking list");
    }
  }

  /**
   * Update booking
   */
  static async update(id: string, updateData: UpdateBookingDTO): Promise<Result<BookingDTO>> {
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      return ok(this.mapToDTO(booking));
    } catch (error) {
      console.error("Error updating booking:", error);
      return internalError("Failed to update booking");
    }
  }

  /**
   * Update booking status
   */
  static async updateStatus(id: string, statusData: UpdateBookingStatusDTO): Promise<Result<BookingDTO>> {
    try {
      const booking = await prisma.booking.update({
        where: { id },
        data: { status: statusData.status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      return ok(this.mapToDTO(booking));
    } catch (error) {
      console.error("Error updating booking status:", error);
      return internalError("Failed to update booking status");
    }
  }

  /**
   * Get bookings for a specific room within date range
   * Excludes UNPAID, CANCELLED, and EXPIRED bookings
   * UNPAID bookings are not considered valid until payment is successful
   */
  static async getBookingsForRoom(
    roomId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Result<BookingDTO[]>> {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          roomId,
          status: {
            // Exclude UNPAID (not paid yet), CANCELLED, and EXPIRED bookings
            // Only count bookings that have been paid (DEPOSIT_PAID, CONFIRMED, CHECKED_IN, COMPLETED)
            notIn: [BookingStatus.UNPAID, BookingStatus.CANCELLED, BookingStatus.EXPIRED]
          },
          OR: [
            {
              checkInDate: {
                gte: startDate,
                lt: endDate
              }
            },
            {
              checkOutDate: {
                gt: startDate,
                lte: endDate
              }
            },
            {
              AND: [
                { checkInDate: { lte: startDate } },
                { checkOutDate: { gte: endDate } }
              ]
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true
            }
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              roomType: true,
              monthlyPrice: true
            }
          },
          payments: true
        }
      });

      return ok(bookings.map(booking => this.mapToDTO(booking)));
    } catch (error) {
      console.error("Error getting bookings for room:", error);
      return internalError("Failed to get bookings for room");
    }
  }

  /**
   * Delete booking (soft delete by updating status)
   */
  static async delete(id: string): Promise<Result<void>> {
    try {
      await prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED }
      });

      return ok(undefined);
    } catch (error) {
      console.error("Error deleting booking:", error);
      return internalError("Failed to delete booking");
    }
  }

  /**
   * Check if room is available for booking in date range
   * Returns true if room is available (no conflicting paid bookings)
   */
  static async isRoomAvailable(
    roomId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<Result<boolean>> {
    try {
      const conflictingBookings = await prisma.booking.count({
        where: {
          roomId,
          id: excludeBookingId ? { not: excludeBookingId } : undefined,
          status: {
            // Only check against paid bookings (exclude UNPAID, CANCELLED, EXPIRED)
            notIn: [BookingStatus.UNPAID, BookingStatus.CANCELLED, BookingStatus.EXPIRED]
          },
          OR: [
            {
              checkInDate: {
                gte: startDate,
                lt: endDate
              }
            },
            {
              checkOutDate: {
                gt: startDate,
                lte: endDate
              }
            },
            {
              AND: [
                { checkInDate: { lte: startDate } },
                { checkOutDate: { gte: endDate } }
              ]
            }
          ]
        }
      });

      return ok(conflictingBookings === 0);
    } catch (error) {
      console.error("Error checking room availability:", error);
      return internalError("Failed to check room availability");
    }
  }

  /**
   * Map database booking to DTO
   */
  private static mapToDTO(booking: any): BookingDTO {
    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      userId: booking.userId,
      propertyId: booking.propertyId,
      roomId: booking.roomId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      leaseType: booking.leaseType as LeaseType,
      totalAmount: Number(booking.totalAmount),
      depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
      paymentStatus: booking.paymentStatus as PaymentStatus,
      status: booking.status as BookingStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: booking.user ? {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email
      } : undefined,
      property: booking.property ? {
        id: booking.property.id,
        name: booking.property.name
      } : undefined,
      room: booking.room ? {
        id: booking.room.id,
        roomNumber: booking.room.roomNumber,
        roomType: booking.room.roomType,
        monthlyPrice: Number(booking.room.monthlyPrice)
      } : undefined,
      payments: booking.payments?.map((payment: any) => ({
        id: payment.id,
        bookingId: payment.bookingId,
        userId: payment.userId,
        midtransOrderId: payment.midtransOrderId,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        amount: Number(payment.amount),
        status: payment.status,
        transactionTime: payment.transactionTime,
        transactionId: payment.transactionId,
        paymentToken: payment.paymentToken,
        expiryTime: payment.expiryTime,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }))
    };
  }
}
