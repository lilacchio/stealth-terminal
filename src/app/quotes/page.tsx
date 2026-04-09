"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeftRight,
  ArrowDown,
  Loader2,
  Bot,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Shield,
  Zap,
  Route,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  POPULAR_TOKENS,
  POPULAR_PAIRS,
  getToken,
  parseQuote,
  type TokenInfo,
  type QuoteResult,
  type JupiterQuote,
} from "@/lib/jupiter";
import { useRouter } from "next/navigation";
import { useApiKey } from "@/lib/api-key-context";

const SLIPPAGE_OPTIONS = [
  { label: "0.1%", bps: 10 },
  { label: "0.3%", bps: 30 },
  { label: "0.5%", bps: 50 },
  { label: "1%", bps: 100 },
  { label: "3%", bps: 300 },
];

function formatAmount(n: number, decimals: number = 6): string {
  if (n === 0) return "0";
  if (n < 0.000001) return n.toExponential(4);
  if (n < 1) return n.toFixed(Math.min(decimals, 8));
  if (n < 1000) return n.toFixed(4);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatUsd(n: number): string {
  if (n < 0.01) return "<$0.01";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export default function QuotesPage() {
  const router = useRouter();
  const { apiKey, setShowModal } = useApiKey();

  const [fromToken, setFromToken] = useState<TokenInfo>(POPULAR_TOKENS[0]); // SOL
  const [toToken, setToToken] = useState<TokenInfo>(POPULAR_TOKENS[1]); // USDC
  const [amount, setAmount] = useState("1");
  const [slippageBps, setSlippageBps] = useState(50);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch USD prices for selected tokens
  const fetchPrices = useCallback(async () => {
    try {
      const mints = [fromToken.mint, toToken.mint].join(",");
      const res = await fetch(`/api/prices?ids=${mints}`);
      if (res.ok) {
        const data = await res.json();
        const priceMap: Record<string, number> = {};
        for (const [mint, info] of Object.entries(data)) {
          priceMap[mint] = (info as { price: number }).price;
        }
        setPrices(priceMap);
      }
    } catch {
      // Silently fail
    }
  }, [fromToken.mint, toToken.mint]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setQuoteResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        amount: parsedAmount.toString(),
        inputDecimals: fromToken.decimals.toString(),
        outputDecimals: toToken.decimals.toString(),
        slippageBps: slippageBps.toString(),
      });

      const res = await fetch(`/api/quote?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Quote failed");

      const result = parseQuote(
        data as JupiterQuote,
        fromToken,
        toToken
      );
      setQuoteResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
      setQuoteResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [amount, fromToken, toToken, slippageBps]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchQuote]);

  // Fetch on param change (debounced)
  useEffect(() => {
    const timeout = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeout);
  }, [fetchQuote]);

  function swapTokens() {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
  }

  function selectPair(from: string, to: string) {
    const f = getToken(from);
    const t = getToken(to);
    if (f && t) {
      setFromToken(f);
      setToToken(t);
    }
  }

  function getAIOpinion() {
    if (!apiKey) {
      setShowModal(true);
      return;
    }
    if (!quoteResult) return;

    const q = quoteResult;
    const fromPrice = prices[fromToken.mint];
    const toPrice = prices[toToken.mint];

    const context = `I'm considering this swap on Solana via Jupiter:

SWAP DETAILS:
- Selling: ${formatAmount(q.inputAmount)} ${fromToken.symbol} (${fromToken.name})${fromPrice ? ` ≈ ${formatUsd(q.inputAmount * fromPrice)}` : ""}
- Buying: ${formatAmount(q.outputAmount)} ${toToken.symbol} (${toToken.name})${toPrice ? ` ≈ ${formatUsd(q.outputAmount * toPrice)}` : ""}
- Rate: 1 ${fromToken.symbol} = ${formatAmount(q.rate)} ${toToken.symbol}
- Price Impact: ${q.priceImpact.toFixed(4)}%
- Slippage Tolerance: ${q.slippageBps / 100}%
- Minimum Received: ${formatAmount(q.minimumReceived)} ${toToken.symbol}
- Route: ${q.routes.join(" → ")}
${fromPrice ? `- ${fromToken.symbol} Price: ${formatUsd(fromPrice)}` : ""}
${toPrice ? `- ${toToken.symbol} Price: ${formatUsd(toPrice)}` : ""}

Should I execute this swap? Consider:
1. Is the price impact acceptable?
2. Is the route efficient?
3. Is this a good time to swap based on current market conditions?
4. Any risks I should be aware of (slippage, liquidity)?
5. Would you recommend a different strategy (DCA, limit order, etc.)?`;

    sessionStorage.setItem("stealth_terminal_prefill", context);
    router.push("/agent");
  }

  const fromUsdValue = prices[fromToken.mint]
    ? parseFloat(amount || "0") * prices[fromToken.mint]
    : null;
  const toUsdValue =
    quoteResult && prices[toToken.mint]
      ? quoteResult.outputAmount * prices[toToken.mint]
      : null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Privacy banner */}
      <div className="flex items-start gap-3 p-3 bg-terminal/5 border border-terminal/20 rounded">
        <Lock className="h-4 w-4 text-terminal shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-terminal font-bold">Read-only quotes.</span>{" "}
          No wallet connection, no transaction signing. Get Jupiter quotes +
          encrypted AI analysis of whether the swap makes sense.
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-terminal" />
            swap_quotes
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Jupiter aggregator · Best routes · Real-time pricing
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
            autoRefresh
              ? "border-terminal/30 bg-terminal/10 text-terminal"
              : "border-border text-muted-foreground"
          }`}
        >
          <RefreshCw className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`} />
          {autoRefresh ? "auto (10s)" : "auto-refresh"}
        </button>
      </div>

      {/* Popular pairs */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground self-center mr-1">
          popular:
        </span>
        {POPULAR_PAIRS.map((pair) => (
          <button
            key={`${pair.from}-${pair.to}`}
            onClick={() => selectPair(pair.from, pair.to)}
            className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
              fromToken.symbol === pair.from && toToken.symbol === pair.to
                ? "border-terminal/30 bg-terminal/10 text-terminal"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {pair.from}/{pair.to}
          </button>
        ))}
      </div>

      {/* Swap card */}
      <div className="border border-border bg-card">
        {/* From */}
        <div className="p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            you pay
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="any"
              className="flex-1 text-2xl font-bold bg-transparent border-none p-0 h-auto focus:ring-0 text-foreground placeholder:text-muted-foreground/30"
            />
            <TokenSelector
              selected={fromToken}
              onSelect={setFromToken}
              exclude={toToken.mint}
            />
          </div>
          {fromUsdValue != null && fromUsdValue > 0 && (
            <div className="text-[11px] text-muted-foreground">
              ≈ {formatUsd(fromUsdValue)}
            </div>
          )}
        </div>

        {/* Swap arrow */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={swapTokens}
            className="h-8 w-8 rounded-full bg-card border-2 border-border flex items-center justify-center hover:border-terminal/30 hover:text-terminal transition-colors text-muted-foreground"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        {/* To */}
        <div className="p-4 pt-5 space-y-2 border-t border-border bg-background/30">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            you receive
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-bold text-foreground">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : quoteResult ? (
                formatAmount(quoteResult.outputAmount)
              ) : (
                <span className="text-muted-foreground/30">0</span>
              )}
            </div>
            <TokenSelector
              selected={toToken}
              onSelect={setToToken}
              exclude={fromToken.mint}
            />
          </div>
          {toUsdValue != null && toUsdValue > 0 && (
            <div className="text-[11px] text-muted-foreground">
              ≈ {formatUsd(toUsdValue)}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      {/* Quote details */}
      {quoteResult && (
        <div className="border border-border bg-card divide-y divide-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              quote details
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuote}
              disabled={isLoading}
              className="h-6 text-[10px] border-border"
            >
              <RefreshCw className={`h-2.5 w-2.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              refresh
            </Button>
          </div>

          {/* Rate */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Rate</span>
            <span className="text-foreground font-mono">
              1 {fromToken.symbol} = {formatAmount(quoteResult.rate)}{" "}
              {toToken.symbol}
            </span>
          </div>

          {/* Inverse rate */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Inverse</span>
            <span className="text-foreground font-mono">
              1 {toToken.symbol} = {formatAmount(quoteResult.inverseRate)}{" "}
              {fromToken.symbol}
            </span>
          </div>

          {/* Price impact */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price Impact</span>
            <span
              className={`font-mono font-bold ${
                quoteResult.priceImpact > 1
                  ? "text-destructive"
                  : quoteResult.priceImpact > 0.1
                    ? "text-yellow-400"
                    : "text-terminal"
              }`}
            >
              {quoteResult.priceImpact > 0.01
                ? `${quoteResult.priceImpact.toFixed(4)}%`
                : "<0.01%"}
              {quoteResult.priceImpact > 1 && (
                <span className="ml-1 text-[9px]">⚠ HIGH</span>
              )}
            </span>
          </div>

          {/* Slippage */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Slippage Tolerance</span>
            <div className="flex items-center gap-1">
              {SLIPPAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.bps}
                  onClick={() => setSlippageBps(opt.bps)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-colors ${
                    slippageBps === opt.bps
                      ? "bg-terminal/10 text-terminal border border-terminal/30"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum received */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Minimum Received</span>
            <span className="text-foreground font-mono">
              {formatAmount(quoteResult.minimumReceived)} {toToken.symbol}
            </span>
          </div>

          {/* Route */}
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Route className="h-3 w-3" />
              Route
            </span>
            <span className="text-foreground font-mono text-[10px]">
              {quoteResult.routes.join(" → ")}
            </span>
          </div>

          {/* Route steps */}
          {quoteResult.quote.routePlan.length > 1 && (
            <div className="px-4 py-2.5 space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                route breakdown
              </span>
              {quoteResult.quote.routePlan.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[10px] text-muted-foreground"
                >
                  <span className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" />
                    {step.swapInfo.label}
                  </span>
                  <span>{step.percent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Execute swap on Jupiter */}
        <a
          href={quoteResult
            ? `https://jup.ag/swap/${fromToken.symbol}-${toToken.symbol}?amount=${amount}`
            : `https://jup.ag/swap/${fromToken.symbol}-${toToken.symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 py-3 text-xs font-bold rounded border transition-colors ${
            quoteResult
              ? "border-terminal bg-terminal text-background hover:bg-terminal/90"
              : "border-border bg-muted text-muted-foreground cursor-not-allowed pointer-events-none opacity-40"
          }`}
        >
          <Zap className="h-4 w-4" />
          execute_swap_on_jupiter ↗
        </a>

        {/* AI Opinion button */}
        <button
          onClick={getAIOpinion}
          disabled={!quoteResult || isLoading}
          className="flex items-center justify-center gap-2 py-3 text-xs font-bold border border-terminal/30 text-terminal hover:bg-terminal/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded"
        >
          <Shield className="h-4 w-4" />
          <Bot className="h-4 w-4" />
          get_encrypted_ai_opinion
        </button>
      </div>

      {/* Quick suggestions */}
      {quoteResult && (
        <div className="space-y-2">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
            ask the agent
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              `Is now a good time to swap ${fromToken.symbol} to ${toToken.symbol}?`,
              `What's the outlook for ${toToken.symbol} this week?`,
              `Compare ${toToken.symbol} vs holding ${fromToken.symbol}`,
              `Best DCA strategy for ${fromToken.symbol} → ${toToken.symbol}`,
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  if (!apiKey) { setShowModal(true); return; }
                  sessionStorage.setItem("stealth_terminal_prefill", q);
                  router.push("/agent");
                }}
                className="text-[10px] px-3 py-2 text-left border border-border text-muted-foreground hover:text-terminal hover:border-terminal/30 transition-colors rounded"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Token Selector Dropdown ──

function TokenSelector({
  selected,
  onSelect,
  exclude,
}: {
  selected: TokenInfo;
  onSelect: (t: TokenInfo) => void;
  exclude: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-10 px-3 bg-muted border border-border rounded font-mono text-sm font-bold text-foreground hover:bg-accent transition-colors shrink-0">
        <span className="text-base">{selected.logo}</span>
        {selected.symbol}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-card border-border max-h-64 overflow-y-auto"
      >
        {POPULAR_TOKENS.filter((t) => t.mint !== exclude).map((token) => (
          <DropdownMenuItem
            key={token.mint}
            onClick={() => onSelect(token)}
            className={`font-mono text-xs ${
              token.mint === selected.mint ? "text-terminal" : ""
            }`}
          >
            <span className="text-base mr-2">{token.logo}</span>
            <span className="font-bold">{token.symbol}</span>
            <span className="ml-2 text-muted-foreground text-[10px]">
              {token.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
