/**
 * Schema validasi untuk endpoint notifikasi WhatsApp
 */

import { z } from "zod";

/**
 * Schema untuk nomor WhatsApp (harus format 62xxx)
 */
const whatsappPhoneSchema = z
  .string()
  .min(10, "Nomor WhatsApp minimal 10 digit")
  .max(15, "Nomor WhatsApp maksimal 15 digit")
  .regex(/^62[0-9]{9,13}$/, "Format nomor WhatsApp harus diawali 62 dan hanya angka (contoh: 6281234567890)");

/**
 * Schema untuk notifikasi booking baru
 */
export const bookingCreatedNotificationSchema = z.object({
  customerName: z.string().min(1, "Nama customer wajib diisi"),
  customerPhone: whatsappPhoneSchema,
  adminkosPhone: whatsappPhoneSchema,
  propertyName: z.string().min(1, "Nama properti wajib diisi"),
  bookingCode: z.string().min(1, "Kode booking wajib diisi"),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
});

/**
 * Schema untuk notifikasi pembayaran berhasil
 */
export const paymentSuccessNotificationSchema = z.object({
  customerName: z.string().min(1, "Nama customer wajib diisi"),
  customerPhone: whatsappPhoneSchema,
  adminkosPhone: whatsappPhoneSchema,
  propertyName: z.string().min(1, "Nama properti wajib diisi"),
  bookingCode: z.string().min(1, "Kode booking wajib diisi"),
  amount: z.number().min(0, "Jumlah pembayaran tidak boleh negatif"),
});

/**
 * Schema untuk notifikasi check-in
 */
export const checkInNotificationSchema = z.object({
  customerName: z.string().min(1, "Nama customer wajib diisi"),
  customerPhone: whatsappPhoneSchema,
  adminkosPhone: whatsappPhoneSchema,
  propertyName: z.string().min(1, "Nama properti wajib diisi"),
  bookingCode: z.string().min(1, "Kode booking wajib diisi"),
  checkInDate: z.coerce.date(),
});

/**
 * Schema untuk notifikasi check-out
 */
export const checkOutNotificationSchema = z.object({
  customerName: z.string().min(1, "Nama customer wajib diisi"),
  customerPhone: whatsappPhoneSchema,
  adminkosPhone: whatsappPhoneSchema,
  propertyName: z.string().min(1, "Nama properti wajib diisi"),
  bookingCode: z.string().min(1, "Kode booking wajib diisi"),
  checkOutDate: z.coerce.date(),
});

/**
 * Schema untuk pengingat jatuh tempo
 */
export const dueReminderNotificationSchema = z.object({
  customerName: z.string().min(1, "Nama customer wajib diisi"),
  customerPhone: whatsappPhoneSchema,
  propertyName: z.string().min(1, "Nama properti wajib diisi"),
  bookingCode: z.string().min(1, "Kode booking wajib diisi"),
  dueDate: z.coerce.date(),
  daysLeft: z.number().min(0, "Sisa hari tidak boleh negatif"),
});

/**
 * Schema untuk kirim pesan manual WhatsApp
 */
export const sendManualMessageSchema = z.object({
  receiver: whatsappPhoneSchema,
  message: z.string().min(1, "Pesan wajib diisi").max(4096, "Pesan maksimal 4096 karakter"),
  mediaUrl: z.string().url("URL media tidak valid").optional(),
  fileName: z.string().optional(),
});

/**
 * Schema untuk broadcast pesan WhatsApp
 */
export const broadcastMessageSchema = z.object({
  label: z.string().min(1, "Label broadcast wajib diisi"),
  receivers: z.array(whatsappPhoneSchema).min(1, "Minimal 1 penerima").max(100, "Maksimal 100 penerima"),
  message: z.string().min(1, "Pesan wajib diisi").max(4096, "Pesan maksimal 4096 karakter"),
  delay: z.number().min(5, "Delay minimal 5 detik").max(300, "Delay maksimal 300 detik").optional(),
  mediaUrl: z.string().url("URL media tidak valid").optional(),
  fileName: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});
