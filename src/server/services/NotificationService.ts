/**
 * Notification Service
 * Service layer untuk mengirim notifikasi WhatsApp berdasarkan event booking/payment/checkin/checkout
 * Mengikuti pola arsitektur: Controller -> Service -> Repository -> Adapter
 */

import type { Result } from "@/server/types/result";
import { WhatsAppRepository } from "@/server/repositories/WhatsAppRepository";
import { notificationTemplates } from "@/server/services/notification-templates";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

/**
 * DTO untuk notifikasi booking baru
 */
export interface BookingCreatedNotificationDTO {
  customerName: string;
  customerPhone: string;
  adminkosPhone: string;
  propertyName: string;
  bookingCode: string;
  checkInDate: Date;
  checkOutDate: Date;
}

/**
 * DTO untuk notifikasi pembayaran berhasil
 */
export interface PaymentSuccessNotificationDTO {
  customerName: string;
  customerPhone: string;
  adminkosPhone: string;
  propertyName: string;
  bookingCode: string;
  amount: number;
}

/**
 * DTO untuk notifikasi check-in
 */
export interface CheckInNotificationDTO {
  customerName: string;
  customerPhone: string;
  adminkosPhone: string;
  propertyName: string;
  bookingCode: string;
  checkInDate: Date;
}

/**
 * DTO untuk notifikasi check-out
 */
export interface CheckOutNotificationDTO {
  customerName: string;
  customerPhone: string;
  adminkosPhone: string;
  propertyName: string;
  bookingCode: string;
  checkOutDate: Date;
}

/**
 * DTO untuk pengingat jatuh tempo
 */
export interface DueReminderNotificationDTO {
  customerName: string;
  customerPhone: string;
  propertyName: string;
  bookingCode: string;
  dueDate: Date;
  daysLeft: number;
}

/**
 * Notification Service
 */
export class NotificationService {
  /**
   * Format tanggal ke string yang user-friendly
   */
  private static formatDate(date: Date): string {
    return format(date, "dd MMMM yyyy, HH:mm", { locale: localeID });
  }

  /**
   * Format jumlah uang ke string rupiah
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID").format(amount);
  }

  /**
   * Kirim notifikasi booking baru (ke customer dan adminkos)
   */
  static async sendBookingCreatedNotification(
    dto: BookingCreatedNotificationDTO
  ): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
    try {
      console.log("🔍 Notification Service: Sending booking created notification");

      const checkIn = this.formatDate(dto.checkInDate);
      const checkOut = this.formatDate(dto.checkOutDate);

      // Kirim ke customer
      const customerMessage = notificationTemplates.bookingCreatedCustomer({
        name: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        checkIn,
        checkOut,
      });

      const customerResult = await WhatsAppRepository.sendMessage({
        receiver: dto.customerPhone,
        message: customerMessage,
      });

      // Kirim ke adminkos
      const adminkosMessage = notificationTemplates.bookingCreatedAdminkos({
        customerName: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        checkIn,
        checkOut,
      });

      const adminkosResult = await WhatsAppRepository.sendMessage({
        receiver: dto.adminkosPhone,
        message: adminkosMessage,
      });

      console.log("✅ Notification Service: Booking created notification sent", {
        customer: customerResult.success,
        adminkos: adminkosResult.success,
      });

      return {
        success: true,
        data: {
          customerSent: customerResult.success,
          adminkosSent: adminkosResult.success,
        },
      };
    } catch (error) {
      console.error("❌ Notification Service: Error sending booking created notification", error);
      return {
        success: false,
        error: {
          code: "NOTIFICATION_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        statusCode: 500,
      };
    }
  }

