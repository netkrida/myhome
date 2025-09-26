import { z } from "zod";

/**
 * Schema for AdminKos registration
 */
export const adminKosRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter")
    .trim(),
  
  email: z
    .string()
    .email("Format email tidak valid")
    .toLowerCase()
    .trim(),
  
  phoneNumber: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP maksimal 15 digit")
    .regex(
      /^(\+62|62|0)[0-9]{8,13}$/,
      "Format nomor HP tidak valid (contoh: 08123456789 atau +62812345678)"
    )
    .trim(),
  
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka"
    ),
  
  confirmPassword: z
    .string()
    .min(1, "Konfirmasi password wajib diisi"),
  
  provinceCode: z
    .string()
    .min(1, "Provinsi wajib dipilih")
    .trim(),

  provinceName: z
    .string()
    .min(1, "Nama provinsi diperlukan")
    .trim(),

  regencyCode: z
    .string()
    .min(1, "Kabupaten/Kota wajib dipilih")
    .trim(),

  regencyName: z
    .string()
    .min(1, "Nama kabupaten/kota diperlukan")
    .trim(),

  districtCode: z
    .string()
    .min(1, "Kecamatan wajib dipilih")
    .trim(),

  districtName: z
    .string()
    .min(1, "Nama kecamatan diperlukan")
    .trim(),

  streetAddress: z
    .string()
    .min(10, "Alamat jalan minimal 10 karakter")
    .max(500, "Alamat jalan maksimal 500 karakter")
    .trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak sesuai",
  path: ["confirmPassword"],
});

/**
 * Schema for AdminKos registration (server-side, without confirmPassword)
 */
export const adminKosRegistrationServerSchema = z.object({
  name: z
    .string()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter")
    .trim(),
  
  email: z
    .string()
    .email("Format email tidak valid")
    .toLowerCase()
    .trim(),
  
  phoneNumber: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP maksimal 15 digit")
    .regex(
      /^(\+62|62|0)[0-9]{8,13}$/,
      "Format nomor HP tidak valid (contoh: 08123456789 atau +62812345678)"
    )
    .trim(),
  
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter"),
  
  provinceCode: z
    .string()
    .min(1, "Provinsi wajib dipilih")
    .trim(),

  provinceName: z
    .string()
    .min(1, "Nama provinsi diperlukan")
    .trim(),

  regencyCode: z
    .string()
    .min(1, "Kabupaten/Kota wajib dipilih")
    .trim(),

  regencyName: z
    .string()
    .min(1, "Nama kabupaten/kota diperlukan")
    .trim(),

  districtCode: z
    .string()
    .min(1, "Kecamatan wajib dipilih")
    .trim(),

  districtName: z
    .string()
    .min(1, "Nama kecamatan diperlukan")
    .trim(),

  streetAddress: z
    .string()
    .min(10, "Alamat jalan minimal 10 karakter")
    .max(500, "Alamat jalan maksimal 500 karakter")
    .trim(),
});

// Export types
export type AdminKosRegistrationInput = z.infer<typeof adminKosRegistrationSchema>;
export type AdminKosRegistrationServerInput = z.infer<typeof adminKosRegistrationServerSchema>;
