/**
 * Midtrans Adapter
 * 
 * Central export point for all Midtrans integrations.
 * This follows the adapter pattern for external service integrations.
 * 
 * Usage in service layer:
 * ```typescript
 * import { createSnapTransaction } from '@/server/adapters/midtrans';
 * 
 * const snapResponse = await createSnapTransaction({
 *   transaction_details: { ... },
 *   customer_details: { ... }
 * });
 * ```
 */

export {
  createSnapTransaction,
  getTransactionStatus,
  cancelTransaction,
  approveTransaction,
  expireTransaction,
  getMidtransClientKey,
  getSnapScriptUrl,
  verifyNotificationSignature,
  getMidtransServerKey,
} from "./snap.adapter";

