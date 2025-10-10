import { type UserRole } from "./rbac";

/**
 * User-related DTOs and types
 */

// Re-export UserRole for convenience
export { UserRole } from "./rbac";

// Base user DTO
export interface UserDTO {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User creation DTO
export interface CreateUserDTO {
  email: string;
  name?: string;
  role: UserRole;
  password?: string; // For non-OAuth registrations
  image?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

// User update DTO
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: UserRole;
  image?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
  // Address fields (nullable in Prisma)
  provinceCode?: string | null;
  provinceName?: string | null;
  regencyCode?: string | null;
  regencyName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  streetAddress?: string | null;
}

// User list query parameters
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
  sortBy?: 'name' | 'email' | 'role' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// User list response
export interface UserListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User list item (for table display)
export interface UserListItem {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User detail item (for detailed view)
export interface UserDetailItem extends UserListItem {
  emailVerified?: Date | null;
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
  districtCode?: string;
  districtName?: string;
  streetAddress?: string;
  adminKosProfile?: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  receptionistProfile?: {
    id: string;
    shift?: string;
    startDate?: Date;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  customerProfile?: {
    id: string;
    dateOfBirth?: Date;
    gender?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

// User status change DTO
export interface ChangeUserStatusDTO {
  isActive: boolean;
}

// User role change DTO
export interface ChangeUserRoleDTO {
  role: UserRole;
}

// User registration DTO (for different roles)
export interface RegisterUserDTO {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  // Role-specific data
  adminKosData?: AdminKosRegistrationData;
  receptionistData?: ReceptionistRegistrationData;
}

// Admin Kos specific registration data
export interface AdminKosRegistrationData {
  kosName: string;
  kosAddress: string;
  kosDescription?: string;
  phoneNumber?: string;
}

// Receptionist specific registration data  
export interface ReceptionistRegistrationData {
  assignedPropertyId: string;
  phoneNumber?: string;
  shift?: string;
}

// User profile DTO (for authenticated user)
export interface UserProfileDTO {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  image?: string;
  emailVerified?: Date;
  // Role-specific profile data
  adminKosProfile?: AdminKosProfileData;
  receptionistProfile?: ReceptionistProfileData;
  customerProfile?: CustomerProfileData;
}

// Role-specific profile data
export interface AdminKosProfileData {
  kosProperties: KosPropertySummary[];
  totalRooms: number;
  totalBookings: number;
}

export interface ReceptionistProfileData {
  assignedProperties: KosPropertySummary[];
  shift?: string;
  phoneNumber?: string;
}

export interface CustomerProfileData {
  totalBookings: number;
  activeBookings: number;
  favoriteProperties: string[];
}

// Supporting types
export interface KosPropertySummary {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  availableRooms: number;
}

// User list with pagination
export interface UserListDTO {
  users: UserDTO[];
  pagination: PaginationDTO;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// User search/filter parameters
export interface UserFilterParams {
  role?: UserRole;
  search?: string; // Search by name or email
  status?: 'active' | 'inactive'; // Filter by user status
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt' | 'role';
  sortOrder?: 'asc' | 'desc';
}
