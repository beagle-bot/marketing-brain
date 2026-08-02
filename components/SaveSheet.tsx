"use client";

import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Rating } from "@/lib/client/types";
import { INDUSTRIES, type Industry, type MarketingItem } from "@/lib/feed/types";

export function SaveSheet({ item, initialIndustry, initialRating = 3, initialNote = "", onClose, onConfirm }: { item?: MarketingItem; initialIndustry?: Industry; initialRating?: Rating; initialNote?: string; onClose: () => void; onConfirm: (industry: Industry, rating: Rating, note: string) => void }) {
  const [industry, setIndustry] = useState<Industry | undefined>(initialIndustry);
  const [rating, setRating] = useState<Rating>(initialRating);
  const [note, setNote] = useState(initialNote);
  const [industryError, setIndustryError] = useState(false);
  useEffect(() => {
    setIndustry(initialIndustry);
    setRating(initialRating);
    setNote(initialNote);
    setIndustryError(false);
  }, [item?.id, initialIndustry, initialRating, initialNote]);
  if (!item) return null;

  function confirm() {
    if (!industry) {
      setIndustryError(true);
      return;
    }
    onConfirm(industry, rating, note);
  }

  return (
    <div className="animate-overlay-in fixed inset-0 z-40 flex items-end bg-ink/30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="animate-sheet-up mx-auto w-full max-w-screen-sm rounded-card border border-line bg-paper p-5 shadow-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="font-serif text-lg font-semibold text-ink">收藏这个案例</h2><p className="mt-1 line-clamp-1 text-xs text-faint">{item.title}</p></div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center text-faint" aria-label="关闭"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">选择行业 <span className="font-normal text-clay">必选</span></p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="收藏行业">
            {INDUSTRIES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={industry === value}
                onClick={() => { setIndustry(value); setIndustryError(false); }}
                className={`rounded-card border px-3 py-2 text-sm transition-colors ${industry === value ? "border-ink bg-ink text-paper" : "border-line bg-paper text-muted hover:border-ink hover:text-ink"}`}
              >
                {value}
              </button>
            ))}
          </div>
          {industryError ? <p className="mt-2 text-xs text-clay" role="alert">请选择行业</p> : null}
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">对你有多有用？</p>
          <div className="mt-2 flex gap-1">
            {([1, 2, 3, 4, 5] as Rating[]).map((value) => (
              <button key={value} type="button" onClick={() => setRating(value)} className="inline-flex h-9 w-9 items-center justify-center" aria-label={`${value} 星`}>
                <Star className={value <= rating ? "text-ink" : "text-line"} fill={value <= rating ? "currentColor" : "none"} style={{ width: 22, height: 22 }} />
              </button>
            ))}
          </div>
        </div>
        <label className="mt-4 block"><span className="text-sm font-semibold text-ink">我的备注</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="它能用在什么地方？" className="mt-2 min-h-24 w-full resize-none rounded-card border border-line bg-card px-3 py-2.5 text-sm leading-6 outline-none focus:border-ink" /></label>
        <button type="button" onClick={confirm} aria-disabled={!industry} className={`mt-5 inline-flex h-11 w-full items-center justify-center rounded-card text-sm font-semibold ${industry ? "bg-ink text-paper" : "bg-line text-muted"}`}>确认收藏</button>
      </section>
    </div>
  );
}
