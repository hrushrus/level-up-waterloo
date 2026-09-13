import { eq, or, like, inArray, gte, lte, desc, and, isNull, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, opportunities, Opportunity, suggestions, Suggestion, InsertSuggestion, donations, Donation, InsertDonation } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Opportunities queries
export async function getAllOpportunities(): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get opportunities: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.isApproved, true))
      .orderBy(opportunities.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get opportunities:", error);
    return [];
  }
}

export async function approveAllActiveOpportunities(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    await db
      .update(opportunities)
      .set({ isApproved: true })
      .where(or(isNull(opportunities.deadline), gt(opportunities.deadline, new Date())));
    return (await getAllOpportunities()).length;
  } catch (error) {
    console.error("[Database] Failed to approve active opportunities:", error);
    return 0;
  }
}

export async function getOpportunitiesByCategory(category: string): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get opportunities: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(opportunities)
      .where(
        or(
          eq(opportunities.category, category as any),
          eq(opportunities.isApproved, false)
        )
      )
      .orderBy(opportunities.createdAt);
    return result.filter((opp) => opp.isApproved && opp.category === category);
  } catch (error) {
    console.error("[Database] Failed to get opportunities by category:", error);
    return [];
  }
}

export async function searchOpportunities(query: string): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search opportunities: database not available");
    return [];
  }

  try {
    const searchPattern = `%${query}%`;
    const result = await db
      .select()
      .from(opportunities)
      .where(
        or(
          like(opportunities.title, searchPattern),
          like(opportunities.description, searchPattern)
        )
      )
      .orderBy(opportunities.createdAt);
    return result.filter((opp) => opp.isApproved);
  } catch (error) {
    console.error("[Database] Failed to search opportunities:", error);
    return [];
  }
}

export async function getOpportunityById(id: number): Promise<Opportunity | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get opportunity: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get opportunity:", error);
    return undefined;
  }
}

export interface FilterParams {
  search?: string;
  categories?: string[];
  deadlineRange?: { min?: number; max?: number };
  levels?: string[];
  types?: string[];
  durations?: string[];
  tags?: string[];
  sortBy?: "newest" | "deadline" | "relevance";
}

type WhereCondition = any;

