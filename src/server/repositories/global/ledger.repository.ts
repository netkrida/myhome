/**
 * Ledger Repository
 * Data access layer for ledger operations
 */

import { prisma } from "../../db/client";
import type {
  LedgerAccountDTO,
  LedgerEntryDTO,
  CreateLedgerAccountDTO,
  UpdateLedgerAccountDTO,
  CreateLedgerEntryDTO,
  LedgerQuery,
  LedgerAccountQuery,
  LedgerAccountType,
  LedgerDirection,
  LedgerRefType,
} from "../../types/ledger";

export class LedgerRepository {
  /**
   * ============================================
   * Ledger Account Operations
   * ============================================
   */

  static async createAccount(
    adminKosId: string,
    data: CreateLedgerAccountDTO & { isSystem?: boolean }
  ): Promise<LedgerAccountDTO> {
    const account = await prisma.ledgerAccount.create({
      data: {
        adminKosId,
        name: data.name,
        type: data.type,
        code: data.code,
        isSystem: data.isSystem || false,
      },
    });

    return this.mapAccountToDTO(account);
  }

  static async getAccountByName(
    adminKosId: string,
    name: string
  ): Promise<LedgerAccountDTO | null> {
    const account = await prisma.ledgerAccount.findFirst({
      where: {
        adminKosId,
        name,
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return account ? this.mapAccountToDTO(account) : null;
  }

  static async getAccountById(id: string): Promise<LedgerAccountDTO | null> {
    const account = await prisma.ledgerAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return account ? this.mapAccountToDTO(account) : null;
  }

  static async getAccountsByAdminKos(
    adminKosId: string,
    query: LedgerAccountQuery = {}
  ): Promise<LedgerAccountDTO[]> {
    const where: any = {
      adminKosId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (!query.includeArchived) {
      where.isArchived = false;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const accounts = await prisma.ledgerAccount.findMany({
      where,
      include: {
        _count: {
          select: { entries: true },
        },
        entries: {
          select: {
            amount: true,
            direction: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return accounts.map((account) => {
      const totalAmount = account.entries.reduce((sum, entry) => {
        const amount = Number(entry.amount);
        return entry.direction === 'IN' ? sum + amount : sum - amount;
      }, 0);

      return this.mapAccountToDTO({
        ...account,
        totalAmount,
      });
    });
  }

  static async updateAccount(
    id: string,
    data: UpdateLedgerAccountDTO
  ): Promise<LedgerAccountDTO> {
    const account = await prisma.ledgerAccount.update({
      where: { id },
      data,
    });

    return this.mapAccountToDTO(account);
  }

  static async findSystemAccount(
    adminKosId: string,
    name: string,
    type: LedgerAccountType
  ): Promise<LedgerAccountDTO | null> {
    const account = await prisma.ledgerAccount.findFirst({
      where: {
        adminKosId,
        name,
        type,
        isSystem: true,
      },
    });

    return account ? this.mapAccountToDTO(account) : null;
  }

  static async ensureSystemAccount(
    adminKosId: string,
    name: string,
    type: LedgerAccountType
  ): Promise<LedgerAccountDTO> {
    let account = await this.findSystemAccount(adminKosId, name, type);
    
    if (!account) {
      account = await this.createAccount(adminKosId, {
        name,
        type,
        isSystem: true,
      });
    }

    return account;
  }

  /**
   * ============================================
   * Ledger Entry Operations
   * ============================================
   */

  static async createEntry(
    adminKosId: string,
    createdBy: string,
    data: CreateLedgerEntryDTO
  ): Promise<LedgerEntryDTO> {
    const entry = await prisma.ledgerEntry.create({
      data: {
        adminKosId,
        accountId: data.accountId,
        direction: data.direction,
        amount: data.amount,
        date: data.date || new Date(),
        note: data.note,
        refType: data.refType,
        refId: data.refId,
        propertyId: data.propertyId,
        createdBy,
      },
      include: {
        account: true,
      },
    });

    return this.mapEntryToDTO(entry);
  }

  static async getEntryById(id: string): Promise<LedgerEntryDTO | null> {
    const entry = await prisma.ledgerEntry.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });

    return entry ? this.mapEntryToDTO(entry) : null;
  }

  static async updateEntry(
    id: string,
    data: Partial<CreateLedgerEntryDTO>
  ): Promise<LedgerEntryDTO> {
    const updateData: any = {};

    if (data.accountId) updateData.accountId = data.accountId;
    if (data.direction) updateData.direction = data.direction;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date) updateData.date = data.date;
    if (data.note !== undefined) updateData.note = data.note;

    const entry = await prisma.ledgerEntry.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
      },
    });

    return this.mapEntryToDTO(entry);
  }

  static async deleteEntry(id: string): Promise<void> {
    await prisma.ledgerEntry.delete({
      where: { id },
    });
  }

  static async getEntriesByAdminKos(
    adminKosId: string,
    query: LedgerQuery = {}
  ): Promise<{ entries: LedgerEntryDTO[]; total: number }> {
    const where: any = {
      adminKosId,
    };

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = query.dateFrom;
      if (query.dateTo) where.date.lte = query.dateTo;
    }

    // Other filters
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.accountId) where.accountId = query.accountId;
    if (query.direction) where.direction = query.direction;
    if (query.refType) where.refType = query.refType;

    // Search filter
    if (query.search) {
      where.OR = [
        { note: { contains: query.search, mode: 'insensitive' } },
        { refId: { contains: query.search, mode: 'insensitive' } },
        { account: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Sorting
    const orderBy: any = {};
    const sortBy = query.sortBy || 'date';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.ledgerEntry.count({ where }),
    ]);

    return {
      entries: entries.map(this.mapEntryToDTO),
      total,
    };
  }

  static async findEntryByRef(
    refType: LedgerRefType,
    refId: string
  ): Promise<LedgerEntryDTO | null> {
    const entry = await prisma.ledgerEntry.findFirst({
      where: {
        refType,
        refId,
      },
      include: {
        account: true,
      },
    });

    return entry ? this.mapEntryToDTO(entry) : null;
  }

  /**
   * ============================================
   * Aggregation Operations
   * ============================================
   */

  static async getSummaryByAdminKos(
    adminKosId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    cashIn: number;
    cashOut: number;
    totalBalance: number;
  }> {
    const where: any = { adminKosId };
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [cashInResult, cashOutResult, totalInResult, totalOutResult] = await Promise.all([
      // Cash in for period
      prisma.ledgerEntry.aggregate({
        where: { ...where, direction: 'IN' },
        _sum: { amount: true },
      }),
      // Cash out for period
      prisma.ledgerEntry.aggregate({
        where: { ...where, direction: 'OUT' },
        _sum: { amount: true },
      }),
      // Total in (all time)
      prisma.ledgerEntry.aggregate({
        where: { adminKosId, direction: 'IN' },
        _sum: { amount: true },
      }),
      // Total out (all time)
      prisma.ledgerEntry.aggregate({
        where: { adminKosId, direction: 'OUT' },
        _sum: { amount: true },
      }),
    ]);

    const cashIn = Number(cashInResult._sum.amount || 0);
    const cashOut = Number(cashOutResult._sum.amount || 0);
    const totalIn = Number(totalInResult._sum.amount || 0);
    const totalOut = Number(totalOutResult._sum.amount || 0);

    return {
      cashIn,
      cashOut,
      totalBalance: totalIn - totalOut,
    };
  }

  /**
   * ============================================
   * Mapping Functions
   * ============================================
   */

  private static mapAccountToDTO(account: any): LedgerAccountDTO {
    return {
      id: account.id,
      adminKosId: account.adminKosId,
      code: account.code,
      name: account.name,
      type: account.type,
      isSystem: account.isSystem,
      isArchived: account.isArchived,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      entriesCount: account._count?.entries || 0,
      totalAmount: account.totalAmount || 0,
    };
  }

  private static mapEntryToDTO(entry: any): LedgerEntryDTO {
    return {
      id: entry.id,
      adminKosId: entry.adminKosId,
      accountId: entry.accountId,
      direction: entry.direction,
      amount: Number(entry.amount),
      date: entry.date,
      note: entry.note,
      refType: entry.refType,
      refId: entry.refId,
      propertyId: entry.propertyId,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      account: entry.account ? {
        id: entry.account.id,
        name: entry.account.name,
        type: entry.account.type,
      } : undefined,
    };
  }
}
