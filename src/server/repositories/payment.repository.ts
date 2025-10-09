import { prisma } from "../db/client";
import type { Prisma } from "@prisma/client";
import type {
  PaymentDTO,
  CreatePaymentDTO
} from "../types/booking";
import {
  PaymentStatus,
  PaymentType
} from "../types/booking";
import type { Result } from "../types/result";
import { ok, fail, notFound, internalError, forbidden } from "../types/result";
import type {
  TransactionFilters,
  TransactionListItem,
  TransactionDetailDTO,
} from "../types/transaction.types";

/**
 * Tier-3: Payment Repository
 * Data access layer for payment operations
 */
export class PaymentRepository {

  /**
   * Create a new payment
   */
  static async create(
    paymentData: CreatePaymentDTO & {
      midtransOrderId: string;
      amount: number;
      status: PaymentStatus;
      paymentToken?: string;
      expiryTime?: Date;
    }
  ): Promise<Result<PaymentDTO>> {
    try {
      const payment = await prisma.payment.create({
        data: {
          bookingId: paymentData.bookingId,
          userId: paymentData.userId,
          midtransOrderId: paymentData.midtransOrderId,
          paymentType: paymentData.paymentType,
          amount: paymentData.amount,
          status: paymentData.status,
          paymentToken: paymentData.paymentToken,
          expiryTime: paymentData.expiryTime
        }
      });

      return ok(this.mapToDTO(payment));
    } catch (error) {
      console.error("Error creating payment:", error);
      return internalError("Failed to create payment");
    }
  }

