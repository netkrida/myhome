/**
 * Withdraw Application Service
 * Business logic for withdraw operations
 * Tier 2: Application Service
 * 
 * Handles withdraw requests that only use balance from "Pembayaran Kos" account
 */

import type { Result } from "@/server/types/result";
import { ok, badRequest, internalError } from "@/server/types/result";
import { WithdrawService } from "@/server/services/withdraw.service";
import { PayoutRepository } from "@/server/repositories/superadmin/payout.repository";
import { BankAccountRepository } from "@/server/repositories/adminkos/bank-account.repository";
import type {
  WithdrawSummaryDTO,
  CreateWithdrawRequestDTO,
  WithdrawBalanceBreakdownDTO,
} from "@/server/types/withdraw";
import type { PayoutDTO } from "@/server/types/bank-account";
import { BankAccountStatus } from "@prisma/client";

export class WithdrawAPI {
  /**
   * Get withdrawable balance summary
   * Only includes balance from automatic payment transactions
   */
  static async getSummary(adminKosId: string): Promise<Result<WithdrawSummaryDTO>> {
    try {
      const summary = await WithdrawService.getWithdrawableBalance(adminKosId);
      return ok(summary);
    } catch (error) {
      console.error("Error getting withdraw summary:", error);
      return internalError("Gagal mendapatkan ringkasan saldo tarik");
    }
  }

  /**
   * Get detailed balance breakdown
   */
  static async getBreakdown(adminKosId: string): Promise<Result<WithdrawBalanceBreakdownDTO>> {
    try {
      const breakdown = await WithdrawService.getBalanceBreakdown(adminKosId);
      return ok(breakdown);
    } catch (error) {
      console.error("Error getting balance breakdown:", error);
      return internalError("Gagal mendapatkan rincian saldo");
    }
  }

  /**
   * Create new withdraw request
   * Validates balance and creates payout with locked source to "Pembayaran Kos"
   */
  static async createWithdrawRequest(
    adminKosId: string,
    data: CreateWithdrawRequestDTO
  ): Promise<Result<PayoutDTO>> {
    try {
      // Validate bank account
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

      // Validate withdraw request and check balance
      const validation = await WithdrawService.validateWithdrawRequest(adminKosId, data.amount);
      
      if (!validation.valid) {
        return badRequest(validation.error || "Validasi gagal");
      }

      const balance = validation.balance!;

      // Create payout with source locked to SALES (from "Pembayaran Kos")
      const payoutResult = await PayoutRepository.create(
        adminKosId,
        {
          bankAccountId: data.bankAccountId,
          amount: data.amount,
          source: "SALES", // Always SALES for withdrawable balance
          notes: data.notes,
        },
        balance.withdrawableBalance // Use withdrawable balance as balanceBefore
      );

      if (!payoutResult.success) {
        return badRequest(payoutResult.error.message || "Gagal membuat pengajuan penarikan");
      }

      return ok(payoutResult.data);
    } catch (error) {
      console.error("Error creating withdraw request:", error);
      return internalError("Gagal membuat pengajuan penarikan");
    }
  }

  /**
   * Get "Pembayaran Kos" account ID
   * Used to lock source selection in UI
   */
  static async getPembayaranKosAccountId(adminKosId: string): Promise<Result<string>> {
    try {
      const accountId = await WithdrawService.getPembayaranKosAccountId(adminKosId);
      return ok(accountId);
    } catch (error) {
      console.error("Error getting Pembayaran Kos account ID:", error);
      return internalError("Gagal mendapatkan ID akun sistem");
    }
  }
}

