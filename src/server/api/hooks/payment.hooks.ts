/**
 * Payment Hooks
 * Handles automatic synchronization of Payment events to Ledger system
 */

import { prisma } from "../../db/client";
import { LedgerService } from "../../services/ledger.service";
import type { PaymentSyncDTO } from "../../types/ledger";

export class PaymentHooks {
  /**
   * Hook called when Payment status changes to SUCCESS
   * Creates corresponding LedgerEntry for income tracking
   */
  static async onPaymentSuccess(paymentId: string): Promise<void> {
    try {
      console.log(`[PaymentHooks] Processing payment success: ${paymentId}`);

      // Get payment with booking and property details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              property: {
                include: {
                  owner: {
                    include: {
                      adminKosProfile: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!payment) {
        console.error(`[PaymentHooks] Payment not found: ${paymentId}`);
        return;
      }

      if (payment.status !== "SUCCESS") {
        console.log(`[PaymentHooks] Payment ${paymentId} is not SUCCESS, skipping`);
        return;
      }

      // Get AdminKos profile
      const adminKosProfile = payment.booking.property.owner.adminKosProfile;
      if (!adminKosProfile) {
        console.error(`[PaymentHooks] AdminKos profile not found for payment: ${paymentId}`);
        return;
      }

      // Prepare sync data
      const syncData: PaymentSyncDTO = {
        paymentId: payment.id,
        bookingId: payment.booking.id,
        propertyId: payment.booking.property.id,
        amount: Number(payment.amount),
        transactionTime: payment.transactionTime || payment.updatedAt,
      };

      // Sync to ledger
      const ledgerEntry = await LedgerService.syncPaymentToLedger(
        adminKosProfile.id,
        syncData
      );

      if (ledgerEntry) {
        console.log(`[PaymentHooks] Successfully synced payment ${paymentId} to ledger entry ${ledgerEntry.id}`);
      } else {
        console.log(`[PaymentHooks] Payment ${paymentId} already synced to ledger`);
      }
    } catch (error) {
      console.error(`[PaymentHooks] Error processing payment success ${paymentId}:`, error);
      // Don't throw error to avoid breaking the payment flow
      // In production, you might want to add this to a retry queue
    }
  }

  /**
   * Batch sync existing SUCCESS payments to ledger
   * Useful for initial migration or fixing missing entries
   */
  static async syncExistingSuccessPayments(adminKosId?: string): Promise<{
    processed: number;
    synced: number;
    errors: number;
  }> {
    try {
      console.log(`[PaymentHooks] Starting batch sync of existing SUCCESS payments`);

      const whereClause: any = {
        status: "SUCCESS",
      };

      // If adminKosId is provided, filter by that admin
      if (adminKosId) {
        whereClause.booking = {
          property: {
            owner: {
              adminKosProfile: {
                id: adminKosId,
              },
            },
          },
        };
      }

      const successPayments = await prisma.payment.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              property: {
                include: {
                  owner: {
                    include: {
                      adminKosProfile: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { transactionTime: 'asc' },
      });

      let processed = 0;
      let synced = 0;
      let errors = 0;

      for (const payment of successPayments) {
        try {
          processed++;

          const adminKosProfile = payment.booking.property.owner.adminKosProfile;
          if (!adminKosProfile) {
            console.warn(`[PaymentHooks] No AdminKos profile for payment ${payment.id}`);
            errors++;
            continue;
          }

          const syncData: PaymentSyncDTO = {
            paymentId: payment.id,
            bookingId: payment.booking.id,
            propertyId: payment.booking.property.id,
            amount: Number(payment.amount),
            transactionTime: payment.transactionTime || payment.updatedAt,
          };

          const ledgerEntry = await LedgerService.syncPaymentToLedger(
            adminKosProfile.id,
            syncData
          );

          if (ledgerEntry) {
            synced++;
            console.log(`[PaymentHooks] Synced payment ${payment.id} to ledger`);
          }
        } catch (error) {
          errors++;
          console.error(`[PaymentHooks] Error syncing payment ${payment.id}:`, error);
        }
      }

      console.log(`[PaymentHooks] Batch sync completed: ${processed} processed, ${synced} synced, ${errors} errors`);

      return { processed, synced, errors };
    } catch (error) {
      console.error(`[PaymentHooks] Error in batch sync:`, error);
      throw error;
    }
  }

  /**
   * Validate payment sync integrity
   * Checks if all SUCCESS payments have corresponding ledger entries
   */
  static async validatePaymentSync(adminKosId: string): Promise<{
    totalSuccessPayments: number;
    syncedPayments: number;
    missingSyncPayments: string[];
  }> {
    try {
      // Get all SUCCESS payments for this admin
      const successPayments = await prisma.payment.findMany({
        where: {
          status: "SUCCESS",
          booking: {
            property: {
              owner: {
                adminKosProfile: {
                  id: adminKosId,
                },
              },
            },
          },
        },
        select: { id: true },
      });

      // Get all payment-related ledger entries
      const paymentEntries = await prisma.ledgerEntry.findMany({
        where: {
          adminKosId,
          refType: "PAYMENT",
        },
        select: { refId: true },
      });

      const syncedPaymentIds = new Set(paymentEntries.map(e => e.refId).filter(Boolean));
      const missingSyncPayments = successPayments
        .filter(p => !syncedPaymentIds.has(p.id))
        .map(p => p.id);

      return {
        totalSuccessPayments: successPayments.length,
        syncedPayments: syncedPaymentIds.size,
        missingSyncPayments,
      };
    } catch (error) {
      console.error(`[PaymentHooks] Error validating payment sync:`, error);
      throw error;
    }
  }
}