  /**
   * Get payment by ID
   */
  static async getById(id: string): Promise<Result<PaymentDTO>> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id }
      });

      if (!payment) {
        return notFound("Payment not found");
      }

      return ok(this.mapToDTO(payment));
    } catch (error) {
      console.error("Error getting payment by ID:", error);
      return internalError("Failed to get payment");
    }
  }

  /**
   * Get payment by Midtrans order ID
   */
  static async getByOrderId(midtransOrderId: string): Promise<Result<PaymentDTO>> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { midtransOrderId }
      });

      if (!payment) {
        return notFound("Payment not found");
      }

      return ok(this.mapToDTO(payment));
    } catch (error) {
      console.error("Error getting payment by order ID:", error);
      return internalError("Failed to get payment");
    }
  }

  /**
   * Get payments by booking ID
   */
  static async getByBookingId(bookingId: string): Promise<Result<PaymentDTO[]>> {
    try {
      const payments = await prisma.payment.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' }
      });

      return ok(payments.map(payment => this.mapToDTO(payment)));
    } catch (error) {
      console.error("Error getting payments by booking ID:", error);
      return internalError("Failed to get payments");
    }
  }

  /**
   * Get payments by user ID
   */
  static async getByUserId(userId: string): Promise<Result<PaymentDTO[]>> {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return ok(payments.map(payment => this.mapToDTO(payment)));
    } catch (error) {
      console.error("Error getting payments by user ID:", error);
      return internalError("Failed to get payments");
    }
  }

  /**
   * Update payment
   */
  static async update(
    id: string,
    updateData: Partial<{
      status: PaymentStatus;
      paymentMethod: string;
      transactionTime: Date;
      transactionId: string;
      expiryTime: Date;
      paymentToken: string;
    }>
  ): Promise<Result<PaymentDTO>> {
    try {
      const payment = await prisma.payment.update({
        where: { id },
        data: updateData
      });

      return ok(this.mapToDTO(payment));
    } catch (error) {
      console.error("Error updating payment:", error);
      return internalError("Failed to update payment");
    }
  }

  /**
   * Update payment by order ID
   */
  static async updateByOrderId(
    midtransOrderId: string,
    updateData: Partial<{
      status: PaymentStatus;
      paymentMethod: string;
      transactionTime: Date;
      transactionId: string;
      expiryTime: Date;
      paymentToken: string;
    }>
  ): Promise<Result<PaymentDTO>> {
    try {
      const payment = await prisma.payment.update({
        where: { midtransOrderId },
        data: updateData
      });

      // Trigger ledger synchronization hook if payment status changed to SUCCESS
      if (updateData.status === "SUCCESS") {
        try {
          const { PaymentHooks } = await import("../api/hooks/payment.hooks");
          await PaymentHooks.onPaymentSuccess(payment.id);
        } catch (error) {
          console.warn("Failed to sync payment to ledger:", error);
          // Don't fail the payment update if ledger sync fails
        }
      }

      return ok(this.mapToDTO(payment));
    } catch (error) {
      console.error("Error updating payment by order ID:", error);
      return internalError("Failed to update payment");
    }
  }

  /**
   * Get pending payments that are expired
   */
  static async getExpiredPayments(): Promise<Result<PaymentDTO[]>> {
    try {
      const now = new Date();
      const payments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          expiryTime: {
            lt: now
          }
        }
      });

      return ok(payments.map(payment => this.mapToDTO(payment)));
    } catch (error) {
      console.error("Error getting expired payments:", error);
      return internalError("Failed to get expired payments");
    }
  }

  /**
   * Update expired payments status
   */
  static async updateExpiredPayments(): Promise<Result<number>> {
    try {
      const now = new Date();
      const result = await prisma.payment.updateMany({
        where: {
          status: PaymentStatus.PENDING,
          expiryTime: {
            lt: now
          }
        },
        data: {
          status: PaymentStatus.EXPIRED
        }
      });

      return ok(result.count);
    } catch (error) {
      console.error("Error updating expired payments:", error);
      return internalError("Failed to update expired payments");
    }
  }

  /**
   * Get payment statistics
   */
  static async getStats(userId?: string): Promise<Result<{
    totalPayments: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    totalAmount: number;
    successfulAmount: number;
  }>> {
    try {
      const where = userId ? { userId } : {};

      const [
        totalPayments,
        successfulPayments,
        pendingPayments,
        failedPayments,
        totalAmountResult,
        successfulAmountResult
      ] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.count({ where: { ...where, status: PaymentStatus.SUCCESS } }),
        prisma.payment.count({ where: { ...where, status: PaymentStatus.PENDING } }),
        prisma.payment.count({ where: { ...where, status: PaymentStatus.FAILED } }),
        prisma.payment.aggregate({
          where,
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { ...where, status: PaymentStatus.SUCCESS },
          _sum: { amount: true }
        })
      ]);

      return ok({
        totalPayments,
        successfulPayments,
        pendingPayments,
        failedPayments,
        totalAmount: Number(totalAmountResult._sum.amount || 0),
        successfulAmount: Number(successfulAmountResult._sum.amount || 0)
      });
    } catch (error) {
      console.error("Error getting payment stats:", error);
      return internalError("Failed to get payment stats");
    }
  }

  /**
   * Delete payment
   */
  static async delete(id: string): Promise<Result<void>> {
    try {
      await prisma.payment.delete({
        where: { id }
      });

      return ok(undefined);
    } catch (error) {
      console.error("Error deleting payment:", error);
      return internalError("Failed to delete payment");
    }
  }

  /**
   * Find payment by order ID with booking details (for transaction)
   * With userId validation to ensure user can only access their own payments
   */
  static async findByOrderIdWithBooking(
    midtransOrderId: string,
    userId?: string
  ): Promise<Result<PaymentDTO & { booking: any }>> {
    try {
      console.log("🔍 PaymentRepository.findByOrderIdWithBooking - Looking up:", midtransOrderId, "userId:", userId);

      const payment = await prisma.payment.findUnique({
        where: { midtransOrderId },
        include: {
          booking: {
            include: {
              room: true,
              user: true,
              property: true
            }
          }
        }
      });

      if (!payment) {
        console.error("❌ Payment not found:", midtransOrderId);
        return notFound("Payment not found");
      }

      // Validate userId if provided (for security)
      if (userId && payment.userId !== userId) {
        console.error("❌ Unauthorized access attempt:", {
          orderId: midtransOrderId,
          requestUserId: userId,
          paymentUserId: payment.userId
        });
        return forbidden("You are not authorized to access this payment");
      }

      console.log("✅ Payment found:", {
        orderId: midtransOrderId,
        paymentId: payment.id,
        status: payment.status,
        userId: payment.userId,
        bookingId: payment.booking?.id
      });

      return ok({
        ...this.mapToDTO(payment),
        booking: payment.booking
      });
    } catch (error) {
      console.error("❌ Error finding payment by order ID with booking:", error);
      return internalError("Failed to find payment");
    }
  }

  /**
   * Update payment token (after creating Snap transaction)
   */
  static async saveToken(
    midtransOrderId: string,
    token: string,
    expiryTime?: Date
  ): Promise<Result<PaymentDTO>> {
    try {
      const payment = await prisma.payment.update({
        where: { midtransOrderId },
        data: {
          paymentToken: token,
          expiryTime: expiryTime
        }
      });

      return ok(this.mapToDTO(payment));
    } catch (error) {
      console.error("Error saving payment token:", error);
      return internalError("Failed to save payment token");
    }
  }

  /**
   * Map database payment to DTO
   */
  private static mapToDTO(payment: any): PaymentDTO {
    return {
      id: payment.id,
      bookingId: payment.bookingId,
      userId: payment.userId,
      midtransOrderId: payment.midtransOrderId,
      paymentType: payment.paymentType as PaymentType,
      paymentMethod: payment.paymentMethod,
      amount: Number(payment.amount),
      status: payment.status as PaymentStatus,
      transactionTime: payment.transactionTime,
      transactionId: payment.transactionId,
      paymentToken: payment.paymentToken,
      expiryTime: payment.expiryTime,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  /**
   * ========================================
   * SUPERADMIN TRANSACTION METHODS
   * ========================================
   */

  /**
   * Build where clause from filters for SUPERADMIN
   */
  private static buildTransactionWhereClause(filters: TransactionFilters): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.OR = [
        {
          transactionTime: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        },
        {
          transactionTime: null,
          createdAt: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        },
      ];
    }

    // Status filter - fix(repo): cast to enum
    if (filters.status) {
      where.status = filters.status as PaymentStatus;
    }

    // Payment type filter - fix(repo): cast to enum
    if (filters.paymentType) {
      where.paymentType = filters.paymentType as PaymentType;
    }

    // Payment method filter
    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    // Property filter - fix(repo): safe nested where
    if (filters.propertyId) {
      if (!where.booking) {
        where.booking = {};
      }
      where.booking.propertyId = filters.propertyId;
    }

    // Owner filter - fix(repo): safe nested where
    if (filters.ownerId) {
      if (!where.booking) {
        where.booking = {};
      }
      where.booking.property = {
        ownerId: filters.ownerId,
      };
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.trim();
      where.OR = [
        { midtransOrderId: { contains: searchTerm, mode: "insensitive" } },
        { transactionId: { contains: searchTerm, mode: "insensitive" } },
        {
          booking: {
            bookingCode: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          user: {
            email: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          booking: {
            room: {
              roomNumber: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Get transaction summary (KPIs) for SUPERADMIN
   */
  static async getTransactionSummary(filters: TransactionFilters) {
    const where = this.buildTransactionWhereClause(filters);

    // Total transactions
    const totalTransactions = await prisma.payment.count({ where });

    // Total revenue (SUCCESS only)
    const successRevenue = await prisma.payment.aggregate({
      where: { ...where, status: "SUCCESS" },
      _sum: { amount: true },
      _count: { _all: true },
    });

    // Pending
    const pending = await prisma.payment.aggregate({
      where: { ...where, status: "PENDING" },
      _sum: { amount: true },
      _count: { _all: true },
    });

    // Failed + Expired
    const failed = await prisma.payment.aggregate({
      where: { ...where, status: { in: ["FAILED", "EXPIRED"] } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    // Refunded
    const refunded = await prisma.payment.aggregate({
      where: { ...where, status: "REFUNDED" },
      _sum: { amount: true },
    });

    const totalRevenue = Number(successRevenue._sum.amount || 0);
    const successCount = successRevenue._count._all;
    const averageOrderValue = successCount > 0 ? totalRevenue / successCount : 0;

    return {
      totalTransactions,
      totalRevenue,
      pendingCount: pending._count._all,
      pendingAmount: Number(pending._sum.amount || 0),
      failedCount: failed._count._all,
      failedAmount: Number(failed._sum.amount || 0),
      refundedAmount: Number(refunded._sum.amount || 0),
      averageOrderValue,
    };
  }

  /**
   * Get time series data for line chart
   */
  static async getTransactionTimeSeries(
    filters: TransactionFilters,
    granularity: "day" | "week" | "month" = "day"
  ) {
    const where = this.buildTransactionWhereClause(filters);

    // Use raw query for date_trunc grouping
    const dateField = `COALESCE("transactionTime", "createdAt")`;
    const truncFunc = granularity === "day" ? `DATE(${dateField})` : `DATE_TRUNC('${granularity}', ${dateField})`;

    const whereConditions = this.buildWhereSQLForTimeSeries(filters);

    const result = await prisma.$queryRawUnsafe<
      Array<{ bucket: Date; revenue: string; count: bigint }>
    >(`
      SELECT
        ${truncFunc} AS bucket,
        SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END) AS revenue,
        COUNT(*) AS count
      FROM "Payment"
      WHERE ${whereConditions}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    return result.map((row) => ({
      date: row.bucket.toISOString(),
      revenue: Number(row.revenue),
      count: Number(row.count),
    }));
  }

  /**
   * Build WHERE clause for raw SQL (time series)
   */
  private static buildWhereSQLForTimeSeries(filters: TransactionFilters): string {
    const conditions: string[] = ["1=1"];

    if (filters.dateFrom) {
      conditions.push(
        `(COALESCE("transactionTime", "createdAt") >= '${filters.dateFrom.toISOString()}')`
      );
    }

    if (filters.dateTo) {
      conditions.push(
        `(COALESCE("transactionTime", "createdAt") <= '${filters.dateTo.toISOString()}')`
      );
    }

    if (filters.status) {
      conditions.push(`status = '${filters.status}'`);
    }

    if (filters.paymentType) {
      conditions.push(`"paymentType" = '${filters.paymentType}'`);
    }

    if (filters.paymentMethod) {
      conditions.push(`"paymentMethod" = '${filters.paymentMethod}'`);
    }

    return conditions.join(" AND ");
  }

  /**
   * Get payment method breakdown for pie chart
   */
  static async getPaymentMethodBreakdown(filters: TransactionFilters) {
    const where = this.buildTransactionWhereClause({ ...filters, status: "SUCCESS" });

    const breakdown = await prisma.payment.groupBy({
      by: ["paymentMethod"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    });

    const total = breakdown.reduce((sum, item) => sum + item._count._all, 0);

    return breakdown.map((item) => ({
      method: item.paymentMethod || "Unknown",
      count: item._count._all,
      amount: Number(item._sum.amount || 0),
      percentage: total > 0 ? (item._count._all / total) * 100 : 0,
    }));
  }

  /**
   * Get paginated transaction list with full details for SUPERADMIN
   */
  static async getTransactionList(
    filters: TransactionFilters,
    page: number = 1,
    pageSize: number = 25,
    sortBy: string = "transactionTime",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const where = this.buildTransactionWhereClause(filters);

    // Get total count
    const total = await prisma.payment.count({ where });

    // Get transactions with full relations
    const transactions = await prisma.payment.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: Math.min(pageSize, 200), // Max 200
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        midtransOrderId: true,
        status: true,
        paymentType: true,
        paymentMethod: true,
        amount: true,
        transactionTime: true,
        transactionId: true,
        createdAt: true,
        // Never select paymentToken
        booking: {
          select: {
            bookingCode: true,
            leaseType: true,
            room: {
              select: {
                roomNumber: true,
                roomType: true,
                floor: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return {
      transactions: transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        payer: tx.user,
      })) as TransactionListItem[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get transaction detail by ID for SUPERADMIN
   */
  static async getTransactionDetail(id: string): Promise<TransactionDetailDTO | null> {
    const transaction = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        midtransOrderId: true,
        status: true,
        paymentType: true,
        paymentMethod: true,
        amount: true,
        transactionTime: true,
        transactionId: true,
        expiryTime: true,
        createdAt: true,
        updatedAt: true,
        // Never select paymentToken
        booking: {
          select: {
            bookingCode: true,
            leaseType: true,
            room: {
              select: {
                roomNumber: true,
                roomType: true,
                floor: true,
              },
            },
            property: {
              select: {
                id: true,
                name: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!transaction) return null;

    return {
      ...transaction,
      amount: Number(transaction.amount),
      payer: transaction.user,
    } as TransactionDetailDTO;
  }

  /**
   * Get distinct payment methods for filter dropdown
   */
  static async getDistinctPaymentMethods(): Promise<string[]> {
    const result = await prisma.payment.findMany({
      where: {
        paymentMethod: { not: null },
      },
      select: {
        paymentMethod: true,
      },
      distinct: ["paymentMethod"],
    });

    return result.map((r) => r.paymentMethod!).filter(Boolean);
  }

  /**
   * Get all transactions for export (no pagination)
   * Limited to 10,000 records for safety
   */
  static async getTransactionsForExport(
    filters: TransactionFilters
  ): Promise<TransactionListItem[]> {
    const where = this.buildTransactionWhereClause(filters);

    const transactions = await prisma.payment.findMany({
      where,
      orderBy: [
        { transactionTime: "desc" },
        { createdAt: "desc" },
      ],
      take: 10000, // Safety limit
      select: {
        id: true,
        midtransOrderId: true,
        status: true,
        paymentType: true,
        paymentMethod: true,
        amount: true,
        transactionTime: true,
        transactionId: true,
        createdAt: true,
        // Join to User (payer)
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        // Join to Booking
        booking: {
          select: {
            bookingCode: true,
            leaseType: true,
            // Join to Room
            room: {
              select: {
                roomNumber: true,
                roomType: true,
                floor: true,
              },
            },
            // Join to Property
            property: {
              select: {
                id: true,
                name: true,
                // Join to Owner
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return transactions.map((tx) => ({
      id: tx.id,
      midtransOrderId: tx.midtransOrderId,
      status: tx.status,
      paymentType: tx.paymentType,
      paymentMethod: tx.paymentMethod,
      amount: Number(tx.amount),
      transactionTime: tx.transactionTime,
      transactionId: tx.transactionId,
      createdAt: tx.createdAt,
      payer: {
        id: tx.user.id,
        name: tx.user.name || "",
        email: tx.user.email || "",
        phoneNumber: tx.user.phoneNumber,
      },
      booking: {
        bookingCode: tx.booking.bookingCode,
        leaseType: tx.booking.leaseType,
        room: {
          roomNumber: tx.booking.room.roomNumber,
          roomType: tx.booking.room.roomType,
          floor: tx.booking.room.floor,
        },
        property: {
          id: tx.booking.property.id,
          name: tx.booking.property.name,
          owner: {
            id: tx.booking.property.owner.id,
            name: tx.booking.property.owner.name || "",
            email: tx.booking.property.owner.email || "",
          },
        },
      },
    }));
  }
}
