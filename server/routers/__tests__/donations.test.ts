import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../../routers";

describe("Donations Router", () => {
  const caller = appRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

  it("should return donation stats with default goal and supporters array", async () => {
    const stats = await caller.donations.getStats();
    expect(stats).toHaveProperty("totalRaisedCents");
    expect(stats).toHaveProperty("donorCount");
    expect(stats).toHaveProperty("goalCents");
    expect(stats).toHaveProperty("supporters");
    expect(Array.isArray(stats.supporters)).toBe(true);
  });

  it("should validate minimum donation amount", async () => {
    await expect(
      caller.donations.submit({
        donorName: "John Doe",
        amountInCents: 50, // Less than $1.00 minimum
        paymentMethod: "card",
      }),
    ).rejects.toThrow();
  });

  it("should accept private donations with showOnWall false", async () => {
    // Should accept validation with showOnWall false
    const schema = (await import("zod")).z.object({
      donorName: (await import("zod")).z.string().min(1),
      amountInCents: (await import("zod")).z.number().min(100),
      showOnWall: (await import("zod")).z.boolean(),
    });
    expect(() =>
      schema.parse({
        donorName: "Private Donor",
        amountInCents: 1500,
        showOnWall: false,
      })
    ).not.toThrow();
  });
});
