// @ts-ignore - midtrans-client doesn't have TypeScript definitions
import midtransClient from "midtrans-client";
import type {
  MidtransSnapRequest,
  MidtransSnapResponse,
} from "@/server/types/booking";

/**
 * Midtrans Snap Adapter
 * Tier-3: External Integration Layer
 *
 * Handles all Midtrans Snap payment gateway interactions.
 * Isolates external API calls from business logic.
 *
 * Benefits:
 * - Easy to switch payment providers (e.g., to Xendit)
 * - Easy to mock for testing
 * - Centralizes API key management
 * - Keeps service layer clean
 *
 * NOTE: Removed "use server" directive because not all functions are async.
 * Only async functions that interact with Midtrans API need to be server actions.
 */

/**
 * Get Midtrans configuration from environment
 */
function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey || !clientKey) {
    throw new Error("Midtrans configuration is incomplete. Check MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in .env");
  }

  return {
    serverKey,
    clientKey,
    isProduction,
  };
}

/**
 * Create Midtrans Snap client instance
 */
function createSnapClient() {
  const config = getMidtransConfig();

  return new midtransClient.Snap({
    isProduction: config.isProduction,
    serverKey: config.serverKey,
    clientKey: config.clientKey,
  });
}

/**
 * Create a Snap transaction and get payment token
 * 
 * @param request - Snap transaction request payload
 * @returns Snap response with token and redirect URL
 * @throws Error if Midtrans API fails
 */
export async function createSnapTransaction(
  request: MidtransSnapRequest
): Promise<MidtransSnapResponse> {
  try {
    const snap = createSnapClient();
    const response = await snap.createTransaction(request);
    
    return {
      token: response.token,
      redirect_url: response.redirect_url,
    };
  } catch (error: any) {
    console.error("Midtrans Snap createTransaction error:", error);
    
    // Extract meaningful error message from Midtrans response
    const errorMessage =
      error?.ApiResponse?.status_message ||
      error?.message ||
      error?.status_message ||
      "Failed to create Midtrans transaction";
    
    throw new Error(errorMessage);
  }
}

/**
 * Get transaction status from Midtrans
 * 
 * @param orderId - Midtrans order ID
 * @returns Transaction status response
 * @throws Error if Midtrans API fails
 */
export async function getTransactionStatus(orderId: string): Promise<any> {
  try {
    const snap = createSnapClient();
    const status = await snap.transaction.status(orderId);
    
    return status;
  } catch (error: any) {
    console.error("Midtrans getTransactionStatus error:", error);
    
    const errorMessage =
      error?.ApiResponse?.status_message ||
      error?.message ||
      error?.status_message ||
      "Failed to get transaction status";
    
    throw new Error(errorMessage);
  }
}

/**
 * Cancel a transaction in Midtrans
 * 
 * @param orderId - Midtrans order ID
 * @returns Cancellation response
 * @throws Error if Midtrans API fails
 */
export async function cancelTransaction(orderId: string): Promise<any> {
  try {
    const snap = createSnapClient();
    const response = await snap.transaction.cancel(orderId);
    
    return response;
  } catch (error: any) {
    console.error("Midtrans cancelTransaction error:", error);
    
    const errorMessage =
      error?.ApiResponse?.status_message ||
      error?.message ||
      error?.status_message ||
      "Failed to cancel transaction";
    
    throw new Error(errorMessage);
  }
}

/**
 * Approve a transaction in Midtrans (for challenge/pending transactions)
 * 
 * @param orderId - Midtrans order ID
 * @returns Approval response
 * @throws Error if Midtrans API fails
 */
export async function approveTransaction(orderId: string): Promise<any> {
  try {
    const snap = createSnapClient();
    const response = await snap.transaction.approve(orderId);
    
    return response;
  } catch (error: any) {
    console.error("Midtrans approveTransaction error:", error);
    
    const errorMessage =
      error?.ApiResponse?.status_message ||
      error?.message ||
      error?.status_message ||
      "Failed to approve transaction";
    
    throw new Error(errorMessage);
  }
}

/**
 * Expire a transaction in Midtrans
 * 
 * @param orderId - Midtrans order ID
 * @returns Expiration response
 * @throws Error if Midtrans API fails
 */
export async function expireTransaction(orderId: string): Promise<any> {
  try {
    const snap = createSnapClient();
    const response = await snap.transaction.expire(orderId);
    
    return response;
  } catch (error: any) {
    console.error("Midtrans expireTransaction error:", error);
    
    const errorMessage =
      error?.ApiResponse?.status_message ||
      error?.message ||
      error?.status_message ||
      "Failed to expire transaction";
    
    throw new Error(errorMessage);
  }
}

/**
 * Get Midtrans client key for frontend
 * Safe to expose to client-side
 */
export function getMidtransClientKey(): string {
  const config = getMidtransConfig();
  return config.clientKey;
}

/**
 * Get Midtrans Snap script URL based on environment
 */
export function getSnapScriptUrl(): string {
  const config = getMidtransConfig();
  return config.isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

/**
 * Verify Midtrans notification signature
 *
 * This ensures the notification actually comes from Midtrans and hasn't been tampered with.
 *
 * @param orderId - Order ID from notification
 * @param statusCode - Status code from notification
 * @param grossAmount - Gross amount from notification
 * @param signatureKey - Signature key from notification
 * @returns true if signature is valid, false otherwise
 */
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  try {
    const config = getMidtransConfig();
    const crypto = require('crypto');

    // Midtrans signature formula: SHA512(order_id + status_code + gross_amount + serverKey)
    const signatureString = `${orderId}${statusCode}${grossAmount}${config.serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    return calculatedSignature === signatureKey;
  } catch (error) {
    console.error("Error verifying Midtrans signature:", error);
    return false;
  }
}

/**
 * Get Midtrans server key (for internal use only - NEVER expose to client)
 */
export function getMidtransServerKey(): string {
  const config = getMidtransConfig();
  return config.serverKey;
}

