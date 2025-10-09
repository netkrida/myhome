/**
 * Bank Account Repository
 * Data access layer for bank account operations
 * Tier 3: Repository
 */

import { prisma } from "@/server/db/client";
import { ok, notFound, internalError, badRequest } from "@/server/types/result";
import type { Result } from "@/server/types/result";
import type {
  BankAccountDTO,
  BankAccountListItem,
  BankAccountDetail,
  CreateBankAccountDTO,
  UpdateBankAccountDTO,
} from "@/server/types/bank-account";
import { BankAccountStatus } from "@prisma/client";

export class BankAccountRepository {
  /**
   * Create new bank account
   */
  static async create(
    adminKosId: string,
    data: CreateBankAccountDTO
  ): Promise<Result<BankAccountDTO>> {
    try {
      // Check if AdminKos already has an approved bank account
      const existingApproved = await prisma.bankAccount.findFirst({
        where: {
          adminKosId,
          status: BankAccountStatus.APPROVED,
        },
      });

      if (existingApproved) {
        return badRequest("Anda sudah memiliki rekening yang disetujui");
      }

      // Check if there's a pending request
      const existingPending = await prisma.bankAccount.findFirst({
        where: {
          adminKosId,
          status: BankAccountStatus.PENDING,
        },
      });

      if (existingPending) {
        return badRequest("Anda masih memiliki pengajuan rekening yang menunggu persetujuan");
      }

      const bankAccount = await prisma.bankAccount.create({
        data: {
          adminKosId,
          ...data,
          status: BankAccountStatus.PENDING,
        },
      });

      return ok(bankAccount as BankAccountDTO);
    } catch (error) {
      console.error("Error creating bank account:", error);
      return internalError("Gagal membuat rekening bank");
    }
  }

  /**
   * Get bank account by ID
   */
  static async getById(id: string): Promise<Result<BankAccountDetail>> {
    try {
      const bankAccount = await prisma.bankAccount.findUnique({
        where: { id },
        include: {
          adminKos: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          approver: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!bankAccount) {
        return notFound("Rekening bank tidak ditemukan");
      }

      const detail: BankAccountDetail = {
        ...bankAccount,
        adminKosName: bankAccount.adminKos.user.name || undefined,
        adminKosEmail: bankAccount.adminKos.user.email || undefined,
        approverName: bankAccount.approver?.name || undefined,
      };

      return ok(detail);
    } catch (error) {
      console.error("Error getting bank account by ID:", error);
      return internalError("Gagal mengambil data rekening bank");
    }
  }

  /**
   * Get approved bank account for AdminKos
   */
  static async getApprovedByAdminKosId(
    adminKosId: string
  ): Promise<Result<BankAccountDTO | null>> {
    try {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: {
          adminKosId,
          status: BankAccountStatus.APPROVED,
        },
      });

      return ok(bankAccount as BankAccountDTO | null);
    } catch (error) {
      console.error("Error getting approved bank account:", error);
      return internalError("Gagal mengambil data rekening bank");
    }
  }

  /**
   * Get all bank accounts for AdminKos
   */
  static async getByAdminKosId(adminKosId: string): Promise<Result<BankAccountListItem[]>> {
    try {
      const bankAccounts = await prisma.bankAccount.findMany({
        where: { adminKosId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bankCode: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
          status: true,
          createdAt: true,
        },
      });

      return ok(bankAccounts);
    } catch (error) {
      console.error("Error getting bank accounts by AdminKos ID:", error);
      return internalError("Gagal mengambil daftar rekening bank");
    }
  }

