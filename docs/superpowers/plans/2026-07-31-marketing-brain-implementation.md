# Marketing Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an independent Marketing Brain that collects and rule-ranks 30 Chinese marketing cases each day while preserving the existing Brain feed, save, and profile experience.

**Architecture:** A Next.js App Router application will expose source adapters for Digitaling RSS, SocialBeta HTML, and Meihua embedded JSON. A pure rule engine normalizes, classifies, deduplicates, scores, and selects a 12/10/8 daily batch; Supabase stores successful batches, while local fixtures and browser cache keep the app usable without infrastructure.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase JS, undici, fast-xml-parser, Vitest, Vercel Cron.

## Global Constraints

- Do not modify the existing `brain` project.
- Create and deploy `marketing-brain` as an independent project.
- Select at most 30 items per day: SocialBeta 12, Meihua 10, Digitaling 8.
- Do not call an LLM or require an LLM API key.
- Use rule-based industry labels: 互联网, 硬件, 医药, 汽车, 金融, 快时尚, 茶饮, 其他.
- The main navigation contains only Feed, 收藏, 我.
- Keep browser decisions and saved-item snapshots in localStorage.
- Target the daily refresh at 00:00 UTC, corresponding to 08:00 Asia/Shanghai.
- A failed refresh must not overwrite the last successful batch.

## File Structure

- `app/`: Feed, saved, profile, API feed, API refresh, layout, and global styling.
- `components/`: application frame, provider, feed card, save sheet, and empty state.
- `lib/feed/`: source adapters, normalization, rules, batch selection, persistence, and orchestration.
- `lib/client/`: browser state, profile defaults, export, and display helpers.
- `data/`: fallback daily batch and compact parser fixtures.
- `tests/`: unit and route-level tests for parsing, rules, selection, and persistence behavior.
- `docs/database.sql`: Supabase schema and policies.
- `vercel.json`: one secured daily cron registration.

---

### Task 1: Independent Application Skeleton

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.mjs`, `postcss.config.js`, `tailwind.config.ts`, `vitest.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/saved/page.tsx`, `app/profile/page.tsx`
- Create: `components/AppFrame.tsx`, `components/EmptyState.tsx`
- Create: `public/manifest.json`, `public/icons/brain-mark.svg`

**Interfaces:**
- Produces: a standalone app that starts with `pnpm dev`, typechecks with `pnpm typecheck`, and tests with `pnpm test`.

- [ ] **Step 1: Create the package and test configuration**

Add scripts `dev`, `build`, `start`, `typecheck`, and `test`, and add `vitest` plus `fast-xml-parser`. Configure the `@/` alias in both TypeScript and Vitest.

- [ ] **Step 2: Reuse the current Brain visual shell**

Copy the existing typography, colors, responsive width, manifest, icon, and header treatment into the new project. Build a three-link navigation:

```ts
const navLinks = [
  { href: "/", label: "Feed" },
  { href: "/saved", label: "收藏" },
  { href: "/profile", label: "我" }
];
```

- [ ] **Step 3: Add temporary page shells and verify the build**

Run: `pnpm install && pnpm typecheck && pnpm build`

Expected: all commands exit 0 and no `/graph` route or navigation entry exists.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.mjs postcss.config.js tailwind.config.ts vitest.config.ts app components public
git commit -m "chore: scaffold marketing brain app"
```

### Task 2: Domain Model and Rule Engine

**Files:**
- Create: `lib/feed/types.ts`
- Create: `lib/feed/rules.ts`
- Create: `lib/feed/select.ts`
- Test: `tests/rules.test.ts`
- Test: `tests/select.test.ts`

**Interfaces:**
- Produces: `MarketingItem`, `FeedBatch`, `SourceResult`, `classifyIndustry(item)`, `scoreItem(item, now)`, `normalizeTitle(title)`, `selectDailyBatch(sourceResults, recentIds, date)`.
- Consumes: no network or UI dependencies.

- [ ] **Step 1: Write failing classification and filtering tests**

Cover native Meihua categories, keyword fallbacks, unknown-to-其他 behavior, recruitment rejection, and case-density scoring:

```ts
expect(classifyIndustry({ ...base, nativeCategory: "药品诊疗" })).toBe("医药");
expect(classifyIndustry({ ...base, title: "瑞幸联名新茶饮" })).toBe("茶饮");
expect(isNoise({ ...base, title: "招聘频道 - 创意总监" })).toBe(true);
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test tests/rules.test.ts`

Expected: FAIL because `lib/feed/rules.ts` does not exist.

