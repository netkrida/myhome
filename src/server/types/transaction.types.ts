/**
 * Transaction Types & DTOs
 * For SUPERADMIN transaction management
 */

export interface TransactionSummaryDTO {
  totalTransactions: number;
  totalRevenue: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  refundedAmount: number;
  averageOrderValue: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  revenue: number;
  count: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface TransactionListItem {
  id: string;
  midtransOrderId: string;
  status: string;
  paymentType: string;
  paymentMethod: string | null;
  amount: number;
  transactionTime: Date | null;
  transactionId: string | null;
  createdAt: Date;
  payer: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  booking: {
    bookingCode: string;
    leaseType: string;
    room: {
      roomNumber: string;
      roomType: string;
      floor: number;
    };
    property: {
      id: string;
      name: string;
      owner: {
        id: string;
        name: string;
        email: string;
      };
    };
  };
}

export interface TransactionDetailDTO extends TransactionListItem {
  expiryTime: Date | null;
  updatedAt: Date;
  // Never include paymentToken
}

export interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  paymentType?: string;
  paymentMethod?: string;
  propertyId?: string;
  ownerId?: string;
  search?: string;
}

export interface TransactionListResponse {
  transactions: TransactionListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionChartData {
  timeSeries: TimeSeriesDataPoint[];
  methodBreakdown: PaymentMethodBreakdown[];
}

