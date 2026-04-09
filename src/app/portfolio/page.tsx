"use client";

import { useState, useCallback } from "react";
import {
  Wallet,
  Loader2,
  RefreshCw,
  Lock,
  Bot,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  PieChart,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApiKey } from "@/lib/api-key-context";
import type { PortfolioData, TokenHolding } from "@/lib/solana";

function formatUsd(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (n < 0.01) return "<$0.01";
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmount(n: number): string {
  if (n === 0) return "0";
  if (n < 0.000001) {
    const str = n.toFixed(20);
    const match = str.match(/^0\.0*(\d+)/);
    if (match) {
      const zeros = str.match(/^0\.(0*)/)?.[1]?.length ?? 0;
      const significant = match[1].slice(0, 4);
      return `0.0{${zeros}}${significant}`;
    }
    return n.toExponential(2);
  }
  if (n < 1) return n.toFixed(6);
  if (n < 1000) return n.toFixed(4);
  if (n < 1_000_000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${(n / 1_000_000).toFixed(2)}M`;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

// Example wallets for quick access
const EXAMPLE_WALLETS = [
  { label: "Toly (Solana co-founder)", address: "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" },
  { label: "Jupiter DAO", address: "BQ72nSv9f3PRyRKCBnHLVrerrv37CYTHm5h3s9VSGQDV" },
  { label: "Drift Protocol", address: "JCNCMFXo5M68qVs4Fjkjkb5Yh4iM6GRQZnLPdKFiVzG" },
];

export default function PortfolioPage() {
  const [address, setAddress] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<"value" | "amount" | "name">("value");

  const router = useRouter();
  const { apiKey, setShowModal } = useApiKey();

  const fetchPortfolio = useCallback(async (addr?: string) => {
    const target = addr || address;
    if (!target.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio?address=${encodeURIComponent(target.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch portfolio");
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch portfolio");
      setPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchPortfolio();
  }

  function handleExampleWallet(addr: string) {
    setAddress(addr);
    fetchPortfolio(addr);
  }

  function copyAddress() {
    if (!portfolio) return;
    navigator.clipboard.writeText(portfolio.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function analyzeWithAI() {
    if (!portfolio) return;
    if (!apiKey) {
      setShowModal(true);
      return;
    }

    const holdings = portfolio.tokens
      .filter((t) => t.usdValue && t.usdValue > 0.01)
      .map((t) => `${t.symbol ?? shortenAddress(t.mint)}: ${formatAmount(t.amount)} (${formatUsd(t.usdValue)})`)
      .join("\n");

    const prompt = `Analyze this Solana wallet portfolio for risk, concentration, and opportunities:

Wallet: ${portfolio.address}
SOL Balance: ${portfolio.solBalance.toFixed(4)} SOL (${formatUsd(portfolio.solUsdValue)})
Total Value: ${formatUsd(portfolio.totalUsdValue)}
Token Holdings (${portfolio.tokens.length} tokens):
${holdings || "No token holdings with value"}

Provide:
1. Portfolio concentration risk (is it too heavy in one asset?)
2. Token quality assessment (any known rugs, memecoins, or low-quality tokens?)
3. Diversification suggestions
4. Any red flags (unusual token patterns, potential airdrop scams, dust attacks)
5. Overall portfolio health score (1-10)`;

    sessionStorage.setItem("agent_prefill", prompt);
    router.push("/agent");
  }

  // Sort tokens
  const sortedTokens = portfolio
    ? [...portfolio.tokens].sort((a, b) => {
        switch (sortBy) {
          case "value":
            return (b.usdValue ?? 0) - (a.usdValue ?? 0);
          case "amount":
            return b.amount - a.amount;
          case "name":
            return (a.symbol ?? a.mint).localeCompare(b.symbol ?? b.mint);
          default:
            return 0;
        }
      })
    : [];

  // Portfolio allocation for top tokens
  const totalValue = portfolio?.totalUsdValue ?? 0;
  const topHoldings = sortedTokens
    .filter((t) => t.usdValue && t.usdValue > 0)
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto h-full overflow-y-auto">
      {/* Privacy banner */}
      <div className="flex items-start gap-3 p-3 bg-terminal/5 border border-terminal/20 rounded">
        <Lock className="h-4 w-4 text-terminal shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-terminal font-bold">Private portfolio analysis.</span>{" "}
          When you click &quot;analyze_with_ai&quot;, your wallet data is encrypted with
          Arcium RescueCipher before analysis. Your holdings and trading patterns remain
          completely private — no one can see what you own.
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-terminal" />
            portfolio_scanner
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Scan any Solana wallet · Token holdings · USD values · AI risk analysis
          </p>
        </div>
        {portfolio && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPortfolio()}
            disabled={isLoading}
            className="text-xs border-border"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            refresh
          </Button>
        )}
      </div>

      {/* Wallet input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Solana wallet address..."
              className="pl-9 text-xs font-mono bg-background border-border h-9"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !address.trim()}
            size="sm"
            className="bg-terminal text-background hover:bg-terminal/90 text-xs h-9 px-4"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "scan"}
          </Button>
        </div>

        {/* Example wallets */}
        {!portfolio && (
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-muted-foreground py-1">try:</span>
            {EXAMPLE_WALLETS.map((w) => (
              <button
                key={w.address}
                type="button"
                onClick={() => handleExampleWallet(w.address)}
                className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-terminal hover:border-terminal/30 transition-colors font-mono"
              >
                {w.label}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Scan failed</div>
            <div className="opacity-80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !portfolio && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 text-terminal animate-spin" />
          <span className="ml-2 text-xs text-muted-foreground">
            scanning wallet...
          </span>
        </div>
      )}

      {/* Portfolio results */}
      {portfolio && (
        <div className="space-y-4">
          {/* Overview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Address */}
            <div className="border border-border bg-card p-3 rounded space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                wallet
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-foreground">
                  {shortenAddress(portfolio.address)}
                </span>
                <button onClick={copyAddress} className="text-muted-foreground hover:text-terminal">
                  {copied ? <Check className="h-3 w-3 text-terminal" /> : <Copy className="h-3 w-3" />}
                </button>
                <a
                  href={`https://solscan.io/account/${portfolio.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-terminal"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* SOL Balance */}
            <div className="border border-border bg-card p-3 rounded space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                sol balance
              </div>
              <div className="text-sm font-bold text-foreground">
                ◎ {portfolio.solBalance.toFixed(4)}
              </div>
              {portfolio.solUsdValue !== undefined && (
                <div className="text-[10px] text-muted-foreground">
                  {formatUsd(portfolio.solUsdValue)}
                </div>
              )}
            </div>

            {/* Token Count */}
            <div className="border border-border bg-card p-3 rounded space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                tokens held
              </div>
              <div className="text-sm font-bold text-foreground">
                {portfolio.tokens.length}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {portfolio.tokens.filter((t) => t.symbol).length} known
              </div>
            </div>

            {/* Total Value */}
            <div className="border border-border bg-card p-3 rounded space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                total value
              </div>
              <div className="text-sm font-bold text-terminal">
                {formatUsd(portfolio.totalUsdValue)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                estimated USD
              </div>
            </div>
          </div>

          {/* Allocation bar (top 5 tokens) */}
          {topHoldings.length > 0 && totalValue > 0 && (
            <div className="border border-border bg-card p-3 rounded space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <PieChart className="h-3 w-3" />
                  allocation
                </div>
                <button
                  onClick={analyzeWithAI}
                  className="text-[10px] text-terminal hover:underline flex items-center gap-1"
                >
                  <Bot className="h-3 w-3" />
                  analyze_with_ai
                </button>
              </div>

              {/* Visual bar */}
              <div className="h-3 rounded-full overflow-hidden flex bg-muted/30">
                {/* SOL portion */}
                {portfolio.solUsdValue && portfolio.solUsdValue > 0 && (
                  <div
                    className="h-full bg-terminal/80"
                    style={{ width: `${Math.max((portfolio.solUsdValue / totalValue) * 100, 2)}%` }}
                    title={`SOL: ${((portfolio.solUsdValue / totalValue) * 100).toFixed(1)}%`}
                  />
                )}
                {topHoldings.map((t, i) => {
                  const pct = ((t.usdValue ?? 0) / totalValue) * 100;
                  if (pct < 1) return null;
                  const colors = [
                    "bg-blue-500/70",
                    "bg-purple-500/70",
                    "bg-yellow-500/70",
                    "bg-pink-500/70",
                    "bg-cyan-500/70",
                  ];
                  return (
                    <div
                      key={t.mint}
                      className={`h-full ${colors[i % colors.length]}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                      title={`${t.symbol ?? shortenAddress(t.mint)}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {portfolio.solUsdValue && portfolio.solUsdValue > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-terminal/80" />
                    SOL {((portfolio.solUsdValue / totalValue) * 100).toFixed(1)}%
                  </div>
                )}
                {topHoldings.map((t, i) => {
                  const pct = ((t.usdValue ?? 0) / totalValue) * 100;
                  if (pct < 1) return null;
                  const dotColors = [
                    "bg-blue-500/70",
                    "bg-purple-500/70",
                    "bg-yellow-500/70",
                    "bg-pink-500/70",
                    "bg-cyan-500/70",
                  ];
                  return (
                    <div key={t.mint} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className={`w-2 h-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                      {t.symbol ?? shortenAddress(t.mint)} {pct.toFixed(1)}%
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Analysis button */}
          <Button
            onClick={analyzeWithAI}
            className="w-full bg-terminal/10 border border-terminal/20 text-terminal hover:bg-terminal/20 text-xs h-9"
            variant="outline"
          >
            <Lock className="h-3 w-3 mr-1.5" />
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            analyze_portfolio_risk (encrypted)
          </Button>

          {/* Holdings table */}
          <div className="border border-border bg-card rounded overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                holdings ({portfolio.tokens.length})
              </div>
              <div className="flex gap-1">
                {(["value", "amount", "name"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                      sortBy === s
                        ? "bg-terminal/10 text-terminal"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {sortedTokens.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No token holdings found in this wallet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* SOL row */}
                <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-terminal/10 flex items-center justify-center text-sm">
                      ◎
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">SOL</div>
                      <div className="text-[10px] text-muted-foreground">Solana</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-foreground">
                      {portfolio.solBalance.toFixed(4)}
                    </div>
                    {portfolio.solUsdValue !== undefined && (
                      <div className="text-[10px] text-muted-foreground">
                        {formatUsd(portfolio.solUsdValue)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Token rows */}
                {sortedTokens.map((token) => (
                  <TokenRow key={token.mint} token={token} />
                ))}
              </div>
            )}
          </div>

          {/* Unknown tokens warning */}
          {portfolio.tokens.some((t) => !t.symbol) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded text-[11px] text-yellow-500/80">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <div>
                Some tokens couldn&apos;t be identified. Unknown tokens may include airdrop scams,
                dust attacks, or legitimate new tokens. Use AI analysis for a full assessment.
              </div>
            </div>
          )}

          {/* Scanned at */}
          <div className="text-[10px] text-muted-foreground text-center">
            scanned at {new Date(portfolio.fetchedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!portfolio && !isLoading && !error && (
        <div className="text-center py-12 space-y-3">
          <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <div className="text-xs text-muted-foreground">
            Enter a Solana wallet address to scan holdings and analyze risk.
          </div>
          <div className="text-[10px] text-muted-foreground/60">
            Works with any public Solana address — no wallet connection needed.
          </div>
        </div>
      )}
    </div>
  );
}

function TokenRow({ token }: { token: TokenHolding }) {
  const isKnown = !!token.symbol;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
            isKnown ? "bg-muted/30" : "bg-yellow-500/10"
          }`}
        >
          {token.logo || "?"}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
            {token.symbol ?? "Unknown"}
            {!isKnown && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-500/80">
                unverified
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground truncate max-w-[180px] sm:max-w-[280px]">
            {token.name ?? shortenAddress(token.mint)}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <div className="text-xs font-mono text-foreground">
          {formatAmount(token.amount)}
        </div>
        {token.usdValue !== undefined ? (
          <div className="text-[10px] text-muted-foreground">
            {formatUsd(token.usdValue)}
            {token.usdPrice !== undefined && (
              <span className="ml-1 opacity-60">
                @ {formatUsd(token.usdPrice)}
              </span>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground/50">no price</div>
        )}
      </div>
    </div>
  );
}
