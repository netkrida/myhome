import { Prisma } from "@prisma/client";
import type { Payment as PrismaPayment } from "@prisma/client";
import { prisma } from "../../db/client";
import type {
  BookingDTO,
  CreateBookingDTO,
  BookingListQuery,
  BookingListResponse,
  UpdateBookingDTO,
  UpdateBookingStatusDTO,
  PaymentDTO
} from "../../types/booking";
import {
  BookingStatus,
  PaymentStatus,
  LeaseType,
  PaymentType
} from "../../types/booking";
import type { Result } from "../../types/result";
import { ok, fail, notFound, internalError, conflict } from "../../types/result";

const MANAGE_ROOM_AVAILABILITY = process.env.FEATURE_MANAGE_ROOM_AVAILABILITY === "true";

const BASE_BOOKING_INCLUDE = {
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
      name: true,
      ownerId: true
    }
  },
  room: {
    select: {
      id: true,
      roomNumber: true,
      roomType: true,
      monthlyPrice: true,
      isAvailable: true,
      depositRequired: true,
      depositType: true,
      depositValue: true,
      hasDeposit: true,
      depositPercentage: true,
      dailyPrice: true,
      weeklyPrice: true,
      quarterlyPrice: true,
      yearlyPrice: true
    }
  },
  payments: true,
  checkedInByUser: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  checkedOutByUser: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
} satisfies Prisma.BookingInclude;

type PrismaBookingWithRelations = Prisma.BookingGetPayload<{ include: typeof BASE_BOOKING_INCLUDE }>;

interface BookingOverlapQuery {
  roomId: string;
  range: {
    start: Date;
    end?: Date | null;
  };
  excludeBookingId?: string;
  statuses?: BookingStatus[];
}

