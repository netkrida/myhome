/**
 * Bank Account Application Service
 * Business logic for bank account management
 * Tier 2: Application Service
 */

import { badRequest } from "@/server/types/result";
import type { Result } from "@/server/types/result";
import { BankAccountRepository } from "@/server/repositories/bank-account.repository";
import type {
  BankAccountDTO,
  BankAccountListItem,
  BankAccountDetail,
  CreateBankAccountDTO,
  ApproveBankAccountDTO,
  UpdateBankAccountDTO,
} from "@/server/types/bank-account";
import { BankAccountStatus } from "@prisma/client";

export class BankAccountAPI {
  /**
   * Create new bank account (AdminKos)
   */
  static async create(
    adminKosId: string,
    data: CreateBankAccountDTO
  ): Promise<Result<BankAccountDTO>> {
    return await BankAccountRepository.create(adminKosId, data);
  }

  /**
   * Get bank account by ID
   */
  static async getById(id: string): Promise<Result<BankAccountDetail>> {
    return await BankAccountRepository.getById(id);
  }

  /**
   * Get approved bank account for AdminKos
   */
  static async getApprovedByAdminKosId(
    adminKosId: string
  ): Promise<Result<BankAccountDTO | null>> {
    return await BankAccountRepository.getApprovedByAdminKosId(adminKosId);
  }

  /**
   * Get all bank accounts for AdminKos
   */
  static async getByAdminKosId(adminKosId: string): Promise<Result<BankAccountListItem[]>> {
    return await BankAccountRepository.getByAdminKosId(adminKosId);
  }

  /**
   * Get all bank accounts with filters (Superadmin)
   */
  static async getAll(filters?: {
    status?: BankAccountStatus;
    page?: number;
    limit?: number;
  }): Promise<Result<{ accounts: BankAccountDetail[]; total: number }>> {
    return await BankAccountRepository.getAll(filters);
  }

  /**
   * Approve or reject bank account (Superadmin)
   */
  static async processApproval(
    id: string,
    data: ApproveBankAccountDTO,
    processedBy: string
  ): Promise<Result<BankAccountDTO>> {
    if (data.approved) {
      return await BankAccountRepository.approve(id, processedBy);
    } else {
      if (!data.rejectionReason) {
        return badRequest("Alasan penolakan wajib diisi");
      }
      return await BankAccountRepository.reject(id, data.rejectionReason, processedBy);
    }
  }

  /**
   * Update bank account submission (Superadmin)
   */
  static async update(
    id: string,
    data: UpdateBankAccountDTO
  ): Promise<Result<BankAccountDTO>> {
    return await BankAccountRepository.update(id, data);
  }

  /**
   * Delete bank account submission (Superadmin)
   */
  static async delete(id: string): Promise<Result<boolean>> {
    return await BankAccountRepository.delete(id);
  }
}

