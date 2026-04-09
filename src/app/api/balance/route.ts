import { NextRequest, NextResponse } from "next/server";
import { SolRouter } from "@solrouter/sdk";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "apiKey is required" },
        { status: 400 }
      );
    }

    const client = new SolRouter({ apiKey, encrypted: true });
    const balance = await client.getBalance();
    return NextResponse.json(balance);
  } catch {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
}
