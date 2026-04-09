const QUOTE_API = "https://api.jup.ag/swap/v1";
const DEXSCREENER_API = "https://api.dexscreener.com";

// Well-known Solana token mints
export const POPULAR_TOKENS = [
  { symbol: "SOL", name: "Solana", mint: "So11111111111111111111111111111111111111112", decimals: 9, logo: "◎" },
  { symbol: "USDC", name: "USD Coin", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, logo: "$" },
  { symbol: "USDT", name: "Tether", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6, logo: "₮" },
  { symbol: "JUP", name: "Jupiter", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6, logo: "♃" },
  { symbol: "RAY", name: "Raydium", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", decimals: 6, logo: "☼" },
  { symbol: "BONK", name: "Bonk", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5, logo: "🐕" },
  { symbol: "WIF", name: "dogwifhat", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", decimals: 6, logo: "🎩" },
  { symbol: "PYTH", name: "Pyth Network", mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3", decimals: 6, logo: "⎔" },
  { symbol: "JTO", name: "Jito", mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL", decimals: 9, logo: "⚡" },
  { symbol: "ORCA", name: "Orca", mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", decimals: 6, logo: "🐋" },
] as const;

export type TokenInfo = (typeof POPULAR_TOKENS)[number];

export const POPULAR_PAIRS = [
  { from: "SOL", to: "USDC" },
  { from: "SOL", to: "JUP" },
  { from: "SOL", to: "BONK" },
  { from: "SOL", to: "WIF" },
  { from: "USDC", to: "SOL" },
  { from: "JUP", to: "SOL" },
  { from: "SOL", to: "RAY" },
  { from: "SOL", to: "JTO" },
];

export function getToken(symbol: string): TokenInfo | undefined {
  return POPULAR_TOKENS.find((t) => t.symbol === symbol);
}

// ── Quote types ──

export interface RouteStep {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
  percent: number;
}

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: {
    swapInfo: RouteStep;
    percent: number;
  }[];
  contextSlot: number;
  timeTaken: number;
}

export interface QuoteResult {
  quote: JupiterQuote;
  inputToken: TokenInfo;
  outputToken: TokenInfo;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  slippageBps: number;
  rate: number;
  inverseRate: number;
  routes: string[];
  minimumReceived: number;
}

// ── API calls ──

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  inputDecimals: number,
  outputDecimals: number,
  slippageBps: number = 50
): Promise<JupiterQuote> {
  const lamports = Math.round(amount * 10 ** inputDecimals);
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: lamports.toString(),
    slippageBps: slippageBps.toString(),
  });

  const res = await fetch(`${QUOTE_API}/quote?${params}`, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch Jupiter quote");
  }
  return res.json();
}

export function parseQuote(
  quote: JupiterQuote,
  inputToken: TokenInfo,
  outputToken: TokenInfo
): QuoteResult {
  const inputAmount =
    parseInt(quote.inAmount) / 10 ** inputToken.decimals;
  const outputAmount =
    parseInt(quote.outAmount) / 10 ** outputToken.decimals;
  const minimumReceived =
    parseInt(quote.otherAmountThreshold) / 10 ** outputToken.decimals;
  const priceImpact = parseFloat(quote.priceImpactPct);
  const rate = outputAmount / inputAmount;
  const inverseRate = inputAmount / outputAmount;

  const routes = quote.routePlan.map((r) => r.swapInfo.label);
  // Deduplicate route labels
  const uniqueRoutes = [...new Set(routes)];

  return {
    quote,
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    priceImpact,
    slippageBps: quote.slippageBps,
    rate,
    inverseRate,
    routes: uniqueRoutes,
    minimumReceived,
  };
}

// ── Price API (via DexScreener) ──

export interface TokenPrice {
  mint: string;
  price: number;
}

export async function getTokenPrices(
  mints: string[]
): Promise<Record<string, TokenPrice>> {
  const addresses = mints.join(",");
  const res = await fetch(
    `${DEXSCREENER_API}/tokens/v1/solana/${addresses}`
  );
  if (!res.ok) throw new Error("Failed to fetch prices");
  const pairs: { baseToken: { address: string }; priceUsd: string }[] =
    await res.json();

  // Deduplicate: pick the pair with highest liquidity for each token
  const result: Record<string, TokenPrice> = {};
  for (const pair of pairs) {
    const mint = pair.baseToken.address;
    if (mints.includes(mint) && !result[mint]) {
      result[mint] = { mint, price: parseFloat(pair.priceUsd) };
    }
  }
  return result;
}
