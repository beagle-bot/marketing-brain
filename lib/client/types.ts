import type { Industry, MarketingItem } from "@/lib/feed/types";

export type Rating = 1 | 2 | 3 | 4 | 5;

export type SavedItem = {
  itemId: string;
  itemSnapshot: MarketingItem;
  savedIndustry: Industry;
  rating: Rating;
  note: string;
  savedAt: string;
};

export type MarketingProfile = {
  preferredIndustries: Industry[];
  customDescription: string;
};

export type ClientState = {
  saved: SavedItem[];
  skippedIds: string[];
  profile: MarketingProfile;
};
