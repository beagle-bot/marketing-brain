# Manual Industry and Live Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the deployed Marketing Brain to a real daily cloud Feed and require users to manually classify every saved item into one of nine industries.

**Architecture:** Keep source ingestion, deterministic reference classification, and Supabase Feed persistence on the server. Add a separate `savedIndustry` field to browser-local saved records so user judgment never overwrites or depends on the Feed reference label. Centralize the nine-value taxonomy and reuse it in rules, save UI, saved filtering, profile preferences, migrations, and Markdown export.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Supabase Postgres, Vercel Cron and Vercel production deployment.

## Global Constraints

- The fixed taxonomy is exactly: `快时尚`, `美妆`, `汽车`, `医药`, `智能硬件`, `金融`, `互联网`, `茶饮`, `其他`.
- Feed reference classification remains deterministic and consumes no LLM tokens.
- Saved industry is manually selected, required, editable, and stored separately from `MarketingItem.industry`.
- Feed batches are cloud-persisted; saves, notes, ratings, skips, and profile remain in browser localStorage.
- Keep only the existing `Feed`, `收藏`, and `我` primary navigation items.
- Do not modify the original Brain project.

---

### Task 1: Centralize the nine-industry taxonomy and reference rules

**Files:**
- Modify: `lib/feed/types.ts`
- Modify: `lib/feed/rules.ts`
- Modify: `app/profile/page.tsx`
- Modify: `tests/rules.test.ts`
- Modify: `tests/sources.test.ts`
- Modify: `data/fallback-batch.json`

**Interfaces:**
- Produces: `INDUSTRIES: readonly Industry[]`, `Industry`, `isIndustry(value: unknown): value is Industry`.
- Preserves: `classifyIndustry(item: MarketingItem): Industry`.

- [ ] **Step 1: Write failing taxonomy and classifier tests**

Add literal expectations proving a cosmetics item becomes `美妆`, a phone item becomes `智能硬件`, legacy `硬件` is rejected by `isIndustry`, and all nine supported values are accepted.

```ts
expect(classifyIndustry(item({ title: "珀莱雅发布夏日口红社媒 campaign" }))).toBe("美妆");
expect(classifyIndustry(item({ title: "新一代 AI 手机发布案例" }))).toBe("智能硬件");
expect(isIndustry("硬件")).toBe(false);
expect(INDUSTRIES).toEqual(["快时尚", "美妆", "汽车", "医药", "智能硬件", "金融", "互联网", "茶饮", "其他"]);
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm vitest run tests/rules.test.ts tests/sources.test.ts`

Expected: compile or assertion failures because `INDUSTRIES`, `isIndustry`, `美妆`, and `智能硬件` do not yet exist.

- [ ] **Step 3: Implement the shared taxonomy and rule changes**

Define the tuple and guard in `lib/feed/types.ts`. Replace `硬件` with `智能硬件`, add native and keyword mappings for cosmetics such as `美妆`, `彩妆`, `护肤`, `口红`, `香氛`, `珀莱雅`, `欧莱雅`, and reuse `INDUSTRIES` in the profile page. Mechanically migrate fallback entries from `硬件` to `智能硬件`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm vitest run tests/rules.test.ts tests/sources.test.ts`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/feed/types.ts lib/feed/rules.ts app/profile/page.tsx tests/rules.test.ts tests/sources.test.ts data/fallback-batch.json
git commit -m "feat: unify marketing industry taxonomy"
```

### Task 2: Store and migrate manually selected industries

**Files:**
- Modify: `lib/client/types.ts`
- Modify: `lib/client/storage.ts`
- Modify: `components/BrainProvider.tsx`
- Modify: `tests/storage.test.ts`

**Interfaces:**
- Produces: `SavedItem.savedIndustry: Industry`.
- Changes: `rememberItem(state, item, savedIndustry, rating, note): ClientState`.
- Changes: `BrainContextValue.remember(item, savedIndustry, rating, note): void`.

- [ ] **Step 1: Write failing save and migration tests**

Add tests proving a manual `美妆` category is stored even when `item.industry` is `互联网`, editing replaces the manual category without changing `savedAt`, and stored legacy saves without `savedIndustry` migrate to `其他`.

```ts
const next = rememberItem(createInitialState(), item, "美妆", 4, "社媒种草思路");
expect(next.saved[0]).toMatchObject({ savedIndustry: "美妆", rating: 4, note: "社媒种草思路" });
expect(next.saved[0].itemSnapshot.industry).toBe("茶饮");
```

- [ ] **Step 2: Run the storage test and verify RED**

Run: `pnpm vitest run tests/storage.test.ts`

Expected: type and assertion failures because saved records lack `savedIndustry` and `rememberItem` has the old signature.

- [ ] **Step 3: Implement manual category storage and safe migration**

Add `savedIndustry` to `SavedItem`; validate stored objects field-by-field; map absent or invalid `savedIndustry` to `其他`; filter invalid profile industries through `isIndustry`; preserve an existing `savedAt` on edit; update the provider signature and all call sites compile-time contract.

- [ ] **Step 4: Run the storage test and verify GREEN**

Run: `pnpm vitest run tests/storage.test.ts`

