import { and, eq, or } from "drizzle-orm";
import { opportunities } from "../../drizzle/schema";
import { getDb } from "../db";
import type { OpportunityImportRow } from "../utils/import-opportunities";
import { isOpportunityTag, type OpportunityTag } from "../../shared/opportunity-tags";

export type OpportunityCategory =
  | "extracurricular"
  | "grant"
  | "stem_competition"
  | "sports"
  | "volunteering"
  | "other";

type Level = "both" | "middle_school" | "high_school";
type OpportunityType = "in_person" | "online" | "hybrid";
type Duration = "short" | "medium" | "long";

export interface DiscoverySource {
  id: string;
  name: string;
  url: string;
  category: OpportunityCategory;
  level?: Level;
  type?: OpportunityType;
  duration?: Duration;
  fallbackDescription: string;
  tags?: OpportunityTag[];
}

export interface DiscoveryCandidate extends OpportunityImportRow {
  sourceId: string;
  sourceUrl: string;
}

export interface OpportunityDiscoveryResult {
  success: boolean;
  sourcesChecked: number;
  discovered: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ source: string; error: string }>;
}

const DISCOVERY_SUBMITTER_EMAIL = "automation@levelupwaterloo.local";

export const DEFAULT_DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    id: "uw-high-school-enrichment",
    name: "University of Waterloo High School Enrichment Programs",
    url: "https://uwaterloo.ca/future-students/visit-waterloo/high-school-enrichment-programs",
    category: "extracurricular",
    level: "high_school",
    type: "hybrid",
    duration: "medium",
    fallbackDescription:
      "University of Waterloo directory for high-school enrichment programs in math, computing, engineering, science, health, finance and outreach.",
    tags: ["stem", "workshop"],
  },
  {
    id: "cemc-math-circles",
    name: "CEMC Math Circles",
    url: "https://cemc.uwaterloo.ca/workshops/student-workshops/math-circles",
    category: "stem_competition",
    level: "both",
    type: "hybrid",
    duration: "medium",
    fallbackDescription:
      "Eight-week mathematics and computer-science enrichment series for students in Grades 6-12.",
    tags: ["stem", "workshop"],
  },
  {
    id: "technovation-waterloo",
    name: "Technovation Girls Waterloo",
    url: "https://uwaterloo.ca/women-in-computer-science/youth-programs/technovation",
    category: "extracurricular",
    level: "both",
    type: "hybrid",
    duration: "long",
    fallbackDescription:
      "App, AI, entrepreneurship and mentorship program for girls and gender-diverse youth.",
    tags: ["stem", "entrepreneurship", "mentorship", "competition"],
  },
  {
    id: "flowboat",
    name: "Flowboat Entrepreneurship Club",
    url: "https://www.flowboat.ca/",
    category: "extracurricular",
    level: "high_school",
    type: "in_person",
    duration: "long",
    fallbackDescription:
      "Waterloo Region high-school entrepreneurship club where students form startup teams, build products and pitch.",
    tags: ["entrepreneurship", "mentorship"],
  },
  {
    id: "uw-engineering-outreach",
    name: "University of Waterloo Engineering Outreach",
    url: "https://uwaterloo.ca/engineering-outreach/youth-programs-0",
    category: "extracurricular",
    level: "both",
    type: "in_person",
    duration: "medium",
    fallbackDescription:
      "Engineering outreach directory for ESQ, Catalyst, Women in Engineering and other youth programs.",
    tags: ["stem", "workshop", "camp"],
  },
  {
    id: "perimeter-issyp",
    name: "Perimeter Institute ISSYP",
    url: "https://perimeterinstitute.ca/issyp",
    category: "extracurricular",
    level: "high_school",
    type: "hybrid",
    duration: "medium",
    fallbackDescription:
      "International Summer School for Young Physicists with lectures, labs, mentoring and collaborative physics learning.",
    tags: ["stem", "summer", "camp"],
  },
  {
    id: "volunteer-waterloo-region",
    name: "Volunteer Waterloo Region",
    url: "https://volunteerwr.ca/volunteer/",
    category: "volunteering",
    level: "both",
    type: "hybrid",
    duration: "medium",
    fallbackDescription:
      "Regional volunteer portal with opportunities from local community organizations.",
    tags: ["volunteering"],
  },
  {
    id: "kpl-teens",
    name: "Kitchener Public Library Teen Opportunities",
    url: "https://www.kpl.org/teens/volunteer-opportunities",
    category: "volunteering",
    level: "both",
    type: "hybrid",
    duration: "medium",
    fallbackDescription:
      "Teen library volunteer, creative, media, residency and advisory opportunities at Kitchener Public Library.",
    tags: ["arts", "volunteering"],
  },
  {
    id: "cambridge-library-events",
    name: "Cambridge Public Library Events",
    url: "https://events.cambridgepl.ca/events",
    category: "extracurricular",
    level: "both",
    type: "in_person",
    duration: "short",
    fallbackDescription:
      "Cambridge Public Library calendar for library, studio, maker, technology, arts and teen programming.",
    tags: ["arts", "workshop", "free"],
  },
  {
    id: "city-kitchener-youth",
    name: "City of Kitchener Children and Youth Programs",
    url: "https://www.kitchener.ca/recreation-and-sports/children-and-youth-programs/",
    category: "extracurricular",
    level: "both",
    type: "in_person",
    duration: "medium",
    fallbackDescription:
      "City youth programs covering leadership, arts, sports, drop-ins, summer programs and special events.",
    tags: ["leadership", "sports", "camp", "summer"],
  },
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function stripHtml(value: string): string {
  return normalizeWhitespace(
    value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+([.,;:!?])/g, "$1"),
  );
}

