/**
 * Notification API
 * Service layer untuk notifikasi (wrapper untuk NotificationService)
 * Mengikuti pola arsitektur: Controller -> API Service -> Domain Service -> Repository
 */

import type { Result } from "@/server/types/result";
import { NotificationService } from "@/server/services/NotificationService";
import type {
  BookingCreatedNotificationDTO,
  PaymentSuccessNotificationDTO,
  CheckInNotificationDTO,
  CheckOutNotificationDTO,
  DueReminderNotificationDTO,
} from "@/server/services/NotificationService";

/**
 * Kirim notifikasi booking baru
 */
export async function sendBookingCreatedNotification(
  dto: BookingCreatedNotificationDTO
): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
  console.log("🔍 Notification API: Processing booking created notification");
  return await NotificationService.sendBookingCreatedNotification(dto);
}

/**
 * Kirim notifikasi pembayaran berhasil
 */
export async function sendPaymentSuccessNotification(
  dto: PaymentSuccessNotificationDTO
): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
  console.log("🔍 Notification API: Processing payment success notification");
  return await NotificationService.sendPaymentSuccessNotification(dto);
}

/**
 * Kirim notifikasi check-in
 */
export async function sendCheckInNotification(
  dto: CheckInNotificationDTO
): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
  console.log("🔍 Notification API: Processing check-in notification");
  return await NotificationService.sendCheckInNotification(dto);
}

/**
 * Kirim notifikasi check-out
 */
export async function sendCheckOutNotification(
  dto: CheckOutNotificationDTO
): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
  console.log("🔍 Notification API: Processing check-out notification");
  return await NotificationService.sendCheckOutNotification(dto);
}

/**
 * Kirim pengingat jatuh tempo
 */
export async function sendDueReminderNotification(
  dto: DueReminderNotificationDTO
): Promise<Result<{ customerSent: boolean }>> {
  console.log("🔍 Notification API: Processing due reminder notification");
  return await NotificationService.sendDueReminderNotification(dto);
}
