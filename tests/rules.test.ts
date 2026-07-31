import { describe, expect, test } from "vitest";
import { classifyIndustry, isNoise, scoreItem } from "@/lib/feed/rules";
import type { MarketingItem } from "@/lib/feed/types";

function item(overrides: Partial<MarketingItem> = {}): MarketingItem {
  return {
    id: "Digitaling:https://example.com/1",
    source: "Digitaling",
    sourceUrl: "https://example.com/1",
    title: "品牌营销案例复盘",
    summary: "一个包含用户洞察、创意执行和社媒传播的完整案例。",
    author: "测试品牌",
    publishedAt: "2026-07-31T00:00:00.000Z",
    collectedAt: "2026-07-31T00:10:00.000Z",
    industry: "其他",
    contentTags: [],
    score: 0,
    selectionReason: "",
    ...overrides
  };
}

describe("classifyIndustry", () => {
  test("使用梅花网原生分类判定医药", () => {
    expect(classifyIndustry(item({ nativeCategory: "药品诊疗" }))).toBe("医药");
  });

  test("原生分类缺失时用茶饮关键词补充", () => {
    expect(classifyIndustry(item({ title: "瑞幸联名上新夏日果茶" }))).toBe("茶饮");
  });

  test("无法判定时返回其他", () => {
    expect(classifyIndustry(item({ title: "一场关于生活的新展览", summary: "记录展览现场。", author: undefined }))).toBe("其他");
  });
});

describe("isNoise", () => {
  test("排除招聘内容", () => {
    expect(isNoise(item({ title: "招聘频道 - 创意总监" }))).toBe(true);
  });

  test("保留有完整摘要的营销案例", () => {
    expect(isNoise(item())).toBe(false);
  });
});

describe("scoreItem", () => {
  test("案例复盘比简短公关通稿得分高", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const caseScore = scoreItem(item(), now).score;
    const releaseScore = scoreItem(item({ title: "公司荣获年度大奖", summary: "公司获奖。", author: undefined }), now).score;
    expect(caseScore).toBeGreaterThan(releaseScore);
  });
});
