import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
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
});

export type AppRouter = typeof appRouter;
