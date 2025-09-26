import type { User, AdminKosProfile } from "@prisma/client";

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
