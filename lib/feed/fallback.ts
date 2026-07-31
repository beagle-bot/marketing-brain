import seeds from "@/data/fallback-batch.json";
import type { FeedBatch, Industry, MarketingItem, SourceCounts, SourceName } from "@/lib/feed/types";

type Seed = { source: SourceName; title: string; industry: Industry; summary: string };

export function fallbackBatch(): FeedBatch {
  const collectedAt = "2026-07-31T00:00:00.000Z";
  const items: MarketingItem[] = (seeds as Seed[]).map((seed, index) => ({
    id: `demo-${seed.source.toLowerCase()}-${index + 1}`,
    source: seed.source,
    sourceUrl:
      seed.source === "SocialBeta"
        ? "https://socialbeta.com/case"
        : seed.source === "Meihua"
          ? "https://www.meihua.info/shots"
          : "https://www.digitaling.com/rss",
    title: seed.title,
    summary: seed.summary,
    author: seed.source,
    publishedAt: collectedAt,
    collectedAt,
    industry: seed.industry,
    contentTags: ["示例", "案例"],
    score: 0,
    selectionReason: "本地示例"
  }));
  const sourceCounts = items.reduce<SourceCounts>(
    (counts, item) => ({ ...counts, [item.source]: counts[item.source] + 1 }),
    { SocialBeta: 0, Meihua: 0, Digitaling: 0 }
  );
  return { batchDate: "2026-07-31", generatedAt: collectedAt, items, sourceCounts, sourceErrors: {} };
}