Expected: all storage tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/client/types.ts lib/client/storage.ts components/BrainProvider.tsx tests/storage.test.ts
git commit -m "feat: persist manual saved industries"
```

### Task 3: Require industry selection in save and edit flows

**Files:**
- Modify: `components/SaveSheet.tsx`
- Modify: `app/page.tsx`
- Modify: `app/saved/page.tsx`

**Interfaces:**
- Changes: `SaveSheet` receives `initialIndustry?: Industry` and calls `onConfirm(industry: Industry, rating: Rating, note: string)`.
- Consumes: `INDUSTRIES` and `BrainContextValue.remember` from Tasks 1–2.

- [ ] **Step 1: Use the failing TypeScript build as the interface RED check**

After Task 2 changes the provider signature, run: `pnpm typecheck`

Expected: failures at the old `remember(item, rating, note)` call sites.

- [ ] **Step 2: Implement the required single-select UI**

Render nine accessible buttons in `SaveSheet`, start new saves with no selection, show `请选择行业` after an invalid submit, and disable confirmation semantics until a valid choice is made. Editing initializes from `saved.savedIndustry`. Pass `(industry, rating, note)` through both Feed and saved-page handlers.

- [ ] **Step 3: Run typecheck and existing client tests**

Run: `pnpm typecheck && pnpm vitest run tests/storage.test.ts`

Expected: no TypeScript errors and all storage tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/SaveSheet.tsx app/page.tsx app/saved/page.tsx
git commit -m "feat: require manual industry on save"
```

### Task 4: Filter saved items and export the manual industry

**Files:**
- Create: `lib/client/filter.ts`
- Modify: `lib/client/export.ts`
- Modify: `app/saved/page.tsx`
- Create: `tests/filter.test.ts`
- Modify: `tests/export.test.ts`

**Interfaces:**
- Produces: `filterSavedItems(items: SavedItem[], industry: Industry | "全部"): SavedItem[]`.
- Changes export output to `- 行业：${saved.savedIndustry}` and keeps source on its own line.

- [ ] **Step 1: Write failing filter and export tests**

Use two literal saved records with different manual industries. Assert that filtering `美妆` returns only the manually tagged cosmetics save and that Markdown contains `- 行业：美妆` even when its Feed reference category differs.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm vitest run tests/filter.test.ts tests/export.test.ts`

Expected: module-not-found for `filterSavedItems` and missing manual-industry export assertion.

- [ ] **Step 3: Implement pure filtering, badges, controls, and export**

Create the pure filter helper. Add an `全部` plus nine-industry control row to the saved page, show counts and industry-specific empty state, label cards using `saved.savedIndustry`, and retain the Feed reference label only where useful as secondary metadata. Export the manual category separately from source.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm vitest run tests/filter.test.ts tests/export.test.ts`

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/client/filter.ts lib/client/export.ts app/saved/page.tsx tests/filter.test.ts tests/export.test.ts
git commit -m "feat: filter and export saved industries"
```

### Task 5: Provision the live Feed and production schedule

**Files:**
- Modify if schema corrections are needed: `docs/database.sql`
- Modify: `README.md`
- Deployment configuration only: Vercel environment variables and existing production project.

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
- Verifies: `GET /api/items` returns `{ source: "supabase", batch: FeedBatch }` after the first refresh.

- [ ] **Step 1: Validate live source adapters before cloud writes**

Run: `pnpm exec tsx scripts/smoke-sources.ts`

Expected: all three sources parse candidates and selection returns 30 items with counts `12/10/8`, or a recorded source-specific failure that still yields at least 20 safe items.

- [ ] **Step 2: Provision or connect Supabase**

Create or select one Supabase project under the user's authenticated account, execute `docs/database.sql`, and collect the project URL and service-role key without writing secrets to tracked files. If account login or project ownership cannot be established, stop only this cloud step and request the missing authorization; continue all local feature work.

- [ ] **Step 3: Configure Vercel runtime secrets**

Generate a random `CRON_SECRET` of at least 32 bytes and set all three variables for the existing `marketing-brain` production project. Do not print secret values or store them in Git.

- [ ] **Step 4: Deploy and trigger the first refresh**

Deploy the tested branch to production, call `/api/cron/refresh` with the bearer secret once, and require a 200 response whose `itemCount` is at least 20. Then call `/api/items` and require `source === "supabase"`.

- [ ] **Step 5: Update operating documentation and commit non-secret changes**

Document the nine-value taxonomy, manual classification behavior, first-run procedure, and recovery behavior in `README.md`. If `docs/database.sql` is unchanged, do not touch it.

```bash
git add README.md docs/database.sql
git commit -m "docs: document live feed operations"
```

### Task 6: Full verification and production handoff

**Files:**
- Verify only unless a defect is found.

**Interfaces:**
- Verifies all public behavior from the design specification.

- [ ] **Step 1: Run the complete automated verification**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: every test file passes, TypeScript exits zero, and Next.js production build exits zero.

- [ ] **Step 2: Verify the production API**

Request the stable production URL and `/api/items`. Require HTTP 200, 30 displayed items when the fresh source pool allows the quota, and `source: "supabase"`. If the safe minimum rule retains an older batch, verify that the older successful batch remains readable.

- [ ] **Step 3: Verify the browser workflow**

On the production site: open a Feed item; attempt to save without a category and observe the required message; select `美妆`; add a note; save; filter saved items to `美妆`; edit the record to `互联网`; confirm the filter and badge update; copy Markdown and confirm the selected industry is present.

- [ ] **Step 4: Confirm repository cleanliness and report the stable URL**

Run: `git status --short`

Expected: no uncommitted source changes. Return the existing production URL plus any remaining external authorization blocker in plain language.
