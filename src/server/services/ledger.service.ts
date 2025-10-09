/**
 * Ledger Domain Service
 * Business logic for financial bookkeeping operations
 */

import { LedgerRepository } from "../repositories/ledger.repository";
import type {
  LedgerAccountDTO,
  LedgerEntryDTO,
  CreateLedgerAccountDTO,
  CreateLedgerEntryDTO,
  LedgerSummaryDTO,
  LedgerTimeSeriesDTO,
  LedgerBreakdownDTO,
  LedgerBreakdownResponse,
  BalanceCalculationDTO,
  PaymentSyncDTO,
  PayoutSyncDTO,
  LedgerAccountType,
  LedgerDirection,
  LedgerRefType,
} from "../types/ledger";
import { prisma } from "../db/client";

export class LedgerService {
  /**
   * ============================================
   * System Account Management
   * ============================================
   */

  static async ensureSystemAccounts(adminKosId: string): Promise<void> {
    // Ensure "Pembayaran Kos" account exists
    await LedgerRepository.ensureSystemAccount(
      adminKosId,
      "Pembayaran Kos",
      "INCOME"
    );

    // Ensure "Penarikan Dana" account exists
    await LedgerRepository.ensureSystemAccount(
      adminKosId,
      "Penarikan Dana",
      "OTHER"
    );
  }

  /**
   * ============================================
   * Account Operations
   * ============================================
   */

  static async createAccount(
    adminKosId: string,
    data: CreateLedgerAccountDTO
  ): Promise<LedgerAccountDTO> {
    // Check if account with same name already exists
    const existing = await LedgerRepository.getAccountByName(adminKosId, data.name);
    if (existing) {
      throw new Error(`Akun dengan nama "${data.name}" sudah ada`);
    }

    // Validate account type and direction compatibility
    this.validateAccountTypeForDirection(data.type, null);

    return LedgerRepository.createAccount(adminKosId, data);
  }

  // fix(async): explicit Promise<void>
  static async validateAccountTypeForDirection(
    accountType: LedgerAccountType,
    direction: LedgerDirection | null
  ): Promise<void> {
    if (!direction) return;

    const validCombinations = {
      IN: ["INCOME", "OTHER"],
      OUT: ["EXPENSE", "OTHER"],
    };

    if (!validCombinations[direction].includes(accountType)) {
      throw new Error(
        `Direction ${direction} tidak kompatibel dengan tipe akun ${accountType}`
      );
    }
  }

  /**
   * ============================================
   * Entry Operations
   * ============================================
   */

  static async createManualEntry(
    adminKosId: string,
    createdBy: string,
    data: CreateLedgerEntryDTO
  ): Promise<LedgerEntryDTO> {
    // Get account to validate type compatibility
    const account = await LedgerRepository.getAccountById(data.accountId);
    if (!account) {
      throw new Error("Akun tidak ditemukan");
    }

    // Validate direction vs account type
    this.validateAccountTypeForDirection(account.type, data.direction);

    // Create entry
    return LedgerRepository.createEntry(adminKosId, createdBy, data);
  }

  /**
   * ============================================
   * Synchronization Operations
   * ============================================
   */

  static async syncPaymentToLedger(
    adminKosId: string,
    paymentData: PaymentSyncDTO
  ): Promise<LedgerEntryDTO | null> {
    // Check if already synced (idempotent)
    const existingEntry = await LedgerRepository.findEntryByRef(
      "PAYMENT",
      paymentData.paymentId
    );

    if (existingEntry) {
      return existingEntry;
    }

    // Ensure system accounts exist
    await this.ensureSystemAccounts(adminKosId);

    // Get "Pembayaran Kos" account
    const paymentAccount = await LedgerRepository.findSystemAccount(
      adminKosId,
      "Pembayaran Kos",
      "INCOME"
    );

    if (!paymentAccount) {
      throw new Error("Akun sistem 'Pembayaran Kos' tidak ditemukan");
    }

    // Create ledger entry
    return LedgerRepository.createEntry(adminKosId, "SYSTEM", {
      accountId: paymentAccount.id,
      direction: "IN",
      amount: paymentData.amount,
      date: paymentData.transactionTime || new Date(),
      note: `Pembayaran booking dari Payment ID: ${paymentData.paymentId}`,
      refType: "PAYMENT",
      refId: paymentData.paymentId,
      propertyId: paymentData.propertyId,
    });
  }

