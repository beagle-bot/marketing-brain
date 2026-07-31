import { expect, test } from "vitest";
import { buildSavedMarkdown } from "@/lib/client/export";
import type { SavedItem } from "@/lib/client/types";

test("导出包含用户备注、摘要和原文链接", () => {
  const saved: SavedItem = {
    itemId: "one",
    rating: 4,
    note: "可用在茶饮新品策划",
    savedAt: "2026-07-31T00:00:00.000Z",
    itemSnapshot: {
      id: "one",
      source: "SocialBeta",
      sourceUrl: "https://socialbeta.com/campaign/1",
      title: "茶饮联名案例",
      summary: "记录品牌从洞察到传播的完整路径。",
      collectedAt: "2026-07-31T00:00:00.000Z",
      industry: "茶饮",
      contentTags: ["案例"],
      score: 80,
      selectionReason: "信息完整"
    }
  };
  const markdown = buildSavedMarkdown([saved], "2026-07-31");
  expect(markdown).toContain("# 我的营销素材包（2026-07-31 · 1 条）");
  expect(markdown).toContain("可用在茶饮新品策划");
  expect(markdown).toContain("记录品牌从洞察到传播");
  expect(markdown).toContain("https://socialbeta.com/campaign/1");
});
