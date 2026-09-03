import "dotenv/config";
import { runOpportunityDiscovery, DEFAULT_DISCOVERY_SOURCES } from "../server/services/opportunity-discovery";

async function main() {
  console.log(`[Crawler] Starting manual crawl of ${DEFAULT_DISCOVERY_SOURCES.length} sources...`);
  const startTime = Date.now();
  const result = await runOpportunityDiscovery();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n================ Crawler Run Summary (${elapsed}s) ================`);
  console.log(`Sources checked: ${result.sourcesChecked}`);
  console.log(`Opportunities discovered: ${result.discovered}`);
  console.log(`New inserted: ${result.inserted}`);
  console.log(`Existing updated: ${result.updated}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log(`Failed sources: ${result.failed}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors encountered (${result.errors.length}):`);
    for (const err of result.errors) {
      console.log(` - [${err.source}] ${err.error}`);
    }
  }
  console.log("===================================================================\n");
  process.exit(result.failed === result.sourcesChecked ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal crawler error:", err);
  process.exit(1);
});
