import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { opportunities, type InsertOpportunity } from "../drizzle/schema";
import { getDb } from "../server/db";
import type { OpportunityTag } from "../shared/opportunity-tags";

const activeWaterlooGuide =
  "https://www.waterloo.ca/media/v3uac3f2/activewaterloo-summer-2026-guide.pdf";
const kitchenerSummerPrograms =
  "https://www.kitchener.ca/recreation-and-sports/children-and-youth-programs/summer-programs/";

const verifiedOpportunities: InsertOpportunity[] = [
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

function inferTags(opportunity: InsertOpportunity): OpportunityTag[] {
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
  if (/\b(career|employment|workplace|apprentice)\b/.test(text)) tags.add("career");
  if (/\b(mentor|mentorship)\b/.test(text)) tags.add("mentorship");
  if (/\b(environment|environmental|conservation|climate|nature|sustainability)\b/.test(text)) {
    tags.add("environment");
  }
  if (/\b(competition|contest|challenge|compete)\b/.test(text)) tags.add("competition");
  if (/\b(camp|camps)\b/.test(text)) tags.add("camp");
  if (/\b(course|class|workshop|training|sessions|program)\b/.test(text)) tags.add("workshop");
  if (/\bfree\b/.test(text)) tags.add("free");
  if (/\b(paid role|paid position|salary|wage|stipend|compensation|employment)\b/.test(text)) {
    tags.add("paid");
  }
  if (/\b(summer|june|july|august)\b/.test(text)) tags.add("summer");

  return [...tags];
}

async function main() {
  const db = await getDb();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  const now = new Date();
  let inserted = 0;
  let updated = 0;
  let skippedExpired = 0;

  for (const opportunity of verifiedOpportunities) {
    if (opportunity.deadline && opportunity.deadline < now) {
      skippedExpired++;
      continue;
    }

    if (!opportunity.externalLink) {
      throw new Error(`Missing external link for ${opportunity.title}`);
    }

    const taggedOpportunity = {
      ...opportunity,
      tags: inferTags(opportunity),
    };

    const existing = await db
      .select({ id: opportunities.id })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.title, opportunity.title),
          eq(opportunities.externalLink, opportunity.externalLink),
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

  console.log(
    JSON.stringify(
      {
        checked: verifiedOpportunities.length,
        inserted,
        updated,
        skippedExpired,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