function asArray(value: unknown): unknown[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // Some sites include invalid JSON-LD. Ignore that source block and keep crawling.
    }
  }

  return blocks;
}

function flattenJsonLd(value: unknown): Record<string, any>[] {
  const nodes: Record<string, any>[] = [];

  for (const item of asArray(value)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, any>;

    if (Array.isArray(record["@graph"])) {
      nodes.push(...flattenJsonLd(record["@graph"]));
    }

    nodes.push(record);
  }

  return nodes;
}

function includesJsonLdType(record: Record<string, any>, expected: string[]): boolean {
  const types = asArray(record["@type"]).map((type) => String(type).toLowerCase());
  return expected.some((type) => types.includes(type.toLowerCase()));
}

function getRecordUrl(record: Record<string, any>, sourceUrl: string): string {
  const rawUrl =
    typeof record.url === "string"
      ? record.url
      : typeof record["@id"] === "string"
        ? record["@id"]
        : sourceUrl;

  return normalizeUrl(new URL(rawUrl, sourceUrl).toString());
}

function getRecordDeadline(record: Record<string, any>): string | undefined {
  const rawDate = record.endDate ?? record.startDate ?? record.validThrough;
  if (typeof rawDate !== "string") return undefined;

  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function parseJsonLdOpportunities(
  html: string,
  source: DiscoverySource,
): DiscoveryCandidate[] {
  const candidates: DiscoveryCandidate[] = [];
  const supportedTypes = ["Event", "EducationEvent", "Course", "Camp", "CreativeWork"];

  for (const block of getJsonLdBlocks(html)) {
    for (const record of flattenJsonLd(block)) {
      if (!includesJsonLdType(record, supportedTypes)) continue;

      const title = typeof record.name === "string" ? normalizeWhitespace(record.name) : "";
      if (!title || title.length < 4) continue;

      const description =
        typeof record.description === "string"
          ? stripHtml(record.description)
          : source.fallbackDescription;

      candidates.push({
        title,
        description,
        category: source.category,
        externalLink: getRecordUrl(record, source.url),
        submittedBy: `Automated discovery: ${source.name}`,
        submitterEmail: DISCOVERY_SUBMITTER_EMAIL,
        deadline: getRecordDeadline(record),
        level: source.level ?? "both",
        type: source.type ?? "in_person",
        duration: source.duration ?? "medium",
        tags: source.tags ?? [],
        isApproved: false,
        sourceId: source.id,
        sourceUrl: source.url,
      });
    }
  }

  return candidates;
}

export function sourceFallbackCandidate(source: DiscoverySource): DiscoveryCandidate {
  return {
    title: source.name,
    description: source.fallbackDescription,
    category: source.category,
    externalLink: normalizeUrl(source.url),
    submittedBy: `Automated discovery: ${source.name}`,
    submitterEmail: DISCOVERY_SUBMITTER_EMAIL,
    level: source.level ?? "both",
    type: source.type ?? "in_person",
    duration: source.duration ?? "medium",
    tags: source.tags ?? [],
    isApproved: false,
    sourceId: source.id,
    sourceUrl: source.url,
  };
}

async function fetchSourceHtml(source: DiscoverySource): Promise<string> {
  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "LevelUpWaterlooBot/1.0 (+https://levelupwaterloo.local)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function discoverFromSource(source: DiscoverySource): Promise<DiscoveryCandidate[]> {
  const html = await fetchSourceHtml(source);
  const parsed = parseJsonLdOpportunities(html, source);
  return parsed.length > 0 ? parsed : [sourceFallbackCandidate(source)];
}

async function existingOpportunityId(candidate: DiscoveryCandidate) {
  const db = await getDb();
  if (!db) return null;

  const externalLink = candidate.externalLink ? normalizeUrl(candidate.externalLink) : null;
  const matches = await db
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(
      externalLink
        ? or(
            eq(opportunities.externalLink, externalLink),
            and(
              eq(opportunities.title, candidate.title),
              eq(opportunities.submittedBy, candidate.submittedBy),
            ),
          )
        : and(
            eq(opportunities.title, candidate.title),
            eq(opportunities.submittedBy, candidate.submittedBy),
          ),
    )
    .limit(1);

  return matches[0]?.id ?? null;
}

async function upsertDiscoveredOpportunity(candidate: DiscoveryCandidate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const existingId = await existingOpportunityId(candidate);
  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.filter(isOpportunityTag)
    : [];
  const values = {
    title: candidate.title,
    description: candidate.description,
    category: candidate.category,
    externalLink: candidate.externalLink ? normalizeUrl(candidate.externalLink) : null,
    submittedBy: candidate.submittedBy,
    submitterEmail: candidate.submitterEmail,
    deadline: candidate.deadline ? new Date(candidate.deadline) : null,
    isApproved: process.env.OPPORTUNITY_DISCOVERY_AUTO_APPROVE === "true",
    level: candidate.level ?? "both",
    type: candidate.type ?? "in_person",
    duration: candidate.duration ?? "medium",
    tags,
  } as const;

  if (existingId) {
    await db
      .update(opportunities)
      .set({
        description: values.description,
        category: values.category,
        externalLink: values.externalLink,
        deadline: values.deadline,
        level: values.level,
        type: values.type,
        duration: values.duration,
        tags: values.tags,
      })
      .where(eq(opportunities.id, existingId));
    return "updated" as const;
  }

  await db.insert(opportunities).values(values);
  return "inserted" as const;
}

export async function runOpportunityDiscovery(
  sources: DiscoverySource[] = DEFAULT_DISCOVERY_SOURCES,
): Promise<OpportunityDiscoveryResult> {
  const result: OpportunityDiscoveryResult = {
    success: true,
    sourcesChecked: 0,
    discovered: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const db = await getDb();
  if (!db) {
    return {
      ...result,
      success: false,
      failed: sources.length,
      errors: [{ source: "database", error: "Database not available" }],
    };
  }

  for (const source of sources) {
    result.sourcesChecked++;

    try {
      const candidates = await discoverFromSource(source);
      result.discovered += candidates.length;

      for (const candidate of candidates) {
        try {
          const status = await upsertDiscoveredOpportunity(candidate);
          result[status]++;
        } catch (error) {
          result.skipped++;
          result.errors.push({
            source: source.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        source: source.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  result.success = result.failed === 0 && result.errors.length === 0;
  return result;
}
