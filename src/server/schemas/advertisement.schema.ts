/**
 * Advertisement/Iklan Validation Schemas
 */

import { z } from "zod";

export const advertisementSubmitSchema = z.object({
  title: z.string().min(1, "Judul harus diisi").max(255, "Judul maksimal 255 karakter"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("URL gambar tidak valid"),
  publicId: z.string().optional().nullable(),
  linkUrl: z
    .string()
    .url("URL link tidak valid")
    .optional()
    .or(z.literal(""))
    .nullable(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal(""))
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal(""))
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
});

export const advertisementUpdateSchema = z.object({
  title: z.string().min(1, "Judul harus diisi").max(255, "Judul maksimal 255 karakter").optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("URL gambar tidak valid").optional(),
  publicId: z.string().optional().nullable(),
  linkUrl: z
    .string()
    .url("URL link tidak valid")
    .optional()
    .or(z.literal(""))
    .nullable(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal(""))
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal(""))
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
});

export const advertisementApprovalSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional().nullable(),
});

export const advertisementPlacementSchema = z.object({
  layoutSlot: z.number().int().min(1, "Slot layout harus minimal 1"),
});

export const advertisementStatusUpdateSchema = z.object({
  isActive: z.boolean(),
});

export type AdvertisementSubmitInput = z.infer<typeof advertisementSubmitSchema>;
export type AdvertisementUpdateInput = z.infer<typeof advertisementUpdateSchema>;
export type AdvertisementApprovalInput = z.infer<typeof advertisementApprovalSchema>;
export type AdvertisementPlacementInput = z.infer<typeof advertisementPlacementSchema>;
export type AdvertisementStatusUpdateInput = z.infer<typeof advertisementStatusUpdateSchema>;
