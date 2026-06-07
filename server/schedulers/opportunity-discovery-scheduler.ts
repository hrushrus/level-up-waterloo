import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { runOpportunityDiscovery } from "../services/opportunity-discovery";

let discoveryJob: ScheduledTask | null = null;

const DISCOVERY_CRON = process.env.OPPORTUNITY_DISCOVERY_CRON || "0 10 * * *";

export function startOpportunityDiscoveryScheduler() {
  if (process.env.OPPORTUNITY_DISCOVERY_ENABLED !== "true") {
    console.log("[Opportunity Discovery] Disabled. Set OPPORTUNITY_DISCOVERY_ENABLED=true to enable.");
    return;
  }

  if (discoveryJob) {
    console.log("[Opportunity Discovery] Scheduler already running");
    return;
  }

  discoveryJob = cron.schedule(DISCOVERY_CRON, async () => {
    console.log("[Opportunity Discovery] Running daily opportunity discovery...");
    try {
      const result = await runOpportunityDiscovery();
      console.log(
        `[Opportunity Discovery] Completed: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} sources failed`,
      );
    } catch (error) {
      console.error("[Opportunity Discovery] Error:", error);
    }
  });

  console.log(`[Opportunity Discovery] Started (${DISCOVERY_CRON})`);

  if (process.env.OPPORTUNITY_DISCOVERY_RUN_ON_STARTUP === "true") {
    runOpportunityDiscovery().catch((error) => {
      console.error("[Opportunity Discovery] Startup run failed:", error);
    });
  }
}

export function stopOpportunityDiscoveryScheduler() {
  if (discoveryJob) {
    discoveryJob.stop();
    discoveryJob = null;
    console.log("[Opportunity Discovery] Stopped");
  }
}

export function getOpportunityDiscoverySchedulerStatus() {
  return {
    running: discoveryJob !== null,
    enabled: process.env.OPPORTUNITY_DISCOVERY_ENABLED === "true",
    schedule: DISCOVERY_CRON,
    autoApprove: process.env.OPPORTUNITY_DISCOVERY_AUTO_APPROVE === "true",
  };
}

export async function triggerOpportunityDiscovery() {
  console.log("[Opportunity Discovery] Manual trigger started");
  return runOpportunityDiscovery();
}

export function validateOpportunityDiscoveryCron(expression: string): boolean {
  return cron.validate(expression);
}
