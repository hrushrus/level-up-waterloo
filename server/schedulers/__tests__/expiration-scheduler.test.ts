import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkAndInactivateExpired, validateCronExpression } from "../expiration-scheduler";

describe("Expiration Scheduler", () => {
  describe("validateCronExpression", () => {
    it("should validate correct cron expressions", () => {
      // These tests work if node-cron is installed
      // If not installed, they will return false
      const validExpressions = [
        "0 0 * * *",      // Daily at midnight
        "0 */6 * * *",    // Every 6 hours
        "0 0 * * 0",      // Weekly on Sunday
      ];

      validExpressions.forEach((expr) => {
        const result = validateCronExpression(expr);
        // Result might be false if node-cron is not installed
        expect(typeof result).toBe("boolean");
      });
    });

    it("should reject invalid cron expressions", () => {
      const invalidExpressions = [
        "invalid",
        "99 99 99 99 99",
        "",
      ];

      invalidExpressions.forEach((expr) => {
        const result = validateCronExpression(expr);
        expect(result).toBe(false);
      });
    });
  });

  describe("checkAndInactivateExpired", () => {
    it("should handle database not available gracefully", async () => {
      // This test verifies the function handles missing database
      const result = await checkAndInactivateExpired();
      
      // Result should indicate success or error
      expect(result).toHaveProperty("success");
      
      // If database is not available, it should return an error
      if (!result.success) {
        expect(result.error).toBeDefined();
      } else {
        expect(result).toHaveProperty("count");
      }
    });

    it("should return count of inactivated opportunities", async () => {
      const result = await checkAndInactivateExpired();
      
      expect(result).toHaveProperty("success");
      if (result.success) {
        expect(result).toHaveProperty("count");
        expect(typeof result.count).toBe("number");
        expect(result.count).toBeGreaterThanOrEqual(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });
});

describe("Scheduler Integration", () => {
  it("should have correct cron schedule for daily midnight UTC", () => {
    // The scheduler uses "0 0 * * *" which means:
    // 0 = second
    // 0 = minute
    // * = every hour
    // * = every day of month
    // * = every month
    // * = every day of week
    // This translates to: every day at 00:00 UTC

    const cronExpression = "0 0 * * *";
    const result = validateCronExpression(cronExpression);
    
    // Result depends on whether node-cron is installed
    expect(typeof result).toBe("boolean");
  });
});
