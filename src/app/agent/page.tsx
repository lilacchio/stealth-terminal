"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useApiKey } from "@/lib/api-key-context";
import { useSession } from "@/lib/session-context";
import { useChat } from "@/hooks/useChat";
import { type ModelId } from "@/lib/solrouter";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatControls } from "@/components/chat/chat-controls";
import { SessionList } from "@/components/chat/session-list";
import {
  Shield,
  Lock,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Zap,
  Search,
  BarChart3,
} from "lucide-react";

interface MarketSnapshot {
  trending: string;
  newPairs: string;
  lowMcap: string;
  highRisk: string;
  gainers: string;
}

const SUGGESTED_PROMPTS = [
  {
    icon: AlertTriangle,
    label: "Rug check trending tokens",
    color: "text-red-400 border-red-400/20 hover:bg-red-400/10",
    buildPrompt: (data: MarketSnapshot) =>
      `Here are the current trending Solana tokens with their risk analysis:\n\n${data.trending}\n\nAnalyze each token for rug pull risk. Which ones look suspicious and why? Which are safer bets? Look at liquidity/mcap ratios, sell pressure, token age, and any red flags.`,
  },
  {
    icon: Sparkles,
    label: "Scan new launches for gems",
    color: "text-purple-400 border-purple-400/20 hover:bg-purple-400/10",
    buildPrompt: (data: MarketSnapshot) =>
      `Here are newly launched Solana tokens:\n\n${data.newPairs}\n\nWhich of these new launches have the best potential? Evaluate based on: liquidity health, buy/sell ratio, early volume, and risk signals. Flag any that look like obvious rugs. Which would you watch?`,
  },
  {
    icon: TrendingUp,
    label: "Find undervalued low-caps",
    color: "text-terminal border-terminal/20 hover:bg-terminal/10",
    buildPrompt: (data: MarketSnapshot) =>
      `Here are Solana tokens under $50M market cap:\n\n${data.lowMcap || data.trending}\n\nWhich of these look undervalued relative to their volume, liquidity, and momentum? I want tokens with strong buy pressure, healthy liquidity ratios, and room to grow. Rank your top picks with reasoning.`,
  },
  {
    icon: Zap,
    label: "Today's biggest movers",
    color: "text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10",
    buildPrompt: (data: MarketSnapshot) =>
      `Here are the biggest 24h gainers on Solana right now:\n\n${data.gainers}\n\nAnalyze each: is this pump organic or manipulated? Check the buy/sell ratio, volume vs liquidity, and token age. Which are still worth entering vs which are likely to dump? Give entry/exit guidance.`,
  },
  {
    icon: Search,
    label: "Spot wash trading & fakes",
    color: "text-orange-400 border-orange-400/20 hover:bg-orange-400/10",
    buildPrompt: (data: MarketSnapshot) =>
      `Here are tokens flagged as high risk on Solana:\n\n${data.highRisk || data.trending}\n\nAnalyze for signs of wash trading, fake volume, or coordinated manipulation. Look for: volume way higher than liquidity, suspicious buy/sell patterns, very new tokens with huge volume. Which are legitimate and which are fakes?`,
  },
  {
    icon: BarChart3,
    label: "Portfolio allocation advice",
    color: "text-blue-400 border-blue-400/20 hover:bg-blue-400/10",
    buildPrompt: (data: MarketSnapshot) =>
      `Here's the current Solana token market:\n\nTrending:\n${data.trending}\n\nNew launches:\n${data.newPairs}\n\nIf I had $1000 to allocate across Solana tokens right now, how would you split it? Consider risk levels, diversification, and current momentum. Give specific allocations with reasoning.`,
  },
];

