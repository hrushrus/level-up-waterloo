import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { opportunities } from "../../drizzle/schema";
import { eq, lt, and } from "drizzle-orm";

/**
 * Admin procedures for managing opportunities
 * All procedures require admin role
 */
export const adminRouter = router({
  /**
   * Add a new opportunity
   */
  addOpportunity: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        category: z.enum([
          "extracurricular",
          "grant",
          "stem_competition",
          "sports",
          "volunteering",
          "other",
        ]),
        level: z.enum(["both", "middle_school", "high_school"]).default("both"),
        type: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
        duration: z.enum(["short", "medium", "long"]).default("long"),
        deadline: z.string().or(z.date()).optional(),
        externalLink: z.string().url("Invalid URL").optional(),
        submittedBy: z.string().min(1, "Submitted by is required"),
        submitterEmail: z.string().email("Invalid email"),
        isApproved: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const deadline =
          input.deadline && typeof input.deadline === "string"
            ? new Date(input.deadline)
            : input.deadline;

        const insertData: any = {
          title: input.title,
          description: input.description,
          category: input.category,
          level: input.level,
          type: input.type,
          duration: input.duration,
          submittedBy: input.submittedBy,
          submitterEmail: input.submitterEmail,
          isApproved: input.isApproved,
        };

        if (deadline) {
          insertData.deadline = deadline;
        }
        if (input.externalLink) {
          insertData.externalLink = input.externalLink;
        }

        const result = await db.insert(opportunities).values(insertData);

        return {
          success: true,
          message: "Opportunity added successfully",
          id: (result as any).insertId,
        };
      } catch (error) {
        throw new Error(`Failed to add opportunity: ${error}`);
      }
    }),

  /**
   * Update an existing opportunity
   */
  updateOpportunity: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        category: z
          .enum([
            "extracurricular",
            "grant",
            "stem_competition",
            "sports",
            "volunteering",
            "other",
          ])
          .optional(),
        level: z.enum(["both", "middle_school", "high_school"]).optional(),
        type: z.enum(["in_person", "online", "hybrid"]).optional(),
        duration: z.enum(["short", "medium", "long"]).optional(),
        deadline: z.string().or(z.date()).optional(),
        externalLink: z.string().url().optional(),
        submittedBy: z.string().optional(),
        submitterEmail: z.string().email().optional(),
        isApproved: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const { id, ...updates } = input;

        // Convert deadline if provided
        if (updates.deadline) {
          (updates as any).deadline =
            typeof updates.deadline === "string"
              ? new Date(updates.deadline)
              : updates.deadline;
        }

        // Build update data, filtering out undefined values
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.level !== undefined) updateData.level = updates.level;
        if (updates.type !== undefined) updateData.type = updates.type;
        if (updates.duration !== undefined) updateData.duration = updates.duration;
        if (updates.deadline !== undefined) updateData.deadline = (updates as any).deadline;
        if (updates.externalLink !== undefined) updateData.externalLink = updates.externalLink;
        if (updates.submittedBy !== undefined) updateData.submittedBy = updates.submittedBy;
        if (updates.submitterEmail !== undefined) updateData.submitterEmail = updates.submitterEmail;
        if (updates.isApproved !== undefined) updateData.isApproved = updates.isApproved;

        await db.update(opportunities).set(updateData).where(eq(opportunities.id, id));

        return {
          success: true,
          message: "Opportunity updated successfully",
        };
      } catch (error) {
        throw new Error(`Failed to update opportunity: ${error}`);
      }
    }),

  /**
   * Inactivate an opportunity (soft delete)
   */
  inactivateOpportunity: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        await db
          .update(opportunities)
          .set({ isApproved: false })
          .where(eq(opportunities.id, input.id));

        return {
          success: true,
          message: "Opportunity inactivated successfully",
        };
      } catch (error) {
        throw new Error(`Failed to inactivate opportunity: ${error}`);
      }
    }),

  /**
   * Delete an opportunity (hard delete)
   */
  deleteOpportunity: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        await db.delete(opportunities).where(eq(opportunities.id, input.id));

        return {
          success: true,
          message: "Opportunity deleted successfully",
        };
      } catch (error) {
        throw new Error(`Failed to delete opportunity: ${error}`);
      }
    }),

  /**
   * Get all opportunities (including inactive ones) for admin view
   */
  listAll: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const result = await db.select().from(opportunities).orderBy(opportunities.createdAt);
      return result;
    } catch (error) {
      console.error("Failed to list opportunities:", error);
      return [];
    }
  }),

  /**
   * Get statistics about opportunities
   */
  getStatistics: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          expired: 0,
          byCategory: {},
        };
      }

      const all = await db.select().from(opportunities);
      const active = all.filter((o) => o.isApproved);
      const inactive = all.filter((o) => !o.isApproved);
      const expired = all.filter((o) => o.deadline && new Date(o.deadline) < new Date());

      const byCategory: Record<string, number> = {};
      all.forEach((o) => {
        byCategory[o.category] = (byCategory[o.category] || 0) + 1;
      });

      return {
        total: all.length,
        active: active.length,
        inactive: inactive.length,
        expired: expired.length,
        byCategory,
      };
    } catch (error) {
      console.error("Failed to get statistics:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        expired: 0,
        byCategory: {},
      };
    }
  }),

  /**
   * Inactivate all expired opportunities
   */
  inactivateAllExpired: adminProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .update(opportunities)
        .set({ isApproved: false })
        .where(and(lt(opportunities.deadline, new Date()), eq(opportunities.isApproved, true)));

      return {
        success: true,
        message: `Inactivated expired opportunities`,
        count: (result as any).rowsAffected || 0,
      };
    } catch (error) {
      throw new Error(`Failed to inactivate expired opportunities: ${error}`);
    }
  }),
});
