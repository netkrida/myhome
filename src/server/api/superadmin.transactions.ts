/**
 * Superadmin Transactions API
 * Application service layer for transaction management
 * Tier 2: Application/Business Logic Layer
 */

import { PaymentRepository } from "@/server/repositories/adminkos/payment.repository";
import { withAuth } from "@/server/lib/auth";
import { UserRole } from "@/server/types/rbac";
import type { UserContext } from "@/server/types/rbac";
import type { Result } from "@/server/types/result";
import { ok, forbidden, internalError, notFound } from "@/server/types/result";
import type {
  TransactionSummaryDTO,
  TransactionChartData,
  TransactionListResponse,
  TransactionDetailDTO,
  TransactionFilters,
} from "@/server/types/transaction.types";
import { format as formatDate } from "date-fns";

export class SuperadminTransactionsAPI {
  /**
   * Get transaction summary (KPIs)
   */
  static getSummary = withAuth(
    async (
      userContext: UserContext,
      filters: TransactionFilters
    ): Promise<Result<TransactionSummaryDTO>> => {
      try {
        // Only SUPERADMIN can access
        if (userContext.role !== UserRole.SUPERADMIN) {
          return forbidden("Only SUPERADMIN can access transaction data");
        }

        const summary = await PaymentRepository.getTransactionSummary(filters);

        return ok(summary);
      } catch (error) {
        console.error("Error getting transaction summary:", error);
        return internalError("Failed to get transaction summary");
      }
    }
  );

  /**
   * Get chart data (time series + method breakdown)
   */
  static getChartData = withAuth(
    async (
      userContext: UserContext,
      filters: TransactionFilters,
      granularity: "day" | "week" | "month" = "day"
    ): Promise<Result<TransactionChartData>> => {
      try {
        // Only SUPERADMIN can access
        if (userContext.role !== UserRole.SUPERADMIN) {
          return forbidden("Only SUPERADMIN can access transaction data");
        }

        // Get time series data
        const timeSeries = await PaymentRepository.getTransactionTimeSeries(
          filters,
          granularity
        );

        // Get payment method breakdown
        const methodBreakdown = await PaymentRepository.getPaymentMethodBreakdown(filters);

        return ok({
          timeSeries,
          methodBreakdown,
        });
      } catch (error) {
        console.error("Error getting chart data:", error);
        return internalError("Failed to get chart data");
      }
    }
  );

  /**
   * Get paginated transaction list
   */
  static getTransactionList = withAuth(
    async (
      userContext: UserContext,
      filters: TransactionFilters,
      page: number = 1,
      pageSize: number = 25,
      sortBy: string = "transactionTime",
      sortOrder: "asc" | "desc" = "desc"
    ): Promise<Result<TransactionListResponse>> => {
      try {
        // Only SUPERADMIN can access
        if (userContext.role !== UserRole.SUPERADMIN) {
          return forbidden("Only SUPERADMIN can access transaction data");
        }

        const result = await PaymentRepository.getTransactionList(
          filters,
          page,
          pageSize,
          sortBy,
          sortOrder
        );

        return ok(result);
      } catch (error) {
        console.error("Error getting transaction list:", error);
        return internalError("Failed to get transaction list");
      }
    }
  );

  /**
   * Get transaction detail by ID
   */
  static getTransactionDetail = withAuth(
    async (
      userContext: UserContext,
      transactionId: string
    ): Promise<Result<TransactionDetailDTO>> => {
      try {
        // Only SUPERADMIN can access
        if (userContext.role !== UserRole.SUPERADMIN) {
          return forbidden("Only SUPERADMIN can access transaction data");
        }

        const transaction = await PaymentRepository.getTransactionDetail(transactionId);

        if (!transaction) {
          return notFound("Transaction", transactionId);
        }

        return ok(transaction);
      } catch (error) {
        console.error("Error getting transaction detail:", error);
        return internalError("Failed to get transaction detail");
      }
    }
  );