export default function AgentPage() {
  const { apiKey, setShowModal } = useApiKey();
  const {
    activeSessionId,
    activeSession,
    createSession,
    updateSessionMessages,
  } = useSession();

  // Persist settings in localStorage
  const [model, setModel] = useState<ModelId>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("st_model") as ModelId) || "gpt-oss-20b";
    }
    return "gpt-oss-20b";
  });
  const [encrypted, setEncrypted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("st_encrypted") !== "false";
    }
    return true;
  });
  const [liveSearch, setLiveSearch] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("st_live_search") === "true";
    }
    return false;
  });
  const [marketData, setMarketData] = useState<MarketSnapshot | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  // Save settings to localStorage on change
  useEffect(() => { localStorage.setItem("st_model", model); }, [model]);
  useEffect(() => { localStorage.setItem("st_encrypted", String(encrypted)); }, [encrypted]);
  useEffect(() => { localStorage.setItem("st_live_search", String(liveSearch)); }, [liveSearch]);

  const {
    messages,
    setMessages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch market data for smart prompts
  const fetchMarketData = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const res = await fetch("/api/tokens/market-snapshot");
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch {
      // Silent fail — prompts will work with generic text
    } finally {
      setLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Load session messages
  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages);
    } else {
      clearMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // Persist messages
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      updateSessionMessages(activeSessionId, messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Pick up prefill from other pages (quotes, dashboard, portfolio)
  const prefillHandled = useRef(false);
  useEffect(() => {
    if (prefillHandled.current) return;
    const prefill =
      sessionStorage.getItem("stealth_terminal_prefill") ||
      sessionStorage.getItem("agent_prefill");
    if (prefill && apiKey) {
      prefillHandled.current = true;
      sessionStorage.removeItem("stealth_terminal_prefill");
      sessionStorage.removeItem("agent_prefill");
      // Small delay to ensure session state is ready
      setTimeout(() => handleSend(prefill), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  function handleSend(content: string) {
    if (!apiKey) {
      setShowModal(true);
      return;
    }

    let chatId = activeSessionId;
    if (!chatId) {
      chatId = createSession(
        content.slice(0, 30) + (content.length > 30 ? "..." : "")
      );
    }

    sendMessage(content, {
      chatId,
      model,
      // Live search only works with encryption on SolRouter
      encrypted: liveSearch ? true : encrypted,
      useLiveSearch: liveSearch,
      systemPrompt:
        "You are an expert Solana trading research assistant with deep knowledge of DeFi, memecoins, and on-chain analytics. Provide concise, data-driven analysis. Use bullet points and tables when appropriate. Always highlight risks clearly. Be direct — traders want actionable insights, not fluff.",
    });
  }

  function handleSuggestedPrompt(
    buildPrompt: (data: MarketSnapshot) => string
  ) {
    if (!apiKey) {
      setShowModal(true);
      return;
    }
    if (!marketData) {
      // Fallback if market data hasn't loaded yet
      handleSend(
        "Fetch the current trending Solana tokens and analyze them for trading opportunities and risks."
      );
      return;
    }
    handleSend(buildPrompt(marketData));
  }

  return (
    <div className="flex h-full">
      {/* Session sidebar */}
      <div className="w-52 border-r border-border bg-card shrink-0 hidden lg:flex flex-col">
        <SessionList />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatControls
          model={model}
          onModelChange={setModel}
          encrypted={encrypted}
          onEncryptedChange={setEncrypted}
          liveSearch={liveSearch}
          onLiveSearchChange={setLiveSearch}
        />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8 gap-6">
              <div className="h-12 w-12 rounded-lg bg-terminal/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-terminal" />
              </div>
              <div className="space-y-2 max-w-lg">
                <h2 className="text-sm font-bold text-foreground">
                  encrypted trading research
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your queries are encrypted with Arcium RescueCipher before
                  leaving your device. The backend never sees what tokens
                  you&apos;re researching — your alpha stays private.
                </p>
              </div>

              {/* Smart prompts grid */}
              <div className="w-full max-w-2xl space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <Lock className="h-3 w-3 text-terminal" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {loadingMarket
                      ? "loading live market data..."
                      : marketData
                        ? "powered by live dexscreener data"
                        : "suggested queries"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={prompt.label}
                        onClick={() =>
                          handleSuggestedPrompt(prompt.buildPrompt)
                        }
                        disabled={isLoading || loadingMarket}
                        className={`flex items-center gap-2.5 px-3 py-3 text-left text-xs border rounded transition-colors disabled:opacity-30 ${prompt.color}`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{prompt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {!apiKey && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-[10px] text-terminal hover:underline mt-2"
                  >
                    connect your API key to start →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-3 px-4 py-3 bg-card/50">
                  <div className="h-6 w-6 rounded flex items-center justify-center bg-terminal/10 text-terminal shrink-0">
                    <Lock className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      agent
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="animate-pulse">
                        decrypting response
                      </span>
                      <span className="cursor-blink">_</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-xs text-destructive">
            {error}
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={false}
        />
      </div>
    </div>
  );
}