  static async syncPayoutToLedger(
    adminKosId: string,
    payoutData: PayoutSyncDTO
  ): Promise<LedgerEntryDTO | null> {
    // Check if already synced (idempotent)
    const existingEntry = await LedgerRepository.findEntryByRef(
      "PAYOUT",
      payoutData.payoutId
    );

    if (existingEntry) {
      return existingEntry;
    }

    // Ensure system accounts exist
    await this.ensureSystemAccounts(adminKosId);

    // Get "Penarikan Dana" account
    const withdrawalAccount = await LedgerRepository.findSystemAccount(
      adminKosId,
      "Penarikan Dana",
      "OTHER"
    );

    if (!withdrawalAccount) {
      throw new Error("Akun sistem 'Penarikan Dana' tidak ditemukan");
    }

    // Create ledger entry
    return LedgerRepository.createEntry(adminKosId, "SYSTEM", {
      accountId: withdrawalAccount.id,
      direction: "OUT",
      amount: payoutData.amount,
      date: payoutData.processedAt || new Date(),
      note: `Penarikan dana dari Payout ID: ${payoutData.payoutId}`,
      refType: "PAYOUT",
      refId: payoutData.payoutId,
    });
  }

  /**
   * ============================================
   * Analytics & Reporting
   * ============================================
   */

  static async calculateBalance(adminKosId: string): Promise<BalanceCalculationDTO> {
    // Get total income and expense from ledger
    const summary = await LedgerRepository.getSummaryByAdminKos(adminKosId);

    // Get pending withdrawals from Payout table
    const pendingPayouts = await prisma.payout.aggregate({
      where: {
        adminKosId,
        status: "PENDING",
      },
      _sum: { amount: true },
    });

    // Get total completed withdrawals from Payout table
    const completedPayouts = await prisma.payout.aggregate({
      where: {
        adminKosId,
        status: { in: ["APPROVED", "COMPLETED"] },
      },
      _sum: { amount: true },
    });

    const totalIncome = summary.cashIn;
    const totalExpense = summary.cashOut;
    const totalBalance = summary.totalBalance;
    const pendingWithdrawals = Number(pendingPayouts._sum.amount || 0);
    const totalWithdrawals = Number(completedPayouts._sum.amount || 0);

    return {
      totalIncome,
      totalExpense,
      totalBalance,
      availableBalance: totalBalance - pendingWithdrawals,
      pendingWithdrawals,
      totalWithdrawals,
    };
  }

