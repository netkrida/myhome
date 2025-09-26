import { z } from "zod";
import { PropertyType, PropertyStatus, ImageCategory } from "../types/property";

/**
 * Property validation schemas using Zod
 */

// Location schema
export const locationSchema = z.object({
  provinceCode: z.string().min(1, "Province code is required"),
  provinceName: z.string().min(1, "Province name is required"),
  regencyCode: z.string().min(1, "Regency code is required"),
  regencyName: z.string().min(1, "Regency name is required"),
  districtCode: z.string().min(1, "District code is required"),
  districtName: z.string().min(1, "District name is required"),
  fullAddress: z.string().min(1, "Full address is required").max(500, "Address must be less than 500 characters"),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
});

// Property facility schema
export const propertyFacilitySchema = z.object({
  id: z.string().min(1, "Facility ID is required"),
  name: z.string().min(1, "Facility name is required"),
  category: z.enum(["property", "parking"], { errorMap: () => ({ message: "Invalid facility category" }) }),
});

// Property rule schema
export const propertyRuleSchema = z.object({
  id: z.string().min(1, "Rule ID is required"),
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
});

// Property image schema
export const propertyImageSchema = z.object({
  category: z.nativeEnum(ImageCategory, { errorMap: () => ({ message: "Invalid image category" }) }),
  imageUrl: z.string().url("Invalid image URL"),
  publicId: z.string().optional(),
  caption: z.string().max(255, "Caption must be less than 255 characters").optional(),
  sortOrder: z.number().min(0, "Sort order must be non-negative").default(0),
});

// Property creation step schemas
export const createPropertyStep1Schema = z.object({
  name: z.string().min(1, "Property name is required").max(255, "Name must be less than 255 characters"),
  buildYear: z.number().min(1900, "Build year must be after 1900").max(new Date().getFullYear(), "Build year cannot be in the future"),
  propertyType: z.nativeEnum(PropertyType, { errorMap: () => ({ message: "Invalid property type" }) }),
  roomTypes: z.array(z.string().min(1, "Room type cannot be empty")).min(1, "At least one room type is required"),
  totalRooms: z.number().min(1, "Total rooms must be at least 1").max(1000, "Total rooms cannot exceed 1000"),
  availableRooms: z.number().min(0, "Available rooms cannot be negative"),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters"),
}).refine((data) => data.availableRooms <= data.totalRooms, {
  message: "Available rooms cannot exceed total rooms",
  path: ["availableRooms"],
});

export const createPropertyStep2Schema = z.object({
  location: locationSchema,
});

export const createPropertyStep3Schema = z.object({
  images: z.object({
    buildingPhotos: z.array(z.any()).min(1, "At least one building photo is required"),
    sharedFacilitiesPhotos: z.array(z.any()).optional(),
    floorPlanPhotos: z.array(z.any()).optional(),
  }),
});

export const createPropertyStep4Schema = z.object({
  facilities: z.array(propertyFacilitySchema).min(1, "At least one facility is required"),
  rules: z.array(propertyRuleSchema).min(1, "At least one rule is required"),
});

// Complete property creation schema
export const createPropertySchema = z.object({
  step1: createPropertyStep1Schema,
  step2: createPropertyStep2Schema,
  step3: createPropertyStep3Schema,
  step4: createPropertyStep4Schema,
});

// Property update schema
export const updatePropertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(255, "Name must be less than 255 characters").optional(),
  buildYear: z.number().min(1900, "Build year must be after 1900").max(new Date().getFullYear(), "Build year cannot be in the future").optional(),
  propertyType: z.nativeEnum(PropertyType, { errorMap: () => ({ message: "Invalid property type" }) }).optional(),
  description: z.string().min(1, "Description is required").max(2000, "Description must be less than 2000 characters").optional(),
  roomTypes: z.array(z.string().min(1, "Room type cannot be empty")).min(1, "At least one room type is required").optional(),
  totalRooms: z.number().min(1, "Total rooms must be at least 1").max(1000, "Total rooms cannot exceed 1000").optional(),
  location: locationSchema.partial().optional(),
  facilities: z.array(propertyFacilitySchema).min(1, "At least one facility is required").optional(),
  rules: z.array(propertyRuleSchema).min(1, "At least one rule is required").optional(),
});

