import { NextRequest, NextResponse } from "next/server";
import { searchTokens, getTokenByAddress } from "@/lib/dexscreener";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  try {
    // If it looks like a Solana address (base58, 32-44 chars), search by address
    const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q);
    const tokens = isAddress
      ? await getTokenByAddress(q)
      : await searchTokens(q);
    return NextResponse.json(tokens);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