  static async getLedgerSummary(
    adminKosId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<LedgerSummaryDTO> {
    // Ensure system accounts exist
    await this.ensureSystemAccounts(adminKosId);

    // Get period summary
    const periodSummary = await LedgerRepository.getSummaryByAdminKos(
      adminKosId,
      dateFrom,
      dateTo
    );

    // Get balance calculation
    const balance = await this.calculateBalance(adminKosId);

    // Get payment income for this month
    const paymentAccount = await LedgerRepository.findSystemAccount(
      adminKosId,
      "Pembayaran Kos",
      "INCOME"
    );

    let paymentIncomeThisMonth = 0;
    if (paymentAccount) {
      const paymentEntries = await prisma.ledgerEntry.aggregate({
        where: {
          adminKosId,
          accountId: paymentAccount.id,
          direction: "IN",
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        _sum: { amount: true },
      });
      paymentIncomeThisMonth = Number(paymentEntries._sum.amount || 0);
    }

    return {
      cashInPeriod: periodSummary.cashIn,
      cashOutPeriod: periodSummary.cashOut,
      netCashFlowPeriod: periodSummary.cashIn - periodSummary.cashOut,
      totalBalance: balance.totalBalance,
      availableBalance: balance.availableBalance,
      totalWithdrawals: balance.totalWithdrawals,
      paymentIncomeThisMonth,
      dateFrom,
      dateTo,
    };
  }

  static async getLedgerBreakdown(
    adminKosId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<LedgerBreakdownResponse> {
    const accounts = await LedgerRepository.getAccountsByAdminKos(adminKosId);

    // Get entries for the period grouped by account
    const entriesGrouped = await prisma.ledgerEntry.groupBy({
      by: ["accountId", "direction"],
      where: {
        adminKosId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Create breakdown by account type
    const breakdown: LedgerBreakdownResponse = {
      income: [],
      expense: [],
      other: [],
    };

    // Calculate totals for percentage calculation
    const totalIn = entriesGrouped
      .filter(e => e.direction === "IN")
      .reduce((sum, e) => sum + Number(e._sum.amount || 0), 0);
    
    const totalOut = entriesGrouped
      .filter(e => e.direction === "OUT")
      .reduce((sum, e) => sum + Number(e._sum.amount || 0), 0);

    // Process each account
    for (const account of accounts) {
      const accountEntries = entriesGrouped.filter(e => e.accountId === account.id);
      
      const inAmount = accountEntries
        .filter(e => e.direction === "IN")
        .reduce((sum, e) => sum + Number(e._sum.amount || 0), 0);
      
      const outAmount = accountEntries
        .filter(e => e.direction === "OUT")
        .reduce((sum, e) => sum + Number(e._sum.amount || 0), 0);

      const totalAmount = inAmount - outAmount;
      const entriesCount = accountEntries.reduce((sum, e) => sum + e._count.id, 0);

      if (totalAmount !== 0 || entriesCount > 0) {
        const breakdownItem: LedgerBreakdownDTO = {
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          totalAmount: Math.abs(totalAmount),
          entriesCount,
          percentage: 0, // Will be calculated below
        };

        // Calculate percentage based on direction
        if (account.type === "INCOME" && inAmount > 0) {
          breakdownItem.percentage = totalIn > 0 ? (inAmount / totalIn) * 100 : 0;
          breakdown.income.push(breakdownItem);
        } else if (account.type === "EXPENSE" && outAmount > 0) {
          breakdownItem.percentage = totalOut > 0 ? (outAmount / totalOut) * 100 : 0;
          breakdown.expense.push(breakdownItem);
        } else if (account.type === "OTHER") {
          const relevantTotal = inAmount > outAmount ? totalIn : totalOut;
          const relevantAmount = inAmount > outAmount ? inAmount : outAmount;
          breakdownItem.percentage = relevantTotal > 0 ? (relevantAmount / relevantTotal) * 100 : 0;
          breakdown.other.push(breakdownItem);
        }
      }
    }

    // Sort by amount descending
    breakdown.income.sort((a, b) => b.totalAmount - a.totalAmount);
    breakdown.expense.sort((a, b) => b.totalAmount - a.totalAmount);
    breakdown.other.sort((a, b) => b.totalAmount - a.totalAmount);

    return breakdown;
  }

  static async getLedgerTimeSeries(
    adminKosId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<LedgerTimeSeriesDTO[]> {
    // This is a simplified version - in production you might want to use raw SQL for better performance
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        adminKosId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group entries by date
    const groupedEntries = new Map<string, { in: number; out: number }>();
    
    for (const entry of entries) {
      const dateKey = this.formatDateForGrouping(entry.date, groupBy);
      const existing = groupedEntries.get(dateKey) || { in: 0, out: 0 };
      
      if (entry.direction === "IN") {
        existing.in += Number(entry.amount);
      } else {
        existing.out += Number(entry.amount);
      }
      
      groupedEntries.set(dateKey, existing);
    }

    // Convert to time series with running balance
    const timeSeries: LedgerTimeSeriesDTO[] = [];
    let runningBalance = 0;

    // Get initial balance before the period
    const initialBalance = await LedgerRepository.getSummaryByAdminKos(
      adminKosId,
      undefined,
      new Date(dateFrom.getTime() - 1)
    );
    runningBalance = initialBalance.totalBalance;

    for (const [date, amounts] of groupedEntries) {
      const netFlow = amounts.in - amounts.out;
      runningBalance += netFlow;

      timeSeries.push({
        date,
        cashIn: amounts.in,
        cashOut: amounts.out,
        netFlow,
        runningBalance,
      });
    }

    return timeSeries;
  }

  // fix(async): date string guards
  private static formatDateForGrouping(date: Date, groupBy: 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'day':
        return (date.toISOString().split('T')[0]) || ''; // YYYY-MM-DD
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return (weekStart.toISOString().split('T')[0]) || '';
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return (date.toISOString().split('T')[0]) || '';
    }
  }
}
