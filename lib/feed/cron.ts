import type { RefreshResult } from "@/lib/feed/refresh";

export type CronDependencies = {
  secret?: string;
  refresh: () => Promise<RefreshResult>;
};

export async function handleCronRequest(request: Request, dependencies: CronDependencies) {
  if (dependencies.secret && request.headers.get("authorization") !== `Bearer ${dependencies.secret}`) {
    return { status: 401, body: { ok: false as const, error: "Unauthorized" } };
  }
  const result = await dependencies.refresh();
  return {
    status: 200,
    body: {
      ok: true as const,
      status: result.status,
      batchDate: result.batch.batchDate,
      itemCount: result.batch.items.length,
      sourceErrors: result.batch.sourceErrors
    }
  };
}
