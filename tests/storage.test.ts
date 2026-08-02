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

  test("收藏保留手动行业、条目快照、评级和备注", () => {
    const next = rememberItem(createInitialState(), item, "美妆", 4, "用在秋季新品提案");
    expect(next.saved[0]).toMatchObject({ itemId: item.id, savedIndustry: "美妆", rating: 4, note: "用在秋季新品提案", itemSnapshot: item });
    expect(next.saved[0].itemSnapshot.industry).toBe("茶饮");
    expect(next.skippedIds).not.toContain(item.id);
  });

  test("编辑收藏可更换手动行业并保留首次收藏时间", () => {
    const remembered = rememberItem(createInitialState(), item, "茶饮", 3, "初版");
    const edited = rememberItem(remembered, item, "互联网", 5, "改为平台案例");
    expect(edited.saved[0]).toMatchObject({ savedIndustry: "互联网", rating: 5, note: "改为平台案例", savedAt: remembered.saved[0].savedAt });
  });

  test("旧收藏没有手动行业时迁移到其他", () => {
    const legacy = {
      saved: [{ itemId: item.id, itemSnapshot: item, rating: 4, note: "旧备注", savedAt: "2026-07-31T00:00:00.000Z" }],
      skippedIds: [],
      profile: { preferredIndustries: ["硬件", "茶饮"], customDescription: "" }
    };
    const migrated = parseStoredState(JSON.stringify(legacy));
    expect(migrated.saved[0].savedIndustry).toBe("其他");
    expect(migrated.profile.preferredIndustries).toEqual(["茶饮"]);
  });

  test("略过后从收藏中移除", () => {
    const remembered = rememberItem(createInitialState(), item, "茶饮", 3, "");
    const next = skipItem(remembered, item.id);
    expect(next.saved).toHaveLength(0);
    expect(next.skippedIds).toContain(item.id);
  });

  test("删除收藏不会自动标记略过", () => {
    const next = removeSavedItem(rememberItem(createInitialState(), item, "茶饮", 5, "重要"), item.id);
    expect(next.saved).toHaveLength(0);
    expect(next.skippedIds).not.toContain(item.id);
  });

  test("损坏的 localStorage JSON 回退到空状态", () => {
    expect(parseStoredState("{broken")).toEqual(createInitialState());
  });
});
