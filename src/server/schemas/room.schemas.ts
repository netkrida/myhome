import { z } from "zod";
import { ImageCategory } from "../types/property";
import { DepositPercentage } from "../types/room";

/**
 * Room validation schemas using Zod
 */

// Room facility schema
export const roomFacilitySchema = z.object({
  id: z.string().min(1, "Facility ID is required"),
  name: z.string().min(1, "Facility name is required"),
  category: z.enum(["room", "bathroom"], { errorMap: () => ({ message: "Invalid facility category" }) }),
});

// Base room pricing schema (without refine for partial support)
export const baseRoomPricingSchema = z.object({
  monthlyPrice: z.number().min(0, "Monthly price cannot be negative"),
  dailyPrice: z.number().min(0, "Daily price cannot be negative").optional(),
  weeklyPrice: z.number().min(0, "Weekly price cannot be negative").optional(),
  quarterlyPrice: z.number().min(0, "Quarterly price cannot be negative").optional(),
  yearlyPrice: z.number().min(0, "Yearly price cannot be negative").optional(),
});

// Room pricing schema with validation
export const roomPricingSchema = baseRoomPricingSchema;

// Room image schema
export const roomImageSchema = z.object({
  category: z.nativeEnum(ImageCategory, { errorMap: () => ({ message: "Invalid image category" }) }),
  imageUrl: z.string().url("Invalid image URL"),
  publicId: z.string().optional(),
  caption: z.string().max(255, "Caption must be less than 255 characters").optional(),
  sortOrder: z.number().min(0, "Sort order must be non-negative").default(0),
});

// Room configuration item schema
export const roomConfigurationItemSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").max(50, "Room number must be less than 50 characters"),
  floor: z.number().min(1, "Floor must be at least 1").max(50, "Floor cannot exceed 50"),
  roomType: z.string().min(1, "Room type is required"),
  isAvailable: z.boolean().default(true),
});

// Room creation step schemas
export const createRoomStep1Schema = z.object({
  roomTypePhotos: z.record(z.string(), z.object({
    frontViewPhotos: z.array(z.string()).min(1, "At least one front view photo is required"),
    interiorPhotos: z.array(z.string()).min(1, "At least one interior photo is required"),
    bathroomPhotos: z.array(z.string()).min(1, "At least one bathroom photo is required"),
    description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  })).refine((data) => Object.keys(data).length > 0, {
    message: "At least one room type must have photos",
  }),
});

export const createRoomStep2Schema = z.object({
  facilities: z.array(roomFacilitySchema).min(1, "At least one facility is required"),
});

export const createRoomStep3Schema = z.object({
  pricing: z.record(z.string(), baseRoomPricingSchema).refine((data) => Object.keys(data).length > 0, {
    message: "At least one room type pricing is required",
  }),
  hasAlternativeRentals: z.boolean().default(false),
  alternativeRentals: z.object({
    daily: z.boolean().default(false),
    weekly: z.boolean().default(false),
    quarterly: z.boolean().default(false),
    yearly: z.boolean().default(false),
  }).optional(),
  hasDeposit: z.boolean().default(false),
  depositPercentage: z.nativeEnum(DepositPercentage).optional(),
}).refine((data) => {
  if (data.hasAlternativeRentals && !data.alternativeRentals) {
    return false;
  }
  if (data.hasDeposit && !data.depositPercentage) {
    return false;
  }
  return true;
}, {
  message: "Alternative rentals and deposit percentage must be provided when enabled",
});

export const createRoomStep4Schema = z.object({
  rooms: z.array(roomConfigurationItemSchema).min(1, "At least one room configuration is required"),
});

// Complete room creation schema
export const createRoomSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID format"),
  step1: createRoomStep1Schema,
  step2: createRoomStep2Schema,
  step3: createRoomStep3Schema,
  step4: createRoomStep4Schema,
});

// Room update schema
export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").max(50, "Room number must be less than 50 characters").optional(),
  floor: z.number().min(1, "Floor must be at least 1").max(50, "Floor cannot exceed 50").optional(),
  roomType: z.string().min(1, "Room type is required").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  size: z.string().max(50, "Size must be less than 50 characters").optional(),
  pricing: baseRoomPricingSchema.partial().optional(),
  facilities: z.array(roomFacilitySchema).min(1, "At least one facility is required").optional(),
  isAvailable: z.boolean().optional(),
});

