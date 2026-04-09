import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/jupiter";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const inputDecimals = parseInt(searchParams.get("inputDecimals") ?? "9");
  const outputDecimals = parseInt(searchParams.get("outputDecimals") ?? "6");
  const slippageBps = parseInt(searchParams.get("slippageBps") ?? "50");

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "inputMint, outputMint, and amount are required" },
      { status: 400 }
    );
  }

  try {
    const quote = await getQuote(
      inputMint,
      outputMint,
      parseFloat(amount),
      inputDecimals,
      outputDecimals,
      slippageBps
    );
    return NextResponse.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
