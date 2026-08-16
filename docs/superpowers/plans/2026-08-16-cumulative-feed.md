# Cumulative Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every untouched historical marketing item in Feed while adding the newest daily batch, without changing save, skip, category, note, or collection behavior.

**Architecture:** Add a pure archive module that paginates records and combines successful daily batches in newest-first order. The Supabase repository exposes an archive read used only by `/api/items`; the existing latest-batch read remains unchanged for cron idempotency. The client receives the same `FeedBatch` shape, so `BrainProvider` continues filtering saved and left-swiped item IDs exactly as it does today.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase JavaScript client, Vitest, Vercel Cron.

## Global Constraints

- Keep the existing left-swipe gesture, skip state, save flow, manual industry, rating, note, profile, and Markdown export behavior unchanged.
- Saved items remain available only on the Saved page and are filtered out of Feed.
- Untouched historical items remain in Feed; each daily refresh adds up to 30 new items.
- Keep `getLatestBatch()` for refresh idempotency and do not change the cron schedule, feed sources, quotas, or database schema.
- Duplicate item IDs across daily batches keep only the newest occurrence.
- Continue using browser `localStorage` for saved and skipped state; cross-device synchronization is out of scope.

---

### Task 1: Historical Batch Aggregation

**Files:**
- Create: `lib/feed/archive.ts`
- Create: `tests/archive.test.ts`

**Interfaces:**
- Consumes: `FeedBatch` from `lib/feed/types.ts`.
- Produces: `readAllPages<T>(loadPage, pageSize?): Promise<T[]>` and `combineFeedBatches(batches: FeedBatch[]): FeedBatch | null`.

- [ ] **Step 1: Write failing aggregation and pagination tests**

```ts
import { describe, expect, test, vi } from "vitest";
import { combineFeedBatches, readAllPages } from "@/lib/feed/archive";
import type { FeedBatch, MarketingItem } from "@/lib/feed/types";

function item(id: string): MarketingItem {
  return {
    id,
    source: "Digitaling",
    sourceUrl: `https://example.com/${id}`,
    title: id,
    summary: `${id} summary`,
    collectedAt: "2026-08-16T00:00:00.000Z",
    industry: "其他",
    contentTags: [],
    score: 1,
    selectionReason: "test"
  };
}

function batch(batchDate: string, ids: string[]): FeedBatch {
  return {
    batchDate,
    generatedAt: `${batchDate}T00:00:00.000Z`,
    items: ids.map(item),
    sourceCounts: { SocialBeta: 0, Meihua: 0, Digitaling: ids.length },
    sourceErrors: {}
  };
}

describe("combineFeedBatches", () => {
  test("orders newest batches first, preserves item order, and removes older duplicate IDs", () => {
    const result = combineFeedBatches([
      batch("2026-08-15", ["old-a", "duplicate"]),
      batch("2026-08-16", ["new-a", "duplicate"])
    ]);
    expect(result?.items.map(({ id }) => id)).toEqual(["new-a", "duplicate", "old-a"]);
    expect(result?.batchDate).toBe("2026-08-16");
    expect(result?.sourceCounts.Digitaling).toBe(2);
  });

  test("returns null for an empty archive", () => {
    expect(combineFeedBatches([])).toBeNull();
  });
});

