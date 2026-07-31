import { NextResponse } from "next/server";
import { handleCronRequest } from "@/lib/feed/cron";
import { refreshDailyFeed } from "@/lib/feed/refresh";
import { getSupabaseRepository } from "@/lib/feed/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const repository = getSupabaseRepository();
  if (!repository) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured" }, { status: 503 });
  }
  try {
    const result = await handleCronRequest(request, {
      secret: process.env.CRON_SECRET,
      refresh: () => refreshDailyFeed({ repository })
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("[api/cron/refresh] refresh failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Refresh failed" }, { status: 500 });
  }
}