- [ ] **Step 3: Implement pure rules**

Define centralized keyword maps and a deterministic integer score. Do not place category keywords in React files.

- [ ] **Step 4: Write failing quota and deduplication tests**

Create candidates for all three sources and assert source quotas, normalized-title dedupe, recent-ID exclusion, fallback fill, and maximum length 30.

- [ ] **Step 5: Implement deterministic batch selection**

Sort each source by score, published time, then stable ID. Select SocialBeta 12, Meihua 10, Digitaling 8; fill shortages from remaining candidates by the same stable ordering.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test tests/rules.test.ts tests/select.test.ts`

Expected: PASS.

```bash
git add lib/feed/types.ts lib/feed/rules.ts lib/feed/select.ts tests/rules.test.ts tests/select.test.ts
git commit -m "feat: add deterministic marketing selection rules"
```

### Task 3: Three Source Adapters

**Files:**
- Create: `lib/feed/http.ts`
- Create: `lib/feed/sources/digitaling.ts`
- Create: `lib/feed/sources/socialbeta.ts`
- Create: `lib/feed/sources/meihua.ts`
- Create: `data/fixtures/digitaling.xml`
- Create: `data/fixtures/socialbeta-case.html`
- Create: `data/fixtures/meihua-shots.html`
- Test: `tests/sources.test.ts`

**Interfaces:**
- Produces: `parseDigitaling(xml)`, `parseSocialBetaCase(html)`, `parseSocialBetaDetail(html, partial)`, `parseMeihuaShots(html)`, and async `fetchDigitaling()`, `fetchSocialBeta()`, `fetchMeihua()` returning `SourceResult`.
- Consumes: `MarketingItem` and centralized rules from Task 2.

- [ ] **Step 1: Save compact public-page fixtures**

Each fixture contains two valid cases and one item that should be filtered or ignored. Fixtures must not copy full articles; keep only the structural fields required by parsers.

- [ ] **Step 2: Write failing parser tests**

Assert source name, canonical URL, title cleanup, HTML-to-text summary, author/brand, publish date, and Meihua native category.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm test tests/sources.test.ts`

Expected: FAIL because source adapters do not exist.

- [ ] **Step 4: Implement bounded HTTP and parsers**

Use a named non-browser user agent, 8-second abort timeout, limited SocialBeta detail concurrency, and explicit structure validation. Return a source-specific error instead of malformed items.

- [ ] **Step 5: Run fixture tests and a live smoke fetch**

Run: `pnpm test tests/sources.test.ts`

Run: `pnpm exec tsx scripts/smoke-sources.ts`

Expected: fixture tests pass; live output reports item counts for every reachable source without printing full article bodies.

- [ ] **Step 6: Commit**

```bash
git add lib/feed/http.ts lib/feed/sources data/fixtures tests/sources.test.ts scripts/smoke-sources.ts package.json pnpm-lock.yaml
git commit -m "feat: add marketing source adapters"
```

### Task 4: Batch Persistence and Refresh Orchestration

**Files:**
- Create: `lib/feed/supabase.ts`
- Create: `lib/feed/refresh.ts`
- Create: `lib/feed/fallback.ts`
- Create: `data/fallback-batch.json`
- Create: `docs/database.sql`
- Test: `tests/refresh.test.ts`

**Interfaces:**
- Produces: `refreshDailyFeed(deps?)`, `getLatestBatch()`, `saveBatchIfComplete(batch)`, and fallback batch loading.
- Consumes: source fetchers and `selectDailyBatch`.

- [ ] **Step 1: Write failing orchestration tests**

Inject fake source adapters and an in-memory repository. Assert a complete batch is saved, duplicate dates upsert idempotently, recent IDs are excluded, one failed source can be backfilled, and insufficient results do not replace the prior batch.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test tests/refresh.test.ts`

Expected: FAIL because refresh orchestration does not exist.

- [ ] **Step 3: Implement repository and orchestration**

Use the service-role client only on the server. Define repository methods so tests do not need Supabase. Treat 20 selected items as the minimum successful batch and 30 as the target maximum.

- [ ] **Step 4: Add SQL schema**

Create `marketing_feed_batches` with a unique `batch_date`, status, counts, and source errors. Create `marketing_feed_items` with a stable item ID, batch foreign key, display position, JSON tags, and normalized text fields. Allow anonymous read-only access and keep writes service-role-only.

- [ ] **Step 5: Create a 30-item fallback batch**

Use clearly marked realistic demo entries distributed 12/10/8 across sources and all seven target industries. No fake performance metrics or claims.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test tests/refresh.test.ts`

