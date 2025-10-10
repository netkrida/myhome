/**
 * Bank Account Types
 * Types for bank account management and payout system
 */

import type { BankAccountStatus, PayoutStatus, PayoutSource } from "@prisma/client";

// ============================================================================
// Bank Account Types
// ============================================================================

export interface BankAccountDTO {
  id: string;
  adminKosId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: BankAccountStatus;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccountListItem {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: BankAccountStatus;
  createdAt: Date;
}

export interface BankAccountDetail extends BankAccountDTO {
  adminKosName?: string;
  adminKosEmail?: string;
  approverName?: string;
}

export interface CreateBankAccountDTO {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export type UpdateBankAccountDTO = CreateBankAccountDTO;

export interface ApproveBankAccountDTO {
  approved: boolean;
  rejectionReason?: string;
}

// ============================================================================
// Payout Types
// ============================================================================

export interface PayoutDTO {
  id: string;
  adminKosId: string;
  bankAccountId: string;
  amount: number;
  source: PayoutSource;
  balanceBefore: number;
  balanceAfter: number;
  status: PayoutStatus;
  notes?: string;
  rejectionReason?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutListItem {
  id: string;
  adminKosName: string;
  adminKosEmail: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: PayoutStatus;
  createdAt: Date;
}

export interface PayoutDetail extends PayoutDTO {
  adminKosName?: string;
  adminKosEmail?: string;
  bankAccount?: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  attachments?: PayoutAttachmentDTO[];
  processorName?: string;
}

export interface CreatePayoutDTO {
  bankAccountId: string;
  amount: number;
  source: PayoutSource;
  notes?: string;
}

export interface ApprovePayoutDTO {
  approved: boolean;
  rejectionReason?: string;
  attachments?: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    publicId?: string;
  }[];
}

export interface PayoutAttachmentDTO {
  id: string;
  payoutId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  publicId?: string;
  createdAt: Date;
}

// ============================================================================
// Balance Types
// ============================================================================

export interface BalanceInfo {
  totalBalance: number;
  availableBalance: number;
  depositBalance: number;
  pendingPayouts: number;
  lastCalculated: Date | string; // Support both Date object and ISO string for serialization
  // Additional fields for withdraw balance from "Pembayaran Kos"
  totalPaymentIncome?: number;
  totalWithdrawals?: number;
}

// ============================================================================
// Bank List from Kemenkeu API
// ============================================================================

export interface BankFromAPI {
  kode: string;
  nama: string;
}

export interface BankListResponse {
  success: boolean;
  data: BankFromAPI[];
}

