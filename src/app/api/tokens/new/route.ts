import { NextResponse } from "next/server";
import { getNewPairs } from "@/lib/dexscreener";

export async function GET() {
  try {
    const tokens = await getNewPairs();
    return NextResponse.json(tokens);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch new pairs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
