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
  const ordered = [...batches].sort(
    (a, b) => b.batchDate.localeCompare(a.batchDate) || b.generatedAt.localeCompare(a.generatedAt)
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
