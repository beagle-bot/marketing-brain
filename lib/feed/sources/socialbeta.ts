import { fetchText, htmlToText } from "@/lib/feed/http";
import { scoreItem } from "@/lib/feed/rules";
import type { MarketingItem, SourceResult } from "@/lib/feed/types";

const CASE_URL = "https://socialbeta.com/case";

function toIsoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function campaignItems(html: string, now: Date) {
  const items: MarketingItem[] = [];
  const pattern = /<div class="box"[^>]*onclick="location='(https:\/\/socialbeta\.com\/campaign\/\d+)'"[^>]*>([\s\S]*?)<div class="cont">([\s\S]*?)<\/div>\s*<\/div>/g;
  for (const match of html.matchAll(pattern)) {
    const url = match[1];
    const titleBlock = match[2].match(/<div class="tit">([\s\S]*?)<\/div>/)?.[1] ?? "";
    const titleText = htmlToText(titleBlock);
    const brand = htmlToText(titleBlock.match(/<span[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
    const title = titleText.slice(brand.length).trim() || titleText;
    const coverUrl = match[2].match(/background:url\('([^']+)'\)/)?.[1];
    const base: MarketingItem = {
      id: `SocialBeta:${url}`,
      source: "SocialBeta",
      sourceUrl: url,
      title,
      summary: htmlToText(match[3]).slice(0, 420),
      author: brand || "SocialBeta",
      collectedAt: now.toISOString(),
      industry: "其他",
      contentTags: ["campaign", "案例"],
      score: 0,
      selectionReason: "",
      coverUrl
    };
    items.push(scoreItem(base, now));
  }
  return items;
}

function articleItems(html: string, now: Date) {
  const items: MarketingItem[] = [];
  const pattern = /<li>\s*<a href="(https:\/\/socialbeta\.com\/article\/\d+)"[\s\S]*?<div class="name"><em class="r">(\d{4}-\d{2}-\d{2})<\/em>[\s\S]*?<a href="\1" class="tit">([\s\S]*?)<\/a>\s*<\/li>/g;
  for (const match of html.matchAll(pattern)) {
    const title = htmlToText(match[3]);
    const base: MarketingItem = {
      id: `SocialBeta:${match[1]}`,
      source: "SocialBeta",
      sourceUrl: match[1],
      title,
      summary: `SocialBeta 案例研究：${title}`,
      author: "SocialBeta",
      publishedAt: toIsoDate(match[2]),
      collectedAt: now.toISOString(),
      industry: "其他",
      contentTags: ["案例研究"],
      score: 0,
      selectionReason: ""
    };
    items.push(scoreItem(base, now));
  }
  return items;
}

export function parseSocialBetaCase(html: string, now = new Date()): MarketingItem[] {
  if (!html.includes("socialbeta.com") || !html.includes("案例")) throw new Error("SocialBeta 案例页结构异常");
  const seen = new Set<string>();
  return [...campaignItems(html, now), ...articleItems(html, now)].filter((item) => {
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
}

export async function fetchSocialBeta(): Promise<SourceResult> {
  try {
    const pages = await Promise.all([1, 2, 3, 4].map((page) => fetchText(page === 1 ? CASE_URL : `${CASE_URL}?page=${page}`)));
    const seen = new Set<string>();
    const items = pages.flatMap((html) => parseSocialBetaCase(html)).filter((item) => {
      if (seen.has(item.sourceUrl)) return false;
      seen.add(item.sourceUrl);
      return true;
    });
    return { source: "SocialBeta", items };
  } catch (error) {
    return { source: "SocialBeta", items: [], error: error instanceof Error ? error.message : String(error) };
  }
}
