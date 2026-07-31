"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useBrain } from "@/components/BrainProvider";
import { EmptyState } from "@/components/EmptyState";
import { SaveSheet } from "@/components/SaveSheet";
import { buildSavedMarkdown } from "@/lib/client/export";

export default function SavedPage() {
  const { state, hydrated, remember, removeSaved } = useBrain();
  const [editingId, setEditingId] = useState<string>();
  const [copied, setCopied] = useState(false);
  const editing = state.saved.find((entry) => entry.itemId === editingId);
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
      <div className="space-y-3">
        {state.saved.map((saved) => {
          const item = saved.itemSnapshot;
          return (
            <article key={saved.itemId} className="rounded-card border border-line bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3 text-xs text-faint"><span>{item.source} · {item.industry}</span><span className="inline-flex">{[1,2,3,4,5].map((value) => <Star key={value} className={value <= saved.rating ? "text-ink" : "text-line"} fill={value <= saved.rating ? "currentColor" : "none"} style={{ width: 12, height: 12 }} />)}</span></div>
              <button type="button" onClick={() => setEditingId(saved.itemId)} className="mt-2 block w-full text-left"><h2 className="font-serif text-base font-semibold leading-6 text-ink">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{saved.note || item.summary}</p></button>
              <div className="mt-3 flex items-center justify-between"><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-faint hover:text-ink"><ExternalLink className="h-3.5 w-3.5" />打开原文</a><button type="button" onClick={() => removeSaved(saved.itemId)} className="inline-flex items-center gap-1 text-xs text-faint hover:text-clay"><Trash2 className="h-3.5 w-3.5" />删除</button></div>
            </article>
          );
        })}
      </div>
      <SaveSheet item={editing?.itemSnapshot} initialRating={editing?.rating} initialNote={editing?.note} onClose={() => setEditingId(undefined)} onConfirm={(rating, note) => { if (editing) remember(editing.itemSnapshot, rating, note); setEditingId(undefined); }} />
    </>
  );
}
