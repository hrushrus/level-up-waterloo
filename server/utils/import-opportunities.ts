import { parse } from "csv-parse/sync";
import { getDb } from "../db";
import { opportunities } from "../../drizzle/schema";
import type { InsertOpportunity } from "../../drizzle/schema";
import { isOpportunityTag, type OpportunityTag } from "../../shared/opportunity-tags";

/**
 * Utility for importing opportunities from various sources
 */

export interface OpportunityImportRow {
  title: string;
  description: string;
  category: "extracurricular" | "grant" | "stem_competition" | "sports" | "volunteering" | "other";
  externalLink?: string;
  submittedBy: string;
  submitterEmail: string;
  deadline?: string; // ISO date string or "YYYY-MM-DD"
  level?: "both" | "middle_school" | "high_school";
  type?: "in_person" | "online" | "hybrid";
  duration?: "short" | "medium" | "long";
  tags?: OpportunityTag[] | string;
  isApproved?: boolean | string; // "true"/"false" or true/false
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  message: string;
}

/**
 * Validate and normalize opportunity data
 */
function validateOpportunity(row: OpportunityImportRow, rowNumber: number): { valid: boolean; data?: InsertOpportunity; error?: string } {
  const errors: string[] = [];

  // Required fields
  if (!row.title || typeof row.title !== "string") {
    errors.push("Missing or invalid title");
  }
  if (!row.description || typeof row.description !== "string") {
    errors.push("Missing or invalid description");
  }
  if (!row.category) {
    errors.push("Missing category");
  }
  if (!row.submittedBy || typeof row.submittedBy !== "string") {
    errors.push("Missing or invalid submittedBy");
  }
  if (!row.submitterEmail || typeof row.submitterEmail !== "string") {
    errors.push("Missing or invalid submitterEmail");
  }

  // Validate category
  const validCategories = ["extracurricular", "grant", "stem_competition", "sports", "volunteering", "other"];
  if (row.category && !validCategories.includes(row.category)) {
    errors.push(`Invalid category: ${row.category}`);
  }

  // Validate email format
  if (row.submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.submitterEmail)) {
    errors.push(`Invalid email format: ${row.submitterEmail}`);
  }

  // Validate deadline if provided
  let deadline: Date | null = null;
  if (row.deadline) {
    const date = new Date(row.deadline);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid deadline date: ${row.deadline}`);
    } else {
      deadline = date;
    }
  }

  // Validate level
  const validLevels = ["both", "middle_school", "high_school"];
  if (row.level && !validLevels.includes(row.level)) {
    errors.push(`Invalid level: ${row.level}`);
  }

  // Validate type
  const validTypes = ["in_person", "online", "hybrid"];
  if (row.type && !validTypes.includes(row.type)) {
    errors.push(`Invalid type: ${row.type}`);
  }

  // Validate duration
  const validDurations = ["short", "medium", "long"];
  if (row.duration && !validDurations.includes(row.duration)) {
    errors.push(`Invalid duration: ${row.duration}`);
  }

  const tags =
    typeof row.tags === "string"
      ? row.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : row.tags ?? [];
  const invalidTags = tags.filter((tag) => !isOpportunityTag(tag));
  if (invalidTags.length > 0) {
    errors.push(`Invalid tags: ${invalidTags.join(", ")}`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: `Row ${rowNumber}: ${errors.join("; ")}`,
    };
  }

  // Parse isApproved
  let isApproved = false;
  if (row.isApproved) {
    if (typeof row.isApproved === "string") {
      isApproved = row.isApproved.toLowerCase() === "true";
    } else {
      isApproved = Boolean(row.isApproved);
    }
  }

  const data: InsertOpportunity = {
    title: row.title.trim(),
    description: row.description.trim(),
    category: row.category,
    externalLink: row.externalLink?.trim() || null,
    submittedBy: row.submittedBy.trim(),
    submitterEmail: row.submitterEmail.trim(),
    deadline: deadline || null,
    isApproved,
    level: (row.level || "both") as "both" | "middle_school" | "high_school",
    type: (row.type || "in_person") as "in_person" | "online" | "hybrid",
    duration: (row.duration || "long") as "short" | "medium" | "long",
    tags: tags as OpportunityTag[],
  };

  return { valid: true, data };
}

/**
 * Import opportunities from CSV content
 */
export async function importFromCSV(csvContent: string): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      message: "Database not available",
    };
  }

  try {
    // Parse CSV
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as OpportunityImportRow[];

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Validate and insert each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateOpportunity(row, i + 2); // +2 because CSV has header row

      if (!validation.valid) {
        errors.push({ row: i + 2, error: validation.error || "Unknown error" });
        failed++;
        continue;
      }

      try {
        await db.insert(opportunities).values(validation.data!);
        imported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push({ row: i + 2, error: errorMessage });
        failed++;
      }
    }

    return {
      success: failed === 0,
      imported,
      failed,
      errors,
      message: `Imported ${imported} opportunities${failed > 0 ? `, ${failed} failed` : ""}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [{ row: 0, error: errorMessage }],
      message: `CSV parsing error: ${errorMessage}`,
    };
  }
}

