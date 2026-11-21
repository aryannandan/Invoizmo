import cron from 'node-cron';
import { Invoice } from '../modules/invoices/invoice.model.js';

/**
 * Daily Trash Cleanup Sweep (PRD Section 12.2 FR-TRASH-5)
 * Secondary fallback to MongoDB TTL index on purgeAt.
 * Runs every night at midnight (00:00).
 */
export function initCronJobs(): void {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const result = await Invoice.deleteMany({
        purgeAt: { $lte: now },
      });
      if (result.deletedCount > 0) {
        console.log(`[Cron Sweep] Purged ${result.deletedCount} expired invoices from trash.`);
      }
    } catch (error) {
      console.error('[Cron Sweep Error] Failed to purge trash:', error);
    }
  });

  console.log('⏰ Background cron jobs initialized');
}
