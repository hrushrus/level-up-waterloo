import { and, eq, sql } from "drizzle-orm";
import { opportunities, type InsertOpportunity } from "../../drizzle/schema";
import { getDb, initPageViewsTable, approveAllActiveOpportunities } from "../db";
import type { OpportunityTag } from "../../shared/opportunity-tags";

const activeWaterlooGuide =
  "https://www.waterloo.ca/media/v3uac3f2/activewaterloo-summer-2026-guide.pdf";
const kitchenerSummerPrograms =
  "https://www.kitchener.ca/recreation-and-sports/children-and-youth-programs/summer-programs/";

export const VERIFIED_OPPORTUNITIES: InsertOpportunity[] = [
  {
    title: "City of Waterloo Snow Removal & Home Maintenance Brokered Worker (Ages 14+)",
    description:
      "The City of Waterloo Home Support Services Brokered Worker program connects local residents and seniors with youth and community members for seasonal outdoor home maintenance. In the winter snow season (November through March), brokered workers shovel and clear driveways within 24 hours of snowfall. Brokered workers are self-employed, choose how many clients to support, and are paid directly by homeowners at $24.00/hour ($27.00/hour when supplying motorized equipment like a snow blower). Open to applicants ages 14 and older.",
    category: "experiential_learning",
    externalLink: "https://www.waterloo.ca/brokered-worker",
    submittedBy: "City of Waterloo Home Support Services",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2027-03-31T23:59:59-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "long",
  },
  {
    title: "CEMC Online Summer Problem Solving Course",
    description:
      "Online, asynchronous mathematics problem-solving course for high-school students who have completed at least Grade 11 university-stream mathematics. Runs June 29 to August 14, 2026; registration costs $250.",
    category: "extracurricular",
    externalLink: "https://cemc.uwaterloo.ca/workshops/online-summer-courses",
    submittedBy: "University of Waterloo CEMC",
    submitterEmail: "cemc@uwaterloo.ca",
    deadline: new Date("2026-06-15T23:59:59-04:00"),
    isApproved: true,
    level: "high_school",
    type: "online",
    duration: "long",
  },
  {
    title: "City of Kitchener Summer Camps 2026",
    description:
      "Weekly summer day camps with neighbourhood, specialty, swimming and inclusion options. The official listing currently identifies camps with spaces available.",
    category: "extracurricular",
    externalLink: kitchenerSummerPrograms,
    submittedBy: "City of Kitchener",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-08-28T23:59:59-04:00"),
    isApproved: true,
    level: "middle_school",
    type: "in_person",
    duration: "medium",
  },
  {
    title: "Kitchener Youth Drop-In Summer 2026",
    description:
      "Free evening games, sports, arts, crafts and social activities for ages 12-17 at Kitchener community centres. Runs Monday-Friday, July 6 to August 28, from 6:30 to 9:30 p.m.; no preregistration required.",
    category: "extracurricular",
    externalLink: `${kitchenerSummerPrograms}#youth-drop-in-ydi`,
    submittedBy: "City of Kitchener",
    submitterEmail: "youth@kitchener.ca",
    deadline: new Date("2026-08-28T21:30:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "long",
  },
  {
    title: "Kitchener Youth Crew",
    description:
      "Youth ages 12-17 help at City of Kitchener Youth Drop-In programs, share their skills and earn secondary-school community volunteer hours during the July 6 to August 28 summer season.",
    category: "volunteering",
    externalLink: `${kitchenerSummerPrograms}#youth-drop-in-ydi`,
    submittedBy: "City of Kitchener",
    submitterEmail: "youth@kitchener.ca",
    deadline: new Date("2026-08-28T21:30:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "long",
  },
  {
    title: "Kitchener Play in the Park 2026",
    description:
      "Free outdoor games, crafts and activities for ages 4-12 at six Kitchener parks. Drop in Monday-Friday from 10 a.m. to noon, June 29 to August 28; no registration required.",
    category: "extracurricular",
    externalLink: `${kitchenerSummerPrograms}#play-in-the-park`,
    submittedBy: "City of Kitchener",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-08-28T12:00:00-04:00"),
    isApproved: true,
    level: "middle_school",
    type: "in_person",
    duration: "long",
  },
  {
    title: "Kitchener Summer Splash Pass 2026",
    description:
      "Recreational swimming pass valid at all City of Kitchener indoor and outdoor pools from June 1 through September 7, 2026. The youth price for participants up to age 18 is $39.11.",
    category: "sports",
    externalLink:
      "https://www.kitchener.ca/news/posts/splash-into-summer-with-a-kitchener-summer-splash-pass/",
    submittedBy: "City of Kitchener",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-09-07T23:59:59-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "long",
  },
  {
    title: "Waterloo Youth Leadership Development Program 2026",
    description:
      "Leadership training and mentored summer-camp placement for youth ages 13-16. Participants develop teamwork, communication, activity leadership and camp-counsellor skills.",
    category: "extracurricular",
    externalLink:
      "https://www.waterloo.ca/recreation-and-sports/camps-and-youth-leadership-programs/register-for-youth-leadership-programs/",
    submittedBy: "City of Waterloo",
    submitterEmail: "camp@waterloo.ca",
    deadline: new Date("2026-06-18T23:59:59-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "long",
  },
  {
    title: "Waterloo Youth Acrylic Landscapes",
    description:
      "Hands-on acrylic landscape drawing and painting course for ages 13-17. Six Saturday sessions at WMRC from July 18 to August 22, 1-3 p.m.; program code 99542, fee $105.",
    category: "extracurricular",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-07-18T13:00:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "medium",
  },
  {
    title: "Waterloo Youth Drawing Fundamentals",
    description:
      "Drawing course for ages 13-17 using pencil, charcoal, ink and pastel. Eight Tuesday sessions at WMRC from July 7 to August 25, 5:15-6:45 p.m.; program code 99362, fee $140.",
    category: "extracurricular",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-07-07T17:15:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "medium",
  },
  {
    title: "Waterloo Youth Explorations in Multimedia",
    description:
      "Art course for ages 13-17 exploring drawing, watercolour, acrylic painting and collage. Eight Tuesday sessions at WMRC from July 7 to August 25, 7:15-8:45 p.m.; program code 99364, fee $140.",
    category: "extracurricular",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-07-07T19:15:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "medium",
  },
  {
    title: "Waterloo Youth Sewing: Beginner",
    description:
      "One-week hands-on sewing program for ages 13-17 covering machine basics, fabric handling, patterns and assembly. Runs August 17-21 at WMRC, 10 a.m.-1 p.m.; program code 99365, fee $180.",
    category: "extracurricular",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-08-17T10:00:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "short",
  },
  {
    title: "Waterloo Youth Watercolour Comics",
    description:
      "Watercolour painting and comic storytelling for ages 13-17. Six Saturday sessions at WMRC from July 18 to August 22, 10 a.m.-noon; program code 99541, fee $105.",
    category: "extracurricular",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-07-18T10:00:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "medium",
  },
  {
    title: "Waterloo Youth Dungeons and Dragons",
    description:
      "Guided Dungeons and Dragons program for ages 13-17 emphasizing creative problem solving, teamwork and storytelling. Eight Thursday sessions at WMRC from July 9 to August 27, 7:15-8:45 p.m.; program code 99535, fee $80.",
    category: "extracurricular",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-07-09T19:15:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "medium",
  },
  {
    title: "Waterloo CAN-BIKE Level 1",
    description:
      "Fundamental cycling skills course for ages 9-14, with on-bike and off-bike instruction at WMRC. July 8 session runs 6-8 p.m.; program code 100778, fee $55.",
    category: "sports",
    externalLink: activeWaterlooGuide,
    submittedBy: "City of Waterloo",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-07-08T18:00:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "short",
  },
  {
    title: "Open Streets Waterloo 2026",
    description:
      "Free, all-ages celebration with music, art, games, dance and a community art market in Waterloo Public Square and Willis Way on June 13 from noon to 6 p.m.",
    category: "extracurricular",
    externalLink: "https://www.waterloo.ca/openstreets",
    submittedBy: "City of Waterloo",
    submitterEmail: "festivals@waterloo.ca",
    deadline: new Date("2026-06-13T18:00:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "short",
  },
  {
    title: "KPL Youth Drop-In at Pioneer Park",
    description:
      "Youth drop-in for school-age participants and teens at Pioneer Park Library on June 8, 2026, from 3 to 4:30 p.m.",
    category: "extracurricular",
    externalLink: "https://www.kpl.org/programs-and-events",
    submittedBy: "Kitchener Public Library",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-06-08T16:30:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "short",
  },
  {
    title: "KPL Teen Drop-In at Country Hills",
    description:
      "Teen social drop-in at Country Hills Library on June 9, 2026, from 3 to 4:15 p.m.",
    category: "extracurricular",
    externalLink: "https://www.kpl.org/programs-and-events",
    submittedBy: "Kitchener Public Library",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-06-09T16:15:00-04:00"),
    isApproved: true,
    level: "both",
    type: "in_person",
    duration: "short",
  },
  {
    title: "KPL Exploring Civic Career Pathways for Youth",
    description:
      "Career exploration program for teens and adults at Central Library on June 9, 2026, from 7 to 8:30 p.m., focused on civic career pathways.",
    category: "extracurricular",
    externalLink: "https://www.kpl.org/programs-and-events",
    submittedBy: "Kitchener Public Library",
    submitterEmail: "automation@levelupwaterloo.local",
    deadline: new Date("2026-06-09T20:30:00-04:00"),
    isApproved: true,
    level: "high_school",
    type: "in_person",
    duration: "short",
  },
];

export function inferOpportunityTags(opportunity: InsertOpportunity): OpportunityTag[] {
  const text = `${opportunity.title} ${opportunity.description}`.toLowerCase();
  const tags = new Set<OpportunityTag>();

  if (
    opportunity.category === "stem_competition" ||
    /\b(math|mathematics|coding|computer|science|engineering|physics|technology)\b/.test(text)
  ) {
    tags.add("stem");
  }
  if (/\b(art|acrylic|drawing|watercolour|sewing|music|dance|craft|storytelling|comic)\b/.test(text)) {
    tags.add("arts");
  }
  if (/\b(entrepreneur|startup|business|pitch)\b/.test(text)) tags.add("entrepreneurship");
  if (/\b(leadership|leader|counsellor)\b/.test(text)) tags.add("leadership");
  if (opportunity.category === "volunteering" || /\b(volunteer|community hours)\b/.test(text)) {
    tags.add("volunteering");
  }
  if (opportunity.category === "sports" || /\b(swim|cycling|sports|games)\b/.test(text)) {
    tags.add("sports");
  }
  if (/\b(career|employment|workplace|apprentice|job|jobs|worker)\b/.test(text)) tags.add("career");
  if (/\b(mentor|mentorship)\b/.test(text)) tags.add("mentorship");
  if (/\b(environment|environmental|conservation|climate|nature|sustainability)\b/.test(text)) {
    tags.add("environment");
  }
  if (/\b(competition|contest|challenge|compete)\b/.test(text)) tags.add("competition");
  if (/\b(camp|camps)\b/.test(text)) tags.add("camp");
  if (/\b(course|class|workshop|training|sessions)\b/.test(text)) tags.add("workshop");
  if (/\bfree\b/.test(text)) tags.add("free");
  if (/\b(paid|salary|wage|stipend|compensation|employment|\$\d+)\b/.test(text)) {
    tags.add("paid");
  }
  if (/\b(summer|june|july|august)\b/.test(text)) tags.add("summer");

  return [...tags];
}

/**
 * Ensures that the database schema is aligned with current definitions:
 * 1. category enum on opportunities, submissions, userInterests includes 'experiential_learning'
 * 2. suggestions table exists
 * 3. page_views table exists
 */
export async function ensureDatabaseSchema(): Promise<{
  success: boolean;
  enumsUpdated: boolean;
  suggestionsCreated: boolean;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, enumsUpdated: false, suggestionsCreated: false, errors: ["No database connection"] };
  }

  const errors: string[] = [];
  let enumsUpdated = false;
  let suggestionsCreated = false;

  // 1. Update category enums
  try {
    await db.execute(sql`
      ALTER TABLE \`opportunities\` MODIFY COLUMN \`category\` enum('extracurricular','grant','stem_competition','sports','volunteering','experiential_learning','other') NOT NULL
    `);
    enumsUpdated = true;
  } catch (err: any) {
    // If already modified or non-fatal, record it
    errors.push(`opportunities enum: ${err?.message}`);
  }

  try {
    await db.execute(sql`
      ALTER TABLE \`submissions\` MODIFY COLUMN \`category\` enum('extracurricular','grant','stem_competition','sports','volunteering','experiential_learning','other') NOT NULL
    `);
  } catch (err: any) {
    errors.push(`submissions enum: ${err?.message}`);
  }

  try {
    await db.execute(sql`
      ALTER TABLE \`userInterests\` MODIFY COLUMN \`category\` enum('extracurricular','grant','stem_competition','sports','volunteering','experiential_learning','other') NOT NULL
    `);
  } catch (err: any) {
    errors.push(`userInterests enum: ${err?.message}`);
  }

  // 2. Create suggestions table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`suggestions\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int,
        \`type\` enum('opportunity','source') NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`organization\` varchar(255),
        \`url\` varchar(2048),
        \`category\` enum('extracurricular','grant','stem_competition','sports','volunteering','experiential_learning','other'),
        \`targetAge\` varchar(100),
        \`description\` text NOT NULL,
        \`notes\` text,
        \`submitterName\` varchar(255),
        \`submitterEmail\` varchar(320),
        \`status\` enum('pending','approved','rejected','converted') NOT NULL DEFAULT 'pending',
        \`adminNotes\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`suggestions_id\` PRIMARY KEY(\`id\`)
      )
    `);
    suggestionsCreated = true;
  } catch (err: any) {
    errors.push(`suggestions table: ${err?.message}`);
  }

  // 3. Ensure page views table
  try {
    await initPageViewsTable();
  } catch (err: any) {
    errors.push(`page_views table: ${err?.message}`);
  }

  return {
    success: errors.length === 0 || enumsUpdated,
    enumsUpdated,
    suggestionsCreated,
    errors,
  };
}

