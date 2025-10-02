import { z } from "zod";

export const customerStatusEnum = z.enum(["MAHASISWA", "PEKERJA"], {
  required_error: "Status wajib dipilih",
  invalid_type_error: "Status tidak valid",
});

export const customerRegistrationSchema = z
  .object({
    fullName: z
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
    status: customerStatusEnum,
    institutionName: z
      .string()
      .max(255, "Nama kampus maksimal 255 karakter")
      .optional()
      .transform((value) => {
        if (typeof value !== "string") return undefined;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sesuai",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      data.status === "PEKERJA" ||
      (typeof data.institutionName === "string" && data.institutionName.length >= 3),
    {
      message: "Nama kampus minimal 3 karakter",
      path: ["institutionName"],
    }
  );

export const customerRegistrationServerSchema = z.object({
  fullName: z
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
  status: customerStatusEnum,
  institutionName: z
    .string()
    .max(255, "Nama kampus maksimal 255 karakter")
    .optional()
    .transform((value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
}).refine(
  (data) =>
    data.status === "PEKERJA" ||
    (typeof data.institutionName === "string" && data.institutionName.length >= 3),
  {
    message: "Nama kampus minimal 3 karakter",
    path: ["institutionName"],
  }
);

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;
export type CustomerRegistrationServerInput = z.infer<typeof customerRegistrationServerSchema>;