// Room list query schema
export const roomListQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(10),
  search: z.string().max(100, "Search term must be less than 100 characters").optional(),
  propertyId: z.string().cuid("Invalid property ID format").optional(),
  roomType: z.string().optional(),
  isAvailable: z.boolean().optional(),
  minPrice: z.coerce.number().min(0, "Minimum price cannot be negative").optional(),
  maxPrice: z.coerce.number().min(0, "Maximum price cannot be negative").optional(),
  floor: z.coerce.number().min(1, "Floor must be at least 1").optional(),
  sortBy: z.enum(["roomNumber", "floor", "monthlyPrice", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine((data) => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "Minimum price cannot exceed maximum price",
  path: ["maxPrice"],
});

// Room availability update schema
export const updateRoomAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

// Room ID parameter schema
export const roomIdSchema = z.object({
  id: z.string().cuid("Invalid room ID format"),
});

// Room image upload schema
export const roomImageUploadSchema = z.object({
  roomId: z.string().cuid("Invalid room ID format"),
  category: z.nativeEnum(ImageCategory, { errorMap: () => ({ message: "Invalid image category" }) }),
  images: z.array(z.any()).min(1, "At least one image is required"),
});

// Room search schema
export const roomSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query must be less than 100 characters"),
  filters: z.object({
    propertyId: z.string().cuid("Invalid property ID format").optional(),
    roomType: z.string().optional(),
    isAvailable: z.boolean().optional(),
    minPrice: z.number().min(0, "Minimum price cannot be negative").optional(),
    maxPrice: z.number().min(0, "Maximum price cannot be negative").optional(),
    floor: z.number().min(1, "Floor must be at least 1").optional(),
  }).optional(),
}).refine((data) => {
  if (data.filters?.minPrice && data.filters?.maxPrice) {
    return data.filters.minPrice <= data.filters.maxPrice;
  }
  return true;
}, {
  message: "Minimum price cannot exceed maximum price",
  path: ["filters", "maxPrice"],
});

// Bulk room operations schema
export const bulkUpdateRoomAvailabilitySchema = z.object({
  roomIds: z.array(z.string().cuid("Invalid room ID format")).min(1, "At least one room ID is required"),
  isAvailable: z.boolean(),
});

export const bulkUpdateRoomPricingSchema = z.object({
  roomIds: z.array(z.string().cuid("Invalid room ID format")).min(1, "At least one room ID is required"),
  pricing: roomPricingSchema.partial(),
});

// Room filter schema for property detail
export const roomFilterSchema = z.object({
  roomType: z.string().optional(),
  isAvailable: z.boolean().optional(),
  minPrice: z.number().min(0, "Minimum price cannot be negative").optional(),
  maxPrice: z.number().min(0, "Maximum price cannot be negative").optional(),
  floor: z.number().min(1, "Floor must be at least 1").optional(),
}).refine((data) => {
  if (data.minPrice && data.maxPrice) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "Minimum price cannot exceed maximum price",
  path: ["maxPrice"],
});

// Room statistics query schema
export const roomStatsQuerySchema = z.object({
  propertyId: z.string().cuid("Invalid property ID format").optional(),
  roomType: z.string().optional(),
  dateFrom: z.string().datetime("Invalid date format").optional(),
  dateTo: z.string().datetime("Invalid date format").optional(),
});

// Room type configuration schema
export const roomTypeConfigSchema = z.object({
  name: z.string().min(1, "Room type name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  defaultFacilities: z.array(z.string()).optional(),
  suggestedPriceRange: z.object({
    min: z.number().min(0, "Minimum price cannot be negative"),
    max: z.number().min(0, "Maximum price cannot be negative"),
  }).refine((data) => data.min <= data.max, {
    message: "Minimum price cannot exceed maximum price",
    path: ["max"],
  }).optional(),
});

// Export types for TypeScript
export type CreateRoomStep1Input = z.infer<typeof createRoomStep1Schema>;
export type CreateRoomStep2Input = z.infer<typeof createRoomStep2Schema>;
export type CreateRoomStep3Input = z.infer<typeof createRoomStep3Schema>;
export type CreateRoomStep4Input = z.infer<typeof createRoomStep4Schema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomListQueryInput = z.infer<typeof roomListQuerySchema>;
export type UpdateRoomAvailabilityInput = z.infer<typeof updateRoomAvailabilitySchema>;
export type RoomIdInput = z.infer<typeof roomIdSchema>;
export type RoomImageUploadInput = z.infer<typeof roomImageUploadSchema>;
export type RoomSearchInput = z.infer<typeof roomSearchSchema>;
export type BulkUpdateRoomAvailabilityInput = z.infer<typeof bulkUpdateRoomAvailabilitySchema>;
export type BulkUpdateRoomPricingInput = z.infer<typeof bulkUpdateRoomPricingSchema>;
export type RoomFilterInput = z.infer<typeof roomFilterSchema>;
export type RoomStatsQueryInput = z.infer<typeof roomStatsQuerySchema>;
export type RoomTypeConfigInput = z.infer<typeof roomTypeConfigSchema>;