/**
 * Seeds and updates verified opportunities in the database.
 */
export async function syncVerifiedOpportunities(): Promise<{
  checked: number;
  inserted: number;
  updated: number;
  skippedExpired: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();
  let inserted = 0;
  let updated = 0;
  let skippedExpired = 0;

  for (const opp of VERIFIED_OPPORTUNITIES) {
    if (opp.deadline && opp.deadline < now) {
      skippedExpired++;
      continue;
    }

    if (!opp.externalLink) {
      continue;
    }

    const taggedOpportunity = {
      ...opp,
      isApproved: true,
      tags: inferOpportunityTags(opp),
    };

    const existing = await db
      .select({ id: opportunities.id })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.title, opp.title),
          eq(opportunities.externalLink, opp.externalLink),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(opportunities)
        .set(taggedOpportunity)
        .where(eq(opportunities.id, existing[0].id));
      updated++;
    } else {
      await db.insert(opportunities).values(taggedOpportunity);
      inserted++;
    }
  }

  return {
    checked: VERIFIED_OPPORTUNITIES.length,
    inserted,
    updated,
    skippedExpired,
  };
}

/**
 * Complete initialization routine run on server start or via API.
 */
export async function initDatabaseSync(): Promise<{
  schema: { success: boolean; enumsUpdated: boolean; suggestionsCreated: boolean; errors: string[] };
  sync: { checked: number; inserted: number; updated: number; skippedExpired: number };
  activeOpportunities: number;
}> {
  console.log("[Database Sync] Ensuring database schema...");
  const schemaResult = await ensureDatabaseSchema();
  console.log("[Database Sync] Schema result:", schemaResult);

  console.log("[Database Sync] Syncing verified opportunities...");
  const syncResult = await syncVerifiedOpportunities();
  console.log(
    `[Database Sync] Verified opportunities: ${syncResult.inserted} inserted, ${syncResult.updated} updated, ${syncResult.skippedExpired} skipped expired`,
  );

  const activeCount = await approveAllActiveOpportunities();
  console.log(`[Database Sync] Total active opportunities: ${activeCount}`);

  return {
    schema: schemaResult,
    sync: syncResult,
    activeOpportunities: activeCount,
  };
}
