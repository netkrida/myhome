/**
 * Ledger Sync Utilities
 * Helper functions for integrating ledger synchronization with existing systems
 */

import { PaymentHooks } from "./payment.hooks";
import { PayoutHooks } from "./payout.hooks";

export class LedgerSyncUtils {
  /**
   * Initialize ledger synchronization for an AdminKos
   * This should be called when an AdminKos first accesses the transaction module
   */
  static async initializeLedgerForAdminKos(adminKosId: string): Promise<{
    success: boolean;
    message: string;
    stats?: {
      paymentSync: { processed: number; synced: number; errors: number };
      payoutSync: { processed: number; synced: number; errors: number };
    };
  }> {
    try {
      console.log(`[LedgerSync] Initializing ledger for AdminKos: ${adminKosId}`);

      // Sync existing payments
      const paymentSync = await PaymentHooks.syncExistingSuccessPayments(adminKosId);
      
      // Sync existing payouts
      const payoutSync = await PayoutHooks.syncExistingApprovedPayouts(adminKosId);

      const totalSynced = paymentSync.synced + payoutSync.synced;
      const totalErrors = paymentSync.errors + payoutSync.errors;

      if (totalErrors > 0) {
        console.warn(`[LedgerSync] Initialization completed with ${totalErrors} errors`);
        return {
          success: false,
          message: `Initialization completed with ${totalErrors} errors. ${totalSynced} entries synced successfully.`,
          stats: { paymentSync, payoutSync },
        };
      }

      console.log(`[LedgerSync] Successfully initialized ledger for AdminKos: ${adminKosId}`);
      return {
        success: true,
        message: `Successfully synced ${totalSynced} entries to ledger.`,
        stats: { paymentSync, payoutSync },
      };
    } catch (error) {
      console.error(`[LedgerSync] Error initializing ledger for AdminKos ${adminKosId}:`, error);
      return {
        success: false,
        message: `Failed to initialize ledger: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate ledger synchronization integrity
   * Checks if all payments and payouts are properly synced
   */
  static async validateLedgerIntegrity(adminKosId: string): Promise<{
    isValid: boolean;
    issues: string[];
    stats: {
      payments: {
        total: number;
        synced: number;
        missing: number;
      };
      payouts: {
        total: number;
        synced: number;
        missing: number;
      };
    };
  }> {
    try {
      console.log(`[LedgerSync] Validating ledger integrity for AdminKos: ${adminKosId}`);

      // Validate payment sync
      const paymentValidation = await PaymentHooks.validatePaymentSync(adminKosId);
      
      // Validate payout sync
      const payoutValidation = await PayoutHooks.validatePayoutSync(adminKosId);

      const issues: string[] = [];
      
      if (paymentValidation.missingSyncPayments.length > 0) {
        issues.push(`${paymentValidation.missingSyncPayments.length} payments not synced to ledger`);
      }
      
      if (payoutValidation.missingSyncPayouts.length > 0) {
        issues.push(`${payoutValidation.missingSyncPayouts.length} payouts not synced to ledger`);
      }

      const stats = {
        payments: {
          total: paymentValidation.totalSuccessPayments,
          synced: paymentValidation.syncedPayments,
          missing: paymentValidation.missingSyncPayments.length,
        },
        payouts: {
          total: payoutValidation.totalApprovedPayouts,
          synced: payoutValidation.syncedPayouts,
          missing: payoutValidation.missingSyncPayouts.length,
        },
      };

      return {
        isValid: issues.length === 0,
        issues,
        stats,
      };
    } catch (error) {
      console.error(`[LedgerSync] Error validating ledger integrity:`, error);
      return {
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        stats: {
          payments: { total: 0, synced: 0, missing: 0 },
          payouts: { total: 0, synced: 0, missing: 0 },
        },
      };
    }
  }

  /**
   * Fix missing ledger entries
   * Attempts to sync any missing payments or payouts
   */
  static async fixMissingEntries(adminKosId: string): Promise<{
    success: boolean;
    message: string;
    fixed: {
      payments: number;
      payouts: number;
    };
    errors: {
      payments: number;
      payouts: number;
    };
  }> {
    try {
      console.log(`[LedgerSync] Fixing missing entries for AdminKos: ${adminKosId}`);

      // Fix missing payment entries
      const paymentSync = await PaymentHooks.syncExistingSuccessPayments(adminKosId);
      
      // Fix missing payout entries
      const payoutSync = await PayoutHooks.syncExistingApprovedPayouts(adminKosId);

      const totalFixed = paymentSync.synced + payoutSync.synced;
      const totalErrors = paymentSync.errors + payoutSync.errors;

      return {
        success: totalErrors === 0,
        message: totalErrors === 0 
          ? `Successfully fixed ${totalFixed} missing entries`
          : `Fixed ${totalFixed} entries with ${totalErrors} errors`,
        fixed: {
          payments: paymentSync.synced,
          payouts: payoutSync.synced,
        },
        errors: {
          payments: paymentSync.errors,
          payouts: payoutSync.errors,
        },
      };
    } catch (error) {
      console.error(`[LedgerSync] Error fixing missing entries:`, error);
      return {
        success: false,
        message: `Failed to fix missing entries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fixed: { payments: 0, payouts: 0 },
        errors: { payments: 0, payouts: 0 },
      };
    }
  }

  /**
   * Get sync status summary for AdminKos dashboard
   */
  static async getSyncStatus(adminKosId: string): Promise<{
    isHealthy: boolean;
    lastSyncCheck: Date;
    summary: {
      totalEntries: number;
      paymentEntries: number;
      payoutEntries: number;
      manualEntries: number;
    };
    issues?: string[];
  }> {
    try {
      // Get entry counts from ledger
      const entryCounts = await this.getEntryCounts(adminKosId);
      
      // Quick validation
      const validation = await this.validateLedgerIntegrity(adminKosId);

      return {
        isHealthy: validation.isValid,
        lastSyncCheck: new Date(),
        summary: {
          totalEntries: entryCounts.total,
          paymentEntries: entryCounts.payment,
          payoutEntries: entryCounts.payout,
          manualEntries: entryCounts.manual,
        },
        issues: validation.isValid ? undefined : validation.issues,
      };
    } catch (error) {
      console.error(`[LedgerSync] Error getting sync status:`, error);
      return {
        isHealthy: false,
        lastSyncCheck: new Date(),
        summary: {
          totalEntries: 0,
          paymentEntries: 0,
          payoutEntries: 0,
          manualEntries: 0,
        },
        issues: [`Failed to get sync status: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Helper function to get entry counts by type
   */
  private static async getEntryCounts(adminKosId: string): Promise<{
    total: number;
    payment: number;
    payout: number;
    manual: number;
    adjustment: number;
  }> {
    const { prisma } = await import("../../db/client");

    const counts = await prisma.ledgerEntry.groupBy({
      by: ['refType'],
      where: { adminKosId },
      _count: { id: true },
    });

    const result = {
      total: 0,
      payment: 0,
      payout: 0,
      manual: 0,
      adjustment: 0,
    };

    for (const count of counts) {
      const entryCount = count._count.id;
      result.total += entryCount;

      switch (count.refType) {
        case 'PAYMENT':
          result.payment = entryCount;
          break;
        case 'PAYOUT':
          result.payout = entryCount;
          break;
        case 'MANUAL':
          result.manual = entryCount;
          break;
        case 'ADJUSTMENT':
          result.adjustment = entryCount;
          break;
      }
    }

    return result;
  }
}
