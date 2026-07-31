import { describe, expect, test } from "vitest";
import { normalizeTitle, selectDailyBatch } from "@/lib/feed/select";
import type { MarketingItem, SourceName, SourceResult } from "@/lib/feed/types";

function candidate(source: SourceName, index: number, score = 100): MarketingItem {
  return {
    id: `${source}-${index}`,
    source,
    sourceUrl: `https://example.com/${source}/${index}`,
    title: `${source} 营销案例 ${index}`,
    summary: `这是 ${source} 的第 ${index} 个完整案例摘要。`,
    publishedAt: new Date(Date.UTC(2026, 6, 31, 0, index)).toISOString(),
    collectedAt: "2026-07-31T01:00:00.000Z",
    industry: "其他",
    contentTags: ["案例"],
    score,
    selectionReason: "案例信息完整"
  };
}

function result(source: SourceName, count: number): SourceResult {
  return { source, items: Array.from({ length: count }, (_, index) => candidate(source, index, 100 - index)) };
}

describe("normalizeTitle", () => {
  test("去掉标点和空白以发现跨源重复", () => {
    expect(normalizeTitle("瑞幸 × 哈尔的移动城堡：联名！")).toBe("瑞幸哈尔的移动城堡联名");
  });
});

describe("selectDailyBatch", () => {
  test("满足 SocialBeta 12、Meihua 10、Digitaling 8 的配额", () => {
    const batch = selectDailyBatch(
      [result("SocialBeta", 20), result("Meihua", 20), result("Digitaling", 20)],
      new Set(),
      "2026-07-31"
    );
    expect(batch.items).toHaveLength(30);
    expect(batch.sourceCounts).toEqual({ SocialBeta: 12, Meihua: 10, Digitaling: 8 });
  });

  test("排除近期 ID 和标题重复", () => {
    const social = result("SocialBeta", 14);
    const meihua = result("Meihua", 12);
    meihua.items[0] = { ...meihua.items[0], title: social.items[1].title };
    const batch = selectDailyBatch([social, meihua, result("Digitaling", 12)], new Set([social.items[0].id]), "2026-07-31");
    expect(batch.items.some((entry) => entry.id === social.items[0].id)).toBe(false);
    expect(batch.items.filter((entry) => normalizeTitle(entry.title) === normalizeTitle(social.items[1].title))).toHaveLength(1);
  });

  test("某来源不足时由剩余高分候选补齐", () => {
    const batch = selectDailyBatch(
      [result("SocialBeta", 20), result("Meihua", 20), result("Digitaling", 3)],
      new Set(),
      "2026-07-31"
    );
    expect(batch.items).toHaveLength(30);
    expect(batch.sourceCounts.Digitaling).toBe(3);
    expect(batch.sourceCounts.SocialBeta + batch.sourceCounts.Meihua).toBe(27);
  });
});
