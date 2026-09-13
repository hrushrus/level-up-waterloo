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
});
