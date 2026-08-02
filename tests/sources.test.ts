import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parseDigitaling } from "@/lib/feed/sources/digitaling";
import { parseMeihuaShots } from "@/lib/feed/sources/meihua";
import { parseSocialBetaCase } from "@/lib/feed/sources/socialbeta";

function fixture(name: string) {
  return readFileSync(join(process.cwd(), "data", "fixtures", name), "utf8");
}

describe("parseDigitaling", () => {
  test("仅返回文章和项目频道的干净内容", () => {
    const items = parseDigitaling(fixture("digitaling.xml"), new Date("2026-07-31T02:00:00.000Z"));
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      source: "Digitaling",
      title: "一次夏日茶饮联名复盘",
      author: "数英编辑部",
      sourceUrl: "https://www.digitaling.com/articles/1001.html"
    });
    expect(items[0].summary).toContain("用户洞察");
    expect(items.some((item) => item.sourceUrl.includes("/jobs/"))).toBe(false);
  });
});

describe("parseSocialBetaCase", () => {
  test("解析 campaign 和案例文章并按 URL 去重", () => {
    const items = parseSocialBetaCase(fixture("socialbeta-case.html"), new Date("2026-07-31T02:00:00.000Z"));
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ source: "SocialBeta", author: "霸王茶姬", sourceUrl: "https://socialbeta.com/campaign/28022" });
    expect(items[0].title).toContain("chagee imagine");
    expect(items[0].summary).toContain("社交货币");
    expect(items[2]).toMatchObject({ title: "本周值得关注的 6 个品牌营销案例", publishedAt: "2026-07-24T16:00:00.000Z" });
  });
});

describe("parseMeihuaShots", () => {
  test("从 NEXT_DATA 读取品牌、分类和作品链接", () => {
    const items = parseMeihuaShots(fixture("meihua-shots.html"), new Date("2026-07-31T02:00:00.000Z"));
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      source: "Meihua",
      author: "美团",
      nativeCategory: "网站与软件",
      sourceUrl: "https://www.meihua.info/shots/6901056276448256"
    });
    expect(items[2].industry).toBe("智能硬件");
  });

  test("结构缺失时显式报错", () => {
    expect(() => parseMeihuaShots("<html></html>")).toThrow("梅花网页面缺少 __NEXT_DATA__");
  });
});
