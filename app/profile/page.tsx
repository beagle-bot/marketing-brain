"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useBrain } from "@/components/BrainProvider";
import type { MarketingProfile } from "@/lib/client/types";
import type { Industry } from "@/lib/feed/types";

const industries: Industry[] = ["互联网", "硬件", "医药", "汽车", "金融", "快时尚", "茶饮"];

export default function ProfilePage() {
  const { state, saveProfile, hydrated } = useBrain();
  const [draft, setDraft] = useState<MarketingProfile>(state.profile);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(state.profile), [state.profile]);
  if (!hydrated) return null;

  function toggle(industry: Industry) {
    setDraft((current) => ({ ...current, preferredIndustries: current.preferredIndustries.includes(industry) ? current.preferredIndustries.filter((value) => value !== industry) : [...current.preferredIndustries, industry] }));
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      <section><h1 className="font-serif text-xl font-semibold text-ink">我</h1><p className="mt-1 text-sm leading-6 text-muted">偏好、收藏和备注都保存在当前浏览器，不会发送给 AI。</p></section>
      <section className="rounded-card border border-line bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink">关注行业</h2><p className="mt-1 text-xs text-faint">仅作为你的本地记录，首版不会影响每日 30 条的配额。</p>
        <div className="mt-4 flex flex-wrap gap-2">{industries.map((industry) => <button key={industry} type="button" onClick={() => toggle(industry)} className={`rounded-card border px-3 py-2 text-sm ${draft.preferredIndustries.includes(industry) ? "border-ink bg-ink text-paper" : "border-line text-muted"}`}>{industry}</button>)}</div>
      </section>
      <section className="rounded-card border border-line bg-card p-5 shadow-card"><label><span className="text-sm font-semibold text-ink">我的营销关注说明</span><textarea value={draft.customDescription} onChange={(event) => { setDraft({ ...draft, customDescription: event.target.value }); setSaved(false); }} placeholder="例如：我关心低预算、高话题性的社媒创意。" className="mt-3 min-h-32 w-full resize-none rounded-card border border-line bg-paper px-3 py-2.5 text-sm leading-6 outline-none focus:border-ink" /></label></section>
      <button type="button" onClick={() => { saveProfile(draft); setSaved(true); }} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-card bg-ink text-sm font-semibold text-paper"><Save className="h-4 w-4" />{saved ? "已保存" : "保存偏好"}</button>
    </div>
  );
}