  /**
   * Get distinct payment methods for filter
   */
  static getPaymentMethods = withAuth(
    async (userContext: UserContext): Promise<Result<string[]>> => {
      try {
        // Only SUPERADMIN can access
        if (userContext.role !== UserRole.SUPERADMIN) {
          return forbidden("Only SUPERADMIN can access transaction data");
        }

        const methods = await PaymentRepository.getDistinctPaymentMethods();

        return ok(methods);
      } catch (error) {
        console.error("Error getting payment methods:", error);
        return internalError("Failed to get payment methods");
      }
    }
  );

  /**
   * Export transactions to CSV or Excel
   */
  static exportTransactions = withAuth(
    async (
      userContext: UserContext,
      filters: TransactionFilters,
      format: "csv" | "excel" = "csv"
    ): Promise<
      Result<{
        data: string | Buffer;
        filename: string;
        mimeType: string;
      }>
    > => {
      try {
        // Only SUPERADMIN can access
        if (userContext.role !== UserRole.SUPERADMIN) {
          return forbidden("Only SUPERADMIN can access transaction data");
        }

        // Get transactions for export
        const transactions = await PaymentRepository.getTransactionsForExport(
          filters
        );

        if (format === "csv") {
          // Generate CSV
          const csv = this.generateCSV(transactions);
          const timestamp = formatDate(new Date(), "yyyyMMdd_HHmmss");
          const filename = `transactions_${timestamp}.csv`;

          return ok({
            data: csv,
            filename,
            mimeType: "text/csv",
          });
        } else {
          // Excel format not implemented yet
          return internalError("Excel export not implemented yet");
        }
      } catch (error) {
        console.error("Error exporting transactions:", error);
        return internalError("Failed to export transactions");
      }
    }
  );

  /**
   * Generate CSV from transactions
   */
  private static generateCSV(
    transactions: Array<{
      midtransOrderId: string;
      status: string;
      paymentType: string;
      paymentMethod: string | null;
      amount: number;
      transactionTime: Date | null;
      transactionId: string | null;
      createdAt: Date;
      payer: {
        name: string;
        email: string;
        phoneNumber: string | null;
      };
      booking: {
        bookingCode: string;
        leaseType: string;
        room: {
          roomNumber: string;
          roomType: string;
          floor: number;
        };
        property: {
          name: string;
          owner: {
            name: string;
            email: string;
          };
        };
      };
    }>
  ): string {
    // CSV Headers
    const headers = [
      "Waktu Transaksi",
      "Order ID",
      "Transaction ID",
      "Status",
      "Tipe Pembayaran",
      "Metode Pembayaran",
      "Amount (Rp)",
      "Nama Pembayar",
      "Email Pembayar",
      "No. HP Pembayar",
      "Booking Code",
      "Lease Type",
      "Room Number",
      "Room Type",
      "Floor",
      "Property Name",
      "Owner Name",
      "Owner Email",
    ];

    // CSV Rows
    const rows = transactions.map((tx) => [
      tx.transactionTime
        ? formatDate(new Date(tx.transactionTime), "dd/MM/yyyy HH:mm:ss")
        : formatDate(new Date(tx.createdAt), "dd/MM/yyyy HH:mm:ss"),
      tx.midtransOrderId,
      tx.transactionId || "-",
      tx.status,
      tx.paymentType,
      tx.paymentMethod || "-",
      tx.amount.toString(),
      tx.payer.name,
      tx.payer.email,
      tx.payer.phoneNumber || "-",
      tx.booking.bookingCode,
      tx.booking.leaseType,
      tx.booking.room.roomNumber,
      tx.booking.room.roomType,
      tx.booking.room.floor.toString(),
      tx.booking.property.name,
      tx.booking.property.owner.name,
      tx.booking.property.owner.email,
    ]);

    // Escape CSV values
    const escapeCSV = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV
    const csvLines = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ];

    return csvLines.join("\n");
  }
}

