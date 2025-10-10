/**
 * Withdraw-related DTOs and types
 * Types for withdraw balance feature that only counts "Pembayaran Kos" transactions
 */

/**
 * Withdrawable balance summary
 * Only includes balance from automatic payment transactions
 */
export interface WithdrawSummaryDTO {
  /** Total income from successful payments (IN from PAYMENT to "Pembayaran Kos") */
  totalPaymentIncome: number;
  
  /** Total withdrawals processed (OUT from PAYOUT to "Pembayaran Kos") */
  totalWithdrawals: number;
  
  /** Net withdrawable balance (totalPaymentIncome - totalWithdrawals) */
  withdrawableBalance: number;
  
  /** Pending withdrawal requests that will reduce available balance */
  pendingWithdrawals: number;
  
  /** Available balance after pending withdrawals */
  availableBalance: number;
  
  /** Timestamp when balance was calculated */
  asOf: Date;
  
  /** ID of the "Pembayaran Kos" system account */
  pembayaranKosAccountId: string;
}

/**
 * Create withdraw request DTO
 */
export interface CreateWithdrawRequestDTO {
  /** Amount to withdraw */
  amount: number;
  
  /** Bank account ID to transfer to */
  bankAccountId: string;
  
  /** Optional notes for the withdrawal */
  notes?: string;
}

/**
 * Withdraw balance breakdown for detailed view
 */
export interface WithdrawBalanceBreakdownDTO {
  /** List of payment entries contributing to balance */
  paymentEntries: {
    id: string;
    amount: number;
    date: Date;
    paymentId: string;
    bookingCode?: string;
    propertyName?: string;
  }[];
  
  /** List of withdrawal entries reducing balance */
  withdrawalEntries: {
    id: string;
    amount: number;
    date: Date;
    payoutId: string;
    status: string;
  }[];
  
  /** Summary totals */
  summary: WithdrawSummaryDTO;
}

