"use client";

import { useState } from "react";
import { useBrain } from "@/components/BrainProvider";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SaveSheet } from "@/components/SaveSheet";

export default function FeedPage() {
  const { batch, feedItems, feedMode, hydrated, remember, skip, reset } = useBrain();
  const [pendingId, setPendingId] = useState<string>();
  const pending = feedItems.find((item) => item.id === pendingId);
  const dailyCount = batch ? Object.values(batch.sourceCounts).reduce((total, count) => total + count, 0) : 0;
  if (!hydrated || feedMode === "loading") return <p className="pt-20 text-center text-sm text-faint">正在准备今天的营销案例…</p>;
  if (!feedItems.length) return <EmptyState title="待浏览内容已经刷完" body="已收藏或略过所有条目，明早会新增 30 条。" action={<button onClick={reset} className="text-sm underline">重新浏览</button>} />;

  return (
    <>
      <section className="mb-6">
        <div className="flex items-end justify-between gap-3"><div><h1 className="font-serif text-xl font-semibold text-ink">待浏览案例</h1><p className="mt-1 text-sm text-muted">{batch?.batchDate ?? "当日"} · 今日新增 {dailyCount} 条 · 当前待浏览 {feedItems.length} 条</p></div><span className="text-xs text-faint">{feedMode === "live" ? "实时批次" : feedMode === "cached" ? "最近缓存" : "示例批次"}</span></div>
        {feedMode === "fallback" ? <p className="mt-3 rounded-card border border-dashed border-line px-3 py-2 text-xs text-faint">数据库尚未配置，当前展示无 token 成本的本地示例。</p> : null}
      </section>
      <div className="space-y-5">
        {feedItems.map((item) => <ItemCard key={item.id} item={item} onSave={() => setPendingId(item.id)} onSkip={() => skip(item.id)} />)}
        <p className="pt-2 text-center text-xs text-faint">右滑收藏 · 左滑略过</p>
      </div>
      <SaveSheet item={pending} onClose={() => setPendingId(undefined)} onConfirm={(industry, rating, note) => { if (pending) remember(pending, industry, rating, note); setPendingId(undefined); }} />
    </>
  );
}
