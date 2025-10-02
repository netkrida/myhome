import type { BookingStatus, CustomerProfile, CustomerStatus, User } from "@prisma/client";
import type { UserRole } from "./rbac";

export interface CustomerRegistrationData {
  fullName: string;
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
  status: "MAHASISWA" | "PEKERJA";
  institutionName?: string;
}

export interface CustomerRegistrationResult {
  user: User;
  profile: CustomerProfile;
}

export type CustomerWithProfile = User & {
  customerProfile: CustomerProfile | null;
};

export interface CustomerAddress {
  provinceCode?: string | null;
  provinceName?: string | null;
  regencyCode?: string | null;
  regencyName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  streetAddress?: string | null;
}

export interface CustomerProfileInfo {
  dateOfBirth?: Date | null;
  gender?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  status?: CustomerStatus | null;
  institutionName?: string | null;
}

export interface CustomerProfileStats {
  totalBookings: number;
  activeBookings: number;
  pendingPayments: number;
}

export interface CustomerBookingSummary {
  id: string;
  bookingCode: string;
  propertyId?: string | null;
  propertyName?: string | null;
  roomId?: string | null;
  roomType?: string | null;
  status: BookingStatus;
  checkInDate: Date;
  createdAt: Date;
  totalAmount: number;
}

export interface CustomerProfileDetail {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  image?: string | null;
  memberSince: Date;
  address: CustomerAddress;
  profile: CustomerProfileInfo | null;
  stats: CustomerProfileStats;
  recentBookings: CustomerBookingSummary[];
}
