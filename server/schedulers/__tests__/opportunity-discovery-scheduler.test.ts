import { describe, expect, it } from "vitest";
import {
  getOpportunityDiscoverySchedulerStatus,
  validateOpportunityDiscoveryCron,
} from "../opportunity-discovery-scheduler";

describe("Opportunity Discovery Scheduler", () => {
  it("validates cron expressions", () => {
    expect(validateOpportunityDiscoveryCron("0 10 * * *")).toBe(true);
    expect(validateOpportunityDiscoveryCron("not a cron")).toBe(false);
  });

  it("reports scheduler status", () => {
    const status = getOpportunityDiscoverySchedulerStatus();

    expect(status).toHaveProperty("running");
    expect(status).toHaveProperty("enabled");
    expect(status).toHaveProperty("schedule");
    expect(status).toHaveProperty("autoApprove");
  });
});
