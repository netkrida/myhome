/**
 * WhatsApp Repository
 * Repository layer untuk pengiriman notifikasi WhatsApp via Kirimi API
 * Mengikuti pola arsitektur: Service -> Repository -> Adapter
 */

import type { Result } from "@/server/types/result";
import * as KirimiAdapter from "@/server/adapters/kirimi/whatsapp.adapter";

/**
 * DTO untuk pengiriman pesan WhatsApp
 */
export interface SendWhatsAppMessageDTO {
  receiver: string; // Nomor WhatsApp format 62xxx
  message: string;
  mediaUrl?: string;
  fileName?: string;
  enableTypingEffect?: boolean;
  typingSpeedMs?: number;
}

/**
 * DTO untuk broadcast pesan WhatsApp
 */
export interface BroadcastWhatsAppMessageDTO {
  label: string;
  receivers: string[]; // Array nomor WhatsApp format 62xxx
  message: string;
  delay?: number;
  mediaUrl?: string;
  fileName?: string;
  scheduledAt?: string; // ISO format
}

/**
 * WhatsApp Repository
 */
export class WhatsAppRepository {
  /**
   * Kirim pesan WhatsApp ke satu nomor (dengan typing effect)
   */
  static async sendMessage(
    dto: SendWhatsAppMessageDTO
  ): Promise<Result<{ success: boolean; data?: any }>> {
    try {
      console.log("🔍 WhatsApp Repository: Sending message to", dto.receiver);

      // Validasi nomor WhatsApp harus format 62xxx
      if (!dto.receiver.startsWith("62")) {
        console.error("❌ WhatsApp Repository: Invalid phone number format", dto.receiver);
        return {
          success: false,
          error: {
            code: "INVALID_PHONE_FORMAT",
            message: "Nomor WhatsApp harus diawali dengan 62",
          },
          statusCode: 400,
        };
      }

      const response = await KirimiAdapter.sendMessage({
        receiver: dto.receiver,
        message: dto.message,
        media_url: dto.mediaUrl,
        fileName: dto.fileName,
        enableTypingEffect: dto.enableTypingEffect,
        typingSpeedMs: dto.typingSpeedMs,
      });

      if (!response.success) {
        console.error("❌ WhatsApp Repository: Failed to send message", response.error);
        return {
          success: false,
          error: {
            code: "WHATSAPP_SEND_FAILED",
            message: response.error || "Failed to send WhatsApp message",
          },
          statusCode: 500,
        };
      }

      console.log("✅ WhatsApp Repository: Message sent successfully");
      return {
        success: true,
        data: {
          success: true,
          data: response.data,
        },
      };
    } catch (error) {
      console.error("❌ WhatsApp Repository: Error sending message", error);
      return {
        success: false,
        error: {
          code: "WHATSAPP_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        statusCode: 500,
      };
    }
  }

  /**
   * Kirim pesan WhatsApp ke satu nomor (tanpa typing effect, lebih cepat)
   */
  static async sendMessageFast(
    dto: SendWhatsAppMessageDTO
  ): Promise<Result<{ success: boolean; data?: any }>> {
    try {
      console.log("🔍 WhatsApp Repository: Sending fast message to", dto.receiver);

      // Validasi nomor WhatsApp harus format 62xxx
      if (!dto.receiver.startsWith("62")) {
        console.error("❌ WhatsApp Repository: Invalid phone number format", dto.receiver);
        return {
          success: false,
          error: {
            code: "INVALID_PHONE_FORMAT",
            message: "Nomor WhatsApp harus diawali dengan 62",
          },
          statusCode: 400,
        };
      }

      const response = await KirimiAdapter.sendMessageFast({
        receiver: dto.receiver,
        message: dto.message,
        media_url: dto.mediaUrl,
        fileName: dto.fileName,
      });

      if (!response.success) {
        console.error("❌ WhatsApp Repository: Failed to send fast message", response.error);
        return {
          success: false,
          error: {
            code: "WHATSAPP_SEND_FAILED",
            message: response.error || "Failed to send fast WhatsApp message",
          },
          statusCode: 500,
        };
      }

      console.log("✅ WhatsApp Repository: Fast message sent successfully");
      return {
        success: true,
        data: {
          success: true,
          data: response.data,
        },
      };
    } catch (error) {
      console.error("❌ WhatsApp Repository: Error sending fast message", error);
      return {
        success: false,
        error: {
          code: "WHATSAPP_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        statusCode: 500,
      };
    }
  }

  /**
   * Broadcast pesan WhatsApp ke banyak nomor
   */
  static async broadcastMessage(
    dto: BroadcastWhatsAppMessageDTO
  ): Promise<Result<{ success: boolean; data?: any }>> {
    try {
      console.log("🔍 WhatsApp Repository: Broadcasting message to", dto.receivers.length, "recipients");

      // Validasi semua nomor WhatsApp harus format 62xxx
      const invalidNumbers = dto.receivers.filter((num) => !num.startsWith("62"));
      if (invalidNumbers.length > 0) {
        console.error("❌ WhatsApp Repository: Invalid phone numbers", invalidNumbers);
        return {
          success: false,
          error: {
            code: "INVALID_PHONE_FORMAT",
            message: `Nomor WhatsApp harus diawali dengan 62: ${invalidNumbers.join(", ")}`,
          },
          statusCode: 400,
        };
      }

      const response = await KirimiAdapter.broadcastMessage({
        label: dto.label,
        numbers: dto.receivers,
        message: dto.message,
        delay: dto.delay,
        media_url: dto.mediaUrl,
        fileName: dto.fileName,
        started_at: dto.scheduledAt,
      });

      if (!response.success) {
        console.error("❌ WhatsApp Repository: Failed to broadcast message", response.error);
        return {
          success: false,
          error: {
            code: "WHATSAPP_BROADCAST_FAILED",
            message: response.error || "Failed to broadcast WhatsApp message",
          },
          statusCode: 500,
        };
      }

      console.log("✅ WhatsApp Repository: Broadcast sent successfully");
      return {
        success: true,
        data: {
          success: true,
          data: response.data,
        },
      };
    } catch (error) {
      console.error("❌ WhatsApp Repository: Error broadcasting message", error);
      return {
        success: false,
        error: {
          code: "WHATSAPP_BROADCAST_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        statusCode: 500,
      };
    }
  }
}
