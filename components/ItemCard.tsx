"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import type { MarketingItem } from "@/lib/feed/types";

const SWIPE_THRESHOLD = 72;
const SWIPE_LIMIT = 132;

export function ItemCard({ item, onSave, onSkip }: { item: MarketingItem; onSave: () => void; onSkip: () => void }) {
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [leaving, setLeaving] = useState(false);

  function reset() {
    pointerId.current = null;
    setDragX(0);
  }

  function pointerDown(event: PointerEvent<HTMLElement>) {
    startX.current = event.clientX;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;
    setDragX(Math.max(-SWIPE_LIMIT, Math.min(SWIPE_LIMIT, event.clientX - startX.current)));
  }

  function pointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (dragX >= SWIPE_THRESHOLD) {
      window.setTimeout(onSave, 100);
      reset();
    } else if (dragX <= -SWIPE_THRESHOLD) {
      setLeaving(true);
      window.setTimeout(onSkip, 180);
    } else reset();
  }

  return (
    <div className="relative overflow-hidden rounded-card">
      <div className="absolute inset-0 flex items-center justify-between border border-dashed border-line px-5 text-xs text-faint">
        <span>收藏</span><span>略过</span>
      </div>
      <article
        className="swipe-card relative rounded-card border border-line bg-card p-5 shadow-card"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={reset}
        style={leaving ? { transform: "translateX(-130%)", opacity: 0, transition: "180ms ease-in" } : { transform: `translateX(${dragX}px)`, transition: pointerId.current ? "none" : "180ms ease" }}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
          <span>{item.source}</span><span>·</span><span>{item.author ?? "未署名品牌"}</span>
          <span className="rounded-full bg-paper px-2 py-0.5 text-muted">{item.industry}</span>
        </div>
        <h2 className="mt-2.5 font-serif text-lg font-semibold leading-7 text-ink">{item.title}</h2>
        <p className="feed-card-summary mt-2 text-sm leading-6 text-muted">{item.summary}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" onPointerDown={(event) => event.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs text-faint hover:text-ink">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />打开原文
          </a>
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onSave} className="inline-flex h-9 items-center gap-1.5 rounded-card bg-ink px-3 text-xs font-semibold text-paper">
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />收藏
          </button>
        </div>
      </article>
    </div>
  );
}
