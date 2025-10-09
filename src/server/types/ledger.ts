/**
 * Ledger System Types
 * Types for financial bookkeeping system
 */

// Enums from Prisma - exported as const enums for runtime usage
export const LedgerAccountType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE', 
  OTHER: 'OTHER'
} as const;

export const LedgerRefType = {
  PAYMENT: 'PAYMENT',
  PAYOUT: 'PAYOUT',
  MANUAL: 'MANUAL',
  ADJUSTMENT: 'ADJUSTMENT'
} as const;

export const LedgerDirection = {
  IN: 'IN',
  OUT: 'OUT'
} as const;

export type LedgerAccountType = typeof LedgerAccountType[keyof typeof LedgerAccountType];
export type LedgerRefType = typeof LedgerRefType[keyof typeof LedgerRefType];
export type LedgerDirection = typeof LedgerDirection[keyof typeof LedgerDirection];

/**
 * ============================================
 * Ledger Account DTOs
 * ============================================
 */

export interface LedgerAccountDTO {
  id: string;
  adminKosId: string;
  code?: string;
  name: string;
  type: LedgerAccountType;
  isSystem: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  entriesCount?: number;
  totalAmount?: number;
}

export interface CreateLedgerAccountDTO {
  name: string;
  type: LedgerAccountType;
  code?: string;
}

export interface UpdateLedgerAccountDTO {
  name?: string;
  code?: string;
  isArchived?: boolean;
}

/**
 * ============================================
 * Ledger Entry DTOs
 * ============================================
 */

export interface LedgerEntryDTO {
  id: string;
  adminKosId: string;
  accountId: string;
  direction: LedgerDirection;
  amount: number;
  date: Date;
  note?: string;
  refType: LedgerRefType;
  refId?: string;
  propertyId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  account?: {
    id: string;
    name: string;
    type: LedgerAccountType;
  };
  creator?: {
    id: string;
    name?: string;
  };
}

export interface CreateLedgerEntryDTO {
  accountId: string;
  direction: LedgerDirection;
  amount: number;
  date?: Date;
  note?: string;
  refType: LedgerRefType;
  refId?: string;
  propertyId?: string;
}

/**
 * ============================================
 * Ledger Summary & Analytics DTOs
 * ============================================
 */

export interface LedgerSummaryDTO {
  // Period summary
  cashInPeriod: number;
  cashOutPeriod: number;
  netCashFlowPeriod: number;
  
  // Total balance (all time)
  totalBalance: number;
  availableBalance: number;
  totalWithdrawals: number;
  
  // Breakdown by payment source
  paymentIncomeThisMonth: number;
  
  // Period info
  dateFrom: Date;
  dateTo: Date;
}

export interface LedgerTimeSeriesDTO {
  date: string; // YYYY-MM-DD format
  cashIn: number;
  cashOut: number;
  netFlow: number;
  runningBalance: number;
}

export interface LedgerBreakdownDTO {
  accountId: string;
  accountName: string;
  accountType: LedgerAccountType;
  totalAmount: number;
  entriesCount: number;
  percentage: number;
}

export interface LedgerBreakdownResponse {
  income: LedgerBreakdownDTO[];
  expense: LedgerBreakdownDTO[];
  other: LedgerBreakdownDTO[];
}

/**
 * ============================================
 * Query & Filter DTOs
 * ============================================
 */

export interface LedgerQuery {
  dateFrom?: Date;
  dateTo?: Date;
  propertyId?: string;
  accountId?: string;
  direction?: LedgerDirection;
  refType?: LedgerRefType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LedgerListResponse {
  entries: LedgerEntryDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LedgerAccountQuery {
  type?: LedgerAccountType;
  includeArchived?: boolean;
  search?: string;
}

export interface LedgerAccountListResponse {
  accounts: LedgerAccountDTO[];
}

/**
 * ============================================
 * System Integration DTOs
 * ============================================
 */

export interface PaymentSyncDTO {
  paymentId: string;
  bookingId: string;
  propertyId: string;
  amount: number;
  transactionTime?: Date;
}

export interface PayoutSyncDTO {
  payoutId: string;
  amount: number;
  processedAt?: Date;
}

/**
 * ============================================
 * Balance Calculation DTOs
 * ============================================
 */

export interface BalanceCalculationDTO {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  availableBalance: number;
  pendingWithdrawals: number;
  totalWithdrawals: number;
}

/**
 * ============================================
 * Validation Schemas Types
 * ============================================
 */

export interface LedgerValidationError {
  field: string;
  message: string;
}

export interface LedgerOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: LedgerValidationError[];
}