Expected: PASS.

```bash
git add lib/feed/supabase.ts lib/feed/refresh.ts lib/feed/fallback.ts data/fallback-batch.json docs/database.sql tests/refresh.test.ts
git commit -m "feat: persist daily marketing feed batches"
```

### Task 5: Feed and Cron APIs

**Files:**
- Create: `app/api/items/route.ts`
- Create: `app/api/cron/refresh/route.ts`
- Create: `vercel.json`
- Create: `.env.example`
- Test: `tests/cron.test.ts`

**Interfaces:**
- Produces: `GET /api/items` returning `{ batch, source }`; `GET /api/cron/refresh` returning refresh status.
- Consumes: `getLatestBatch`, `refreshDailyFeed`, fallback loading.

- [ ] **Step 1: Write failing cron authorization tests**

Assert missing or incorrect bearer tokens return 401 when `CRON_SECRET` is set, the correct token invokes refresh, and development can run without configured Supabase by returning a diagnostic response.

- [ ] **Step 2: Implement APIs and cron registration**

Configure:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/refresh", "schedule": "0 0 * * *" }]
}
```

The public feed route returns the latest successful database batch, then server cache, then the bundled fallback.

- [ ] **Step 3: Run tests and commit**

Run: `pnpm test tests/cron.test.ts`

Expected: PASS.

```bash
git add app/api/items/route.ts app/api/cron/refresh/route.ts vercel.json .env.example tests/cron.test.ts
git commit -m "feat: expose daily feed and secured refresh APIs"
```

### Task 6: Feed, Save, and Profile Experience

**Files:**
- Create: `lib/client/types.ts`, `lib/client/storage.ts`, `lib/client/export.ts`, `lib/client/profile.ts`
- Create: `components/BrainProvider.tsx`, `components/ItemCard.tsx`, `components/SaveSheet.tsx`
- Modify: `components/AppFrame.tsx`
- Modify: `app/page.tsx`, `app/saved/page.tsx`, `app/profile/page.tsx`, `app/layout.tsx`
- Test: `tests/storage.test.ts`

**Interfaces:**
- Produces: `useBrain()`, local decision and saved-item persistence, Markdown export, and the complete three-page UI.
- Consumes: `GET /api/items` and `MarketingItem` snapshots.

- [ ] **Step 1: Write failing storage migration tests**

Assert empty initialization, remember/skip decisions, saved snapshot survival, note updates, reset behavior, and tolerance of malformed localStorage JSON.

- [ ] **Step 2: Implement client state and storage**

Use a new namespace such as `marketing-brain-v1-state`; never read or overwrite the original Brain keys. Cache the latest successful feed separately.

- [ ] **Step 3: Implement the Feed page**

Render batch date/count, timeline cards, source and industry chips, summary, author/brand, original link, explicit save button, and swipe gestures. A save opens a compact rating/note sheet and stores the full snapshot.

- [ ] **Step 4: Implement Saved and Profile pages**

Saved supports chronological browsing, editing notes, deleting a save, and Markdown export. Profile explains local storage and lets the user record preferred industries without invoking AI.

- [ ] **Step 5: Run unit and production checks**

Run: `pnpm test tests/storage.test.ts && pnpm typecheck && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/client components app tests/storage.test.ts
git commit -m "feat: build marketing feed and save experience"
```

### Task 7: End-to-End Verification and Handoff

**Files:**
- Modify: `README.md`
- Modify: any implementation file with a defect found during verification

**Interfaces:**
- Produces: verified local application and deploy/configuration instructions.

- [ ] **Step 1: Run the complete automated suite**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 2: Run live source smoke tests**

Run: `pnpm exec tsx scripts/smoke-sources.ts`

Expected: each reachable source reports parsed candidate counts and no source causes an unhandled rejection.

- [ ] **Step 3: Start the app and verify API responses**

Run: `pnpm dev`

Check `/api/items`, `/`, `/saved`, and `/profile`. Confirm fallback mode works without Supabase, there are 30 feed entries, saved snapshots survive refresh, and navigation has no Graph link.

- [ ] **Step 4: Confirm original repository isolation**

Compare `git -C ../brain status --short` with the baseline captured before implementation. It must contain only the user's pre-existing changes.

- [ ] **Step 5: Document setup and commit**

README must include local run commands, source behavior, scoring rules, Supabase SQL setup, required environment variables, cron timing caveat, and Vercel deployment steps.

```bash
git add README.md
git commit -m "docs: add marketing brain setup guide"
```
