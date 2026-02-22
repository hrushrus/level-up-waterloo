import { eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, opportunities, Opportunity } from "../drizzle/schema";
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