describe("readAllPages", () => {
  test("loads consecutive inclusive ranges until a short page", async () => {
    const loadPage = vi.fn(async (from: number) => from === 0 ? [1, 2] : [3]);
    await expect(readAllPages(loadPage, 2)).resolves.toEqual([1, 2, 3]);
    expect(loadPage.mock.calls).toEqual([[0, 1], [2, 3]]);
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run: `pnpm vitest run tests/archive.test.ts`

Expected: FAIL because `@/lib/feed/archive` does not exist.

- [ ] **Step 3: Implement pagination, newest-first sorting, and newest-wins de-duplication**

```ts
import type { FeedBatch } from "@/lib/feed/types";

export async function readAllPages<T>(
  loadPage: (from: number, to: number) => Promise<T[]>,
  pageSize = 100
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await loadPage(from, from + pageSize - 1);
    all.push(...page);
    if (page.length < pageSize) return all;
  }
}

export function combineFeedBatches(batches: FeedBatch[]): FeedBatch | null {
  const ordered = [...batches].sort((a, b) =>
    b.batchDate.localeCompare(a.batchDate) || b.generatedAt.localeCompare(a.generatedAt)
  );
  const latest = ordered[0];
  if (!latest) return null;

  const seen = new Set<string>();
  const items = ordered.flatMap((batch) => batch.items).filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
  return { ...latest, items };
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run tests/archive.test.ts`

Expected: PASS for ordering, duplicate removal, empty input, and multiple pages.

- [ ] **Step 5: Commit the archive unit**

```bash
git add lib/feed/archive.ts tests/archive.test.ts
git commit -m "feat: aggregate historical feed batches"
```

### Task 2: Supabase Archive Read and Items API

**Files:**
- Modify: `lib/feed/supabase.ts`
- Modify: `app/api/items/route.ts`
- Modify: `tests/archive.test.ts`

**Interfaces:**
- Consumes: `readAllPages()` and `combineFeedBatches()` from Task 1.
- Produces: `SupabaseFeedRepository.getArchiveBatch(): Promise<FeedBatch | null>`; `/api/items` continues returning `{ batch: FeedBatch, source: "supabase" | "fallback" }`.

- [ ] **Step 1: Add a failing test for an exact-size page followed by an empty page**

```ts
test("requests one final page when the previous page is full", async () => {
  const loadPage = vi.fn(async (from: number) => from === 0 ? [1, 2] : []);
  await expect(readAllPages(loadPage, 2)).resolves.toEqual([1, 2]);
  expect(loadPage.mock.calls).toEqual([[0, 1], [2, 3]]);
});
```

- [ ] **Step 2: Run the focused test to verify the pagination contract**

Run: `pnpm vitest run tests/archive.test.ts`

Expected: PASS with the Task 1 loop; if it fails, fix only `readAllPages` before continuing.

- [ ] **Step 3: Add the paginated archive query without changing latest-batch refresh logic**

Add this method to `SupabaseFeedRepository`:

```ts
async getArchiveBatch() {
  const rows = await readAllPages<BatchRow>(async (from, to) => {
    const { data, error } = await this.client
      .from("marketing_feed_batches")
      .select("*, marketing_feed_items(*)")
      .eq("status", "success")
      .order("batch_date", { ascending: false })
      .order("position", { referencedTable: "marketing_feed_items", ascending: true })
      .range(from, to);
    if (error) throw new Error(`Supabase 读取历史批次失败: ${error.message}`);
    return (data ?? []) as BatchRow[];
  });
  return combineFeedBatches(rows.map(batchFromRow));
}
```

Import `combineFeedBatches` and `readAllPages` from `@/lib/feed/archive`. Do not alter `getLatestBatch()`, `getRecentItemIds()`, or `saveBatch()`.

- [ ] **Step 4: Switch only the public items endpoint to archive reads**

In `app/api/items/route.ts`, replace `repository.getLatestBatch()` with `repository.getArchiveBatch()` and change the error label from `latest batch failed` to `archive batch failed`. Keep the current fallback response unchanged.

- [ ] **Step 5: Run archive, refresh, cron, and client-storage regression tests**

Run: `pnpm vitest run tests/archive.test.ts tests/refresh.test.ts tests/cron.test.ts tests/storage.test.ts`

Expected: PASS. The storage tests demonstrate that left-swipe skip IDs still filter items and that saved records remain distinct from skipped IDs.

- [ ] **Step 6: Commit the repository and API change**

```bash
git add lib/feed/supabase.ts app/api/items/route.ts tests/archive.test.ts
git commit -m "feat: serve cumulative feed history"
```

### Task 3: Feed Copy and Documentation

**Files:**
- Modify: `app/page.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: latest-batch metadata plus the cumulative `batch.items` returned by `/api/items`.
- Produces: a Feed header that distinguishes today's additions from the current unresolved history count.

- [ ] **Step 1: Compute the latest daily count from source metadata**

After resolving `pending`, add:

```ts
const dailyCount = batch ? Object.values(batch.sourceCounts).reduce((total, count) => total + count, 0) : 0;
```

- [ ] **Step 2: Update only Feed status copy**

Change the title and subtitle to:

```tsx
<h1 className="font-serif text-xl font-semibold text-ink">待浏览案例</h1>
<p className="mt-1 text-sm text-muted">
  {batch?.batchDate ?? "当日"} · 今日新增 {dailyCount} 条 · 当前待浏览 {feedItems.length} 条
</p>
```

Keep the card callbacks unchanged: `onSave={() => setPendingId(item.id)}` and `onSkip={() => skip(item.id)}`. Update the empty-state body to `已收藏或略过所有条目，明早会新增 30 条。`.

- [ ] **Step 3: Document cumulative Feed behavior**

Update the README product description and Feed bullet to state that each day adds up to 30 items, untouched history stays in Feed, saved items move to Saved, and left-swiped items remain skipped on the current browser.

- [ ] **Step 4: Run all local quality gates**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: every Vitest test passes, TypeScript exits with code 0, and Next.js completes a production build.

- [ ] **Step 5: Commit UI copy and documentation**

```bash
git add app/page.tsx README.md
git commit -m "docs: clarify cumulative feed status"
```

### Task 4: Production Deployment and Verification

**Files:**
- Verify only: production application and Git status.

**Interfaces:**
- Consumes: the tested commits from Tasks 1–3 and the existing linked Vercel project.
- Produces: a production deployment at `https://marketing-brain-orpin.vercel.app/`.

- [ ] **Step 1: Re-run the complete verification suite immediately before deployment**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all commands exit with code 0 using the final committed source.

- [ ] **Step 2: Deploy the current worktree to production**

Run: `pnpm dlx vercel@latest deploy --prod --yes`

Expected: Vercel reports the production alias `https://marketing-brain-orpin.vercel.app/`.

- [ ] **Step 3: Verify the live API and page**

Run a request against `https://marketing-brain-orpin.vercel.app/api/items` and verify:

- `source` equals `supabase` when production credentials are available.
- the returned item IDs contain no duplicates.
- when more than one successful daily batch exists, `batch.items.length` is greater than 30.
- the homepage shows `待浏览案例`, `今日新增`, and `左滑略过`.

- [ ] **Step 4: Confirm a clean worktree and capture the deployed revision**

Run: `git status --short && git log -1 --oneline`

Expected: no uncommitted files; the latest commit is the UI/documentation commit from Task 3.

