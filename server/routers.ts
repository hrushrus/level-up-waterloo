import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { adminRouter } from "./routers/admin";
import { importRouter } from "./routers/import";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,

  opportunities: router({
    // Get all approved opportunities
    list: publicProcedure.query(async () => {
      return await db.getAllOpportunities();
    }),

    // Get opportunities by category
    byCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getOpportunitiesByCategory(input.category);
      }),

    // Search opportunities by keyword
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return await db.searchOpportunities(input.query);
      }),

    // Get a single opportunity by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getOpportunityById(input.id);
      }),

    // Advanced filtering
    filter: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          categories: z.array(z.string()).optional(),
          deadlineRange: z
            .object({
              min: z.number().optional(),
              max: z.number().optional(),
            })
            .optional(),
          levels: z.array(z.string()).optional(),
          types: z.array(z.string()).optional(),
          durations: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          sortBy: z.enum(["newest", "deadline", "relevance"]).optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.filterOpportunities(input);
      }),
  }),

  admin: adminRouter,
  import: importRouter,

  views: router({
    // Record page view
    record: publicProcedure
      .input(z.object({ page: z.string().default("home") }))
      .mutation(async ({ input }) => {
        return await db.recordPageView(input.page);
      }),

    // Get view count for a specific page
    get: publicProcedure
      .input(z.object({ page: z.string().default("home") }))
      .query(async ({ input }) => {
        const views = await db.getPageViewCount(input.page);
        const totalViews = await db.getPageViewCount("total");
        return { page: input.page, views, totalViews };
      }),

    // Get statistics for all pages
    stats: publicProcedure.query(async () => {
      return await db.getAllPageViewStats();
    }),
  }),

  suggestions: router({
    // Submit a community suggestion (authenticated users only)
    submit: protectedProcedure
      .input(
        z.object({
          type: z.enum(["opportunity", "source"]),
          title: z.string().min(2, "Title is required").max(255),
          organization: z.string().max(255).optional(),
          url: z.string().max(2048).optional(),
          category: z
            .enum([
              "extracurricular",
              "grant",
              "stem_competition",
              "sports",
              "volunteering",
              "experiential_learning",
              "other",
            ])
            .optional(),
          targetAge: z.string().max(100).optional(),
          description: z.string().min(5, "Description is required"),
          notes: z.string().optional(),
          submitterName: z.string().max(255).optional(),
          submitterEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user.id;
        const normalizedData: any = {
          userId,
          type: input.type,
          title: input.title.trim(),
          organization: input.organization?.trim() || null,
          url: input.url?.trim() || null,
          category: input.category || null,
          targetAge: input.targetAge?.trim() || null,
          description: input.description.trim(),
          notes: input.notes?.trim() || null,
          submitterName: input.submitterName?.trim() || ctx.user.name || null,
          submitterEmail: input.submitterEmail?.trim() || ctx.user.email || null,
          status: "pending",
        };

        const result = await db.createSuggestion(normalizedData);
        if (!result.success) {
          throw new Error(result.error || "Failed to submit suggestion");
        }

        return {
          success: true,
          id: result.id,
          message: "Thank you! Your suggestion has been received for review.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
