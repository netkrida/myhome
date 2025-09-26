import { z } from "zod";
import { UserRole } from "../types/rbac";

/**
 * Authentication and authorization validation schemas
 */

// User role validation
export const userRoleSchema = z.nativeEnum(UserRole);

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional().default(false),
});

// User registration base schema (without refine)
const registerUserBaseFields = {
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
};

// User registration base schema with password confirmation
export const registerUserBaseSchema = z.object(registerUserBaseFields).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Admin Kos registration schema
export const registerAdminKosSchema = z.object({
  ...registerUserBaseFields,
  role: z.literal(UserRole.ADMINKOS),
  kosName: z.string().min(2, "Kos name must be at least 2 characters"),
  kosAddress: z.string().min(10, "Address must be at least 10 characters"),
  kosDescription: z.string().optional(),
  businessPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Receptionist registration schema (by AdminKos)
export const registerReceptionistSchema = z.object({
  ...registerUserBaseFields,
  role: z.literal(UserRole.RECEPTIONIST),
  assignedPropertyId: z.string().cuid("Invalid property ID"),
  shift: z.enum(["morning", "evening", "night"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Customer registration schema (by AdminKos or self-registration)
export const registerCustomerSchema = z.object({
  ...registerUserBaseFields,
  role: z.literal(UserRole.CUSTOMER),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Superadmin registration schema (system only)
export const registerSuperadminSchema = z.object({
  ...registerUserBaseFields,
  role: z.literal(UserRole.SUPERADMIN),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Union schema for all registration types (without password confirmation)
const registerUserSchemaBase = z.discriminatedUnion("role", [
  z.object({
    ...registerUserBaseFields,
    role: z.literal(UserRole.ADMINKOS),
    kosName: z.string().min(2, "Kos name must be at least 2 characters"),
    kosAddress: z.string().min(10, "Address must be at least 10 characters"),
    kosDescription: z.string().optional(),
    businessPhone: z.string().optional(),
  }),
  z.object({
    ...registerUserBaseFields,
    role: z.literal(UserRole.RECEPTIONIST),
    assignedPropertyId: z.string().cuid("Invalid property ID"),
    shift: z.enum(["morning", "evening", "night"]).optional(),
  }),
  z.object({
    ...registerUserBaseFields,
    role: z.literal(UserRole.CUSTOMER),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
  }),
  z.object({
    ...registerUserBaseFields,
    role: z.literal(UserRole.SUPERADMIN),
  }),
]);

// Union schema with password confirmation
export const registerUserSchema = registerUserSchemaBase.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User update schema
export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  // Role changes should be handled separately with proper authorization
});

// Role change schema (restricted operation)
export const changeUserRoleSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  newRole: userRoleSchema,
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User query/filter schema
export const userFilterSchema = z.object({
  role: userRoleSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["name", "email", "createdAt", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  isActive: z.boolean().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type RegisterAdminKosInput = z.infer<typeof registerAdminKosSchema>;
export type RegisterReceptionistInput = z.infer<typeof registerReceptionistSchema>;
export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
