import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db";
import * as db from "../server/db";
import { opportunities } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Opportunities API", () => {
  let database: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    database = await getDb();
    if (!database) {
      console.warn("Database not available for testing");
    }
  });

  describe("getAllOpportunities", () => {
    it("should return all approved opportunities", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const allOpps = await db.getAllOpportunities();
      expect(Array.isArray(allOpps)).toBe(true);
      expect(allOpps.length).toBeGreaterThan(0);

      // All returned opportunities should be approved
      allOpps.forEach((opp) => {
        expect(opp.isApproved).toBe(true);
      });
    });

    it("should return opportunities with all required fields", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const allOpps = await db.getAllOpportunities();
      expect(allOpps.length).toBeGreaterThan(0);

      allOpps.forEach((opp) => {
        expect(opp.id).toBeDefined();
        expect(opp.title).toBeDefined();
        expect(opp.description).toBeDefined();
        expect(opp.category).toBeDefined();
        expect(opp.level).toBeDefined();
        expect(opp.type).toBeDefined();
        expect(opp.duration).toBeDefined();
      });
    });
  });

  describe("getOpportunitiesByCategory", () => {
    it("should return only volunteering opportunities when filtering by volunteering", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const volunteeringOpps = await db.getOpportunitiesByCategory("volunteering");
      expect(Array.isArray(volunteeringOpps)).toBe(true);
      expect(volunteeringOpps.length).toBeGreaterThan(0);

      // All returned opportunities should be in volunteering category
      volunteeringOpps.forEach((opp) => {
        expect(opp.category).toBe("volunteering");
        expect(opp.isApproved).toBe(true);
      });
    });

    it("should return opportunities for other categories", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const categories = ["extracurricular", "grant", "stem_competition", "sports", "other"];

      for (const category of categories) {
        const opps = await db.getOpportunitiesByCategory(category);
        // Some categories may be empty, which is fine
        opps.forEach((opp) => {
          expect(opp.category).toBe(category);
          expect(opp.isApproved).toBe(true);
        });
      }
    });
  });

  describe("searchOpportunities", () => {
    it("should find opportunities by title keyword", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const results = await db.searchOpportunities("Waterloo");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // All results should contain "Waterloo" in title or description
      results.forEach((opp) => {
        const titleMatch = opp.title.toLowerCase().includes("waterloo");
        const descMatch = opp.description.toLowerCase().includes("waterloo");
        expect(titleMatch || descMatch).toBe(true);
        expect(opp.isApproved).toBe(true);
      });
    });

    it("should find opportunities by description keyword", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const results = await db.searchOpportunities("volunteer");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // All results should contain "volunteer" in title or description
      results.forEach((opp) => {
        const titleMatch = opp.title.toLowerCase().includes("volunteer");
        const descMatch = opp.description.toLowerCase().includes("volunteer");
        expect(titleMatch || descMatch).toBe(true);
        expect(opp.isApproved).toBe(true);
      });
    });

    it("should return empty array for non-matching search", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const results = await db.searchOpportunities("xyznonexistent");
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it("should be case-insensitive", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const resultsLower = await db.searchOpportunities("tutoring");
      const resultsUpper = await db.searchOpportunities("TUTORING");
      const resultsMixed = await db.searchOpportunities("TuToRiNg");

      expect(resultsLower.length).toBe(resultsUpper.length);
      expect(resultsLower.length).toBe(resultsMixed.length);
    });
  });

  describe("getOpportunityById", () => {
    it("should return a specific opportunity by ID", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      // Get first opportunity
      const allOpps = await db.getAllOpportunities();
      expect(allOpps.length).toBeGreaterThan(0);

      const firstOpp = allOpps[0];
      const retrieved = await db.getOpportunityById(firstOpp.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstOpp.id);
      expect(retrieved?.title).toBe(firstOpp.title);
    });

    it("should return undefined for non-existent ID", async () => {
      if (!database) {
        console.warn("Skipping test: database not available");
        return;
      }

      const result = await db.getOpportunityById(99999);
      expect(result).toBeUndefined();
    });
  });
});
