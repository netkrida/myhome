/**
 * Kirimi WhatsApp API Adapter
 * Handles direct integration with Kirimi.id API for sending WhatsApp messages
 * https://api.kirimi.id/v1/
 */

import { env } from "@/env";

const KIRIMI_API_BASE_URL = "https://api.kirimi.id/v1";

/**
 * Payload untuk Send Message endpoint
 */
export interface SendMessagePayload {
  receiver: string; // Format: 6281234567890
  message: string;
  media_url?: string;
  fileName?: string;
  enableTypingEffect?: boolean;
  typingSpeedMs?: number;
  quotedMessageId?: string;
}

/**
 * Payload untuk Send Message Fast endpoint
 */
export interface SendMessageFastPayload {
  receiver: string;
  message: string;
  media_url?: string;
  fileName?: string;
  quotedMessageId?: string;
}

/**
 * Payload untuk Broadcast Message endpoint
 */
export interface BroadcastMessagePayload {
  label: string;
  numbers: string[];
  message: string;
  delay?: number; // min: 5, recommended: 30
  media_url?: string;
  fileName?: string;
  started_at?: string; // ISO format
  enableTypingEffect?: boolean;
  typingSpeedMs?: number;
}

/**
 * Response dari Kirimi API
 */
export interface KirimiApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Kirim pesan WhatsApp dengan typing effect (lebih natural)
 */
export async function sendMessage(
  payload: SendMessagePayload
): Promise<KirimiApiResponse> {
  try {
    console.log("🔍 Kirimi Adapter: Sending WhatsApp message to", payload.receiver);

    const response = await fetch(`${KIRIMI_API_BASE_URL}/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_code: env.KIRIMI_USER_CODE,
        device_id: env.KIRIMI_DEVICE_ID,
        secret: env.KIRIMI_SECRET_KEY,
        receiver: payload.receiver,
        message: payload.message,
        media_url: payload.media_url,
        fileName: payload.fileName,
        enableTypingEffect: payload.enableTypingEffect ?? true,
        typingSpeedMs: payload.typingSpeedMs ?? 350,
        quotedMessageId: payload.quotedMessageId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Kirimi Adapter: Failed to send message", data);
      return {
        success: false,
        error: data.message || "Failed to send WhatsApp message",
      };
    }

    console.log("✅ Kirimi Adapter: Message sent successfully to", payload.receiver);
    return {
      success: true,
      message: "WhatsApp message sent successfully",
      data,
    };
  } catch (error) {
    console.error("❌ Kirimi Adapter: Error sending message", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Kirim pesan WhatsApp tanpa typing effect (lebih cepat)
 */
export async function sendMessageFast(
  payload: SendMessageFastPayload
): Promise<KirimiApiResponse> {
  try {
    console.log("🔍 Kirimi Adapter: Sending fast WhatsApp message to", payload.receiver);

    const response = await fetch(`${KIRIMI_API_BASE_URL}/send-message-fast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_code: env.KIRIMI_USER_CODE,
        device_id: env.KIRIMI_DEVICE_ID,
        secret: env.KIRIMI_SECRET_KEY,
        receiver: payload.receiver,
        message: payload.message,
        media_url: payload.media_url,
        fileName: payload.fileName,
        quotedMessageId: payload.quotedMessageId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Kirimi Adapter: Failed to send fast message", data);
      return {
        success: false,
        error: data.message || "Failed to send fast WhatsApp message",
      };
    }

    console.log("✅ Kirimi Adapter: Fast message sent successfully to", payload.receiver);
    return {
      success: true,
      message: "WhatsApp fast message sent successfully",
      data,
    };
  } catch (error) {
    console.error("❌ Kirimi Adapter: Error sending fast message", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Broadcast pesan WhatsApp ke banyak nomor
 */
export async function broadcastMessage(
  payload: BroadcastMessagePayload
): Promise<KirimiApiResponse> {
  try {
    console.log("🔍 Kirimi Adapter: Broadcasting WhatsApp message to", payload.numbers.length, "recipients");

    const response = await fetch(`${KIRIMI_API_BASE_URL}/broadcast-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_code: env.KIRIMI_USER_CODE,
        device_id: env.KIRIMI_DEVICE_ID,
        secret: env.KIRIMI_SECRET_KEY,
        label: payload.label,
        numbers: payload.numbers,
        message: payload.message,
        delay: payload.delay ?? 30,
        media_url: payload.media_url,
        fileName: payload.fileName,
        started_at: payload.started_at,
        enableTypingEffect: payload.enableTypingEffect ?? true,
        typingSpeedMs: payload.typingSpeedMs ?? 350,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Kirimi Adapter: Failed to broadcast message", data);
      return {
        success: false,
        error: data.message || "Failed to broadcast WhatsApp message",
      };
    }

    console.log("✅ Kirimi Adapter: Broadcast message sent successfully");
    return {
      success: true,
      message: "WhatsApp broadcast sent successfully",
      data,
    };
  } catch (error) {
    console.error("❌ Kirimi Adapter: Error broadcasting message", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
