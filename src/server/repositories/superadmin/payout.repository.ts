/**
 * Payout Repository
 * Data access layer for payout operations
 * Tier 3: Repository
 * chore(types): type-only imports per verbatimModuleSyntax
 * fix(prisma): use Prisma.Decimal
 */

import { prisma } from "@/server/db/client";
import type { Result } from "@/server/types/result";
import { ok, notFound, internalError, badRequest } from "@/server/types/result";
import type {
  PayoutDTO,
  PayoutListItem,
  PayoutDetail,
  CreatePayoutDTO,
  BalanceInfo,
} from "@/server/types/bank-account";
import { PayoutStatus, Prisma } from "@prisma/client";

export class PayoutRepository {
  /**
   * Create new payout request
   */
  static async create(
    adminKosId: string,
    data: CreatePayoutDTO,
    balanceBefore: number
  ): Promise<Result<PayoutDTO>> {
    try {
      const balanceAfter = balanceBefore - data.amount;

      const payout = await prisma.payout.create({
        data: {
          adminKosId,
          bankAccountId: data.bankAccountId,
          amount: new Prisma.Decimal(data.amount),
          source: data.source,
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          status: PayoutStatus.PENDING,
          notes: data.notes,
        },
      });

      return ok({
        ...payout,
        amount: Number(payout.amount),
        balanceBefore: Number(payout.balanceBefore),
        balanceAfter: Number(payout.balanceAfter),
      } as PayoutDTO);
    } catch (error) {
      console.error("Error creating payout:", error);
      return internalError("Gagal membuat pengajuan penarikan");
    }
  }

