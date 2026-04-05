import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  /** Hashed password for email/password authentication */
  passwordHash: text("passwordHash"),
  /** Login method: 'oauth' or 'email' */
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Email verification status */
  emailVerified: boolean("emailVerified").default(false).notNull(),
  /** Email verification token */
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  /** Email verification token expiration */
  emailVerificationTokenExpiresAt: timestamp("emailVerificationTokenExpiresAt"),
  /** Password reset token */
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  /** Password reset token expiration */
  passwordResetTokenExpiresAt: timestamp("passwordResetTokenExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Opportunities table for extracurricular activities, grants, STEM competitions, sports, volunteering, etc.
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "extracurricular",
    "grant",
    "stem_competition",
    "sports",
    "volunteering",
    "other",
  ]).notNull(),
  externalLink: varchar("externalLink", { length: 2048 }),
  submittedBy: varchar("submittedBy", { length: 255 }).notNull(),
  submitterEmail: varchar("submitterEmail", { length: 320 }).notNull(),
  deadline: timestamp("deadline"),
  isApproved: boolean("isApproved").default(false).notNull(),
  level: mysqlEnum("level", ["both", "middle_school", "high_school"]).default("both").notNull(),
  type: mysqlEnum("type", ["in_person", "online", "hybrid"]).default("in_person").notNull(),
  duration: mysqlEnum("duration", ["short", "medium", "long"]).default("long").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;

// Submissions table for tracking user submissions/applications
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  category: mysqlEnum("category", [
    "extracurricular",
    "grant",
    "stem_competition",
    "sports",
    "volunteering",
    "other",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

// User interests table for tracking which categories users are interested in
export const userInterests = mysqlTable("userInterests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", [
    "extracurricular",
    "grant",
    "stem_competition",
    "sports",
    "volunteering",
    "other",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = typeof userInterests.$inferInsert;

// Application tracking table for tracking user applications
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  status: mysqlEnum("status", ["interested", "applied", "interviewing", "accepted", "rejected"]).default("interested").notNull(),
  notes: text("notes"),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// Email notifications table for tracking sent reminder emails
export const emailNotifications = mysqlTable("emailNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  type: mysqlEnum("type", ["deadline_reminder"]).default("deadline_reminder").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

// Bookmarks table for tracking user bookmarked opportunities
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  opportunityId: int("opportunityId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
