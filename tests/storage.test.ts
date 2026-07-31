import { describe, expect, test } from "vitest";
import { createInitialState, parseStoredState, rememberItem, removeSavedItem, skipItem } from "@/lib/client/storage";
import type { MarketingItem } from "@/lib/feed/types";

const item: MarketingItem = {
  id: "SocialBeta:1",
  source: "SocialBeta",
  sourceUrl: "https://socialbeta.com/campaign/1",
  title: "一个茶饮营销案例",
  summary: "完整记录了品牌如何从洞察到执行建立社媒话题。",
  publishedAt: "2026-07-31T00:00:00.000Z",
  collectedAt: "2026-07-31T01:00:00.000Z",
  industry: "茶饮",
  contentTags: ["案例"],
  score: 88,
  selectionReason: "信息完整"
};

describe("client storage state", () => {
  test("空状态使用营销偏好默认值", () => {
    expect(createInitialState()).toMatchObject({ saved: [], skippedIds: [], profile: { preferredIndustries: [] } });
  });

  test("收藏保留条目快照、评级和备注", () => {
    const next = rememberItem(createInitialState(), item, 4, "用在秋季新品提案");
    expect(next.saved[0]).toMatchObject({ itemId: item.id, rating: 4, note: "用在秋季新品提案", itemSnapshot: item });
    expect(next.skippedIds).not.toContain(item.id);
  });

  test("略过后从收藏中移除", () => {
    const remembered = rememberItem(createInitialState(), item, 3, "");
    const next = skipItem(remembered, item.id);
    expect(next.saved).toHaveLength(0);
    expect(next.skippedIds).toContain(item.id);
  });

  test("删除收藏不会自动标记略过", () => {
    const next = removeSavedItem(rememberItem(createInitialState(), item, 5, "重要"), item.id);
    expect(next.saved).toHaveLength(0);
    expect(next.skippedIds).not.toContain(item.id);
  });

  test("损坏的 localStorage JSON 回退到空状态", () => {
    expect(parseStoredState("{broken")).toEqual(createInitialState());
  });
});
