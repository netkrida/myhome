/**
 * Payout Hooks
 * Handles automatic synchronization of Payout events to Ledger system
 */

import { prisma } from "../../db/client";
import { LedgerService } from "../../services/ledger.service";
import type { PayoutSyncDTO } from "../../types/ledger";

export class PayoutHooks {
  /**
   * Hook called when Payout status changes to APPROVED or COMPLETED
   * Creates corresponding LedgerEntry for expense tracking
   */
  static async onPayoutApproved(payoutId: string): Promise<void> {
    try {
      console.log(`[PayoutHooks] Processing payout approval: ${payoutId}`);

      // Get payout details
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
        include: {
          adminKos: true,
        },
      });

      if (!payout) {
        console.error(`[PayoutHooks] Payout not found: ${payoutId}`);
        return;
      }

      if (!["APPROVED", "COMPLETED"].includes(payout.status)) {
        console.log(`[PayoutHooks] Payout ${payoutId} is not APPROVED/COMPLETED, skipping`);
        return;
      }

      // Prepare sync data
      const syncData: PayoutSyncDTO = {
        payoutId: payout.id,
        amount: Number(payout.amount),
        processedAt: payout.processedAt || payout.updatedAt,
      };

      // Sync to ledger
      const ledgerEntry = await LedgerService.syncPayoutToLedger(
        payout.adminKosId,
        syncData
      );

      if (ledgerEntry) {
        console.log(`[PayoutHooks] Successfully synced payout ${payoutId} to ledger entry ${ledgerEntry.id}`);
      } else {
        console.log(`[PayoutHooks] Payout ${payoutId} already synced to ledger`);
      }
    } catch (error) {
      console.error(`[PayoutHooks] Error processing payout approval ${payoutId}:`, error);
      // Don't throw error to avoid breaking the payout flow
      // In production, you might want to add this to a retry queue
    }
  }

  /**
   * Hook called when Payout status changes to COMPLETED
   * Same as onPayoutApproved but specifically for COMPLETED status
   */
  static async onPayoutCompleted(payoutId: string): Promise<void> {
    // Use the same logic as approval since both statuses should create ledger entries
    await this.onPayoutApproved(payoutId);
  }

  /**
   * Batch sync existing APPROVED/COMPLETED payouts to ledger
   * Useful for initial migration or fixing missing entries
   */
  static async syncExistingApprovedPayouts(adminKosId?: string): Promise<{
    processed: number;
    synced: number;
    errors: number;
  }> {
    try {
      console.log(`[PayoutHooks] Starting batch sync of existing APPROVED/COMPLETED payouts`);

      const whereClause: any = {
        status: { in: ["APPROVED", "COMPLETED"] },
      };

      // If adminKosId is provided, filter by that admin
      if (adminKosId) {
        whereClause.adminKosId = adminKosId;
      }

      const approvedPayouts = await prisma.payout.findMany({
        where: whereClause,
        include: {
          adminKos: true,
        },
        orderBy: { processedAt: 'asc' },
      });

      let processed = 0;
      let synced = 0;
      let errors = 0;

      for (const payout of approvedPayouts) {
        try {
          processed++;

          const syncData: PayoutSyncDTO = {
            payoutId: payout.id,
            amount: Number(payout.amount),
            processedAt: payout.processedAt || payout.updatedAt,
          };

          const ledgerEntry = await LedgerService.syncPayoutToLedger(
            payout.adminKosId,
            syncData
          );

          if (ledgerEntry) {
            synced++;
            console.log(`[PayoutHooks] Synced payout ${payout.id} to ledger`);
          }
        } catch (error) {
          errors++;
          console.error(`[PayoutHooks] Error syncing payout ${payout.id}:`, error);
        }
      }

      console.log(`[PayoutHooks] Batch sync completed: ${processed} processed, ${synced} synced, ${errors} errors`);

      return { processed, synced, errors };
    } catch (error) {
      console.error(`[PayoutHooks] Error in batch sync:`, error);
      throw error;
    }
  }

  /**
   * Validate payout sync integrity
   * Checks if all APPROVED/COMPLETED payouts have corresponding ledger entries
   */
  static async validatePayoutSync(adminKosId: string): Promise<{
    totalApprovedPayouts: number;
    syncedPayouts: number;
    missingSyncPayouts: string[];
  }> {
    try {
      // Get all APPROVED/COMPLETED payouts for this admin
      const approvedPayouts = await prisma.payout.findMany({
        where: {
          adminKosId,
          status: { in: ["APPROVED", "COMPLETED"] },
        },
        select: { id: true },
      });

      // Get all payout-related ledger entries
      const payoutEntries = await prisma.ledgerEntry.findMany({
        where: {
          adminKosId,
          refType: "PAYOUT",
        },
        select: { refId: true },
      });

      const syncedPayoutIds = new Set(payoutEntries.map(e => e.refId).filter(Boolean));
      const missingSyncPayouts = approvedPayouts
        .filter(p => !syncedPayoutIds.has(p.id))
        .map(p => p.id);

      return {
        totalApprovedPayouts: approvedPayouts.length,
        syncedPayouts: syncedPayoutIds.size,
        missingSyncPayouts,
      };
    } catch (error) {
      console.error(`[PayoutHooks] Error validating payout sync:`, error);
      throw error;
    }
  }

  /**
   * Recalculate balance after payout operations
   * Useful for ensuring balance consistency
   */
  static async recalculateBalance(adminKosId: string): Promise<{
    ledgerBalance: number;
    payoutTotal: number;
    difference: number;
  }> {
    try {
      // Get balance from ledger
      const balance = await LedgerService.calculateBalance(adminKosId);

      // Get total from payout table
      const payoutTotal = await prisma.payout.aggregate({
        where: {
          adminKosId,
          status: { in: ["APPROVED", "COMPLETED"] },
        },
        _sum: { amount: true },
      });

      const payoutTotalAmount = Number(payoutTotal._sum.amount || 0);
      const difference = balance.totalWithdrawals - payoutTotalAmount;

      return {
        ledgerBalance: balance.totalBalance,
        payoutTotal: payoutTotalAmount,
        difference,
      };
    } catch (error) {
      console.error(`[PayoutHooks] Error recalculating balance:`, error);
      throw error;
    }
  }
}
