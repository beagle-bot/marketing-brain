import { expect, test } from "vitest";
import { filterSavedItems } from "@/lib/client/filter";
import type { SavedItem } from "@/lib/client/types";

function saved(itemId: string, savedIndustry: SavedItem["savedIndustry"]): SavedItem {
  return {
    itemId,
    savedIndustry,
    rating: 4,
    note: `${savedIndustry}备注`,
    savedAt: "2026-08-02T00:00:00.000Z",
    itemSnapshot: {
      id: itemId,
      source: "SocialBeta",
      sourceUrl: `https://example.com/${itemId}`,
      title: `${itemId}营销案例`,
      summary: "一条用于测试行业筛选的完整案例摘要。",
      collectedAt: "2026-08-02T00:00:00.000Z",
      industry: "互联网",
      contentTags: ["案例"],
      score: 80,
      selectionReason: "信息完整"
    }
  };
}

test("按用户手动行业筛选而不是 Feed 参考行业", () => {
  const items = [saved("beauty", "美妆"), saved("auto", "汽车")];
  expect(filterSavedItems(items, "美妆").map((entry) => entry.itemId)).toEqual(["beauty"]);
  expect(filterSavedItems(items, "全部")).toHaveLength(2);
});
