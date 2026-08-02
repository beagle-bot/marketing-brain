import type { SavedItem } from "@/lib/client/types";
import type { Industry } from "@/lib/feed/types";

export type SavedIndustryFilter = Industry | "全部";

export function filterSavedItems(items: SavedItem[], industry: SavedIndustryFilter) {
  return industry === "全部" ? items : items.filter((item) => item.savedIndustry === industry);
}
