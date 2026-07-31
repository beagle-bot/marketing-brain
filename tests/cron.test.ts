import { describe, expect, test } from "vitest";
import { handleCronRequest } from "@/lib/feed/cron";
import type { FeedBatch } from "@/lib/feed/types";

const batch: FeedBatch = {
  batchDate: "2026-07-31",
  generatedAt: "2026-07-31T00:00:00.000Z",
  items: [],
  sourceCounts: { SocialBeta: 0, Meihua: 0, Digitaling: 0 },
  sourceErrors: {}
};

describe("handleCronRequest", () => {
  test("配置密钥后拒绝缺失的 bearer token", async () => {
    const result = await handleCronRequest(new Request("https://example.com/api/cron/refresh"), {
      secret: "a-secure-secret",
      refresh: async () => ({ status: "refreshed", batch })
    });
    expect(result).toEqual({ status: 401, body: { ok: false, error: "Unauthorized" } });
  });

  test("拒绝错误的 bearer token", async () => {
    const request = new Request("https://example.com/api/cron/refresh", { headers: { Authorization: "Bearer wrong" } });
    const result = await handleCronRequest(request, {
      secret: "a-secure-secret",
      refresh: async () => ({ status: "refreshed", batch })
    });
    expect(result.status).toBe(401);
  });

  test("正确 token 触发刷新并返回批次摘要", async () => {
    const request = new Request("https://example.com/api/cron/refresh", { headers: { Authorization: "Bearer a-secure-secret" } });
    const result = await handleCronRequest(request, {
      secret: "a-secure-secret",
      refresh: async () => ({ status: "refreshed", batch: { ...batch, items: [{ id: "one" } as never] } })
    });
    expect(result).toEqual({
      status: 200,
      body: { ok: true, status: "refreshed", batchDate: "2026-07-31", itemCount: 1, sourceErrors: {} }
    });
  });
});
