import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { importFromCSV, importFromArray, generateCSVTemplate, exportToCSV } from "../utils/import-opportunities";
import type { OpportunityImportRow } from "../utils/import-opportunities";

/**
 * Admin router for importing opportunities
 */

export const importRouter = router({
  /**
   * Import opportunities from CSV content
   */
  importCSV: adminProcedure
    .input(
      z.object({
        csvContent: z.string().min(1, "CSV content cannot be empty"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await importFromCSV(input.csvContent);
      return result;
    }),

  /**
   * Import opportunities from JSON array
   */
  importJSON: adminProcedure
    .input(
      z.object({
        opportunities: z.array(
          z.object({
            title: z.string(),
            description: z.string(),
            category: z.enum(["extracurricular", "grant", "stem_competition", "sports", "volunteering", "other"]),
            externalLink: z.string().optional(),
            submittedBy: z.string(),
            submitterEmail: z.string().email(),
            deadline: z.string().optional(),
            level: z.enum(["both", "middle_school", "high_school"]).optional(),
            type: z.enum(["in_person", "online", "hybrid"]).optional(),
            duration: z.enum(["short", "medium", "long"]).optional(),
            isApproved: z.boolean().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const result = await importFromArray(input.opportunities as OpportunityImportRow[]);
      return result;
    }),

  /**
   * Get CSV template for bulk import
   */
  getCSVTemplate: adminProcedure.query(async () => {
    const template = generateCSVTemplate();
    return {
      success: true,
      template,
      message: "CSV template generated successfully",
    };
  }),

  /**
   * Export all opportunities to CSV
   */
  exportCSV: adminProcedure.query(async () => {
    try {
      const csv = await exportToCSV();
      return {
        success: true,
        csv,
        message: "Opportunities exported successfully",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        csv: "",
        message: `Export failed: ${errorMessage}`,
      };
    }
  }),
});
