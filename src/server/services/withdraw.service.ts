/**
 * Withdraw Service
 * Business logic for withdraw balance calculations
 * 
 * This service calculates withdrawable balance ONLY from "Pembayaran Kos" account:
 * - IN entries with refType=PAYMENT (automatic from successful payments)
 * - OUT entries with refType=PAYOUT (automatic from approved/completed payouts)
 * 
 * Manual entries (refType=MANUAL) are NOT included in withdrawable balance.
 */

import { prisma } from "../db/client";
import { LedgerRepository } from "../repositories/global/ledger.repository";
import type { WithdrawSummaryDTO, WithdrawBalanceBreakdownDTO } from "../types/withdraw";

export class WithdrawService {
  /**
   * Get withdrawable balance for an AdminKos
   * Only counts transactions from "Pembayaran Kos" system account
   */
  static async getWithdrawableBalance(adminKosId: string): Promise<WithdrawSummaryDTO> {
    // Ensure "Pembayaran Kos" system account exists
    const pembayaranKosAccount = await LedgerRepository.ensureSystemAccount(
      adminKosId,
      "Pembayaran Kos",
      "INCOME"
    );

    // Get total income from successful payments (IN from PAYMENT)
    const paymentIncomeResult = await prisma.ledgerEntry.aggregate({
      where: {
        adminKosId,
        accountId: pembayaranKosAccount.id,
        direction: "IN",
        refType: "PAYMENT",
      },
      _sum: { amount: true },
    });

    // Get total withdrawals processed (OUT from PAYOUT)
    const withdrawalsResult = await prisma.ledgerEntry.aggregate({
      where: {
        adminKosId,
        accountId: pembayaranKosAccount.id,
        direction: "OUT",
        refType: "PAYOUT",
      },
      _sum: { amount: true },
    });

    // Get pending withdrawal requests
    const pendingPayoutsResult = await prisma.payout.aggregate({
      where: {
        adminKosId,
        status: "PENDING",
      },
      _sum: { amount: true },
    });

    const totalPaymentIncome = Number(paymentIncomeResult._sum.amount || 0);
    const totalWithdrawals = Number(withdrawalsResult._sum.amount || 0);
    const pendingWithdrawals = Number(pendingPayoutsResult._sum.amount || 0);
    const withdrawableBalance = totalPaymentIncome - totalWithdrawals;
    const availableBalance = withdrawableBalance - pendingWithdrawals;

    return {
      totalPaymentIncome,
      totalWithdrawals,
      withdrawableBalance,
      pendingWithdrawals,
      availableBalance,
      asOf: new Date(),
      pembayaranKosAccountId: pembayaranKosAccount.id,
    };
  }

  /**
   * Validate if a withdraw request can be processed
   * Checks if amount is valid and sufficient balance exists
   */
  static async validateWithdrawRequest(
    adminKosId: string,
    amount: number
  ): Promise<{ valid: boolean; error?: string; balance?: WithdrawSummaryDTO }> {
    // Validate amount
    if (amount <= 0) {
      return {
        valid: false,
        error: "Jumlah penarikan harus lebih dari 0",
      };
    }

    // Get current balance
    const balance = await this.getWithdrawableBalance(adminKosId);

    // Check if sufficient balance
    if (amount > balance.availableBalance) {
      return {
        valid: false,
        error: `Saldo tidak mencukupi. Saldo tersedia: Rp ${balance.availableBalance.toLocaleString("id-ID")}`,
        balance,
      };
    }

    return {
      valid: true,
      balance,
    };
  }

  /**
   * Get detailed breakdown of withdrawable balance
   * Shows all payment and withdrawal entries
   */
  static async getBalanceBreakdown(adminKosId: string): Promise<WithdrawBalanceBreakdownDTO> {
    // Get summary first
    const summary = await this.getWithdrawableBalance(adminKosId);

    // Get payment entries (IN from PAYMENT)
    const paymentEntries = await prisma.ledgerEntry.findMany({
      where: {
        adminKosId,
        accountId: summary.pembayaranKosAccountId,
        direction: "IN",
        refType: "PAYMENT",
      },
      orderBy: { date: "desc" },
      take: 100, // Limit to recent 100 entries
      select: {
        id: true,
        amount: true,
        date: true,
        refId: true,
        note: true,
      },
    });

    // Get withdrawal entries (OUT from PAYOUT)
    const withdrawalEntries = await prisma.ledgerEntry.findMany({
      where: {
        adminKosId,
        accountId: summary.pembayaranKosAccountId,
        direction: "OUT",
        refType: "PAYOUT",
      },
      orderBy: { date: "desc" },
      take: 100, // Limit to recent 100 entries
      select: {
        id: true,
        amount: true,
        date: true,
        refId: true,
        note: true,
      },
    });

    // Get payment details for better display
    const paymentIds = paymentEntries.map(e => e.refId).filter(Boolean) as string[];
    const payments = await prisma.payment.findMany({
      where: { id: { in: paymentIds } },
      select: {
        id: true,
        booking: {
          select: {
            bookingCode: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const paymentMap = new Map(payments.map(p => [p.id, p]));

    // Get payout details for better display
    const payoutIds = withdrawalEntries.map(e => e.refId).filter(Boolean) as string[];
    const payouts = await prisma.payout.findMany({
      where: { id: { in: payoutIds } },
      select: {
        id: true,
        status: true,
      },
    });

    const payoutMap = new Map(payouts.map(p => [p.id, p]));

    return {
      paymentEntries: paymentEntries.map(entry => {
        const payment = entry.refId ? paymentMap.get(entry.refId) : null;
        return {
          id: entry.id,
          amount: Number(entry.amount),
          date: entry.date,
          paymentId: entry.refId || "",
          bookingCode: payment?.booking.bookingCode,
          propertyName: payment?.booking.property.name,
        };
      }),
      withdrawalEntries: withdrawalEntries.map(entry => {
        const payout = entry.refId ? payoutMap.get(entry.refId) : null;
        return {
          id: entry.id,
          amount: Number(entry.amount),
          date: entry.date,
          payoutId: entry.refId || "",
          status: payout?.status || "UNKNOWN",
        };
      }),
      summary,
    };
  }

  /**
   * Get the "Pembayaran Kos" system account ID
   * Used to lock the source account in UI
   */
  static async getPembayaranKosAccountId(adminKosId: string): Promise<string> {
    const account = await LedgerRepository.ensureSystemAccount(
      adminKosId,
      "Pembayaran Kos",
      "INCOME"
    );
    return account.id;
  }
}

