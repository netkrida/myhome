/**
 * Central export for all server types
 */

// RBAC types
export * from "./rbac";

// User types
export * from "./user";

// AdminKos types (excluding duplicates from user.ts)
export type {
  AdminKosRegistrationData as AdminKosRegistrationDTO,
  AdminKosRegistrationResult,
  AdminKosWithProfile
} from "./adminkos";

// Result types
export * from "./result";

// Property types
export * from "./property";

// Room types
export * from "./room";

// Booking types
export * from "./booking";

// Campus types
export * from "./campus";
