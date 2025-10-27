/**
 * Notification Templates dengan Spintax
 * Setiap template menggunakan format {pilihan1|pilihan2|...} untuk variasi pesan otomatis
 * guna menghindari deteksi spam oleh WhatsApp
 */

/**
 * Utility untuk memproses Spintax menjadi pesan acak.
 * Contoh: "{Halo|Hi} {Pak|Bu} {Nama}" => "Hi Bu Nama"
 */
export function parseSpintax(template: string): string {
  return template.replace(/\{([^{}]+)\}/g, (_, group) => {
    const options = group.split("|");
    return options[Math.floor(Math.random() * options.length)];
  });
}

/**
 * Template pesan untuk berbagai event notifikasi
 */
export const notificationTemplates = {
  /**
   * Template untuk notifikasi booking baru (ke Customer)
   */
  bookingCreatedCustomer: ({
    name,
    property,
    bookingCode,
    checkIn,
    checkOut,
  }: {
    name: string;
    property: string;
    bookingCode: string;
    checkIn: string;
    checkOut: string;
  }) =>
    parseSpintax(
      `{Halo|Hi|Hai} {Pak|Bu|Bapak|Ibu|Saudara/i} ${name}!\n\n` +
        `{Terima kasih|Kami mengapresiasi|Kami menerima} booking Anda di *${property}*.\n\n` +
        `📋 Kode Booking: *${bookingCode}*\n` +
        `📅 Check-in: ${checkIn}\n` +
        `📅 Check-out: ${checkOut}\n\n` +
        `{Semoga|Mudah-mudahan} {hari Anda|harinya} {menyenangkan|berjalan lancar|penuh berkah}! 🏠✨`
    ),

  /**
   * Template untuk notifikasi booking baru (ke Adminkos)
   */
  bookingCreatedAdminkos: ({
    customerName,
    property,
    bookingCode,
    checkIn,
    checkOut,
  }: {
    customerName: string;
    property: string;
    bookingCode: string;
    checkIn: string;
    checkOut: string;
  }) =>
    parseSpintax(
      `🔔 *Booking Baru Masuk!*\n\n` +
        `{Ada|Terdapat|Kami menerima} booking baru di *${property}*.\n\n` +
        `👤 Customer: ${customerName}\n` +
        `📋 Kode: *${bookingCode}*\n` +
        `📅 Check-in: ${checkIn}\n` +
        `📅 Check-out: ${checkOut}\n\n` +
        `{Silakan|Mohon|Harap} {segera cek|lihat detail|konfirmasi} di dashboard.`
    ),

  /**
   * Template untuk notifikasi pembayaran berhasil (ke Customer)
   */
  paymentSuccessCustomer: ({
    name,
    property,
    amount,
    bookingCode,
  }: {
    name: string;
    property: string;
    amount: string;
    bookingCode: string;
  }) =>
    parseSpintax(
      `{Selamat|Congrats|Mantap} ${name}! 🎉\n\n` +
        `Pembayaran untuk booking *${bookingCode}* di *${property}* telah {berhasil|sukses|diterima}.\n\n` +
        `💰 Jumlah: *Rp${amount}*\n\n` +
        `{Terima kasih|Kami mengapresiasi|Kami menerima} kepercayaan Anda! 🙏`
    ),

  /**
   * Template untuk notifikasi pembayaran berhasil (ke Adminkos)
   */
  paymentSuccessAdminkos: ({
    customerName,
    property,
    amount,
    bookingCode,
  }: {
    customerName: string;
    property: string;
    amount: string;
    bookingCode: string;
  }) =>
    parseSpintax(
      `💰 *Pembayaran Diterima!*\n\n` +
        `{Pembayaran untuk|Transaksi|Payment} booking *${bookingCode}* di *${property}* telah {berhasil|sukses|diterima}.\n\n` +
        `👤 Customer: ${customerName}\n` +
        `💵 Jumlah: *Rp${amount}*\n\n` +
        `{Silakan|Mohon|Harap} cek dashboard untuk detail lengkap.`
    ),

  /**
   * Template untuk notifikasi check-in (ke Customer)
   */
  checkInCustomer: ({
    name,
    property,
    bookingCode,
    checkIn,
  }: {
    name: string;
    property: string;
    bookingCode: string;
    checkIn: string;
  }) =>
    parseSpintax(
      `{Selamat datang|Welcome|Hai} ${name}! 🏠\n\n` +
        `Anda telah {berhasil|sukses} check-in di *${property}*.\n\n` +
        `📋 Kode Booking: *${bookingCode}*\n` +
        `📅 Check-in: ${checkIn}\n\n` +
        `{Semoga|Mudah-mudahan} {masa tinggal|pengalaman Anda|waktu Anda} {menyenangkan|nyaman|berkesan}! ✨`
    ),

  /**
   * Template untuk notifikasi check-in (ke Adminkos)
   */
  checkInAdminkos: ({
    customerName,
    property,
    bookingCode,
    checkIn,
  }: {
    customerName: string;
    property: string;
    bookingCode: string;
    checkIn: string;
  }) =>
    parseSpintax(
      `✅ *Customer Check-in*\n\n` +
        `Customer telah check-in di *${property}*.\n\n` +
        `👤 Customer: ${customerName}\n` +
        `📋 Kode: *${bookingCode}*\n` +
        `📅 Check-in: ${checkIn}\n\n` +
        `Status booking telah diupdate di dashboard.`
    ),

  /**
   * Template untuk notifikasi check-out (ke Customer)
   */
  checkOutCustomer: ({
    name,
    property,
    bookingCode,
    checkOut,
  }: {
    name: string;
    property: string;
    bookingCode: string;
    checkOut: string;
  }) =>
    parseSpintax(
      `{Terima kasih|Kami mengapresiasi|Kami berterima kasih} ${name}! 🙏\n\n` +
        `Anda telah check-out dari *${property}*.\n\n` +
        `📋 Kode Booking: *${bookingCode}*\n` +
        `📅 Check-out: ${checkOut}\n\n` +
        `{Silakan|Monggo|Yuk} {hubungi|kontak|chat} kami untuk {info lebih lanjut|informasi detail|keterangan lengkap}! 📞`
    ),

  /**
   * Template untuk notifikasi check-out (ke Adminkos)
   */
  checkOutAdminkos: ({
    customerName,
    property,
    bookingCode,
    checkOut,
  }: {
    customerName: string;
    property: string;
    bookingCode: string;
    checkOut: string;
  }) =>
    parseSpintax(
      `🚪 *Customer Check-out*\n\n` +
        `Customer telah check-out dari *${property}*.\n\n` +
        `👤 Customer: ${customerName}\n` +
        `📋 Kode: *${bookingCode}*\n` +
        `📅 Check-out: ${checkOut}\n\n` +
        `Status booking telah diupdate di dashboard.`
    ),

  /**
   * Template untuk pengingat jatuh tempo (ke Customer)
   */
  dueReminderCustomer: ({
    name,
    property,
    bookingCode,
    dueDate,
    daysLeft,
  }: {
    name: string;
    property: string;
    bookingCode: string;
    dueDate: string;
    daysLeft: number;
  }) =>
    parseSpintax(
      `⏰ *{Pengingat|Reminder|Notifikasi}* untuk ${name}!\n\n` +
        `Tanggal jatuh tempo kamar Anda di *${property}* akan segera tiba.\n\n` +
        `📋 Kode Booking: *${bookingCode}*\n` +
        `📅 Jatuh Tempo: ${dueDate}\n` +
        `⌛ Sisa Waktu: ${daysLeft} hari\n\n` +
        `{Silakan|Monggo|Yuk} {hubungi|kontak|chat} kami untuk {perpanjangan|renewal|info lebih lanjut}! 📞`
    ),
};
