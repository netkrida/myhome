import { z } from "zod";
import { UserRole } from "../types/rbac";

/**
 * User validation schemas using Zod
 */

// Base user schema
export const userBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Invalid email format"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 digits").optional(),
});

// Create user schema
export const createUserSchema = userBaseSchema.extend({
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Invalid role" }) }),
  password: z.string().min(8, "Password must be at least 8 characters").max(100, "Password must be less than 100 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
});

// Update user schema
export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Invalid role" }) }).optional(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be less than 15 digits").optional(),
  isActive: z.boolean().optional(),
});

// User list query schema
export const userListQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(10),
  search: z.string().max(100, "Search term must be less than 100 characters").optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sortBy: z.enum(["name", "email", "role", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Change user status schema
export const changeUserStatusSchema = z.object({
  isActive: z.boolean(),
});

// Change user role schema
export const changeUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Invalid role" }) }),
});

// User ID parameter schema
export const userIdSchema = z.object({
  id: z.string().cuid("Invalid user ID format"),
});

// Bulk user operations schema
export const bulkUserOperationSchema = z.object({
  userIds: z.array(z.string().cuid("Invalid user ID format")).min(1, "At least one user ID is required"),
  operation: z.enum(["activate", "deactivate", "delete"]),
});

// User search schema
export const userSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query must be less than 100 characters"),
  filters: z.object({
    role: z.nativeEnum(UserRole).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }).optional(),
});

// Export types for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>;
// UpdateUserInput is exported from auth.ts to avoid duplicate exports
export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
// ChangeUserRoleInput is exported from auth.ts to avoid duplicate exports
export type UserIdInput = z.infer<typeof userIdSchema>;
export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;