export async function filterOpportunities(params: FilterParams): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot filter opportunities: database not available");
    return [];
  }

  try {
    const conditions: any[] = [eq(opportunities.isApproved, true)];

    // Search filter
    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search}%`;
      conditions.push(
        or(
          like(opportunities.title, searchPattern),
          like(opportunities.description, searchPattern)
        )
      );
    }

    // Category filter
    if (params.categories && params.categories.length > 0) {
      conditions.push(inArray(opportunities.category, params.categories as any));
    }

    // Level filter
    if (params.levels && params.levels.length > 0) {
      conditions.push(inArray(opportunities.level, params.levels as any));
    }

    // Type filter
    if (params.types && params.types.length > 0) {
      conditions.push(inArray(opportunities.type, params.types as any));
    }

    // Duration filter
    if (params.durations && params.durations.length > 0) {
      conditions.push(inArray(opportunities.duration, params.durations as any));
    }

    if (params.tags && params.tags.length > 0) {
      conditions.push(
        or(
          ...params.tags.map(
            (tag) => like(opportunities.tags as any, `%"${tag}"%`),
          ),
        ),
      );
    }

    // Deadline range filter
    if (params.deadlineRange) {
      const now = new Date();
      if (params.deadlineRange.min !== undefined) {
        const minDate = new Date(now.getTime() + params.deadlineRange.min * 24 * 60 * 60 * 1000);
        conditions.push(gte(opportunities.deadline, minDate));
      }
      if (params.deadlineRange.max !== undefined) {
        const maxDate = new Date(now.getTime() + params.deadlineRange.max * 24 * 60 * 60 * 1000);
        conditions.push(lte(opportunities.deadline, maxDate));
      }
    }

    // Build query with all conditions
    let whereCondition = conditions[0];
    if (conditions.length > 1) {
      whereCondition = and(...conditions);
    }

    // Execute query with sorting
    const result = await db
      .select()
      .from(opportunities)
      .where(whereCondition)
      .orderBy(
        params.sortBy === "deadline" ? opportunities.deadline : desc(opportunities.createdAt)
      );

    return result;
  } catch (error) {
    console.error("[Database] Failed to filter opportunities:", error);
    return [];
  }
}

/**
 * Ensure all users in database are marked as emailVerified so that
 * lack of external email service does not lock users out.
 */
export async function ensureAllUsersEmailVerified(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result: any = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.emailVerified, false));
    return result?.rowsAffected || 0;
  } catch (error) {
    console.error("[Database] Failed to verify all users:", error);
    return 0;
  }
}

let pageViewsTableInitialized = false;

/**
 * Ensure page_views table exists in MySQL
 */
export async function initPageViewsTable(): Promise<void> {
  if (pageViewsTableInitialized) return;
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS page_views (
        page VARCHAR(255) PRIMARY KEY,
        views INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    pageViewsTableInitialized = true;
  } catch (error) {
    console.error("[Database] Failed to initialize page_views table:", error);
  }
}

/**
 * Record a page view and increment total counter
 */
export async function recordPageView(
  page: string = "home"
): Promise<{ page: string; views: number; totalViews: number }> {
  const db = await getDb();
  if (!db) {
    return { page, views: 1, totalViews: 1 };
  }

  try {
    await initPageViewsTable();

    // Increment page counter
    await db.execute(sql`
      INSERT INTO page_views (page, views)
      VALUES (${page}, 1)
      ON DUPLICATE KEY UPDATE views = views + 1
    `);

    // If this is not total, also increment total site views
    if (page !== "total") {
      await db.execute(sql`
        INSERT INTO page_views (page, views)
        VALUES ('total', 1)
        ON DUPLICATE KEY UPDATE views = views + 1
      `);
    }

    const views = await getPageViewCount(page);
    const totalViews = await getPageViewCount("total");

    return {
      page,
      views,
      totalViews,
    };
  } catch (error) {
    console.error("[Database] Failed to record page view:", error);
    return { page, views: 0, totalViews: 0 };
  }
}

/**
 * Get view count for a specific page
 */
export async function getPageViewCount(page: string = "home"): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    await initPageViewsTable();
    const result: any = await db.execute(sql`
      SELECT views FROM page_views WHERE page = ${page} LIMIT 1
    `);

    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : Array.isArray(result)
        ? result
        : [];
    if (rows.length > 0 && rows[0]?.views !== undefined) {
      return Number(rows[0].views);
    }
    return 0;
  } catch (error) {
    console.error(`[Database] Failed to get view count for ${page}:`, error);
    return 0;
  }
}

/**
 * Get stats for all tracked pages
 */
export async function getAllPageViewStats(): Promise<{
  total: number;
  pages: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) return { total: 0, pages: {} };

  try {
    await initPageViewsTable();
    const result: any = await db.execute(sql`SELECT page, views FROM page_views`);
    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : Array.isArray(result)
        ? result
        : [];
    const pages: Record<string, number> = {};
    let total = 0;

    for (const row of rows) {
      if (row.page && row.views !== undefined) {
        const count = Number(row.views);
        pages[row.page] = count;
        if (row.page === "total") {
          total = count;
        }
      }
    }

    return { total, pages };
  } catch (error) {
    console.error("[Database] Failed to get all page view stats:", error);
    return { total: 0, pages: {} };
  }
}

// ---------------------------------------------------------------------------
// Community Suggestions helpers
// ---------------------------------------------------------------------------

export async function createSuggestion(
  data: InsertSuggestion,
): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const result: any = await db.insert(suggestions).values(data);
    const insertId = result[0]?.insertId ?? result.insertId;
    return { success: true, id: insertId ? Number(insertId) : undefined };
  } catch (error: any) {
    console.error("[Database] Failed to create suggestion:", error);
    return { success: false, error: error?.message || "Failed to create suggestion" };
  }
}

export async function getAllSuggestions(filter?: {
  status?: "pending" | "approved" | "rejected" | "converted";
  type?: "opportunity" | "source";
}): Promise<Suggestion[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [];
    if (filter?.status) {
      conditions.push(eq(suggestions.status, filter.status));
    }
    if (filter?.type) {
      conditions.push(eq(suggestions.type, filter.type));
    }

    const query = db.select().from(suggestions);
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(suggestions.createdAt));
    }
    return await query.orderBy(desc(suggestions.createdAt));
  } catch (error) {
    console.error("[Database] Failed to list suggestions:", error);
    return [];
  }
}

export async function getSuggestionById(id: number): Promise<Suggestion | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.id, id))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error(`[Database] Failed to get suggestion ${id}:`, error);
    return null;
  }
}

export async function updateSuggestionStatus(
  id: number,
  status: "pending" | "approved" | "rejected" | "converted",
  adminNotes?: string,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: Record<string, any> = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    await db.update(suggestions).set(updateData).where(eq(suggestions.id, id));
    return true;
  } catch (error) {
    console.error(`[Database] Failed to update suggestion status ${id}:`, error);
    return false;
  }
}

export async function convertSuggestionToOpportunity(id: number): Promise<{
  success: boolean;
  opportunityId?: number;
  error?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      return { success: false, error: "Suggestion not found" };
    }

    const newOpp: any = {
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category || "other",
      externalLink: suggestion.url || null,
      submittedBy: suggestion.organization || suggestion.submitterName || "Community Suggestion",
      submitterEmail: suggestion.submitterEmail || "community@levelupwaterloo.local",
      isApproved: true,
      level: "both",
      type: "in_person",
      duration: "long",
      tags: [],
    };

    const insertResult: any = await db.insert(opportunities).values(newOpp);
    const oppId = Number(insertResult[0]?.insertId ?? insertResult.insertId);

    await db
      .update(suggestions)
      .set({
        status: "converted",
        adminNotes: suggestion.adminNotes
          ? `${suggestion.adminNotes}\nConverted to opportunity #${oppId}`
          : `Converted to opportunity #${oppId}`,
      })
      .where(eq(suggestions.id, id));

    return { success: true, opportunityId: oppId };
  } catch (error: any) {
    console.error(`[Database] Failed to convert suggestion ${id}:`, error);
    return { success: false, error: error?.message || "Conversion failed" };
  }
}

