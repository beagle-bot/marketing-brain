import { describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseFeedRepository } from "@/lib/feed/supabase";

function itemRow(itemId: string, position: number) {
  return {
    item_id: itemId,
    source: "Digitaling" as const,
    source_url: `https://example.com/${itemId}`,
    title: itemId,
    summary: `${itemId} summary`,
    author: null,
    published_at: null,
    collected_at: "2026-08-16T00:00:00.000Z",
    native_category: null,
    industry: "其他" as const,
    content_tags: [],
    rule_score: 1,
    selection_reason: "test",
    cover_url: null,
    position
  };
}

function batchRow(batchDate: string, items: ReturnType<typeof itemRow>[]) {
  return {
    id: batchDate,
    batch_date: batchDate,
    generated_at: `${batchDate}T00:00:00.000Z`,
    source_counts: { SocialBeta: 0, Meihua: 0, Digitaling: items.length },
    source_errors: {},
    marketing_feed_items: items
  };
}

describe("SupabaseFeedRepository.getArchiveBatch", () => {
  test("returns untouched items from every successful daily batch in newest-first order", async () => {
    const rows = [
      batchRow("2026-08-15", [itemRow("old-b", 1), itemRow("old-a", 0)]),
      batchRow("2026-08-16", [itemRow("new-a", 0)])
    ];
    const query = {
      select() { return this; },
      eq() { return this; },
      order() { return this; },
      async range() { return { data: rows, error: null }; }
    };
    const client = { from: () => query } as unknown as SupabaseClient;
    const repository = new SupabaseFeedRepository(client);

    const result = await repository.getArchiveBatch();

    expect(result?.items.map(({ id }) => id)).toEqual(["new-a", "old-a", "old-b"]);
    expect(result?.batchDate).toBe("2026-08-16");
  });
});