  /**
   * Get all pending bank accounts (for Superadmin)
   */
  static async getPendingAccounts(): Promise<Result<BankAccountDetail[]>> {
    try {
      const bankAccounts = await prisma.bankAccount.findMany({
        where: { status: BankAccountStatus.PENDING },
        include: {
          adminKos: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const details: BankAccountDetail[] = bankAccounts.map((ba) => ({
        ...ba,
        adminKosName: ba.adminKos.user.name || undefined,
        adminKosEmail: ba.adminKos.user.email || undefined,
      }));

      return ok(details);
    } catch (error) {
      console.error("Error getting pending bank accounts:", error);
      return internalError("Gagal mengambil daftar pengajuan rekening");
    }
  }

  /**
   * Get all bank accounts with filters (for Superadmin)
   */
  static async getAll(filters?: {
    status?: BankAccountStatus;
    page?: number;
    limit?: number;
  }): Promise<Result<{ accounts: BankAccountDetail[]; total: number }>> {
    try {
      const { status, page = 1, limit = 20 } = filters || {};
      const skip = (page - 1) * limit;

      const where = status ? { status } : {};

      const [bankAccounts, total] = await Promise.all([
        prisma.bankAccount.findMany({
          where,
          include: {
            adminKos: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            approver: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.bankAccount.count({ where }),
      ]);

      const details: BankAccountDetail[] = bankAccounts.map((ba) => ({
        ...ba,
        adminKosName: ba.adminKos.user.name || undefined,
        adminKosEmail: ba.adminKos.user.email || undefined,
        approverName: ba.approver?.name || undefined,
      }));

      return ok({ accounts: details, total });
    } catch (error) {
      console.error("Error getting all bank accounts:", error);
      return internalError("Gagal mengambil daftar rekening bank");
    }
  }

  /**
   * Approve bank account
   */
  static async approve(id: string, approvedBy: string): Promise<Result<BankAccountDTO>> {
    try {
      const bankAccount = await prisma.bankAccount.update({
        where: { id },
        data: {
          status: BankAccountStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      return ok(bankAccount as BankAccountDTO);
    } catch (error) {
      console.error("Error approving bank account:", error);
      return internalError("Gagal menyetujui rekening bank");
    }
  }

  /**
   * Reject bank account
   */
  static async reject(
    id: string,
    rejectionReason: string,
    rejectedBy: string
  ): Promise<Result<BankAccountDTO>> {
    try {
      const bankAccount = await prisma.bankAccount.update({
        where: { id },
        data: {
          status: BankAccountStatus.REJECTED,
          rejectionReason,
          approvedBy: rejectedBy,
          approvedAt: new Date(),
        },
      });

      return ok(bankAccount as BankAccountDTO);
    } catch (error) {
      console.error("Error rejecting bank account:", error);
      return internalError("Gagal menolak rekening bank");
    }
  }

  /**
   * Update bank account details
   */
  static async update(
    id: string,
    data: UpdateBankAccountDTO
  ): Promise<Result<BankAccountDTO>> {
    try {
      const existing = await prisma.bankAccount.findUnique({
        where: { id },
        select: {
          status: true,
        },
      });

      if (!existing) {
        return notFound("Rekening bank tidak ditemukan");
      }

      if (existing.status === BankAccountStatus.APPROVED) {
        return badRequest("Rekening yang sudah disetujui tidak dapat diedit");
      }

      const updated = await prisma.bankAccount.update({
        where: { id },
        data: {
          bankCode: data.bankCode,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
        },
      });

      return ok(updated as BankAccountDTO);
    } catch (error) {
      console.error("Error updating bank account:", error);
      return internalError("Gagal memperbarui rekening bank");
    }
  }

  /**
   * Delete bank account submission
   */
  static async delete(id: string): Promise<Result<boolean>> {
    try {
      const existing = await prisma.bankAccount.findUnique({
        where: { id },
        select: {
          id: true,
        },
      });

      if (!existing) {
        return notFound("Rekening bank tidak ditemukan");
      }

      await prisma.bankAccount.delete({
        where: { id },
      });

      return ok(true);
    } catch (error) {
      console.error("Error deleting bank account:", error);
      return internalError("Gagal menghapus rekening bank");
    }
  }
}

