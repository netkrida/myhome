import { prisma } from "../db/client";
import type {
  PaymentDTO,
  CreatePaymentDTO
} from "../types/booking";
import {
  PaymentStatus,
  PaymentType
} from "../types/booking";
import type { Result } from "../types/result";
import { ok, fail, notFound, internalError } from "../types/result";

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
}
