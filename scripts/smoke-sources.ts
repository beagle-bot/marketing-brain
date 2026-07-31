import { fetchDigitaling } from "../lib/feed/sources/digitaling";
import { fetchMeihua } from "../lib/feed/sources/meihua";
import { fetchSocialBeta } from "../lib/feed/sources/socialbeta";
import { selectDailyBatch } from "../lib/feed/select";

async function main() {
  const results = await Promise.all([fetchSocialBeta(), fetchMeihua(), fetchDigitaling()]);
  for (const result of results) {
    const industries = Array.from(new Set(result.items.map((item) => item.industry))).join(", ");
    process.stdout.write(`${result.source}: ${result.items.length} items${result.error ? `, error=${result.error}` : ""}, industries=${industries}\n`);
  }
  const batch = selectDailyBatch(results, new Set(), new Date().toISOString().slice(0, 10));
  process.stdout.write(`Selected: ${batch.items.length} items, quotas=${JSON.stringify(batch.sourceCounts)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
