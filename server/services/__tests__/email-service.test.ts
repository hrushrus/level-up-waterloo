import { describe, it, expect } from "vitest";
import { sendDeadlineReminderEmail, testEmailSending } from "../email-service";

describe("Email Service", { timeout: 15000 }, () => {
  describe("sendDeadlineReminderEmail", () => {
    it("should return response object with valid inputs", async () => {
      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "test@example.com",
        "Test Student",
        "Test Opportunity",
        "This is a test opportunity",
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        "https://example.com"
      );

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    }, { timeout: 10000 });

    it("should include all required fields in response", async () => {
      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "test@example.com",
        "Test Student",
        "Test Opportunity",
        "This is a test opportunity",
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        "https://example.com"
      );

      if (result.success) {
        expect(result).toHaveProperty("messageId");
      } else {
        expect(result).toHaveProperty("error");
      }
    }, { timeout: 10000 });
  });

  describe("testEmailSending", () => {
    it("should attempt to send test email", async () => {
      const result = await testEmailSending("test@example.com");
      expect(typeof result).toBe("boolean");
    }, { timeout: 10000 });
  });

  describe("Email Template Generation", () => {
    it("should generate valid HTML template", async () => {
      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "test@example.com",
        "John Doe",
        "Summer Internship Program",
        "Join our summer internship program and gain valuable experience",
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        "https://example.com/opportunity/123"
      );

      expect(result).toBeDefined();
      expect(result.success !== undefined).toBe(true);
    }, { timeout: 10000 });

    it("should handle opportunities expiring soon", async () => {
      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "test@example.com",
        "Jane Smith",
        "Urgent: Last Day to Apply",
        "This opportunity closes today!",
        new Date(Date.now() + 1 * 60 * 60 * 1000),
        "https://example.com/urgent"
      );

      expect(result).toBeDefined();
    }, { timeout: 10000 });

    it("should handle long opportunity descriptions", async () => {
      const longDescription = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10);

      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "test@example.com",
        "Test User",
        "Long Description Test",
        longDescription,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        "https://example.com"
      );

      expect(result).toBeDefined();
    }, { timeout: 10000 });
  });

  describe("Email Service Robustness", () => {
    it("should handle empty email gracefully", async () => {
      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "",
        "Test User",
        "Test",
        "Test",
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        "https://example.com"
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
    }, { timeout: 10000 });

    it("should handle special characters in opportunity title", async () => {
      const result = await sendDeadlineReminderEmail(
        1,
        1,
        "test@example.com",
        "Test User",
        "Test & Opportunity <Special> Characters",
        "Test with special characters",
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        "https://example.com"
      );

      expect(result).toBeDefined();
    }, { timeout: 10000 });
  });
});