// Property list query schema
export const propertyListQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(10),
  search: z.string().max(100, "Search term must be less than 100 characters").optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  ownerId: z.string().cuid("Invalid owner ID format").optional(),
  provinceCode: z.string().optional(),
  regencyCode: z.string().optional(),
  districtCode: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "buildYear", "totalRooms"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Property approval schema
export const propertyApprovalSchema = z.object({
  status: z.nativeEnum(PropertyStatus, { errorMap: () => ({ message: "Invalid status" }) }),
  rejectionReason: z.string().min(1, "Rejection reason is required").max(500, "Rejection reason must be less than 500 characters").optional(),
}).refine((data) => {
  if (data.status === PropertyStatus.REJECTED && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when rejecting a property",
  path: ["rejectionReason"],
});

// Property ID parameter schema
export const propertyIdSchema = z.object({
  id: z.string().cuid("Invalid property ID format"),
});

// Property image upload schema
export const propertyImageUploadSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID format"),
  category: z.nativeEnum(ImageCategory, { errorMap: () => ({ message: "Invalid image category" }) }),
  images: z.array(z.any()).min(1, "At least one image is required"),
});

// Property search schema
export const propertySearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query must be less than 100 characters"),
  filters: z.object({
    propertyType: z.nativeEnum(PropertyType).optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
    provinceCode: z.string().optional(),
    regencyCode: z.string().optional(),
    districtCode: z.string().optional(),
    minRooms: z.number().min(1, "Minimum rooms must be at least 1").optional(),
    maxRooms: z.number().min(1, "Maximum rooms must be at least 1").optional(),
  }).optional(),
}).refine((data) => {
  if (data.filters?.minRooms && data.filters?.maxRooms) {
    return data.filters.minRooms <= data.filters.maxRooms;
  }
  return true;
}, {
  message: "Minimum rooms cannot exceed maximum rooms",
  path: ["filters", "maxRooms"],
});

// Bulk property operations schema
export const bulkPropertyOperationSchema = z.object({
  propertyIds: z.array(z.string().cuid("Invalid property ID format")).min(1, "At least one property ID is required"),
  operation: z.enum(["approve", "reject", "suspend", "delete"]),
  rejectionReason: z.string().min(1, "Rejection reason is required").max(500, "Rejection reason must be less than 500 characters").optional(),
}).refine((data) => {
  if (data.operation === "reject" && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when rejecting properties",
  path: ["rejectionReason"],
});

// Property statistics query schema
export const propertyStatsQuerySchema = z.object({
  ownerId: z.string().cuid("Invalid owner ID format").optional(),
  provinceCode: z.string().optional(),
  regencyCode: z.string().optional(),
  districtCode: z.string().optional(),
  dateFrom: z.string().datetime("Invalid date format").optional(),
  dateTo: z.string().datetime("Invalid date format").optional(),
});

// Export types for TypeScript
export type CreatePropertyStep1Input = z.infer<typeof createPropertyStep1Schema>;
export type CreatePropertyStep2Input = z.infer<typeof createPropertyStep2Schema>;
export type CreatePropertyStep3Input = z.infer<typeof createPropertyStep3Schema>;
export type CreatePropertyStep4Input = z.infer<typeof createPropertyStep4Schema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyListQueryInput = z.infer<typeof propertyListQuerySchema>;
export type PropertyApprovalInput = z.infer<typeof propertyApprovalSchema>;
export type PropertyIdInput = z.infer<typeof propertyIdSchema>;
export type PropertyImageUploadInput = z.infer<typeof propertyImageUploadSchema>;
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type BulkPropertyOperationInput = z.infer<typeof bulkPropertyOperationSchema>;
export type PropertyStatsQueryInput = z.infer<typeof propertyStatsQuerySchema>;