/**
 * Import opportunities from array of objects
 */
export async function importFromArray(data: OpportunityImportRow[]): Promise<ImportResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      message: "Database not available",
    };
  }

  let imported = 0;
  let failed = 0;
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const validation = validateOpportunity(row, i + 1);

    if (!validation.valid) {
      errors.push({ row: i + 1, error: validation.error || "Unknown error" });
      failed++;
      continue;
    }

    try {
      await db.insert(opportunities).values(validation.data!);
      imported++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push({ row: i + 1, error: errorMessage });
      failed++;
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors,
    message: `Imported ${imported} opportunities${failed > 0 ? `, ${failed} failed` : ""}`,
  };
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    "title",
    "description",
    "category",
    "externalLink",
    "submittedBy",
    "submitterEmail",
    "deadline",
    "level",
    "type",
    "duration",
    "tags",
    "isApproved",
  ];

  const sampleRows = [
    [
      "CEMC Math Circles",
      "Mathematics and computer-science enrichment for students in Grades 6-12",
      "stem_competition",
      "https://cemc.uwaterloo.ca/workshops/student-workshops/math-circles",
      "Centre for Education in Mathematics and Computing",
      "automation@levelupwaterloo.local",
      "",
      "both",
      "hybrid",
      "medium",
      "stem,workshop",
      "false",
    ],
    [
      "Technovation Girls Waterloo",
      "Technology and entrepreneurship program for girls and gender-diverse youth",
      "extracurricular",
      "https://uwaterloo.ca/women-in-computer-science/youth-programs/technovation",
      "University of Waterloo Women in Computer Science",
      "automation@levelupwaterloo.local",
      "",
      "both",
      "hybrid",
      "long",
      "stem,entrepreneurship,mentorship,competition",
      "false",
    ],
    [
      "Volunteer Waterloo Region",
      "Regional portal for volunteer opportunities from local community organizations",
      "volunteering",
      "https://volunteerwr.ca/volunteer/",
      "Volunteer Waterloo Region",
      "automation@levelupwaterloo.local",
      "",
      "both",
      "hybrid",
      "medium",
      "volunteering,free",
      "false",
    ],
  ];

  const csvLines = [headers.join(","), ...sampleRows.map((row) => row.map((cell) => `"${cell}"`).join(","))];

  return csvLines.join("\n");
}

/**
 * Export opportunities to CSV
 */
export async function exportToCSV(): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const allOpportunities = await db.select().from(opportunities);

  const headers = [
    "id",
    "title",
    "description",
    "category",
    "externalLink",
    "submittedBy",
    "submitterEmail",
    "deadline",
    "isApproved",
    "level",
    "type",
    "duration",
    "tags",
    "createdAt",
    "updatedAt",
  ];

  const rows = allOpportunities.map((opp) => [
    opp.id,
    `"${opp.title}"`,
    `"${opp.description}"`,
    opp.category,
    opp.externalLink ? `"${opp.externalLink}"` : "",
    `"${opp.submittedBy}"`,
    opp.submitterEmail,
    opp.deadline?.toISOString().split("T")[0] || "",
    opp.isApproved ? "true" : "false",
    opp.level,
    opp.type,
    opp.duration,
    `"${(opp.tags ?? []).join(",")}"`,
    opp.createdAt?.toISOString() || "",
    opp.updatedAt?.toISOString() || "",
  ]);

  const csvLines = [headers.join(","), ...rows.map((row) => row.join(","))];

  return csvLines.join("\n");
}
