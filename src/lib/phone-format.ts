// src/server/lib/phone-format.ts

/**
 * Format nomor HP Indonesia ke awalan 62 (bukan 0)
 * Contoh: 082283496340 => 6282283496340
 * Hanya angka, hapus spasi/tanda baca
 */
export function formatIndonesianPhoneNumber(input: string): string {
  if (!input) return "";
  // Hapus spasi, tanda baca, dll
  let phone = input.replace(/[^0-9]/g, "");
  // Jika awalan 0, ganti ke 62
  if (phone.startsWith("0")) {
    phone = "62" + phone.slice(1);
  }
  // Jika sudah 62, biarkan
  return phone;
}
