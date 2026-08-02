import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { SaveSheet } from "@/components/SaveSheet";
import type { MarketingItem } from "@/lib/feed/types";

const item: MarketingItem = {
  id: "case-1",
  source: "SocialBeta",
  sourceUrl: "https://example.com/case-1",
  title: "需要手动选择行业的案例",
  summary: "测试收藏表单在没有选择行业时仍然能够运行客户端校验。",
  collectedAt: "2026-08-02T00:00:00.000Z",
  industry: "其他",
  contentTags: ["案例"],
  score: 60,
  selectionReason: "测试"
};

test("未选行业时确认按钮仍可点击以显示表单错误", () => {
  vi.stubGlobal("React", React);
  const html = renderToStaticMarkup(React.createElement(SaveSheet, { item, onClose: () => undefined, onConfirm: () => undefined }));
  const confirmButton = html.match(/<button[^>]*>确认收藏<\/button>/)?.[0];
  expect(confirmButton).toBeDefined();
  expect(confirmButton).not.toContain("aria-disabled");
  expect(confirmButton).not.toContain(" disabled");
});
