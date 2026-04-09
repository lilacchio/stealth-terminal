const BASE_URL = "https://api.dexscreener.com";

export interface DexToken {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h1: number;
    h24: number;
  };
  priceChange: {
    h1: number;
    h24: number;
  };
  liquidity?: {
    usd: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  url: string;
}

// ── Risk Analysis ──

export interface RiskSignals {
  score: number; // 0-100, higher = riskier
  level: "low" | "medium" | "high" | "critical";
  flags: string[];
}

export function analyzeRisk(token: DexToken): RiskSignals {
  const flags: string[] = [];
  let score = 0;

  // 1. Token age — very new tokens are risky
  const ageMs = token.pairCreatedAt
    ? Date.now() - token.pairCreatedAt
    : Infinity;
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 1) {
    score += 30;
    flags.push("Created <1 hour ago");
  } else if (ageHours < 24) {
    score += 20;
    flags.push("Created <24 hours ago");
  } else if (ageHours < 72) {
    score += 10;
    flags.push("Created <3 days ago");
  }

  // 2. Liquidity health — low liquidity relative to mcap = rug risk
  const liq = token.liquidity?.usd ?? 0;
  const mcap = token.marketCap ?? token.fdv ?? 0;
  if (liq < 1000) {
    score += 25;
    flags.push("Liquidity <$1K (extremely thin)");
  } else if (liq < 10_000) {
    score += 15;
    flags.push("Liquidity <$10K (thin)");
  }
  if (mcap > 0 && liq > 0) {
    const liqRatio = liq / mcap;
    if (liqRatio < 0.02) {
      score += 15;
      flags.push("Liquidity/MCap ratio <2% (easy to rug)");
    } else if (liqRatio < 0.05) {
      score += 8;
      flags.push("Liquidity/MCap ratio <5%");
    }
  }

  // 3. Buy/sell ratio — heavy selling = dump signal
  const buys24 = token.txns.h24.buys;
  const sells24 = token.txns.h24.sells;
  const totalTxns = buys24 + sells24;
  if (totalTxns > 10) {
    const sellRatio = sells24 / totalTxns;
    if (sellRatio > 0.7) {
      score += 15;
      flags.push("Heavy selling (>70% sells in 24h)");
    } else if (sellRatio > 0.6) {
      score += 8;
      flags.push("More sells than buys (>60%)");
    }
  }
  if (totalTxns < 10) {
    score += 10;
    flags.push("Very low transaction count (<10 in 24h)");
  }

  // 4. Volume anomalies — volume way higher than liquidity = wash trading
  if (liq > 0 && token.volume.h24 > liq * 10) {
    score += 12;
    flags.push("Volume >10x liquidity (possible wash trading)");
  }

  // 5. Price crash
  if (token.priceChange.h24 < -50) {
    score += 20;
    flags.push(`Price crashed ${token.priceChange.h24.toFixed(0)}% in 24h`);
  } else if (token.priceChange.h24 < -30) {
    score += 10;
    flags.push(`Price dropped ${token.priceChange.h24.toFixed(0)}% in 24h`);
  }

  // 6. Extreme pump — could be manipulated
  if (token.priceChange.h24 > 500) {
    score += 10;
    flags.push(`Pumped +${token.priceChange.h24.toFixed(0)}% in 24h (caution)`);
  }

  // Clamp
  score = Math.min(score, 100);

  let level: RiskSignals["level"];
  if (score >= 60) level = "critical";
  else if (score >= 40) level = "high";
  else if (score >= 20) level = "medium";
  else level = "low";

  if (flags.length === 0) flags.push("No major risk signals detected");

  return { score, level, flags };
}

// ── Token age helper ──

export function getTokenAge(token: DexToken): string {
  if (!token.pairCreatedAt) return "unknown";
  const ms = Date.now() - token.pairCreatedAt;
  const mins = ms / (1000 * 60);
  if (mins < 60) return `${Math.floor(mins)}m`;
  const hours = mins / 60;
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d`;
  return `${Math.floor(days / 30)}mo`;
}

// ── API calls ──

export async function searchTokens(query: string): Promise<DexToken[]> {
  const res = await fetch(
    `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("DexScreener search failed");
  const data = await res.json();
  return (data.pairs ?? []).filter(
    (p: DexToken) => p.chainId === "solana"
  );
}

export async function getTrendingTokens(): Promise<DexToken[]> {
  const res = await fetch(`${BASE_URL}/token-boosts/top/v1`);
  if (!res.ok) throw new Error("DexScreener trending failed");
  const data = await res.json();

  const solanaTokens = (data ?? [])
    .filter((t: { chainId: string }) => t.chainId === "solana")
    .slice(0, 20);

  if (solanaTokens.length === 0) return [];

  const addresses = solanaTokens
    .map((t: { tokenAddress: string }) => t.tokenAddress)
    .join(",");

  const pairsRes = await fetch(`${BASE_URL}/tokens/v1/solana/${addresses}`);
  if (!pairsRes.ok) return [];
  const pairsData: DexToken[] = await pairsRes.json();

  // Deduplicate by base token — keep highest volume pair
  const seen = new Map<string, DexToken>();
  for (const pair of pairsData) {
    const key = pair.baseToken.address;
    const existing = seen.get(key);
    if (!existing || pair.volume.h24 > existing.volume.h24) {
      seen.set(key, pair);
    }
  }

  return Array.from(seen.values()).slice(0, 10);
}

export async function getNewPairs(): Promise<DexToken[]> {
  // Fetch latest token profiles (newly listed)
  const res = await fetch(`${BASE_URL}/token-profiles/latest/v1`);
  if (!res.ok) throw new Error("DexScreener new pairs failed");
  const data = await res.json();

  const solanaTokens = (data ?? [])
    .filter((t: { chainId: string }) => t.chainId === "solana")
    .slice(0, 20);

  if (solanaTokens.length === 0) return [];

  const addresses = solanaTokens
    .map((t: { tokenAddress: string }) => t.tokenAddress)
    .join(",");

  const pairsRes = await fetch(`${BASE_URL}/tokens/v1/solana/${addresses}`);
  if (!pairsRes.ok) return [];
  const pairsData: DexToken[] = await pairsRes.json();

  const seen = new Map<string, DexToken>();
  for (const pair of pairsData) {
    const key = pair.baseToken.address;
    const existing = seen.get(key);
    if (!existing || pair.volume.h24 > existing.volume.h24) {
      seen.set(key, pair);
    }
  }

  // Sort by creation date (newest first)
  return Array.from(seen.values())
    .sort((a, b) => (b.pairCreatedAt ?? 0) - (a.pairCreatedAt ?? 0))
    .slice(0, 12);
}

export async function getTokenByAddress(
  address: string
): Promise<DexToken[]> {
  const res = await fetch(`${BASE_URL}/tokens/v1/solana/${address}`);
  if (!res.ok) throw new Error("DexScreener token fetch failed");
  const data: DexToken[] = await res.json();
  return data.filter((p) => p.chainId === "solana");
}
