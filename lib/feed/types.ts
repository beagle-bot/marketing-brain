export type SourceName = "SocialBeta" | "Meihua" | "Digitaling";

export type Industry = "互联网" | "硬件" | "医药" | "汽车" | "金融" | "快时尚" | "茶饮" | "其他";

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
