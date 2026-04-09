import { NextResponse } from "next/server";
import { getTrendingTokens, getNewPairs, analyzeRisk, getTokenAge } from "@/lib/dexscreener";
import type { DexToken } from "@/lib/dexscreener";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function tokenSummary(t: DexToken): string {
  const risk = analyzeRisk(t);
  return `${t.baseToken.symbol} (${t.baseToken.name}): price $${parseFloat(t.priceUsd).toFixed(8)}, 24h change ${t.priceChange.h24 >= 0 ? "+" : ""}${t.priceChange.h24.toFixed(1)}%, vol ${formatNum(t.volume.h24)}, mcap ${t.marketCap ? formatNum(t.marketCap) : "?"}, liq ${t.liquidity ? formatNum(t.liquidity.usd) : "?"}, age ${getTokenAge(t)}, buys/sells ${t.txns.h24.buys}/${t.txns.h24.sells}, risk ${risk.level} (${risk.score}/100) [${risk.flags.join("; ")}]`;
}

export async function GET() {
  try {
    const [trending, newPairs] = await Promise.all([
      getTrendingTokens().catch(() => []),
      getNewPairs().catch(() => []),
    ]);

    // Build data snapshots
    const trendingSummary = trending
      .slice(0, 8)
      .map(tokenSummary)
      .join("\n");

    const newPairsSummary = newPairs
      .slice(0, 8)
      .map(tokenSummary)
      .join("\n");

    // Find specific categories
    const lowMcap = trending
      .filter((t) => (t.marketCap ?? Infinity) < 50_000_000)
      .slice(0, 5)
      .map(tokenSummary)
      .join("\n");

    const highRisk = [...trending, ...newPairs]
      .filter((t) => analyzeRisk(t).level === "critical" || analyzeRisk(t).level === "high")
      .slice(0, 5)
      .map(tokenSummary)
      .join("\n");

    const gainers = [...trending, ...newPairs]
      .filter((t) => t.priceChange.h24 > 0)
      .sort((a, b) => b.priceChange.h24 - a.priceChange.h24)
      .slice(0, 5)
      .map(tokenSummary)
      .join("\n");

    return NextResponse.json({
      trending: trendingSummary,
      newPairs: newPairsSummary,
      lowMcap,
      highRisk,
      gainers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
