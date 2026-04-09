import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPC_URL = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export interface TokenHolding {
  mint: string;
  symbol?: string;
  name?: string;
  amount: number;
  decimals: number;
  usdValue?: number;
  usdPrice?: number;
  logo?: string;
}

export interface PortfolioData {
  address: string;
  solBalance: number;
  solUsdValue?: number;
  tokens: TokenHolding[];
  totalUsdValue?: number;
  fetchedAt: number;
}

// Known token metadata (for quick display without external lookups)
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; logo: string }> = {
  "So11111111111111111111111111111111111111112": { symbol: "SOL", name: "Solana", logo: "◎" },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", name: "USD Coin", logo: "$" },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", name: "Tether", logo: "₮" },
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": { symbol: "JUP", name: "Jupiter", logo: "♃" },
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": { symbol: "RAY", name: "Raydium", logo: "☼" },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": { symbol: "BONK", name: "Bonk", logo: "🐕" },
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": { symbol: "WIF", name: "dogwifhat", logo: "🎩" },
  "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3": { symbol: "PYTH", name: "Pyth Network", logo: "⎔" },
  "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL": { symbol: "JTO", name: "Jito", logo: "⚡" },
  "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE": { symbol: "ORCA", name: "Orca", logo: "🐋" },
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": { symbol: "WETH", name: "Wrapped ETH", logo: "Ξ" },
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": { symbol: "mSOL", name: "Marinade SOL", logo: "🌊" },
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": { symbol: "stSOL", name: "Lido Staked SOL", logo: "💧" },
  "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1": { symbol: "bSOL", name: "BlazeStake SOL", logo: "🔥" },
};

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

export async function getPortfolio(address: string): Promise<PortfolioData> {
  const conn = new Connection(RPC_URL, "confirmed");
  const pubkey = new PublicKey(address);

  // Fetch SOL balance and token accounts in parallel
  const [solBalance, tokenAccounts] = await Promise.all([
    conn.getBalance(pubkey),
    conn.getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID }),
  ]);

  const tokens: TokenHolding[] = [];

  for (const account of tokenAccounts.value) {
    const parsed = account.account.data.parsed;
    if (parsed.type !== "account") continue;

    const info = parsed.info;
    const mint: string = info.mint;
    const amount = parseFloat(info.tokenAmount.uiAmountString ?? "0");
    const decimals: number = info.tokenAmount.decimals;

    // Skip zero-balance accounts
    if (amount === 0) continue;

    const known = KNOWN_TOKENS[mint];
    tokens.push({
      mint,
      symbol: known?.symbol,
      name: known?.name,
      logo: known?.logo,
      amount,
      decimals,
    });
  }

  // Sort: known tokens first (by symbol), then unknown by amount descending
  tokens.sort((a, b) => {
    if (a.symbol && !b.symbol) return -1;
    if (!a.symbol && b.symbol) return 1;
    if (a.symbol && b.symbol) return a.symbol.localeCompare(b.symbol);
    return b.amount - a.amount;
  });

  return {
    address,
    solBalance: solBalance / LAMPORTS_PER_SOL,
    tokens,
    fetchedAt: Date.now(),
  };
}
