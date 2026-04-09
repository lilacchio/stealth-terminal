"use client";

import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Bot,
  Shield,
  AlertTriangle,
  Clock,
  Droplets,
  Activity,
} from "lucide-react";
import type { DexToken } from "@/lib/dexscreener";
import { analyzeRisk, getTokenAge } from "@/lib/dexscreener";
import { useRouter } from "next/navigation";
import { useApiKey } from "@/lib/api-key-context";
import { useState } from "react";

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPrice(p: string): string {
  const n = parseFloat(p);
  if (n === 0) return "$0";
  if (n < 0.0001) {
    // Show as $0.0{5}4306 style (zeros count in braces)
    const str = n.toFixed(20);
    const match = str.match(/^0\.(0+)(\d+)/);
    if (match) {
      const zeros = match[1].length;
      const sig = match[2].slice(0, 4);
      return `$0.0{${zeros}}${sig}`;
    }
    return `$${n.toFixed(10)}`;
  }
  if (n < 1) return `$${n.toFixed(4)}`;
  if (n < 1000) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const RISK_COLORS = {
  low: "text-terminal",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const RISK_BG = {
  low: "bg-terminal/10 border-terminal/20",
  medium: "bg-yellow-400/10 border-yellow-400/20",
  high: "bg-orange-400/10 border-orange-400/20",
  critical: "bg-red-400/10 border-red-400/20",
};

export function TokenCard({ token }: { token: DexToken }) {
  const router = useRouter();
  const { apiKey } = useApiKey();
  const [showFlags, setShowFlags] = useState(false);

  const change = token.priceChange.h24;
  const isPositive = change >= 0;
  const risk = analyzeRisk(token);
  const age = getTokenAge(token);

  const buys = token.txns.h24.buys;
  const sells = token.txns.h24.sells;
  const total = buys + sells;
  const buyPercent = total > 0 ? (buys / total) * 100 : 50;

  function analyzeWithAI() {
    const context = `Analyze this Solana token for trading potential and risks:
- Name: ${token.baseToken.name} (${token.baseToken.symbol})
- Price: ${formatPrice(token.priceUsd)}
- 24h Change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%
- 24h Volume: ${formatNumber(token.volume.h24)}
- Market Cap: ${token.marketCap ? formatNumber(token.marketCap) : "N/A"}
- Liquidity: ${token.liquidity ? formatNumber(token.liquidity.usd) : "N/A"}
- DEX: ${token.dexId}
- Pair Age: ${age}
- 24h Txns: ${buys} buys / ${sells} sells
- Risk Score: ${risk.score}/100 (${risk.level})
- Risk Flags: ${risk.flags.join(", ")}

Give a brief risk assessment: is this a potential rug pull? What are the red/green flags? Should a trader enter, and at what risk level?`;

    sessionStorage.setItem("stealth_terminal_prefill", context);
    router.push("/agent");
  }

  return (
    <div className="border border-border bg-card space-y-0 hover:border-terminal/30 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between p-3 pb-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground truncate">
              {token.baseToken.symbol}
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {token.baseToken.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
            <span>{token.dexId}</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {age}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Price + change */}
      <div className="flex items-baseline justify-between px-3 py-2">
        <span className="text-lg font-bold text-foreground">
          {formatPrice(token.priceUsd)}
        </span>
        <span
          className={`flex items-center gap-0.5 text-xs font-bold ${
            isPositive ? "text-terminal" : "text-destructive"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      </div>

      {/* Risk badge */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setShowFlags(!showFlags)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded border ${RISK_BG[risk.level]} ${RISK_COLORS[risk.level]} w-full justify-between`}
        >
          <span className="flex items-center gap-1">
            {risk.level === "low" ? (
              <Shield className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            risk: {risk.level.toUpperCase()} ({risk.score}/100)
          </span>
          <span className="text-[9px] opacity-60">
            {risk.flags.length} signal{risk.flags.length !== 1 ? "s" : ""}
          </span>
        </button>
        {showFlags && (
          <div className="mt-1.5 space-y-0.5">
            {risk.flags.map((flag, i) => (
              <div
                key={i}
                className={`text-[9px] px-2 py-0.5 ${RISK_COLORS[risk.level]} opacity-80`}
              >
                • {flag}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="bg-card px-3 py-2">
          <div className="text-[9px] text-muted-foreground uppercase">
            volume 24h
          </div>
          <div className="text-xs font-bold text-foreground">
            {formatNumber(token.volume.h24)}
          </div>
        </div>
        <div className="bg-card px-3 py-2">
          <div className="text-[9px] text-muted-foreground uppercase">mcap</div>
          <div className="text-xs font-bold text-foreground">
            {token.marketCap ? formatNumber(token.marketCap) : "—"}
          </div>
        </div>
        <div className="bg-card px-3 py-2">
          <div className="text-[9px] text-muted-foreground uppercase flex items-center gap-0.5">
            <Droplets className="h-2.5 w-2.5" />
            liquidity
          </div>
          <div className="text-xs font-bold text-foreground">
            {token.liquidity ? formatNumber(token.liquidity.usd) : "—"}
          </div>
        </div>
      </div>

      {/* Buy/Sell bar */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between text-[9px]">
          <span className="text-terminal">
            {buys} buys ({buyPercent.toFixed(0)}%)
          </span>
          <span className="text-destructive">
            {sells} sells ({(100 - buyPercent).toFixed(0)}%)
          </span>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
          <div
            className="bg-terminal transition-all"
            style={{ width: `${buyPercent}%` }}
          />
          <div
            className="bg-destructive transition-all"
            style={{ width: `${100 - buyPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <Activity className="h-2.5 w-2.5" />
          {total} txns in 24h
        </div>
      </div>

      {/* Analyze button */}
      <div className="p-3 pt-0">
        <button
          onClick={analyzeWithAI}
          disabled={!apiKey}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold border border-terminal/30 text-terminal hover:bg-terminal/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Bot className="h-3 w-3" />
          encrypted_risk_analysis
        </button>
      </div>
    </div>
  );
}
