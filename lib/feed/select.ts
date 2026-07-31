import type { FeedBatch, MarketingItem, SourceCounts, SourceName, SourceResult } from "@/lib/feed/types";

const quotas: Record<SourceName, number> = {
  SocialBeta: 12,
  Meihua: 10,
  Digitaling: 8
};

export function normalizeTitle(title: string) {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

function itemTime(item: MarketingItem) {
  const value = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
  return Number.isNaN(value) ? 0 : value;
}

function compareItems(first: MarketingItem, second: MarketingItem) {
  return second.score - first.score || itemTime(second) - itemTime(first) || first.id.localeCompare(second.id);
}

export function selectDailyBatch(sourceResults: SourceResult[], recentIds: Set<string>, batchDate: string): FeedBatch {
  const seenTitles = new Set<string>();
  const selected: MarketingItem[] = [];
  const remainder: MarketingItem[] = [];
  const sourceCounts: SourceCounts = { SocialBeta: 0, Meihua: 0, Digitaling: 0 };
  const sourceErrors: FeedBatch["sourceErrors"] = {};

  for (const result of sourceResults) {
    if (result.error) sourceErrors[result.source] = result.error;
    const eligible = result.items.filter((item) => !recentIds.has(item.id)).sort(compareItems);
    for (const item of eligible) {
      const normalized = normalizeTitle(item.title);
      if (!normalized || seenTitles.has(normalized)) continue;
      if (sourceCounts[result.source] < quotas[result.source]) {
        selected.push(item);
        sourceCounts[result.source] += 1;
        seenTitles.add(normalized);
      } else {
        remainder.push(item);
      }
    }
  }

  for (const item of remainder.sort(compareItems)) {
    if (selected.length >= 30) break;
    const normalized = normalizeTitle(item.title);
    if (seenTitles.has(normalized)) continue;
    selected.push(item);
    sourceCounts[item.source] += 1;
    seenTitles.add(normalized);
  }

  return {
    batchDate,
    generatedAt: new Date().toISOString(),
    items: selected.slice(0, 30),
    sourceCounts,
    sourceErrors
  };
}
