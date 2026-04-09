import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/lib/dexscreener";

export async function GET() {
  try {
    const tokens = await getTrendingTokens();
    return NextResponse.json(tokens);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch trending";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