interface DirectBookingTransactionInput {
  booking: {
    bookingCode: string;
    userId: string;
    propertyId: string;
    roomId: string;
    leaseType: LeaseType;
    checkInDate: Date;
    checkOutDate?: Date | null;
    totalAmount: number;
    depositAmount?: number;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
  };
  payment: {
    userId: string;
    paymentType: PaymentType;
    paymentMethod: string;
    amount: number;
    status: PaymentStatus;
    midtransOrderId: string;
    transactionTime?: Date;
  };
  ledgerEntry?: {
    adminKosId: string;
    accountId: string;
    propertyId: string;
    amount: number;
    createdBy: string;
    note?: string;
    date?: Date;
  };
}

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
        include: BASE_BOOKING_INCLUDE
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
        include: BASE_BOOKING_INCLUDE
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
        include: BASE_BOOKING_INCLUDE
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
        include: BASE_BOOKING_INCLUDE
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
        include: BASE_BOOKING_INCLUDE
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
        include: BASE_BOOKING_INCLUDE
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
        include: BASE_BOOKING_INCLUDE
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

  static async findByIdWithPropertyAndRoom(id: string): Promise<BookingDTO | null> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: BASE_BOOKING_INCLUDE
    });

    return booking ? this.mapToDTO(booking) : null;
  }

  static async findActiveOverlaps(query: BookingOverlapQuery): Promise<BookingDTO[]> {
    const { roomId, range, excludeBookingId, statuses } = query;
    const end = range.end ?? null;

    const overlapping = await prisma.booking.findMany({
      where: {
        roomId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: statuses || [BookingStatus.DEPOSIT_PAID, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
        },
        OR: end
          ? [
              {
                checkInDate: {
                  lt: end,
                  gte: range.start
                }
              },
              {
                checkOutDate: {
                  gt: range.start,
                  lte: end
                }
              },
              {
                AND: [
                  { checkInDate: { lte: range.start } },
                  { checkOutDate: { gte: end } }
                ]
              },
              {
                status: BookingStatus.CHECKED_IN,
                checkInDate: { lte: end },
                checkOutDate: null
              }
            ]
          : [
              {
                status: BookingStatus.CHECKED_IN,
                checkInDate: {
                  lte: range.start
                },
                checkOutDate: null
              },
              {
                status: BookingStatus.CHECKED_IN,
                checkInDate: {
                  lte: range.start
                },
                checkOutDate: {
                  gte: range.start
                }
              }
            ]
      },
      include: BASE_BOOKING_INCLUDE
    });

    return overlapping.map((booking) => this.mapToDTO(booking));
  }

  static async updateForCheckIn(params: {
    id: string;
    checkedInBy: string;
    actualCheckInAt: Date;
  }): Promise<BookingDTO | null> {
    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: params.id },
        data: {
          status: BookingStatus.CHECKED_IN,
          checkedInBy: params.checkedInBy,
          actualCheckInAt: params.actualCheckInAt,
        },
        include: BASE_BOOKING_INCLUDE,
      });

      if (MANAGE_ROOM_AVAILABILITY) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { isAvailable: false },
        });
      }

      return booking;
    });

    return updated ? this.mapToDTO(updated) : null;
  }

  static async updateForCheckOut(params: {
    id: string;
    checkedOutBy: string;
    actualCheckOutAt: Date;
  }): Promise<BookingDTO | null> {
    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: params.id },
        data: {
          status: BookingStatus.COMPLETED,
          checkedOutBy: params.checkedOutBy,
          actualCheckOutAt: params.actualCheckOutAt,
        },
        include: BASE_BOOKING_INCLUDE,
      });

      if (MANAGE_ROOM_AVAILABILITY) {
        await tx.room.update({
          where: { id: booking.roomId },
          data: { isAvailable: true },
        });
      }

      return booking;
    });

    return updated ? this.mapToDTO(updated) : null;
  }

  static async updateDates(params: {
    id: string;
    checkInDate: Date;
    checkOutDate?: Date;
  }): Promise<BookingDTO | null> {
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate ?? null,
      },
      include: BASE_BOOKING_INCLUDE,
    });

    return this.mapToDTO(booking);
  }

  static async createWithPaymentTx(input: DirectBookingTransactionInput): Promise<Result<{ booking: BookingDTO; payment: PaymentDTO }>> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            bookingCode: input.booking.bookingCode,
            userId: input.booking.userId,
            propertyId: input.booking.propertyId,
            roomId: input.booking.roomId,
            checkInDate: input.booking.checkInDate,
            checkOutDate: input.booking.checkOutDate ?? null,
            leaseType: input.booking.leaseType,
            totalAmount: input.booking.totalAmount,
            depositAmount: input.booking.depositAmount ?? null,
            paymentStatus: input.booking.paymentStatus,
            status: input.booking.status,
          },
          include: BASE_BOOKING_INCLUDE,
        });

        const payment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            userId: input.payment.userId,
            paymentType: input.payment.paymentType,
            paymentMethod: input.payment.paymentMethod,
            amount: input.payment.amount,
            status: input.payment.status,
            midtransOrderId: input.payment.midtransOrderId,
            transactionTime: input.payment.transactionTime ?? new Date(),
          },
        });

        if (input.ledgerEntry) {
          await tx.ledgerEntry.create({
            data: {
              adminKosId: input.ledgerEntry.adminKosId,
              accountId: input.ledgerEntry.accountId,
              direction: "IN",
              amount: input.ledgerEntry.amount,
              date: input.ledgerEntry.date ?? new Date(),
              note: input.ledgerEntry.note ?? `Pembayaran offline booking ${booking.bookingCode}`,
              refType: "PAYMENT",
              refId: payment.id,
              propertyId: input.ledgerEntry.propertyId,
              createdBy: input.ledgerEntry.createdBy,
            },
          });
        }

        if (MANAGE_ROOM_AVAILABILITY && input.booking.status === BookingStatus.CONFIRMED) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: { isAvailable: false },
          });
        }

        return { booking, payment };
      }, { timeout: 60000, maxWait: 5000 });

      return ok({
        booking: this.mapToDTO(result.booking),
        payment: this.mapPayment(result.payment),
      }, 201);
    } catch (error) {
      console.error("Error creating direct booking:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return conflict("Booking atau pembayaran sudah tercatat sebelumnya");
      }
      return internalError("Failed to create booking");
    }
  }

  /**
   * Map database booking to DTO
   */
  private static mapToDTO(booking: PrismaBookingWithRelations): BookingDTO {
    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      userId: booking.userId,
      propertyId: booking.propertyId,
      roomId: booking.roomId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate ?? undefined,
      leaseType: booking.leaseType as LeaseType,
      totalAmount: Number(booking.totalAmount),
      depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
      paymentStatus: booking.paymentStatus as PaymentStatus,
      status: booking.status as BookingStatus,
      checkedInBy: booking.checkedInBy ?? undefined,
      actualCheckInAt: booking.actualCheckInAt ?? undefined,
      checkedOutBy: booking.checkedOutBy ?? undefined,
      actualCheckOutAt: booking.actualCheckOutAt ?? undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: booking.user ? {
        id: booking.user.id,
        name: booking.user.name ?? undefined,
        email: booking.user.email ?? undefined,
      } : undefined,
      property: booking.property ? {
        id: booking.property.id,
        name: booking.property.name,
        ownerId: booking.property.ownerId
      } : undefined,
      room: booking.room ? {
        id: booking.room.id,
        roomNumber: booking.room.roomNumber,
        roomType: booking.room.roomType,
        monthlyPrice: Number(booking.room.monthlyPrice)
      } : undefined,
      checkedInByUser: booking.checkedInByUser ? {
        id: booking.checkedInByUser.id,
        name: booking.checkedInByUser.name ?? undefined,
        email: booking.checkedInByUser.email ?? undefined,
      } : undefined,
      checkedOutByUser: booking.checkedOutByUser ? {
        id: booking.checkedOutByUser.id,
        name: booking.checkedOutByUser.name ?? undefined,
        email: booking.checkedOutByUser.email ?? undefined,
      } : undefined,
      payments: booking.payments?.map((payment) => this.mapPayment(payment))
    };
  }

  private static mapPayment(payment: PrismaPayment): PaymentDTO {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      midtransOrderId: payment.midtransOrderId,
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod ?? undefined,
      amount: Number(payment.amount),
      status: payment.status,
      transactionTime: payment.transactionTime ?? undefined,
      transactionId: payment.transactionId ?? undefined,
      paymentToken: payment.paymentToken ?? undefined,
      expiryTime: payment.expiryTime ?? undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }
}
