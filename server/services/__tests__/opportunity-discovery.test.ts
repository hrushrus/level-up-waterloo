import { describe, expect, it } from "vitest";
import {
  parseJsonLdOpportunities,
  sourceFallbackCandidate,
  normalizeUrl,
  stripHtml,
  type DiscoverySource,
} from "../opportunity-discovery";

const source: DiscoverySource = {
  id: "test-source",
  name: "Test Source",
  url: "https://example.com/events/",
  category: "extracurricular",
  level: "high_school",
  type: "hybrid",
  duration: "medium",
  fallbackDescription: "Fallback description",
};

describe("opportunity discovery", () => {
  it("normalizes URLs for deduplication", () => {
    expect(normalizeUrl("https://example.com/path/#section")).toBe("https://example.com/path");
    expect(normalizeUrl("https://example.com/path/")).toBe("https://example.com/path");
  });

  it("strips basic HTML from descriptions", () => {
    expect(stripHtml("<p>Build &amp; pitch <strong>apps</strong>.</p>")).toBe("Build & pitch apps.");
  });

  it("parses JSON-LD event records into import candidates", () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "EducationEvent",
              "name": "Youth Startup Lab",
              "description": "<p>Build a startup with mentors.</p>",
              "url": "/events/youth-startup-lab",
              "startDate": "2026-09-15T18:00:00-04:00"
            }
          </script>
        </head>
      </html>
    `;

    const candidates = parseJsonLdOpportunities(html, source);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      title: "Youth Startup Lab",
      description: "Build a startup with mentors.",
      category: "extracurricular",
      externalLink: "https://example.com/events/youth-startup-lab",
      submittedBy: "Automated discovery: Test Source",
      submitterEmail: "automation@levelupwaterloo.local",
      isApproved: false,
      level: "high_school",
      type: "hybrid",
      duration: "medium",
      sourceId: "test-source",
    });
  });

  it("creates a fallback candidate when no structured event is available", () => {
    const candidate = sourceFallbackCandidate(source);

    expect(candidate).toMatchObject({
      title: "Test Source",
      description: "Fallback description",
      externalLink: "https://example.com/events",
      isApproved: false,
    });
  });
});
