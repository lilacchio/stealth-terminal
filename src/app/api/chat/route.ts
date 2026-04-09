import { NextRequest, NextResponse } from "next/server";
import { SolRouter, clearSession } from "@solrouter/sdk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiKey,
      prompt,
      model,
      encrypted,
      chatId,
      systemPrompt,
      useLiveSearch,
    } = body;

    if (!apiKey || !prompt) {
      return NextResponse.json(
        { error: "apiKey and prompt are required" },
        { status: 400 }
      );
    }

    // Clear shared encryption state to avoid TEE conflicts between concurrent requests
    clearSession();

    const client = new SolRouter({ apiKey, encrypted: encrypted ?? true });
    const resolvedChatId = chatId || `st-${Date.now()}`;
    const response = await client.chat(prompt, {
      model: model ?? "gpt-oss-20b",
      encrypted: encrypted ?? true,
      chatId: resolvedChatId,
      systemPrompt,
      useLiveSearch: useLiveSearch ?? false,
    });

    return NextResponse.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
