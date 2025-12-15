import type { User, AdminKosProfile } from "@prisma/client";
import type { BookingStatus, PaymentStatus, LeaseType, PaymentType } from "./booking";

/**
 * AdminKos registration data
 */
export interface AdminKosRegistrationData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  districtCode: string;
  districtName: string;
  streetAddress: string;
}

/**
 * AdminKos registration result
 */
export interface AdminKosRegistrationResult {
  user: User;
  profile: AdminKosProfile;
}

/**
 * AdminKos with profile data
 */
export type AdminKosWithProfile = User & {
  adminKosProfile: AdminKosProfile | null;
};

/**
 * ============================================
 * AdminKos Dashboard Types
 * ============================================
 */

/**
 * KPI Summary for AdminKos Dashboard
 */
export interface AdminKosSummaryDTO {
  totalActiveProperties: number;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number; // Percentage (0-100)
  activeBookings: number;
  revenueThisMonth: number;
  depositReceivedThisMonth: number;
  pendingPayments: number;
}

/**
 * Today's Activity Panel
 */
export interface TodayActivityDTO {
  checkInsToday: BookingActivityDTO[];
  checkOutsToday: BookingActivityDTO[];
  pendingPayments: PendingPaymentDTO[];
}

export interface BookingActivityDTO {
  id: string;
  bookingCode: string;
  customerName: string;
  propertyName: string;
  roomNumber: string;
  checkInDate: Date;
  checkOutDate: Date | null;
  status: BookingStatus;
}

export interface PendingPaymentDTO {
  id: string;
  bookingCode: string;
  customerName: string;
  amount: number;
  paymentType: PaymentType;
  expiryTime: Date | null;
  status: PaymentStatus;
  hoursUntilExpiry: number | null;
}

/**
 * Revenue Chart Data (12 months)
 */
export interface RevenueChartDTO {
  months: MonthlyRevenueDTO[];
}

export interface MonthlyRevenueDTO {
  month: string; // Format: "2024-01" or "Jan 2024"
  totalRevenue: number;
  depositRevenue: number;
  fullRevenue: number;
  transactionCount: number;
}

/**
 * Payment Type Breakdown (current month)
 */
export interface PaymentTypeBreakdownDTO {
  deposit: number;
  full: number;
  totalAmount: number;
}

/**
 * Recent Bookings Table
 */
export interface RecentBookingsDTO {
  bookings: BookingTableItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingTableItemDTO {
  id: string;
  bookingCode: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  propertyName: string;
  roomNumber: string;
  roomType: string;
  leaseType: LeaseType;
  checkInDate: Date;
  checkOutDate: Date | null;
  actualCheckInAt: Date | null;
  actualCheckOutAt: Date | null;
  leaseDuration: number; // in days
  remainingDays: number; // remaining days until checkout
  totalAmount: number;
  depositAmount: number | null;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
}

/**
 * Rooms Table
 */
export interface AdminKosRoomsDTO {
  rooms: RoomTableItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomTableItemDTO {
  id: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  updatedAt: Date;
  mainImageUrl: string | null;
}

/**
 * My Properties Cards
 */
export interface MyPropertiesDTO {
  properties: PropertyCardDTO[];
}

export interface PropertyCardDTO {
  id: string;
  name: string;
  status: string;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
  revenueThisMonth: number;
  propertyType: string;
  mainImageUrl: string | null;
}

/**
 * Query Filters
 */
export interface AdminKosDashboardQuery {
  propertyIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AdminKosBookingsQuery {
  page?: number;
  limit?: number;
  propertyId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  leaseType?: LeaseType;
  search?: string; // Search by bookingCode, customer name/email, roomNumber
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "createdAt" | "checkInDate" | "totalAmount";
  sortOrder?: "asc" | "desc";
}

export interface AdminKosRoomsQuery {
  page?: number;
  limit?: number;
  propertyId?: string;
  isAvailable?: boolean;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "roomNumber" | "monthlyPrice" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * ============================================
 * New Rooms Management Types
 * ============================================
 */

/**
 * Rooms Summary for new rooms page
 */
export interface RoomsSummaryDTO {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number; // Percentage (0-100)
  propertyName?: string; // If filtered by specific property
}

/**
 * Room Grid Item for maps/grid view
 */
export interface RoomGridItemDTO {
  id: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  hasActiveBooking: boolean;
  mainImageUrl: string | null;
  // Status for grid display
  status: 'available' | 'occupied' | 'unavailable';
}

/**
 * Active Booking Detail for modal
 */
export interface ActiveBookingDetailDTO {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  leaseType: LeaseType;
  checkInDate: Date;
  checkOutDate: Date | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  // Room info
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    floor: number;
    propertyName: string;
  };
  // Tenant info
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
}

/**
 * Room Detail DTO (for detail modal)
 */
export interface RoomDetailDTO {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  description: string | null;
  size: string | null;
  monthlyPrice: number;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  quarterlyPrice: number | null;
  yearlyPrice: number | null;
  isAvailable: boolean;
  facilities: any;
  createdAt: Date;
  updatedAt: Date;
  // Property info
  property: {
    id: string;
    name: string;
    fullAddress: string;
  };
  // Images
  images: {
    id: string;
    imageUrl: string;
    category: string;
  }[];
  // Active booking (if any)
  activeBooking: {
    id: string;
    bookingCode: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    leaseType: LeaseType;
    checkInDate: Date;
    checkOutDate: Date | null;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    user: {
      id: string;
      name: string;
      email: string;
      phoneNumber: string | null;
    };
  } | null;
}

/**
 * Edit Room DTO
 */
export interface EditRoomDTO {
  roomType?: string;
  floor?: number;
  monthlyPrice?: number;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  quarterlyPrice?: number | null;
  yearlyPrice?: number | null;
}

/**
 * Add Room DTO
 */
export interface AddRoomDTO {
  propertyId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  monthlyPrice: number;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  quarterlyPrice?: number | null;
  yearlyPrice?: number | null;
  isAvailable?: boolean;
  description?: string;
  size?: string;
  facilities?: any[];
}

/**
 * Property Slider Item
 */
export interface PropertySliderItemDTO {
  id: string;
  name: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  mainImageUrl: string | null;
}

/**
 * Notifications & To-Do
 */
export interface AdminKosNotificationsDTO {
  pendingProperties: number;
  failedPayments: number;
  unpaidBookingsOverXHours: number;
  suspendedProperties: number;
}
