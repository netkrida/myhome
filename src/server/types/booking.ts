/**
 * Booking-related DTOs and types
 */

// Enums from Prisma - exported as const enums for runtime usage
export const BookingStatus = {
  UNPAID: 'UNPAID',           // Booking created but payment not completed yet
  DEPOSIT_PAID: 'DEPOSIT_PAID', // Deposit payment successful
  CONFIRMED: 'CONFIRMED',      // Full payment successful
  CHECKED_IN: 'CHECKED_IN',    // Customer has checked in
  COMPLETED: 'COMPLETED',      // Booking completed (checked out)
  CANCELLED: 'CANCELLED',      // Booking cancelled by user or admin
  EXPIRED: 'EXPIRED'           // Payment expired, booking invalid
} as const;

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED'
} as const;

export const PaymentType = {
  DEPOSIT: 'DEPOSIT',
  FULL: 'FULL'
} as const;

export const LeaseType = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
} as const;

export const DepositType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED'
} as const;

// Type definitions for const enums
export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
export type PaymentType = typeof PaymentType[keyof typeof PaymentType];
export type LeaseType = typeof LeaseType[keyof typeof LeaseType];
export type DepositType = typeof DepositType[keyof typeof DepositType];

// Booking DTOs
export interface CreateBookingDTO {
  userId: string;
  roomId: string;
  checkInDate: Date;
  leaseType: LeaseType;
  depositOption: 'deposit' | 'full'; // User choice for payment type
  paymentMethod?: string;
  discountAmount?: number;   // Potongan harga yang diberikan
  discountNote?: string;     // Catatan untuk potongan harga
}

export interface BookingDTO {
  id: string;
  bookingCode: string;
  userId: string;
  propertyId: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate?: Date;
  leaseType: LeaseType;
  totalAmount: number;
  depositAmount?: number;
  discountAmount?: number;   // Potongan harga yang diberikan
  discountNote?: string;     // Catatan untuk potongan harga
  finalAmount?: number;      // Harga setelah diskon (totalAmount - discountAmount)
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  checkedInBy?: string;
  actualCheckInAt?: Date;
  checkedOutBy?: string;
  actualCheckOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
  property?: {
    id: string;
    name: string;
    ownerId?: string;
  };
  room?: {
    id: string;
    roomNumber: string;
    roomType: string;
    monthlyPrice: number;
  };
  checkedInByUser?: BasicUserInfo;
  checkedOutByUser?: BasicUserInfo;
  payments?: PaymentDTO[];
}

export interface BasicUserInfo {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface BookingListQuery {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  propertyId?: string;
  roomId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'checkInDate' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingListResponse {
  bookings: BookingDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Payment DTOs
export interface PaymentDTO {
  id: string;
  bookingId: string;
  userId: string;
  midtransOrderId: string;
  paymentType: PaymentType;
  paymentMethod?: string;
  amount: number;
  status: PaymentStatus;
  transactionTime?: Date;
  transactionId?: string;
  paymentToken?: string;
  expiryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  accountId?: string; // manual booking association
}

export interface CreatePaymentDTO {
  bookingId: string;
  userId: string;
  paymentType: PaymentType;
  amount: number;
  accountId?: string; // manual booking association
  transactionTime?: Date;
}

// Midtrans DTOs
export interface MidtransSnapRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: {
    first_name: string;
    email: string;
    phone?: string;
  };
  item_details: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  expiry?: {
    start_time: string;
    unit: 'minute' | 'hour' | 'day';
    duration: number;
  };
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  signature_key: string;
  settlement_time?: string;
  fraud_status?: string;
  expiry_time?: string;
}

// Booking calculation DTOs
export interface BookingCalculation {
  baseAmount: number;
  totalAmount: number;
  depositAmount?: number;
  leaseType: LeaseType;
  duration: number; // in days/weeks/months based on lease type
  pricePerUnit: number;
}

// Booking validation DTOs
export interface BookingValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Room availability DTOs
export interface RoomAvailabilityCheck {
  roomId: string;
  checkInDate: Date;
  checkOutDate?: Date;
  leaseType: LeaseType;
}

export interface RoomAvailabilityResult {
  isAvailable: boolean;
  conflictingBookings?: Array<{
    id: string;
    checkInDate: Date;
    checkOutDate?: Date;
    status: BookingStatus;
  }>;
}

// Booking statistics DTOs
export interface BookingStatsDTO {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// Update booking DTOs
export interface UpdateBookingStatusDTO {
  status: BookingStatus;
  reason?: string;
}

export interface UpdateBookingDTO {
  checkInDate?: Date;
  checkOutDate?: Date;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

// Receptionist use cases
export interface CheckInRequestDTO {
  bookingId: string;
}

export interface CheckInResponseDTO {
  bookingId: string;
  status: BookingStatus;
  actualCheckInAt?: Date;
  checkedInBy?: BasicUserInfo;
}

export interface CheckOutRequestDTO {
  bookingId: string;
}

export interface CheckOutResponseDTO {
  bookingId: string;
  status: BookingStatus;
  actualCheckOutAt?: Date;
  checkedOutBy?: BasicUserInfo;
}

export type OfflinePaymentMethod = "CASH" | "TRANSFER-ADMIN";
export type DirectBookingPaymentMode = "FULL" | "DEPOSIT";

export interface DirectBookingCustomerInput {
  id?: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
}

export interface DirectBookingPaymentInput {
  mode: DirectBookingPaymentMode;
  method: OfflinePaymentMethod;
  ledgerAccountId: string;
}

export interface DirectBookingRequestDTO {
  customer: DirectBookingCustomerInput;
  propertyId: string;
  roomId: string;
  leaseType: LeaseType;
  checkInDate: Date;
  checkOutDate?: Date;
  payment: DirectBookingPaymentInput;
  idempotencyKey?: string;
  discountAmount?: number;   // Potongan harga yang diberikan
  discountNote?: string;     // Catatan untuk potongan harga
}

export interface DirectBookingResponseDTO {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
  payment: {
    id: string;
    status: PaymentStatus;
  };
}

export interface UpdateBookingDatesDTO {
  checkInDate: Date;
  checkOutDate?: Date;
}

// Extension/Renewal DTOs
export interface ExtendBookingDTO {
  leaseType?: LeaseType; // If not provided, use same as original booking
  periods?: number; // Number of periods to extend (default: 1)
  depositOption?: 'deposit' | 'full'; // Payment option (default: 'full')
  notes?: string;
}

export interface BookingExtensionInfo {
  bookingId: string;
  bookingCode: string;
  currentCheckOutDate: Date;
  newCheckOutDate: Date;
  leaseType: LeaseType;
  extensionAmount: number;
  depositAmount?: number;
  isEligible: boolean;
  reason?: string; // Reason if not eligible
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
  };
  property?: {
    id: string;
    name: string;
  };
}
