import { NextRequest, NextResponse } from "next/server";
import { getPortfolio, isValidSolanaAddress } from "@/lib/solana";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address parameter required" }, { status: 400 });
  }

  if (!isValidSolanaAddress(address)) {
    return NextResponse.json({ error: "Invalid Solana address" }, { status: 400 });
  }

  try {
    const portfolio = await getPortfolio(address);

    // Fetch USD prices for tokens that have mints
    const mints = [
      "So11111111111111111111111111111111111111112", // SOL
      ...portfolio.tokens.map((t) => t.mint),
    ];

    // Deduplicate and limit to 30 tokens for DexScreener
    const uniqueMints = [...new Set(mints)].slice(0, 30);

    try {
      const priceRes = await fetch(
        `https://api.dexscreener.com/tokens/v1/solana/${uniqueMints.join(",")}`
      );
      if (priceRes.ok) {
        const pairs: { baseToken: { address: string }; priceUsd: string }[] =
          await priceRes.json();

        const prices: Record<string, number> = {};
        for (const pair of pairs) {
          const mint = pair.baseToken.address;
          if (!prices[mint] && pair.priceUsd) {
            prices[mint] = parseFloat(pair.priceUsd);
          }
        }

        // Apply SOL price
        const solPrice = prices["So11111111111111111111111111111111111111112"];
        if (solPrice) {
          portfolio.solUsdValue = portfolio.solBalance * solPrice;
        }

        // Apply token prices
        let totalUsd = portfolio.solUsdValue ?? 0;
        for (const token of portfolio.tokens) {
          const price = prices[token.mint];
          if (price) {
            token.usdPrice = price;
            token.usdValue = token.amount * price;
            totalUsd += token.usdValue;
          }
        }
        portfolio.totalUsdValue = totalUsd;
      }
    } catch {
      // Price fetch failed — still return portfolio without USD values
    }

    return NextResponse.json(portfolio);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portfolio fetch failed";
    // Handle RPC scan limit for wallets with too many token accounts
    if (message.includes("scan aborted") || message.includes("exceeded the limit")) {
      return NextResponse.json(
        { error: "This wallet has too many token accounts for the public RPC. Try a wallet with fewer holdings." },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
