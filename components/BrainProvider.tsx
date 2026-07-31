"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FEED_CACHE_KEY, createInitialState, loadClientState, rememberItem as rememberState, removeSavedItem as removeState, saveClientState, skipItem as skipState } from "@/lib/client/storage";
import type { ClientState, MarketingProfile, Rating } from "@/lib/client/types";
import type { FeedBatch, MarketingItem } from "@/lib/feed/types";

type FeedMode = "loading" | "live" | "cached" | "fallback";

type BrainContextValue = {
  state: ClientState;
  batch?: FeedBatch;
  feedItems: MarketingItem[];
  feedMode: FeedMode;
  hydrated: boolean;
  remember: (item: MarketingItem, rating: Rating, note: string) => void;
  skip: (itemId: string) => void;
  removeSaved: (itemId: string) => void;
  saveProfile: (profile: MarketingProfile) => void;
  reset: () => void;
};

const BrainContext = createContext<BrainContextValue | null>(null);

function loadCachedBatch() {
  if (typeof window === "undefined") return undefined;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FEED_CACHE_KEY) ?? "null") as FeedBatch | null;
    return parsed?.items?.length ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function BrainProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ClientState>(() => createInitialState());
  const [batch, setBatch] = useState<FeedBatch>();
  const [feedMode, setFeedMode] = useState<FeedMode>("loading");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadClientState());
    setHydrated(true);
    const cached = loadCachedBatch();
    if (cached) {
      setBatch(cached);
      setFeedMode("cached");
    }
    fetch("/api/items")
      .then(async (response) => {
        if (!response.ok) throw new Error(`/api/items ${response.status}`);
        return (await response.json()) as { batch: FeedBatch; source: "supabase" | "fallback" };
      })
      .then((payload) => {
        setBatch(payload.batch);
        setFeedMode(payload.source === "supabase" ? "live" : "fallback");
        if (payload.source === "supabase") window.localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(payload.batch));
      })
      .catch(() => {
        if (!cached) setFeedMode("fallback");
      });
  }, []);

  const commit = useCallback((next: ClientState) => {
    setState(next);
    saveClientState(next);
  }, []);

  const remember = useCallback((item: MarketingItem, rating: Rating, note: string) => commit(rememberState(state, item, rating, note)), [commit, state]);
  const skip = useCallback((itemId: string) => commit(skipState(state, itemId)), [commit, state]);
  const removeSaved = useCallback((itemId: string) => commit(removeState(state, itemId)), [commit, state]);
  const saveProfile = useCallback((profile: MarketingProfile) => commit({ ...state, profile }), [commit, state]);
  const reset = useCallback(() => commit(createInitialState()), [commit]);

  const decided = useMemo(() => new Set([...state.skippedIds, ...state.saved.map((entry) => entry.itemId)]), [state.saved, state.skippedIds]);
  const feedItems = useMemo(() => (batch?.items ?? []).filter((item) => !decided.has(item.id)), [batch, decided]);
  const value = useMemo(
    () => ({ state, batch, feedItems, feedMode, hydrated, remember, skip, removeSaved, saveProfile, reset }),
    [state, batch, feedItems, feedMode, hydrated, remember, skip, removeSaved, saveProfile, reset]
  );

  return <BrainContext.Provider value={value}>{children}</BrainContext.Provider>;
}

export function useBrain() {
  const context = useContext(BrainContext);
  if (!context) throw new Error("useBrain must be used within BrainProvider");
  return context;
}
