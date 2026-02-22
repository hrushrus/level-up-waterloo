import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import { opportunities } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Volunteering Opportunities", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      console.warn("Database not available for testing");
    }
  });

  it("should have seeded 12 volunteering opportunities", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const volunteeringOpps = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, "volunteering"));

    expect(volunteeringOpps.length).toBe(12);
  });

  it("should have all volunteering opportunities with required fields", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const volunteeringOpps = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, "volunteering"));

    volunteeringOpps.forEach((opp) => {
      expect(opp.title).toBeDefined();
      expect(opp.title).not.toBe("");
      expect(opp.description).toBeDefined();
      expect(opp.description).not.toBe("");
      expect(opp.category).toBe("volunteering");
      expect(opp.externalLink).toBeDefined();
      expect(opp.submittedBy).toBe("Admin");
      expect(opp.submitterEmail).toBe("admin@levelup.ca");
      expect(opp.isApproved).toBe(true);
      expect(["both", "middle_school", "high_school"]).toContain(opp.level);
      expect(["in_person", "online", "hybrid"]).toContain(opp.type);
      expect(["short", "medium", "long"]).toContain(opp.duration);
      expect(opp.deadline).toBeDefined();
    });
  });

  it("should include specific volunteering opportunities", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const volunteeringOpps = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, "volunteering"));

    const titles = volunteeringOpps.map((opp) => opp.title);

    expect(titles).toContain("Waterloo Food Bank - Youth Volunteer Program");
    expect(titles).toContain("Waterloo Public Library - Teen Volunteer");
    expect(titles).toContain("Kitchener-Waterloo Humane Society - Animal Care Volunteer");
    expect(titles).toContain("Waterloo Region Habitat for Humanity - Youth Build");
    expect(titles).toContain("Waterloo Community Tutoring - Student Tutor");
    expect(titles).toContain("Waterloo Region Youth Mentorship Program");
    expect(titles).toContain("Waterloo Environmental Action - Trail Maintenance");
    expect(titles).toContain("Waterloo Community Health Centre - Volunteer");
    expect(titles).toContain("Waterloo Seniors' Support Program - Teen Volunteer");
    expect(titles).toContain("Waterloo Youth Crisis Line - Peer Support Volunteer");
    expect(titles).toContain("Waterloo Community Garden - Garden Volunteer");
    expect(titles).toContain("Waterloo Sports for All - Volunteer Coach");
  });

  it("should have correct level assignments for opportunities", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const volunteeringOpps = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, "volunteering"));

    // Check that high school level opportunities are appropriate
    const highSchoolOpps = volunteeringOpps.filter((opp) => opp.level === "high_school");
    expect(highSchoolOpps.length).toBeGreaterThan(0);

    // Check that both level opportunities exist
    const bothLevelOpps = volunteeringOpps.filter((opp) => opp.level === "both");
    expect(bothLevelOpps.length).toBeGreaterThan(0);
  });

  it("should have correct type assignments for opportunities", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const volunteeringOpps = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, "volunteering"));

    // Check that in-person opportunities exist
    const inPersonOpps = volunteeringOpps.filter((opp) => opp.type === "in_person");
    expect(inPersonOpps.length).toBeGreaterThan(0);

    // Check that hybrid opportunities exist
    const hybridOpps = volunteeringOpps.filter((opp) => opp.type === "hybrid");
    expect(hybridOpps.length).toBeGreaterThan(0);

    // Check that online opportunities exist
    const onlineOpps = volunteeringOpps.filter((opp) => opp.type === "online");
    expect(onlineOpps.length).toBeGreaterThan(0);
  });
});
