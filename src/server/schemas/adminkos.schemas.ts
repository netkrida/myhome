/**
 * AdminKos Dashboard Validation Schemas
 * Zod schemas for validating AdminKos dashboard requests
 */

import { z } from "zod";
import { BookingStatus, PaymentStatus, LeaseType } from "../types/booking";

/**
 * Dashboard Query Schema
 */
export const adminKosDashboardQuerySchema = z.object({
  propertyIds: z.array(z.string().cuid()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type AdminKosDashboardQueryInput = z.infer<typeof adminKosDashboardQuerySchema>;

/**
 * Bookings Query Schema
 */
export const adminKosBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(10),
  propertyId: z.string().cuid().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  leaseType: z.nativeEnum(LeaseType).optional(),
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "checkInDate", "totalAmount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  overdue: z.coerce.boolean().optional(), // Filter untuk booking yang sudah lewat waktu
});

export type AdminKosBookingsQueryInput = z.infer<typeof adminKosBookingsQuerySchema>;

/**
 * Rooms Query Schema
 */
export const adminKosRoomsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  propertyId: z.string().cuid().optional(),
  isAvailable: z.coerce.boolean().optional(),
  roomType: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(["roomNumber", "monthlyPrice", "updatedAt"]).default("roomNumber"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type AdminKosRoomsQueryInput = z.infer<typeof adminKosRoomsQuerySchema>;

/**
 * ============================================
 * New Rooms Management Schemas
 * ============================================
 */

/**
 * Rooms Summary Query Schema
 */
export const roomsSummaryQuerySchema = z.object({
  propertyId: z.string().cuid().optional(),
});

export type RoomsSummaryQueryInput = z.infer<typeof roomsSummaryQuerySchema>;

/**
 * Edit Room Schema
 */
export const editRoomSchema = z.object({
  roomType: z.string().min(1, "Room type is required").optional(),
  floor: z.coerce.number().int().positive("Floor must be positive").optional(),
  monthlyPrice: z.coerce.number().positive("Monthly price must be positive").optional(),
  dailyPrice: z.coerce.number().positive("Daily price must be positive").nullable().optional(),
  weeklyPrice: z.coerce.number().positive("Weekly price must be positive").nullable().optional(),
  quarterlyPrice: z.coerce.number().positive("Quarterly price must be positive").nullable().optional(),
  yearlyPrice: z.coerce.number().positive("Yearly price must be positive").nullable().optional(),
  isAvailable: z.coerce.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export type EditRoomInput = z.infer<typeof editRoomSchema>;

/**
 * Add Room Schema
 */
export const addRoomSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  roomNumber: z.string().min(1, "Room number is required").max(50, "Room number too long"),
  roomType: z.string().min(1, "Room type is required").max(100, "Room type too long"),
  floor: z.coerce.number().int().positive("Floor must be positive"),
  monthlyPrice: z.coerce.number().positive("Monthly price must be positive"),
  dailyPrice: z.coerce.number().positive("Daily price must be positive").nullable().optional(),
  weeklyPrice: z.coerce.number().positive("Weekly price must be positive").nullable().optional(),
  quarterlyPrice: z.coerce.number().positive("Quarterly price must be positive").nullable().optional(),
  yearlyPrice: z.coerce.number().positive("Yearly price must be positive").nullable().optional(),
  isAvailable: z.coerce.boolean().default(true),
  description: z.string().optional(),
  size: z.string().max(50, "Size description too long").optional(),
  facilities: z.array(z.any()).optional().default([]),
});

export type AddRoomInput = z.infer<typeof addRoomSchema>;

