import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { sendDeadlineReminders } from "../services/email-service";

/**
 * Scheduler for sending deadline reminder emails
 * Runs daily at 9 AM UTC to check for opportunities expiring within 7 days
 */

let reminderJob: ScheduledTask | null = null;

/**
 * Start the reminder scheduler
 * Sends deadline reminders daily at 9 AM UTC
 */
export function startReminderScheduler() {
  if (reminderJob) {
    console.log("Reminder scheduler already running");
    return;
  }

  // Schedule for 9 AM UTC every day
  // Cron format: second minute hour day month day-of-week
  reminderJob = cron.schedule("0 9 * * *", async () => {
    console.log("[Reminder Scheduler] Running deadline reminder check...");
    try {
      const result = await sendDeadlineReminders();
      console.log(
        `[Reminder Scheduler] Completed: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`
      );
    } catch (error) {
      console.error("[Reminder Scheduler] Error:", error);
    }
  });

  console.log("[Reminder Scheduler] Started (9 AM UTC daily)");
}

/**
 * Stop the reminder scheduler
 */
export function stopReminderScheduler() {
  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
    console.log("[Reminder Scheduler] Stopped");
  }
}

/**
 * Manually trigger reminder check (for testing/admin purposes)
 */
export async function triggerReminderCheck() {
  console.log("[Reminder Scheduler] Manual trigger: Running deadline reminder check...");
  try {
    const result = await sendDeadlineReminders();
    console.log(
      `[Reminder Scheduler] Completed: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`
    );
    return result;
  } catch (error) {
    console.error("[Reminder Scheduler] Error:", error);
    throw error;
  }
}

/**
 * Get scheduler status
 */
export function getReminderSchedulerStatus() {
  return {
    running: reminderJob !== null,
    schedule: "9 AM UTC daily",
  };
}
