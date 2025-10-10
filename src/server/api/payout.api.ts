/**
 * Payout Application Service
 * Business logic for payout management
 * Tier 2: Application Service
 */

import type { Result } from "@/server/types/result";
import { badRequest } from "@/server/types/result";
import { PayoutRepository } from "@/server/repositories/payout.repository";
import { BankAccountRepository } from "@/server/repositories/bank-account.repository";
import type {
  PayoutDTO,
  PayoutListItem,
  PayoutDetail,
  CreatePayoutDTO,
  ApprovePayoutDTO,
  BalanceInfo,
} from "@/server/types/bank-account";
import { PayoutStatus, BankAccountStatus } from "@prisma/client";

export class PayoutAPI {
  /**
   * Create new payout request (AdminKos)
   *
   * NOTE: This method uses general ledger balance calculation.
   * For withdraw feature that only counts "Pembayaran Kos" transactions,
   * use WithdrawAPI.createWithdrawRequest() instead.
   */
  static async create(
    adminKosId: string,
    data: CreatePayoutDTO
  ): Promise<Result<PayoutDTO>> {
    // Validate bank account
    // fix: discriminated union Result type - guard before accessing error
    const bankAccountResult = await BankAccountRepository.getById(data.bankAccountId);
    if (!bankAccountResult.success) {
      return badRequest(bankAccountResult.error.message || "Rekening bank tidak ditemukan");
    }

    const bankAccount = bankAccountResult.data;

    // Check if bank account belongs to AdminKos
    if (bankAccount.adminKosId !== adminKosId) {
      return badRequest("Rekening bank tidak valid");
    }

    // Check if bank account is approved
    if (bankAccount.status !== BankAccountStatus.APPROVED) {
      return badRequest("Rekening bank belum disetujui");
    }

    // Get current balance from ledger system (integrated approach)
    // This uses GENERAL ledger balance (all entries)
    // For withdrawable balance (only from "Pembayaran Kos"), use WithdrawService
    let balance: BalanceInfo;
    try {
      const { LedgerService } = await import("../services/ledger.service");
      const ledgerBalance = await LedgerService.calculateBalance(adminKosId);

      balance = {
        totalBalance: ledgerBalance.totalBalance,
        availableBalance: ledgerBalance.availableBalance,
        depositBalance: 0,
        pendingPayouts: ledgerBalance.pendingWithdrawals,
        lastCalculated: new Date(),
      };
    } catch (error) {
      console.warn("Ledger system not available, falling back to old balance calculation:", error);
      // Fallback to old balance calculation
      // fix: discriminated union Result type - guard before accessing error
      const balanceResult = await PayoutRepository.getBalance(adminKosId);
      if (!balanceResult.success) {
        return badRequest(balanceResult.error.message || "Gagal mendapatkan saldo");
      }
      balance = balanceResult.data;
    }

    // Check if sufficient balance
    if (data.amount > balance.availableBalance) {
      return badRequest(
        `Saldo tidak mencukupi. Saldo tersedia: Rp ${balance.availableBalance.toLocaleString("id-ID")}`
      );
    }

    // Create payout
    return await PayoutRepository.create(adminKosId, data, balance.totalBalance);
  }

  /**
   * Get payout by ID
   */
  static async getById(id: string): Promise<Result<PayoutDetail>> {
    return await PayoutRepository.getById(id);
  }

  /**
   * Get all payouts for AdminKos
   */
  static async getByAdminKosId(adminKosId: string): Promise<Result<PayoutDetail[]>> {
    return await PayoutRepository.getByAdminKosId(adminKosId);
  }

  /**
   * Get all payouts with filters (Superadmin)
   */
  static async getAll(filters?: {
    status?: PayoutStatus;
    adminKosId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<Result<{ payouts: PayoutListItem[]; total: number }>> {
    return await PayoutRepository.getAll(filters);
  }

  /**
   * Approve or reject payout (Superadmin)
   */
  static async processApproval(
    id: string,
    data: ApprovePayoutDTO,
    processedBy: string
  ): Promise<Result<PayoutDTO>> {
    if (data.approved) {
      if (!data.attachments || data.attachments.length === 0) {
        return badRequest("Bukti transfer wajib diupload");
      }
      return await PayoutRepository.approve(id, processedBy, data.attachments);
    } else {
      if (!data.rejectionReason) {
        return badRequest("Alasan penolakan wajib diisi");
      }
      return await PayoutRepository.reject(id, data.rejectionReason, processedBy);
    }
  }

  /**
   * Get balance for AdminKos
   */
  static async getBalance(adminKosId: string): Promise<Result<BalanceInfo>> {
    return await PayoutRepository.getBalance(adminKosId);
  }
}

