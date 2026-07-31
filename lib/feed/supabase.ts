import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FeedRepository } from "@/lib/feed/refresh";
import type { FeedBatch, MarketingItem, SourceCounts, SourceName } from "@/lib/feed/types";

type BatchRow = {
  id: string;
  batch_date: string;
  generated_at: string;
  source_counts: SourceCounts;
  source_errors: Partial<Record<SourceName, string>>;
  marketing_feed_items?: ItemRow[];
};

type ItemRow = {
  item_id: string;
  source: SourceName;
  source_url: string;
  title: string;
  summary: string;
  author?: string | null;
  published_at?: string | null;
  collected_at: string;
  native_category?: string | null;
  industry: MarketingItem["industry"];
  content_tags: string[];
  rule_score: number;
  selection_reason: string;
  cover_url?: string | null;
  position: number;
};

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function itemFromRow(row: ItemRow): MarketingItem {
  return {
    id: row.item_id,
    source: row.source,
    sourceUrl: row.source_url,
    title: row.title,
    summary: row.summary,
    author: row.author ?? undefined,
    publishedAt: row.published_at ?? undefined,
    collectedAt: row.collected_at,
    nativeCategory: row.native_category ?? undefined,
    industry: row.industry,
    contentTags: row.content_tags ?? [],
    score: row.rule_score,
    selectionReason: row.selection_reason,
    coverUrl: row.cover_url ?? undefined
  };
}

function batchFromRow(row: BatchRow): FeedBatch {
  return {
    batchDate: row.batch_date,
    generatedAt: row.generated_at,
    items: [...(row.marketing_feed_items ?? [])].sort((a, b) => a.position - b.position).map(itemFromRow),
    sourceCounts: row.source_counts,
    sourceErrors: row.source_errors ?? {}
  };
}

export class SupabaseFeedRepository implements FeedRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getLatestBatch() {
    const { data, error } = await this.client
      .from("marketing_feed_batches")
      .select("*, marketing_feed_items(*)")
      .eq("status", "success")
      .order("batch_date", { ascending: false })
      .order("position", { referencedTable: "marketing_feed_items", ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Supabase 读取批次失败: ${error.message}`);
    return data ? batchFromRow(data as BatchRow) : null;
  }

  async getRecentItemIds() {
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const { data, error } = await this.client.from("marketing_feed_items").select("item_id, marketing_feed_batches!inner(batch_date)").gte("marketing_feed_batches.batch_date", cutoff);
    if (error) throw new Error(`Supabase 读取去重记录失败: ${error.message}`);
    return new Set((data ?? []).map((row) => String(row.item_id)));
  }

  async saveBatch(batch: FeedBatch) {
    const { data, error } = await this.client
      .from("marketing_feed_batches")
      .upsert(
        {
          batch_date: batch.batchDate,
          generated_at: batch.generatedAt,
          status: "success",
          item_count: batch.items.length,
          source_counts: batch.sourceCounts,
          source_errors: batch.sourceErrors
        },
        { onConflict: "batch_date" }
      )
      .select("id")
      .single();
    if (error || !data) throw new Error(`Supabase 保存批次失败: ${error?.message ?? "missing batch id"}`);

    const batchId = String(data.id);
    const deletion = await this.client.from("marketing_feed_items").delete().eq("batch_id", batchId);
    if (deletion.error) throw new Error(`Supabase 替换批次条目失败: ${deletion.error.message}`);
    const rows = batch.items.map((item, position) => ({
      batch_id: batchId,
      item_id: item.id,
      source: item.source,
      source_url: item.sourceUrl,
      title: item.title,
      summary: item.summary,
      author: item.author,
      published_at: item.publishedAt,
      collected_at: item.collectedAt,
      native_category: item.nativeCategory,
      industry: item.industry,
      content_tags: item.contentTags,
      rule_score: item.score,
      selection_reason: item.selectionReason,
      cover_url: item.coverUrl,
      position
    }));
    const insertion = await this.client.from("marketing_feed_items").insert(rows);
    if (insertion.error) throw new Error(`Supabase 保存批次条目失败: ${insertion.error.message}`);
    return batch;
  }
}

export function getSupabaseRepository() {
  const client = serverClient();
  return client ? new SupabaseFeedRepository(client) : null;
}
