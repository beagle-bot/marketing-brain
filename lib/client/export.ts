import type { SavedItem } from "@/lib/client/types";

export function buildSavedMarkdown(items: SavedItem[], dateLabel = new Date().toISOString().slice(0, 10)) {
  const sorted = [...items].sort((a, b) => b.rating - a.rating || b.savedAt.localeCompare(a.savedAt));
  const blocks = sorted.map((saved, index) => {
    const item = saved.itemSnapshot;
    return [
      `## ${index + 1}. ${item.title}`,
      `- 行业：${saved.savedIndustry}`,
      `- 来源：${item.source}`,
      `- 有用性：${"★".repeat(saved.rating)}${"☆".repeat(5 - saved.rating)}`,
      saved.note ? `- 我的备注：${saved.note}` : "",
      item.summary ? `- 摘要：${item.summary}` : "",
      `- 原文：${item.sourceUrl}`
    ]
      .filter(Boolean)
      .join("\n");
  });
  return [`# 我的营销素材包（${dateLabel} · ${sorted.length} 条）`, "", "> 以下内容经过人工筛选，请优先参考“我的备注”。", "", blocks.join("\n\n")].join("\n");
}
