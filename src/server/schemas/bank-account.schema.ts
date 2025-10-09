/**
 * Bank Account Validation Schemas
 * Zod schemas for bank account and payout validation
 */

import { z } from "zod";
import { BankAccountStatus, PayoutStatus, PayoutSource } from "@prisma/client";

// ============================================================================
// Bank Account Schemas
// ============================================================================

export const createBankAccountSchema = z.object({
  bankCode: z.string().min(1, "Kode bank wajib diisi").max(10, "Kode bank terlalu panjang"),
  bankName: z.string().min(1, "Nama bank wajib diisi").max(255, "Nama bank terlalu panjang"),
  accountNumber: z
    .string()
    .min(5, "Nomor rekening minimal 5 digit")
    .max(50, "Nomor rekening terlalu panjang")
    .regex(/^[0-9]+$/, "Nomor rekening hanya boleh berisi angka"),
  accountName: z
    .string()
    .min(3, "Nama pemilik rekening minimal 3 karakter")
    .max(255, "Nama pemilik rekening terlalu panjang"),
});

export const updateBankAccountSchema = createBankAccountSchema.extend({});

export const approveBankAccountSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => {
    // If rejected, rejection reason is required
    if (!data.approved && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: "Alasan penolakan wajib diisi jika menolak",
    path: ["rejectionReason"],
  }
);

// ============================================================================
// Payout Schemas
// ============================================================================

export const createPayoutSchema = z.object({
  bankAccountId: z.string().min(1, "Rekening tujuan wajib dipilih"),
  amount: z
    .number()
    .positive("Jumlah penarikan harus lebih dari 0")
    .max(1000000000, "Jumlah penarikan terlalu besar"),
  source: z.nativeEnum(PayoutSource, {
    errorMap: () => ({ message: "Sumber penarikan tidak valid" }),
  }),
  notes: z.string().max(500, "Catatan terlalu panjang").optional(),
});

export const approvePayoutSchema = z.object({
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string().url("URL file tidak valid"),
        fileName: z.string().min(1, "Nama file wajib diisi"),
        fileType: z.string().min(1, "Tipe file wajib diisi"),
        publicId: z.string().optional(),
      })
    )
    .optional(),
}).refine(
  (data) => {
    // If approved, at least one attachment is required
    if (data.approved && (!data.attachments || data.attachments.length === 0)) {
      return false;
    }
    // If rejected, rejection reason is required
    if (!data.approved && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  (data) => {
    if (data.approved) {
      return {
        message: "Bukti transfer wajib diupload saat menyetujui penarikan",
        path: ["attachments"],
      };
    }
    return {
      message: "Alasan penolakan wajib diisi jika menolak",
      path: ["rejectionReason"],
    };
  }
);

// ============================================================================
// Query Schemas
// ============================================================================

export const bankAccountQuerySchema = z.object({
  status: z.nativeEnum(BankAccountStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const payoutQuerySchema = z.object({
  status: z.nativeEnum(PayoutStatus).optional(),
  adminKosId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type ApproveBankAccountInput = z.infer<typeof approveBankAccountSchema>;
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
export type ApprovePayoutInput = z.infer<typeof approvePayoutSchema>;
export type BankAccountQueryInput = z.infer<typeof bankAccountQuerySchema>;
export type PayoutQueryInput = z.infer<typeof payoutQuerySchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;

