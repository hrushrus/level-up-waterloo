/**
 * Expiration Scheduler for LevelUp Waterloo
 * 
 * Automatically inactivates opportunities that have passed their deadline.
 * Runs daily at midnight UTC.
 */

import { getDb } from "../db";
import { opportunities } from "../../drizzle/schema";
import { lt } from "drizzle-orm";

/**
 * Check and inactivate expired opportunities
 * This function is called by the scheduler
 */
export async function checkAndInactivateExpired() {
  try {
    console.log("[Expiration Scheduler] Running expiration check...");

    const db = await getDb();
    if (!db) {
      console.warn("[Expiration Scheduler] Database not available");
      return { success: false, error: "Database not available" };
    }

    // Find all opportunities with deadline in the past
    const expired = await db
      .select()
      .from(opportunities)
      .where(lt(opportunities.deadline, new Date()));

    if (expired.length === 0) {
      console.log("[Expiration Scheduler] No expired opportunities found");
      return { success: true, count: 0 };
    }

    // Get only those that are still approved
    const toInactivate = expired.filter((opp: any) => opp.isApproved);

    if (toInactivate.length === 0) {
      console.log("[Expiration Scheduler] No active expired opportunities to inactivate");
      return { success: true, count: 0 };
    }

    // Inactivate all expired opportunities
    await db
      .update(opportunities)
      .set({ isApproved: false })
      .where(lt(opportunities.deadline, new Date()));

    console.log(
      `[Expiration Scheduler] Successfully inactivated ${toInactivate.length} expired opportunities`
    );

    return { success: true, count: toInactivate.length };
  } catch (error) {
    console.error("[Expiration Scheduler] Error during expiration check:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Initialize the expiration scheduler using node-cron
 * Runs daily at midnight UTC: "0 0 * * *"
 */
export function initExpirationScheduler() {
  try {
    // Try to import node-cron dynamically
    let cron: any;
    try {
      cron = require("node-cron");
    } catch (e) {
      console.warn(
        "[Expiration Scheduler] node-cron not installed. Install with: pnpm add node-cron"
      );
      console.log(
        "[Expiration Scheduler] Running expiration check on startup instead..."
      );
      // Run once on startup
      checkAndInactivateExpired().catch(console.error);
      return;
    }

    // Schedule: "0 0 * * *" = every day at midnight UTC
    const task = cron.schedule("0 0 * * *", async () => {
      await checkAndInactivateExpired();
    });

    console.log("[Expiration Scheduler] Initialized (runs daily at midnight UTC)");

    // Also run on startup to catch any missed expirations
    checkAndInactivateExpired().catch(console.error);

    return task;
  } catch (error) {
    console.error("[Expiration Scheduler] Failed to initialize scheduler:", error);
  }
}

/**
 * Validate cron expression (for testing)
 */
export function validateCronExpression(expression: string): boolean {
  try {
    const cron = require("node-cron");
    return cron.validate(expression);
  } catch (e) {
    return false;
  }
}
