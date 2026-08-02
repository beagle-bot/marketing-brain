import type { ClientState, Rating, SavedItem } from "@/lib/client/types";
import { isIndustry, type Industry, type MarketingItem } from "@/lib/feed/types";

export const STATE_KEY = "marketing-brain-v1-state";
export const FEED_CACHE_KEY = "marketing-brain-v1-feed-cache";

export function createInitialState(): ClientState {
  return { saved: [], skippedIds: [], profile: { preferredIndustries: [], customDescription: "" } };
}

export function parseStoredState(raw: string | null): ClientState {
  if (!raw) return createInitialState();
  try {
    const value = JSON.parse(raw) as Partial<ClientState>;
    if (!Array.isArray(value.saved) || !Array.isArray(value.skippedIds) || !value.profile) return createInitialState();
    const saved = value.saved.flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const entry = candidate as Partial<SavedItem>;
      if (typeof entry.itemId !== "string" || !entry.itemSnapshot || typeof entry.note !== "string" || typeof entry.savedAt !== "string" || !isRating(entry.rating)) return [];
      return [{ ...entry, savedIndustry: isIndustry(entry.savedIndustry) ? entry.savedIndustry : "其他" } as SavedItem];
    });
    return {
      saved,
      skippedIds: value.skippedIds.filter((id): id is string => typeof id === "string"),
      profile: {
        preferredIndustries: Array.isArray(value.profile.preferredIndustries) ? value.profile.preferredIndustries.filter(isIndustry) : [],
        customDescription: typeof value.profile.customDescription === "string" ? value.profile.customDescription : ""
      }
    };
  } catch {
    return createInitialState();
  }
}

function isRating(value: unknown): value is Rating {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function rememberItem(state: ClientState, item: MarketingItem, savedIndustry: Industry, rating: Rating, note: string): ClientState {
  const existing = state.saved.find((entry) => entry.itemId === item.id);
  const saved = {
    itemId: item.id,
    itemSnapshot: { ...item },
    savedIndustry,
    rating,
    note: note.trim(),
    savedAt: existing?.savedAt ?? new Date().toISOString()
  };
  return {
    ...state,
    saved: [saved, ...state.saved.filter((entry) => entry.itemId !== item.id)],
    skippedIds: state.skippedIds.filter((id) => id !== item.id)
  };
}

export function skipItem(state: ClientState, itemId: string): ClientState {
  return {
    ...state,
    saved: state.saved.filter((entry) => entry.itemId !== itemId),
    skippedIds: Array.from(new Set([...state.skippedIds, itemId]))
  };
}

export function removeSavedItem(state: ClientState, itemId: string): ClientState {
  return { ...state, saved: state.saved.filter((entry) => entry.itemId !== itemId) };
}

export function loadClientState() {
  if (typeof window === "undefined") return createInitialState();
  return parseStoredState(window.localStorage.getItem(STATE_KEY));
}

export function saveClientState(state: ClientState) {
  if (typeof window !== "undefined") window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
