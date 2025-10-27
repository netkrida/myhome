/**
 * AdminKos Ledger Application Service
 * Orchestrates ledger use cases for AdminKos
 */

import { getCurrentUserContext } from "../lib/auth";
import { UserRole } from "../types/rbac";
import type { Result } from "../types/result";
import { ok, forbidden, badRequest, internalError } from "../types/result";
import { LedgerService } from "../services/ledger.service";
import { LedgerRepository } from "../repositories/global/ledger.repository";
import type {
  LedgerSummaryDTO,
  LedgerTimeSeriesDTO,
  LedgerBreakdownResponse,
  LedgerListResponse,
  LedgerAccountListResponse,
  LedgerEntryDTO,
  LedgerAccountDTO,
  CreateLedgerAccountDTO,
  CreateLedgerEntryDTO,
  LedgerQuery,
  LedgerAccountQuery,
} from "../types/ledger";

export class AdminKosLedgerAPI {
  /**
   * ============================================
   * Summary & Analytics
   * ============================================
   */

  static async getSummary(
    dateFrom: Date,
    dateTo: Date
  ): Promise<Result<LedgerSummaryDTO>> {
    try {
      const user = await getCurrentUserContext();

      // Ensure user is AdminKos
      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      const summary = await LedgerService.getLedgerSummary(
        user.profileId,
        dateFrom,
        dateTo
      );

      return ok(summary);
    } catch (error) {
      console.error("Error getting ledger summary:", error);
      return internalError("Failed to get ledger summary");
    }
  }

