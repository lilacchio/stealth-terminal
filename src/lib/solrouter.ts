// Client-safe wrapper — calls API routes (SDK runs server-side only)

export interface ChatOptions {
  model?: string;
  encrypted?: boolean;
  chatId?: string;
  systemPrompt?: string;
  useLiveSearch?: boolean;
}

export interface ChatResponse {
  message: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
  encrypted: boolean;
  privacyAttestationId?: string;
}

export interface BalanceResponse {
  balance: number;
  balanceFormatted: string;
}

export const MODELS = [
  { id: "gpt-oss-20b", label: "GPT-OSS 20B", desc: "Cheapest" },
  { id: "qwen3-8b", label: "Qwen3 8B", desc: "Quick" },
  { id: "gemini-flash", label: "Gemini Flash", desc: "Fast" },
  { id: "claude-sonnet", label: "Claude Sonnet", desc: "Deep" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Balanced" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export async function chat(
  apiKey: string,
  prompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  // Retry on TEE failures or transient fetch errors
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, prompt, ...options }),
      });
      const data = await res.json();
      if (res.ok) return data;
      const errMsg = data.error ?? "Chat request failed";
      // Retry on TEE or encryption-related errors
      if (attempt < 2 && (errMsg.includes("TEE") || errMsg.includes("encrypt") || errMsg.includes("session"))) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw new Error(errMsg);
    } catch (err) {
      // Retry on network/fetch failures
      if (attempt < 2 && err instanceof TypeError) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      if (err instanceof Error && err.message !== "Chat request failed") throw err;
      throw new Error("Connection failed — check your network and try again");
    }
  }
  throw new Error("Chat request failed after retries");
}

export async function getBalance(
  apiKey: string
): Promise<BalanceResponse> {
  const res = await fetch("/api/balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Balance request failed");
  return data;
}

export async function validateApiKey(
  apiKey: string
): Promise<BalanceResponse | null> {
  try {
    return await getBalance(apiKey);
  } catch {
    return null;
  }
}
