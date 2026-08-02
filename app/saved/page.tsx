"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useBrain } from "@/components/BrainProvider";
import { EmptyState } from "@/components/EmptyState";
import { SaveSheet } from "@/components/SaveSheet";
import { buildSavedMarkdown } from "@/lib/client/export";
import { filterSavedItems, type SavedIndustryFilter } from "@/lib/client/filter";
import { INDUSTRIES } from "@/lib/feed/types";

export default function SavedPage() {
  const { state, hydrated, remember, removeSaved } = useBrain();
  const [editingId, setEditingId] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [industryFilter, setIndustryFilter] = useState<SavedIndustryFilter>("全部");
  const editing = state.saved.find((entry) => entry.itemId === editingId);
  const visibleItems = filterSavedItems(state.saved, industryFilter);
  if (!hydrated) return null;
  if (!state.saved.length) return <EmptyState title="还没有收藏" body="在 Feed 里点击收藏，或者向右滑动卡片。" action={<Link href="/" className="inline-flex h-10 items-center rounded-card bg-ink px-4 text-sm font-semibold text-paper">回到 Feed</Link>} />;

  async function copyMarkdown() {
    await navigator.clipboard.writeText(buildSavedMarkdown(state.saved));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <section className="mb-5 flex items-start justify-between gap-3">
        <div><h1 className="font-serif text-xl font-semibold text-ink">收藏</h1><p className="mt-1 text-sm text-muted">{state.saved.length} 条人工筛选的营销素材</p></div>
        <button type="button" onClick={copyMarkdown} className="inline-flex h-9 items-center gap-1.5 rounded-card border border-line px-3 text-xs text-muted hover:text-ink">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "已复制" : "导出 Markdown"}</button>
      </section>
      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="按行业筛选收藏">
        {(["全部", ...INDUSTRIES] as SavedIndustryFilter[]).map((industry) => (
          <button
            key={industry}
            type="button"
            onClick={() => setIndustryFilter(industry)}
            aria-pressed={industryFilter === industry}
            className={`shrink-0 rounded-card border px-3 py-2 text-xs transition-colors ${industryFilter === industry ? "border-ink bg-ink text-paper" : "border-line bg-card text-muted hover:text-ink"}`}
          >
            {industry}
          </button>
        ))}
      </div>
      {!visibleItems.length ? (
        <EmptyState title={`还没有${industryFilter}收藏`} body="可以编辑已有收藏的行业，或回到 Feed 继续沉淀案例。" action={<button type="button" onClick={() => setIndustryFilter("全部")} className="text-sm underline">查看全部收藏</button>} />
      ) : (
      <div className="space-y-3">
        {visibleItems.map((saved) => {
          const item = saved.itemSnapshot;
          return (
            <article key={saved.itemId} className="rounded-card border border-line bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3 text-xs text-faint"><span className="inline-flex items-center gap-2"><span className="rounded-full border border-line bg-paper px-2 py-1 font-medium text-ink">{saved.savedIndustry}</span><span>{item.source}</span></span><span className="inline-flex">{[1,2,3,4,5].map((value) => <Star key={value} className={value <= saved.rating ? "text-ink" : "text-line"} fill={value <= saved.rating ? "currentColor" : "none"} style={{ width: 12, height: 12 }} />)}</span></div>
              <button type="button" onClick={() => setEditingId(saved.itemId)} className="mt-2 block w-full text-left"><h2 className="font-serif text-base font-semibold leading-6 text-ink">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{saved.note || item.summary}</p></button>
              <div className="mt-3 flex items-center justify-between"><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-faint hover:text-ink"><ExternalLink className="h-3.5 w-3.5" />打开原文</a><button type="button" onClick={() => removeSaved(saved.itemId)} className="inline-flex items-center gap-1 text-xs text-faint hover:text-clay"><Trash2 className="h-3.5 w-3.5" />删除</button></div>
            </article>
          );
        })}
      </div>
      )}
      <SaveSheet item={editing?.itemSnapshot} initialIndustry={editing?.savedIndustry} initialRating={editing?.rating} initialNote={editing?.note} onClose={() => setEditingId(undefined)} onConfirm={(industry, rating, note) => { if (editing) remember(editing.itemSnapshot, industry, rating, note); setEditingId(undefined); }} />
    </>
  );
}
