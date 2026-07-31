import { fetchDigitaling } from "@/lib/feed/sources/digitaling";
import { fetchMeihua } from "@/lib/feed/sources/meihua";
import { fetchSocialBeta } from "@/lib/feed/sources/socialbeta";
import { selectDailyBatch } from "@/lib/feed/select";
import type { FeedBatch, SourceResult } from "@/lib/feed/types";

export type FeedRepository = {
  getLatestBatch: () => Promise<FeedBatch | null>;
  getRecentItemIds: () => Promise<Set<string>>;
  saveBatch: (batch: FeedBatch) => Promise<FeedBatch>;
};

export type RefreshDependencies = {
  repository: FeedRepository;
  fetchSources?: () => Promise<SourceResult[]>;
  now?: () => Date;
};

export type RefreshResult = {
  status: "refreshed" | "already-current" | "stale";
  batch: FeedBatch;
};

function chinaDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function fetchAllSources() {
  return Promise.all([fetchSocialBeta(), fetchMeihua(), fetchDigitaling()]);
}

export async function refreshDailyFeed(dependencies: RefreshDependencies): Promise<RefreshResult> {
  const now = (dependencies.now ?? (() => new Date()))();
  const batchDate = chinaDate(now);
  const latest = await dependencies.repository.getLatestBatch();
  if (latest?.batchDate === batchDate) return { status: "already-current", batch: latest };

  const [sourceResults, recentIds] = await Promise.all([
    (dependencies.fetchSources ?? fetchAllSources)(),
    dependencies.repository.getRecentItemIds()
  ]);
  const batch = selectDailyBatch(sourceResults, recentIds, batchDate);
  batch.generatedAt = now.toISOString();

  if (batch.items.length < 20) {
    if (latest) return { status: "stale", batch: latest };
    throw new Error(`每日候选不足：仅选出 ${batch.items.length} 条，最少需要 20 条`);
  }

  return { status: "refreshed", batch: await dependencies.repository.saveBatch(batch) };
}