  /**
   * Kirim notifikasi pembayaran berhasil (ke customer dan adminkos)
   */
  static async sendPaymentSuccessNotification(
    dto: PaymentSuccessNotificationDTO
  ): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
    try {
      console.log("🔍 Notification Service: Sending payment success notification");

      const amount = this.formatCurrency(dto.amount);

      // Kirim ke customer
      const customerMessage = notificationTemplates.paymentSuccessCustomer({
        name: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        amount,
      });

      const customerResult = await WhatsAppRepository.sendMessage({
        receiver: dto.customerPhone,
        message: customerMessage,
      });

      // Kirim ke adminkos
      const adminkosMessage = notificationTemplates.paymentSuccessAdminkos({
        customerName: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        amount,
      });

      const adminkosResult = await WhatsAppRepository.sendMessage({
        receiver: dto.adminkosPhone,
        message: adminkosMessage,
      });

      console.log("✅ Notification Service: Payment success notification sent", {
        customer: customerResult.success,
        adminkos: adminkosResult.success,
      });

      return {
        success: true,
        data: {
          customerSent: customerResult.success,
          adminkosSent: adminkosResult.success,
        },
      };
    } catch (error) {
      console.error("❌ Notification Service: Error sending payment success notification", error);
      return {
        success: false,
        error: {
          code: "NOTIFICATION_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        }, statusCode: 500,};
    }
  }

  /**
   * Kirim notifikasi check-in (ke customer dan adminkos)
   */
  static async sendCheckInNotification(
    dto: CheckInNotificationDTO
  ): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
    try {
      console.log("🔍 Notification Service: Sending check-in notification");

      const checkIn = this.formatDate(dto.checkInDate);

      // Kirim ke customer
      const customerMessage = notificationTemplates.checkInCustomer({
        name: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        checkIn,
      });

      const customerResult = await WhatsAppRepository.sendMessage({
        receiver: dto.customerPhone,
        message: customerMessage,
      });

      // Kirim ke adminkos
      const adminkosMessage = notificationTemplates.checkInAdminkos({
        customerName: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        checkIn,
      });

      const adminkosResult = await WhatsAppRepository.sendMessage({
        receiver: dto.adminkosPhone,
        message: adminkosMessage,
      });

      console.log("✅ Notification Service: Check-in notification sent", {
        customer: customerResult.success,
        adminkos: adminkosResult.success,
      });

      return {
        success: true,
        data: {
          customerSent: customerResult.success,
          adminkosSent: adminkosResult.success,
        },
      };
    } catch (error) {
      console.error("❌ Notification Service: Error sending check-in notification", error);
      return {
        success: false,
        error: {
          code: "NOTIFICATION_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        }, statusCode: 500,};
    }
  }

  /**
   * Kirim notifikasi check-out (ke customer dan adminkos)
   */
  static async sendCheckOutNotification(
    dto: CheckOutNotificationDTO
  ): Promise<Result<{ customerSent: boolean; adminkosSent: boolean }>> {
    try {
      console.log("🔍 Notification Service: Sending check-out notification");

      const checkOut = this.formatDate(dto.checkOutDate);

      // Kirim ke customer
      const customerMessage = notificationTemplates.checkOutCustomer({
        name: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        checkOut,
      });

      const customerResult = await WhatsAppRepository.sendMessage({
        receiver: dto.customerPhone,
        message: customerMessage,
      });

      // Kirim ke adminkos
      const adminkosMessage = notificationTemplates.checkOutAdminkos({
        customerName: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        checkOut,
      });

      const adminkosResult = await WhatsAppRepository.sendMessage({
        receiver: dto.adminkosPhone,
        message: adminkosMessage,
      });

      console.log("✅ Notification Service: Check-out notification sent", {
        customer: customerResult.success,
        adminkos: adminkosResult.success,
      });

      return {
        success: true,
        data: {
          customerSent: customerResult.success,
          adminkosSent: adminkosResult.success,
        },
      };
    } catch (error) {
      console.error("❌ Notification Service: Error sending check-out notification", error);
      return {
        success: false,
        error: {
          code: "NOTIFICATION_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        }, statusCode: 500,};
    }
  }

  /**
   * Kirim pengingat jatuh tempo (hanya ke customer)
   */
  static async sendDueReminderNotification(
    dto: DueReminderNotificationDTO
  ): Promise<Result<{ customerSent: boolean }>> {
    try {
      console.log("🔍 Notification Service: Sending due reminder notification");

      const dueDate = this.formatDate(dto.dueDate);

      // Kirim ke customer
      const customerMessage = notificationTemplates.dueReminderCustomer({
        name: dto.customerName,
        property: dto.propertyName,
        bookingCode: dto.bookingCode,
        dueDate,
        daysLeft: dto.daysLeft,
      });

      const customerResult = await WhatsAppRepository.sendMessage({
        receiver: dto.customerPhone,
        message: customerMessage,
      });

      console.log("✅ Notification Service: Due reminder notification sent", {
        customer: customerResult.success,
      });

      return {
        success: true,
        data: {
          customerSent: customerResult.success,
        },
      };
    } catch (error) {
      console.error("❌ Notification Service: Error sending due reminder notification", error);
      return {
        success: false,
        error: {
          code: "NOTIFICATION_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        }, statusCode: 500,};
    }
  }
}

