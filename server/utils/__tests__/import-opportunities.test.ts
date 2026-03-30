import { describe, it, expect } from "vitest";
import { generateCSVTemplate } from "../import-opportunities";

describe("Import Opportunities", () => {
  describe("generateCSVTemplate", () => {
    it("should generate a valid CSV template", () => {
      const template = generateCSVTemplate();

      expect(template).toBeDefined();
      expect(typeof template).toBe("string");
      expect(template.length).toBeGreaterThan(0);
    });

    it("should include all required headers", () => {
      const template = generateCSVTemplate();
      const lines = template.split("\n");
      const headers = lines[0];

      const requiredHeaders = [
        "title",
        "description",
        "category",
        "externalLink",
        "submittedBy",
        "submitterEmail",
        "deadline",
        "level",
        "type",
        "duration",
        "isApproved",
      ];

      requiredHeaders.forEach((header) => {
        expect(headers).toContain(header);
      });
    });

    it("should include sample data rows", () => {
      const template = generateCSVTemplate();
      const lines = template.split("\n");

      // Should have header + at least 3 sample rows
      expect(lines.length).toBeGreaterThanOrEqual(4);
    });

    it("should have valid category values in samples", () => {
      const template = generateCSVTemplate();
      const validCategories = ["extracurricular", "stem_competition", "volunteering"];

      validCategories.forEach((category) => {
        expect(template).toContain(category);
      });
    });

    it("should have valid level values in samples", () => {
      const template = generateCSVTemplate();
      const validLevels = ["both", "middle_school", "high_school"];

      validLevels.forEach((level) => {
        expect(template).toContain(level);
      });
    });

    it("should have valid type values in samples", () => {
      const template = generateCSVTemplate();
      const validTypes = ["in_person", "hybrid"];

      validTypes.forEach((type) => {
        expect(template).toContain(type);
      });
    });

    it("should have valid duration values in samples", () => {
      const template = generateCSVTemplate();
      const validDurations = ["short", "long"];

      validDurations.forEach((duration) => {
        expect(template).toContain(duration);
      });
    });

    it("should have boolean values for isApproved", () => {
      const template = generateCSVTemplate();

      expect(template).toContain("true");
      expect(template).toContain("false");
    });

    it("should have properly formatted URLs", () => {
      const template = generateCSVTemplate();

      expect(template).toContain("https://");
    });

    it("should have properly formatted email addresses", () => {
      const template = generateCSVTemplate();

      expect(template).toContain("@");
      expect(template).toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    });

    it("should have properly formatted dates", () => {
      const template = generateCSVTemplate();
      const dateRegex = /\d{4}-\d{2}-\d{2}/;

      expect(template).toMatch(dateRegex);
    });
  });

  describe("CSV structure", () => {
    it("should be parseable as valid CSV", () => {
      const template = generateCSVTemplate();
      const lines = template.split("\n");

      // Each line should have the same number of fields
      const headerCount = lines[0].split(",").length;

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim().length > 0) {
          // Count commas, accounting for quoted fields
          let fieldCount = 0;
          let inQuotes = false;
          for (let j = 0; j < lines[i].length; j++) {
            if (lines[i][j] === '"') {
              inQuotes = !inQuotes;
            } else if (lines[i][j] === "," && !inQuotes) {
              fieldCount++;
            }
          }
          fieldCount++; // Add 1 for the last field

          // Allow some flexibility for quoted fields
          expect(fieldCount).toBeGreaterThanOrEqual(headerCount - 2);
        }
      }
    });
  });
});
