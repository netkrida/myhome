import { z } from "zod";

export const CheckInRequestSchema = z.object({
  bookingId: z.string().cuid("Invalid booking ID"),
});

export const CheckOutRequestSchema = z.object({
  bookingId: z.string().cuid("Invalid booking ID"),
});

const DirectBookingCustomerSchema = z
  .object({
    id: z.string().cuid("Invalid customer ID").optional(),
    name: z.string().min(1, "Nama wajib diisi").optional(),
    phoneNumber: z.string().min(6, "Minimal 6 karakter").optional(),
    email: z.string().email("Format email tidak valid").optional(),
  })
  .refine(
    (value) => {
      if (value.id) {
        return true;
      }
      return Boolean(value.name && value.phoneNumber);
    },
    {
      message: "Customer minimal punya id, atau nama dan nomor telepon",
    }
  );

export const DirectBookingSchema = z.object({
  customer: DirectBookingCustomerSchema,
  propertyId: z.string().cuid("Invalid property ID"),
  roomId: z.string().cuid("Invalid room ID"),
  leaseType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  checkInDate: z.string().datetime({ message: "checkInDate harus berupa ISO datetime" }),
  checkOutDate: z
    .string()
    .datetime({ message: "checkOutDate harus berupa ISO datetime" })
    .optional(),
  payment: z.object({
    mode: z.enum(["FULL", "DEPOSIT"]),
    method: z.enum(["CASH", "TRANSFER-ADMIN"]),
    ledgerAccountId: z.string().cuid("Invalid ledger account ID"),
  }),
  idempotencyKey: z.string().max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  discountNote: z.string().max(255).optional(),
});

export const UpdateBookingDatesSchema = z
  .object({
    checkInDate: z.string().datetime({ message: "checkInDate harus berupa ISO datetime" }),
    checkOutDate: z
      .string()
      .datetime({ message: "checkOutDate harus berupa ISO datetime" })
      .optional(),
  })
  .refine(
    (value) => {
      if (!value.checkOutDate) {
        return true;
      }
      return new Date(value.checkInDate) < new Date(value.checkOutDate);
    },
    {
      message: "checkOutDate harus setelah checkInDate",
      path: ["checkOutDate"],
    }
  );

export type CheckInRequestInput = z.infer<typeof CheckInRequestSchema>;
export type CheckOutRequestInput = z.infer<typeof CheckOutRequestSchema>;
export type DirectBookingInput = z.infer<typeof DirectBookingSchema>;
export type UpdateBookingDatesInput = z.infer<typeof UpdateBookingDatesSchema>;
