import { NextRequest, NextResponse } from "next/server";
import { getTokenPrices } from "@/lib/jupiter";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  try {
    const prices = await getTokenPrices(ids.split(","));
    return NextResponse.json(prices);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Price fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
