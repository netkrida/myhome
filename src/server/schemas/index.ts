/**
 * Central export for all validation schemas
 */

// Authentication schemas
export * from "./auth";

// AdminKos registration schemas
export * from "./adminkos-registration";

// Customer registration schemas
export * from "./customer-registration";

// User schemas (excluding duplicates from auth.ts)
export {
  createUserSchema,
  updateUserSchema,
  userListQuerySchema,
  changeUserStatusSchema,
  changeUserRoleSchema as userChangeRoleSchema, // Rename to avoid conflict
  userIdSchema,
  bulkUserOperationSchema,
  type CreateUserInput,
  type UserListQueryInput,
  type ChangeUserStatusInput,
  type UserIdInput,
  type BulkUserOperationInput
} from "./user.schemas";

// Property schemas
export * from "./property.schemas";

// Room schemas
export * from "./room.schemas";

// Booking schemas
export * from "./booking.schemas";