  static async getTimeSeries(
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Result<LedgerTimeSeriesDTO[]>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      const timeSeries = await LedgerService.getLedgerTimeSeries(
        user.profileId,
        dateFrom,
        dateTo,
        groupBy
      );

      return ok(timeSeries);
    } catch (error) {
      console.error("Error getting ledger time series:", error);
      return internalError("Failed to get ledger time series");
    }
  }

  static async getBreakdown(
    dateFrom: Date,
    dateTo: Date
  ): Promise<Result<LedgerBreakdownResponse>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      const breakdown = await LedgerService.getLedgerBreakdown(
        user.profileId,
        dateFrom,
        dateTo
      );

      return ok(breakdown);
    } catch (error) {
      console.error("Error getting ledger breakdown:", error);
      return internalError("Failed to get ledger breakdown");
    }
  }

  /**
   * ============================================
   * Ledger Entries
   * ============================================
   */

  static async listEntries(query: LedgerQuery): Promise<Result<LedgerListResponse>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      const { entries, total } = await LedgerRepository.getEntriesByAdminKos(
        user.profileId,
        query
      );

      const page = query.page || 1;
      const limit = query.limit || 20;
      const totalPages = Math.ceil(total / limit);

      return ok({
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error listing ledger entries:", error);
      return internalError("Failed to list ledger entries");
    }
  }

  static async createManualEntry(
    data: CreateLedgerEntryDTO
  ): Promise<Result<LedgerEntryDTO>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      // Validate required fields
      if (!data.accountId || !data.direction || !data.amount) {
        return badRequest("Missing required fields");
      }

      if (data.amount <= 0) {
        return badRequest("Amount must be greater than 0");
      }

      // Set manual entry defaults
      const entryData: CreateLedgerEntryDTO = {
        ...data,
        refType: "MANUAL",
        refId: `manual-${Date.now()}`,
      };

      const entry = await LedgerService.createManualEntry(
        user.profileId,
        user.id,
        entryData
      );

      return ok(entry);
    } catch (error) {
      console.error("Error creating manual entry:", error);
      if (error instanceof Error) {
        return badRequest(error.message);
      }
      return internalError("Failed to create manual entry");
    }
  }

  static async updateEntry(
    entryId: string,
    data: Partial<CreateLedgerEntryDTO>
  ): Promise<Result<LedgerEntryDTO>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      // Get entry to verify ownership and check if it's manual
      const entry = await LedgerRepository.getEntryById(entryId);
      if (!entry) {
        return badRequest("Entry not found");
      }

      if (entry.adminKosId !== user.profileId) {
        return forbidden("Access denied");
      }

      // Only allow editing manual entries
      if (entry.refType !== "MANUAL") {
        return badRequest("Only manual entries can be edited");
      }

      // Validate amount if provided
      if (data.amount !== undefined && data.amount <= 0) {
        return badRequest("Amount must be greater than 0");
      }

      const updatedEntry = await LedgerRepository.updateEntry(entryId, data);

      return ok(updatedEntry);
    } catch (error) {
      console.error("Error updating ledger entry:", error);
      if (error instanceof Error) {
        return badRequest(error.message);
      }
      return internalError("Failed to update ledger entry");
    }
  }

  static async deleteEntry(entryId: string): Promise<Result<void>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      // Get entry to verify ownership and check if it's manual
      const entry = await LedgerRepository.getEntryById(entryId);
      if (!entry) {
        return badRequest("Entry not found");
      }

      if (entry.adminKosId !== user.profileId) {
        return forbidden("Access denied");
      }

      // Only allow deleting manual entries
      if (entry.refType !== "MANUAL") {
        return badRequest("Only manual entries can be deleted");
      }

      await LedgerRepository.deleteEntry(entryId);

      return ok(undefined);
    } catch (error) {
      console.error("Error deleting ledger entry:", error);
      return internalError("Failed to delete ledger entry");
    }
  }

  /**
   * ============================================
   * Ledger Accounts
   * ============================================
   */

  static async listAccounts(query: LedgerAccountQuery = {}): Promise<Result<LedgerAccountListResponse>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      const accounts = await LedgerRepository.getAccountsByAdminKos(
        user.profileId,
        query
      );

      return ok({ accounts });
    } catch (error) {
      console.error("Error listing ledger accounts:", error);
      return internalError("Failed to list ledger accounts");
    }
  }

  static async createAccount(
    data: CreateLedgerAccountDTO
  ): Promise<Result<LedgerAccountDTO>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      // Validate required fields
      if (!data.name || !data.type) {
        return badRequest("Missing required fields");
      }

      // Validate name length
      if (data.name.length < 3 || data.name.length > 100) {
        return badRequest("Account name must be between 3 and 100 characters");
      }

      // Validate code if provided
      if (data.code && (data.code.length < 2 || data.code.length > 30)) {
        return badRequest("Account code must be between 2 and 30 characters");
      }

      const account = await LedgerService.createAccount(
        user.profileId,
        data
      );

      return ok(account);
    } catch (error) {
      console.error("Error creating ledger account:", error);
      if (error instanceof Error) {
        return badRequest(error.message);
      }
      return internalError("Failed to create ledger account");
    }
  }

  static async archiveAccount(accountId: string): Promise<Result<LedgerAccountDTO>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      // Get account to verify ownership and check if it's a system account
      const account = await LedgerRepository.getAccountById(accountId);
      if (!account) {
        return badRequest("Account not found");
      }

      if (account.adminKosId !== user.profileId) {
        return forbidden("Access denied");
      }

      if (account.isSystem) {
        return badRequest("Cannot archive system accounts");
      }

      const updatedAccount = await LedgerRepository.updateAccount(accountId, {
        isArchived: true,
      });

      return ok(updatedAccount);
    } catch (error) {
      console.error("Error archiving ledger account:", error);
      return internalError("Failed to archive ledger account");
    }
  }

  static async unarchiveAccount(accountId: string): Promise<Result<LedgerAccountDTO>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      // Get account to verify ownership
      const account = await LedgerRepository.getAccountById(accountId);
      if (!account) {
        return badRequest("Account not found");
      }

      if (account.adminKosId !== user.profileId) {
        return forbidden("Access denied");
      }

      const updatedAccount = await LedgerRepository.updateAccount(accountId, {
        isArchived: false,
      });

      return ok(updatedAccount);
    } catch (error) {
      console.error("Error unarchiving ledger account:", error);
      return internalError("Failed to unarchive ledger account");
    }
  }

  /**
   * ============================================
   * System Integration
   * ============================================
   */

  static async ensureSystemAccounts(): Promise<Result<void>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      await LedgerService.ensureSystemAccounts(user.profileId);
      return ok(undefined);
    } catch (error) {
      console.error("Error ensuring system accounts:", error);
      return internalError("Failed to ensure system accounts");
    }
  }

  /**
   * ============================================
   * Balance Information (for Withdraw integration)
   * ============================================
   */

  static async getBalanceInfo(): Promise<Result<{
    totalBalance: number;
    availableBalance: number;
    totalWithdrawals: number;
  }>> {
    try {
      const user = await getCurrentUserContext();

      if (!user || user.role !== UserRole.ADMINKOS || !user.profileId) {
        return forbidden("Access denied");
      }

      const balance = await LedgerService.calculateBalance(user.profileId);

      return ok({
        totalBalance: balance.totalBalance,
        availableBalance: balance.availableBalance,
        totalWithdrawals: balance.totalWithdrawals,
      });
    } catch (error) {
      console.error("Error getting balance info:", error);
      return internalError("Failed to get balance info");
    }
  }
}
