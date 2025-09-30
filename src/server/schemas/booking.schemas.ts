import { z } from "zod";
import { BookingStatus, PaymentStatus, PaymentType, LeaseType } from "../types/booking";

// Base schemas
export const bookingStatusSchema = z.nativeEnum(BookingStatus);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
export const paymentTypeSchema = z.nativeEnum(PaymentType);
export const leaseTypeSchema = z.nativeEnum(LeaseType);

// Create booking schema
export const createBookingSchema = z.object({
  userId: z.string().cuid("Invalid user ID format"),
  roomId: z.string().cuid("Invalid room ID format"),
  checkInDate: z.coerce.date().refine(
    (date) => date > new Date(),
    "Check-in date must be in the future"
  ),
  leaseType: leaseTypeSchema,
  depositOption: z.enum(['deposit', 'full'], {
    required_error: "Payment option is required",
    invalid_type_error: "Payment option must be either 'deposit' or 'full'"
  }),
  paymentMethod: z.string().optional()
});

// Booking list query schema
export const bookingListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: bookingStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  userId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional(),
  search: z.string().min(1).optional(),
  sortBy: z.enum(['createdAt', 'checkInDate', 'totalAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Update booking status schema
export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
  reason: z.string().min(1).max(500).optional()
});

// Update booking schema
export const updateBookingSchema = z.object({
  checkInDate: z.coerce.date().optional(),
  checkOutDate: z.coerce.date().optional(),
  status: bookingStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional()
}).refine(
  (data) => {
    if (data.checkInDate && data.checkOutDate) {
      return data.checkInDate < data.checkOutDate;
    }
    return true;
  },
  {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"]
  }
);

// Booking ID schema
export const bookingIdSchema = z.object({
  id: z.string().cuid("Invalid booking ID format")
});

// Room availability check schema
export const roomAvailabilitySchema = z.object({
  roomId: z.string().cuid("Invalid room ID format"),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date().optional(),
  leaseType: leaseTypeSchema
}).refine(
  (data) => {
    if (data.checkOutDate) {
      return data.checkInDate < data.checkOutDate;
    }
    return true;
  },
  {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"]
  }
);

// Create payment schema
export const createPaymentSchema = z.object({
  bookingId: z.string().cuid("Invalid booking ID format"),
  paymentType: paymentTypeSchema
});

// Midtrans notification schema
export const midtransNotificationSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string(),
  gross_amount: z.string(),
  payment_type: z.string(),
  transaction_time: z.string(),
  transaction_status: z.string(),
  transaction_id: z.string(),
  signature_key: z.string(),
  settlement_time: z.string().optional(),
  fraud_status: z.string().optional(),
  expiry_time: z.string().optional()
});

// Type exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingListQueryInput = z.infer<typeof bookingListQuerySchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type BookingIdInput = z.infer<typeof bookingIdSchema>;
export type RoomAvailabilityInput = z.infer<typeof roomAvailabilitySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type MidtransNotificationInput = z.infer<typeof midtransNotificationSchema>;
