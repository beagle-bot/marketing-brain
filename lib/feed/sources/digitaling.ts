import { XMLParser } from "fast-xml-parser";
import { fetchText, htmlToText } from "@/lib/feed/http";
import { isNoise, scoreItem } from "@/lib/feed/rules";
import type { MarketingItem, SourceResult } from "@/lib/feed/types";

const FEED_URL = "https://www.digitaling.com/rss";

type RssItem = { title?: string; link?: string; description?: string; pubDate?: string; author?: string };

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function isoDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value.trim());
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function parseDigitaling(xml: string, now = new Date()): MarketingItem[] {
  const parsed = new XMLParser({ trimValues: true }).parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } } };
  const entries = asArray(parsed.rss?.channel?.item);
  if (!parsed.rss?.channel || !entries.length) throw new Error("数英 RSS 结构异常");

  return entries
    .filter((entry) => /^\s*(文章频道|项目频道)\s*-/.test(entry.title ?? ""))
    .map((entry) => {
      const sourceUrl = String(entry.link ?? "").trim();
      const title = htmlToText(String(entry.title ?? "")).replace(/^(文章频道|项目频道)\s*-\s*/, "");
      const base: MarketingItem = {
        id: `Digitaling:${sourceUrl}`,
        source: "Digitaling",
        sourceUrl,
        title,
        summary: htmlToText(String(entry.description ?? "")).slice(0, 420),
        author: htmlToText(String(entry.author ?? "")) || undefined,
        publishedAt: isoDate(entry.pubDate),
        collectedAt: now.toISOString(),
        industry: "其他",
        contentTags: [sourceUrl.includes("/projects/") ? "项目" : "文章"],
        score: 0,
        selectionReason: ""
      };
      return scoreItem(base, now);
    })
    .filter((item) => item.sourceUrl.startsWith("https://www.digitaling.com/") && !isNoise(item));
}

export async function fetchDigitaling(): Promise<SourceResult> {
  try {
    return { source: "Digitaling", items: parseDigitaling(await fetchText(FEED_URL)) };
  } catch (error) {
    return { source: "Digitaling", items: [], error: error instanceof Error ? error.message : String(error) };
  }
}
