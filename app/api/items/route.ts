import { NextResponse } from "next/server";
import { fallbackBatch } from "@/lib/feed/fallback";
import { getSupabaseRepository } from "@/lib/feed/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const repository = getSupabaseRepository();
  if (repository) {
    try {
      const batch = await repository.getArchiveBatch();
      if (batch?.items.length) return NextResponse.json({ batch, source: "supabase" });
    } catch (error) {
      console.error("[api/items] archive batch failed", error);
    }
  }
  return NextResponse.json({ batch: fallbackBatch(), source: "fallback" });
}
