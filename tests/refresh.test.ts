import { describe, expect, test } from "vitest";
import { fallbackBatch } from "@/lib/feed/fallback";
import { refreshDailyFeed, type FeedRepository, type RefreshDependencies } from "@/lib/feed/refresh";
import type { FeedBatch, MarketingItem, SourceName, SourceResult } from "@/lib/feed/types";

function item(source: SourceName, index: number): MarketingItem {
  return {
    id: `${source}:${index}`,
    source,
    sourceUrl: `https://example.com/${source}/${index}`,
    title: `${source} 品牌营销案例 ${index}`,
    summary: `这是第 ${index} 个包含用户洞察和社媒传播策略的完整案例摘要。`,
    publishedAt: `2026-07-${String(31 - (index % 5)).padStart(2, "0")}T00:00:00.000Z`,
    collectedAt: "2026-07-31T00:00:00.000Z",
    industry: "其他",
    contentTags: ["案例"],
    score: 100 - index,
    selectionReason: "案例信息完整"
  };
}

function source(source: SourceName, count: number, error?: string): SourceResult {
  return { source, items: Array.from({ length: count }, (_, index) => item(source, index)), error };
}

class MemoryRepository implements FeedRepository {
  batches: FeedBatch[] = [];
  saveCalls = 0;

  async getLatestBatch() {
    return this.batches.at(-1) ?? null;
  }

  async getRecentItemIds() {
    return new Set(this.batches.flatMap((batch) => batch.items.map((entry) => entry.id)));
  }

  async saveBatch(batch: FeedBatch) {
    this.saveCalls += 1;
    const found = this.batches.findIndex((entry) => entry.batchDate === batch.batchDate);
    if (found >= 0) this.batches[found] = batch;
    else this.batches.push(batch);
    return batch;
  }
}

function dependencies(repository: MemoryRepository, results: SourceResult[]): RefreshDependencies {
  return {
    repository,
    fetchSources: async () => results,
    now: () => new Date("2026-07-31T00:05:00.000Z")
  };
}

describe("refreshDailyFeed", () => {
  test("生成并保存当日 30 条批次", async () => {
    const repository = new MemoryRepository();
    const result = await refreshDailyFeed(dependencies(repository, [source("SocialBeta", 20), source("Meihua", 20), source("Digitaling", 20)]));
    expect(result.status).toBe("refreshed");
    expect(result.batch.items).toHaveLength(30);
    expect(result.batch.batchDate).toBe("2026-07-31");
    expect(repository.saveCalls).toBe(1);
  });

  test("同日重复触发直接返回已有批次", async () => {
    const repository = new MemoryRepository();
    const first = await refreshDailyFeed(dependencies(repository, [source("SocialBeta", 20), source("Meihua", 20), source("Digitaling", 20)]));
    const second = await refreshDailyFeed(dependencies(repository, [source("SocialBeta", 20), source("Meihua", 20), source("Digitaling", 20)]));
    expect(second.status).toBe("already-current");
    expect(second.batch.generatedAt).toBe(first.batch.generatedAt);
    expect(repository.saveCalls).toBe(1);
  });

  test("单一来源失败时用其他来源补足", async () => {
    const repository = new MemoryRepository();
    const result = await refreshDailyFeed(dependencies(repository, [source("SocialBeta", 24), source("Meihua", 24), source("Digitaling", 0, "RSS timeout")]));
    expect(result.status).toBe("refreshed");
    expect(result.batch.items).toHaveLength(30);
    expect(result.batch.sourceErrors.Digitaling).toBe("RSS timeout");
  });

  test("结果不足 20 条时不覆盖上一批", async () => {
    const repository = new MemoryRepository();
    const previous: FeedBatch = {
      batchDate: "2026-07-30",
      generatedAt: "2026-07-30T00:05:00.000Z",
      items: Array.from({ length: 30 }, (_, index) => item("Meihua", 100 + index)),
      sourceCounts: { SocialBeta: 0, Meihua: 30, Digitaling: 0 },
      sourceErrors: {}
    };
    repository.batches.push(previous);
    const result = await refreshDailyFeed(dependencies(repository, [source("SocialBeta", 5), source("Meihua", 5), source("Digitaling", 5)]));
    expect(result.status).toBe("stale");
    expect(result.batch.batchDate).toBe("2026-07-30");
    expect(repository.saveCalls).toBe(0);
  });
});

test("本地示例批次保持 12/10/8 配额", () => {
  const batch = fallbackBatch();
  expect(batch.items).toHaveLength(30);
  expect(batch.sourceCounts).toEqual({ SocialBeta: 12, Meihua: 10, Digitaling: 8 });
  expect(batch.items.every((entry) => entry.contentTags.includes("示例"))).toBe(true);
});
