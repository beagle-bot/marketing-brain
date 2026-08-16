import { describe, expect, test, vi } from "vitest";
import { combineFeedBatches, readAllPages } from "@/lib/feed/archive";
import type { FeedBatch, MarketingItem } from "@/lib/feed/types";

function item(id: string): MarketingItem {
  return {
    id,
    source: "Digitaling",
    sourceUrl: `https://example.com/${id}`,
    title: id,
    summary: `${id} summary`,
    collectedAt: "2026-08-16T00:00:00.000Z",
    industry: "其他",
    contentTags: [],
    score: 1,
    selectionReason: "test"
  };
}

function batch(batchDate: string, ids: string[]): FeedBatch {
  return {
    batchDate,
    generatedAt: `${batchDate}T00:00:00.000Z`,
    items: ids.map(item),
    sourceCounts: { SocialBeta: 0, Meihua: 0, Digitaling: ids.length },
    sourceErrors: {}
  };
}

describe("combineFeedBatches", () => {
  test("places newer batches before older batches while preserving each batch's item order", () => {
    const result = combineFeedBatches([
      batch("2026-08-15", ["old-a", "old-b"]),
      batch("2026-08-16", ["new-a", "new-b"])
    ]);

    expect(result?.items.map(({ id }) => id)).toEqual(["new-a", "new-b", "old-a", "old-b"]);
  });

  test("keeps the newest occurrence when an item ID appears in multiple batches", () => {
    const older = batch("2026-08-15", ["duplicate"]);
    older.items[0].title = "older";
    const newer = batch("2026-08-16", ["duplicate"]);
    newer.items[0].title = "newer";

    const result = combineFeedBatches([older, newer]);

    expect(result?.items).toHaveLength(1);
    expect(result?.items[0].title).toBe("newer");
  });

  test("uses the newest batch metadata", () => {
    const result = combineFeedBatches([
      batch("2026-08-15", ["old-a"]),
      batch("2026-08-16", ["new-a", "new-b"])
    ]);

    expect(result?.batchDate).toBe("2026-08-16");
    expect(result?.sourceCounts.Digitaling).toBe(2);
  });

  test("returns null for an empty archive", () => {
    expect(combineFeedBatches([])).toBeNull();
  });
});

describe("readAllPages", () => {
  test("collects consecutive inclusive pages until a short page", async () => {
    const loadPage = vi.fn(async (from: number) => from === 0 ? [1, 2] : [3]);

    await expect(readAllPages(loadPage, 2)).resolves.toEqual([1, 2, 3]);
    expect(loadPage.mock.calls).toEqual([[0, 1], [2, 3]]);
  });

  test("requests a final page when the previous page is full", async () => {
    const loadPage = vi.fn(async (from: number) => from === 0 ? [1, 2] : []);

    await expect(readAllPages(loadPage, 2)).resolves.toEqual([1, 2]);
    expect(loadPage.mock.calls).toEqual([[0, 1], [2, 3]]);
  });
});
