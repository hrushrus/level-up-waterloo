#!/usr/bin/env tsx
/**
 * Admin CLI Tool for LevelUp Waterloo Opportunity Management
 * 
 * Usage:
 *   tsx scripts/admin-cli.ts add <title> <category> <deadline>
 *   tsx scripts/admin-cli.ts update <id> <field> <value>
 *   tsx scripts/admin-cli.ts inactivate <id>
 *   tsx scripts/admin-cli.ts delete <id>
 *   tsx scripts/admin-cli.ts stats
 *   tsx scripts/admin-cli.ts expire-all
 *   tsx scripts/admin-cli.ts list [category]
 */

import { opportunities } from "../drizzle/schema";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, lt } from "drizzle-orm";

const args = process.argv.slice(2);
const command = args[0];

// Initialize database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "levelup_waterloo",
});

const db = drizzle(pool);

async function addOpportunity() {
  const [title, category, deadline] = args.slice(1);

  if (!title || !category || !deadline) {
    console.error("Usage: admin-cli add <title> <category> <deadline>");
    process.exit(1);
  }

  try {
    await db.insert(opportunities).values({
      title,
      description: "To be filled",
      category: category as any,
      level: "both",
      type: "in_person",
      duration: "medium",
      deadline: new Date(deadline),
      externalLink: "https://example.com",
      submittedBy: "Admin",
      submitterEmail: "admin@levelup.local",
      isApproved: false,
    });

    console.log(`✅ Added opportunity: ${title}`);
  } catch (error) {
    console.error("❌ Failed to add opportunity:", error);
  }
}

async function updateOpportunity() {
  const [id, field, value] = args.slice(1);

  if (!id || !field || !value) {
    console.error("Usage: admin-cli update <id> <field> <value>");
    process.exit(1);
  }

  try {
    const updates: any = {};
    
    // Map field names
    if (field === "deadline") {
      updates.deadline = new Date(value);
    } else if (field === "link") {
      updates.externalLink = value;
    } else if (field === "approved") {
      updates.isApproved = value === "true";
    } else if (field === "submittedBy") {
      updates.submittedBy = value;
    } else if (field === "submitterEmail") {
      updates.submitterEmail = value;
    } else {
      updates[field] = value;
    }

    await db.update(opportunities).set(updates).where(eq(opportunities.id, parseInt(id)));

    console.log(`✅ Updated opportunity ${id}: ${field} = ${value}`);
  } catch (error) {
    console.error("❌ Failed to update opportunity:", error);
  }
}

async function inactivateOpportunity() {
  const [id] = args.slice(1);

  if (!id) {
    console.error("Usage: admin-cli inactivate <id>");
    process.exit(1);
  }

  try {
    await db
      .update(opportunities)
      .set({ isApproved: false })
      .where(eq(opportunities.id, parseInt(id)));

    console.log(`✅ Inactivated opportunity ${id}`);
  } catch (error) {
    console.error("❌ Failed to inactivate opportunity:", error);
  }
}

async function deleteOpportunity() {
  const [id] = args.slice(1);

  if (!id) {
    console.error("Usage: admin-cli delete <id>");
    process.exit(1);
  }

  try {
    await db.delete(opportunities).where(eq(opportunities.id, parseInt(id)));

    console.log(`✅ Deleted opportunity ${id}`);
  } catch (error) {
    console.error("❌ Failed to delete opportunity:", error);
  }
}

async function getStatistics() {
  try {
    const all = await db.select().from(opportunities);
    const active = all.filter((o: any) => o.isApproved);
    const inactive = all.filter((o: any) => !o.isApproved);
    const expired = all.filter((o: any) => o.deadline && new Date(o.deadline) < new Date());

    const byCategory: Record<string, number> = {};
    all.forEach((o: any) => {
      byCategory[o.category] = (byCategory[o.category] || 0) + 1;
    });

    console.log("\n📊 Opportunity Statistics");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total:    ${all.length}`);
    console.log(`Active:   ${active.length}`);
    console.log(`Inactive: ${inactive.length}`);
    console.log(`Expired:  ${expired.length}`);
    console.log("\nBy Category:");
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Failed to get statistics:", error);
  }
}

async function inactivateAllExpired() {
  try {
    const result = await db
      .update(opportunities)
      .set({ isApproved: false })
      .where(lt(opportunities.deadline, new Date()));

    console.log(`✅ Inactivated expired opportunities`);
  } catch (error) {
    console.error("❌ Failed to inactivate expired opportunities:", error);
  }
}

async function listOpportunities() {
  const [category] = args.slice(1);

  try {
    let allOpps = await db.select().from(opportunities);

    if (category) {
      allOpps = allOpps.filter((o: any) => o.category === category);
    }

    console.log(`\n📋 Opportunities (${allOpps.length} total)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    allOpps.forEach((opp: any) => {
      const status = opp.isApproved ? "✅ Active" : "❌ Inactive";
      const isExpired = opp.deadline && new Date(opp.deadline) < new Date() ? " (EXPIRED)" : "";
      console.log(`\n[${opp.id}] ${opp.title} ${status}${isExpired}`);
      console.log(`    Submitted by: ${opp.submittedBy}`);
      console.log(`    Category: ${opp.category} | Level: ${opp.level}`);
      console.log(`    Deadline: ${opp.deadline || "N/A"}`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Failed to list opportunities:", error);
  }
}

async function main() {
  switch (command) {
    case "add":
      await addOpportunity();
      break;
    case "update":
      await updateOpportunity();
      break;
    case "inactivate":
      await inactivateOpportunity();
      break;
    case "delete":
      await deleteOpportunity();
      break;
    case "stats":
      await getStatistics();
      break;
    case "expire-all":
      await inactivateAllExpired();
      break;
    case "list":
      await listOpportunities();
      break;
    default:
      console.log(`
Admin CLI Tool for LevelUp Waterloo

Usage:
  tsx scripts/admin-cli.ts add <title> <category> <deadline>
  tsx scripts/admin-cli.ts update <id> <field> <value>
  tsx scripts/admin-cli.ts inactivate <id>
  tsx scripts/admin-cli.ts delete <id>
  tsx scripts/admin-cli.ts stats
  tsx scripts/admin-cli.ts expire-all
  tsx scripts/admin-cli.ts list [category]

Examples:
  tsx scripts/admin-cli.ts add "Science Olympiad" stem_competition "2026-04-15"
  tsx scripts/admin-cli.ts update 5 deadline "2026-05-01"
  tsx scripts/admin-cli.ts inactivate 5
  tsx scripts/admin-cli.ts stats
  tsx scripts/admin-cli.ts list volunteering
      `);
  }

  process.exit(0);
}

main().catch(console.error);