export async function getSuggestionStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  converted: number;
  opportunities: number;
  sources: number;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, pending: 0, approved: 0, rejected: 0, converted: 0, opportunities: 0, sources: 0 };
  }

  try {
    const all = await db.select().from(suggestions);
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "pending").length,
      approved: all.filter((s) => s.status === "approved").length,
      rejected: all.filter((s) => s.status === "rejected").length,
      converted: all.filter((s) => s.status === "converted").length,
      opportunities: all.filter((s) => s.type === "opportunity").length,
      sources: all.filter((s) => s.type === "source").length,
    };
  } catch (error) {
    console.error("[Database] Failed to get suggestion stats:", error);
    return { total: 0, pending: 0, approved: 0, rejected: 0, converted: 0, opportunities: 0, sources: 0 };
  }
}

// ---------------------------------------------------------------------------
// Donation & Community Support helpers
// ---------------------------------------------------------------------------

export async function createDonation(
  data: InsertDonation,
): Promise<{ success: boolean; id?: number; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const result: any = await db.insert(donations).values(data);
    const insertId = result[0]?.insertId ?? result.insertId;
    return { success: true, id: insertId ? Number(insertId) : undefined };
  } catch (error: any) {
    console.error("[Database] Failed to create donation record:", error);
    return { success: false, error: error?.message || "Failed to record contribution" };
  }
}

export async function getDonationStats(): Promise<{
  totalRaisedCents: number;
  donorCount: number;
  goalCents: number;
  supporters: Array<{
    id: number;
    displayName: string;
    amountInCents: number;
    currency: string;
    tier: string;
    message: string | null;
    createdAt: Date;
  }>;
}> {
  const db = await getDb();
  const goalCents = 50000; // $500.00 CAD annual infrastructure goal
  if (!db) {
    return { totalRaisedCents: 0, donorCount: 0, goalCents, supporters: [] };
  }

  try {
    const all = await db
      .select()
      .from(donations)
      .where(or(eq(donations.status, "completed"), eq(donations.status, "pledged")))
      .orderBy(desc(donations.createdAt));

    const totalRaisedCents = all
      .filter((d) => d.status === "completed")
      .reduce((sum, d) => sum + d.amountInCents, 0);

    const donorCount = all.length;

    const supporters = all
      .filter((d) => d.showOnWall)
      .slice(0, 50)
      .map((d) => ({
        id: d.id,
        displayName: d.isAnonymous ? "Anonymous Community Member" : d.donorName,
        amountInCents: d.amountInCents,
        currency: d.currency,
        tier: d.tier,
        message: d.message,
        createdAt: d.createdAt,
      }));

    return {
      totalRaisedCents,
      donorCount,
      goalCents,
      supporters,
    };
  } catch (error) {
    console.error("[Database] Failed to get donation stats:", error);
    return { totalRaisedCents: 0, donorCount: 0, goalCents, supporters: [] };
  }
}

export async function getAllDonations(filter?: {
  status?: "completed" | "pledged" | "refunded";
}): Promise<Donation[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = db.select().from(donations);
    if (filter?.status) {
      return await query.where(eq(donations.status, filter.status)).orderBy(desc(donations.createdAt));
    }
    return await query.orderBy(desc(donations.createdAt));
  } catch (error) {
    console.error("[Database] Failed to list donations:", error);
    return [];
  }
}

export async function updateDonationStatus(
  id: number,
  status: "completed" | "pledged" | "refunded",
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(donations).set({ status }).where(eq(donations.id, id));
    return true;
  } catch (error) {
    console.error(`[Database] Failed to update donation status ${id}:`, error);
    return false;
  }
}

export async function toggleDonationWall(id: number, showOnWall: boolean): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(donations).set({ showOnWall }).where(eq(donations.id, id));
    return true;
  } catch (error) {
    console.error(`[Database] Failed to toggle donation wall visibility for ${id}:`, error);
    return false;
  }
}



