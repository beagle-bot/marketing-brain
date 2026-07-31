import { fetchText } from "@/lib/feed/http";
import { isNoise, scoreItem } from "@/lib/feed/rules";
import type { MarketingItem, SourceResult } from "@/lib/feed/types";

const SHOTS_URL = "https://www.meihua.info/shots";

type MeihuaShot = {
  compositionId?: number | string;
  brandName?: string | null;
  categoryName?: string | null;
  title?: string;
  summary?: string;
  gmtPublish?: number;
  cover?: string;
};

export function parseMeihuaShots(html: string, now = new Date()): MarketingItem[] {
  const match = html.match(/__NEXT_DATA__\s*=\s*(\{[\s\S]*?\});__NEXT_LOADED_PAGES__/);
  if (!match) throw new Error("梅花网页面缺少 __NEXT_DATA__");
  const payload = JSON.parse(match[1]) as {
    props?: { initialMobxState?: { shotsStore?: { shotsData?: { list?: MeihuaShot[] } } } };
  };
  const shots = payload.props?.initialMobxState?.shotsStore?.shotsData?.list;
  if (!Array.isArray(shots) || !shots.length) throw new Error("梅花网作品列表结构异常");

  return shots
    .map((shot) => {
      const id = String(shot.compositionId ?? "");
      const sourceUrl = `https://www.meihua.info/shots/${id}`;
      const base: MarketingItem = {
        id: `Meihua:${sourceUrl}`,
        source: "Meihua",
        sourceUrl,
        title: String(shot.title ?? "").trim(),
        summary: String(shot.summary ?? "").trim().slice(0, 420),
        author: shot.brandName?.trim() || undefined,
        publishedAt: typeof shot.gmtPublish === "number" ? new Date(shot.gmtPublish).toISOString() : undefined,
        collectedAt: now.toISOString(),
        nativeCategory: shot.categoryName?.trim() || undefined,
        industry: "其他",
        contentTags: ["作品", "案例"],
        score: 0,
        selectionReason: "",
        coverUrl: shot.cover
      };
      return scoreItem(base, now);
    })
    .filter((item) => /\/shots\/\d+$/.test(item.sourceUrl) && item.title.length > 0 && !isNoise(item));
}

export async function fetchMeihua(): Promise<SourceResult> {
  try {
    return { source: "Meihua", items: parseMeihuaShots(await fetchText(SHOTS_URL)) };
  } catch (error) {
    return { source: "Meihua", items: [], error: error instanceof Error ? error.message : String(error) };
  }
}
