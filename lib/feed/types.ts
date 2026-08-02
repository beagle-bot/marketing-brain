export type SourceName = "SocialBeta" | "Meihua" | "Digitaling";

export const INDUSTRIES = ["快时尚", "美妆", "汽车", "医药", "智能硬件", "金融", "互联网", "茶饮", "其他"] as const;

export type Industry = (typeof INDUSTRIES)[number];

export function isIndustry(value: unknown): value is Industry {
  return typeof value === "string" && (INDUSTRIES as readonly string[]).includes(value);
}

export type MarketingItem = {
  id: string;
  source: SourceName;
  sourceUrl: string;
  title: string;
  summary: string;
  author?: string;
  publishedAt?: string;
  collectedAt: string;
  nativeCategory?: string;
  industry: Industry;
  contentTags: string[];
  score: number;
  selectionReason: string;
  coverUrl?: string;
};

export type SourceResult = {
  source: SourceName;
  items: MarketingItem[];
  error?: string;
};

export type SourceCounts = Record<SourceName, number>;

export type FeedBatch = {
  batchDate: string;
  generatedAt: string;
  items: MarketingItem[];
  sourceCounts: SourceCounts;
  sourceErrors: Partial<Record<SourceName, string>>;
};