  /**
   * Get payout by ID
   */
  static async getById(id: string): Promise<Result<PayoutDetail>> {
    try {
      const payout = await prisma.payout.findUnique({
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
          bankAccount: {
            select: {
              bankCode: true,
              bankName: true,
              accountNumber: true,
              accountName: true,
            },
          },
          attachments: true,
          processor: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!payout) {
        return notFound("Pengajuan penarikan tidak ditemukan");
      }

      // fix(dto): normalize null→undefined for all nullable fields
      const detail: PayoutDetail = {
        ...payout,
        amount: Number(payout.amount),
        balanceBefore: Number(payout.balanceBefore),
        balanceAfter: Number(payout.balanceAfter),
        adminKosName: payout.adminKos.user.name || undefined,
        adminKosEmail: payout.adminKos.user.email || undefined,
        processorName: payout.processor?.name || undefined,
        notes: payout.notes ?? undefined,
        rejectionReason: payout.rejectionReason ?? undefined,
        processedBy: payout.processedBy ?? undefined,
        processedAt: payout.processedAt ?? undefined,
        attachments: payout.attachments.map(a => ({
          id: a.id,
          createdAt: a.createdAt,
          publicId: a.publicId ?? undefined,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileType: a.fileType,
          payoutId: a.payoutId,
        })),
      };

      return ok(detail);
    } catch (error) {
      console.error("Error getting payout by ID:", error);
      return internalError("Gagal mengambil data pengajuan penarikan");
    }
  }

  /**
   * Get all payouts for AdminKos
   */
  static async getByAdminKosId(adminKosId: string): Promise<Result<PayoutDetail[]>> {
    try {
      const payouts = await prisma.payout.findMany({
        where: { adminKosId },
        include: {
          bankAccount: {
            select: {
              bankCode: true,
              bankName: true,
              accountNumber: true,
              accountName: true,
            },
          },
          attachments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // fix(dto): normalize null→undefined for all nullable fields
      const details: PayoutDetail[] = payouts.map((p) => ({
        ...p,
        amount: Number(p.amount),
        balanceBefore: Number(p.balanceBefore),
        balanceAfter: Number(p.balanceAfter),
        notes: p.notes ?? undefined,
        rejectionReason: p.rejectionReason ?? undefined,
        processedBy: p.processedBy ?? undefined,
        processedAt: p.processedAt ?? undefined,
        attachments: p.attachments.map(a => ({
          id: a.id,
          createdAt: a.createdAt,
          publicId: a.publicId ?? undefined,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileType: a.fileType,
          payoutId: a.payoutId,
        })),
      }));

      return ok(details);
    } catch (error) {
      console.error("Error getting payouts by AdminKos ID:", error);
      return internalError("Gagal mengambil daftar penarikan");
    }
  }

  /**
   * Get all payouts with filters (for Superadmin)
   */
  static async getAll(filters?: {
    status?: PayoutStatus;
    adminKosId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<Result<{ payouts: PayoutListItem[]; total: number }>> {
    try {
      const { status, adminKosId, dateFrom, dateTo, page = 1, limit = 20 } = filters || {};
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (adminKosId) where.adminKosId = adminKosId;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const [payouts, total] = await Promise.all([
        prisma.payout.findMany({
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
            bankAccount: {
              select: {
                bankName: true,
                accountNumber: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.payout.count({ where }),
      ]);

      const listItems: PayoutListItem[] = payouts.map((p) => ({
        id: p.id,
        adminKosName: p.adminKos.user.name || "Unknown",
        adminKosEmail: p.adminKos.user.email || "Unknown",
        amount: Number(p.amount),
        bankName: p.bankAccount.bankName,
        accountNumber: p.bankAccount.accountNumber,
        status: p.status,
        createdAt: p.createdAt,
      }));

      return ok({ payouts: listItems, total });
    } catch (error) {
      console.error("Error getting all payouts:", error);
      return internalError("Gagal mengambil daftar pengajuan penarikan");
    }
  }

  /**
   * Approve payout
   */
  static async approve(
    id: string,
    processedBy: string,
    attachments?: Array<{
      fileUrl: string;
      fileName: string;
      fileType: string;
      publicId?: string;
    }>
  ): Promise<Result<PayoutDTO>> {
    try {
      const payout = await prisma.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.APPROVED,
          processedBy,
          processedAt: new Date(),
          attachments: attachments
            ? {
                create: attachments,
              }
            : undefined,
        },
      });

      // Trigger ledger synchronization hook
      try {
        const { PayoutHooks } = await import("../../api/hooks/payout.hooks");
        await PayoutHooks.onPayoutApproved(payout.id);
      } catch (error) {
        console.warn("Failed to sync payout to ledger:", error);
        // Don't fail the approval if ledger sync fails
      }

      return ok({
        ...payout,
        amount: Number(payout.amount),
        balanceBefore: Number(payout.balanceBefore),
        balanceAfter: Number(payout.balanceAfter),
      } as PayoutDTO);
    } catch (error) {
      console.error("Error approving payout:", error);
      return internalError("Gagal menyetujui penarikan");
    }
  }

  /**
   * Reject payout
   */
  static async reject(
    id: string,
    rejectionReason: string,
    processedBy: string
  ): Promise<Result<PayoutDTO>> {
    try {
      const payout = await prisma.payout.update({
        where: { id },
        data: {
          status: PayoutStatus.REJECTED,
          rejectionReason,
          processedBy,
          processedAt: new Date(),
        },
      });

      return ok({
        ...payout,
        amount: Number(payout.amount),
        balanceBefore: Number(payout.balanceBefore),
        balanceAfter: Number(payout.balanceAfter),
      } as PayoutDTO);
    } catch (error) {
      console.error("Error rejecting payout:", error);
      return internalError("Gagal menolak penarikan");
    }
  }

  /**
   * Calculate balance for AdminKos
   * This is a simplified version - in production, you'd calculate from actual transactions
   */
  static async getBalance(adminKosId: string): Promise<Result<BalanceInfo>> {
    try {
      // Get total from approved payments for this AdminKos's properties
      const payments = await prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          booking: {
            property: {
              ownerId: adminKosId,
            },
          },
        },
        _sum: {
          amount: true,
        },
      });

      const totalIncome = Number(payments._sum.amount || 0);

      // Get total approved payouts
      const approvedPayouts = await prisma.payout.aggregate({
        where: {
          adminKosId,
          status: PayoutStatus.APPROVED,
        },
        _sum: {
          amount: true,
        },
      });

      const totalWithdrawn = Number(approvedPayouts._sum.amount || 0);

      // Get pending payouts
      const pendingPayouts = await prisma.payout.aggregate({
        where: {
          adminKosId,
          status: PayoutStatus.PENDING,
        },
        _sum: {
          amount: true,
        },
      });

      const totalPending = Number(pendingPayouts._sum.amount || 0);

      const totalBalance = totalIncome - totalWithdrawn;
      const availableBalance = totalBalance - totalPending;

      const balanceInfo: BalanceInfo = {
        totalBalance,
        availableBalance,
        depositBalance: 0, // TODO: Calculate from deposits
        pendingPayouts: totalPending,
        lastCalculated: new Date(),
      };

      return ok(balanceInfo);
    } catch (error) {
      console.error("Error calculating balance:", error);
      return internalError("Gagal menghitung saldo");
    }
  }
}

