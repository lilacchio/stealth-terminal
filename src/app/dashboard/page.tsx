"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  TrendingUp,
  Loader2,
  RefreshCw,
  Sparkles,
  Filter,
  Lock,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TokenCard } from "@/components/dashboard/token-card";
import type { DexToken } from "@/lib/dexscreener";
import { analyzeRisk } from "@/lib/dexscreener";

type Tab = "trending" | "new" | "search";

const MCAP_FILTERS = [
  { label: "All", value: "all" },
  { label: "<$100K", value: "100k" },
  { label: "<$1M", value: "1m" },
  { label: "<$10M", value: "10m" },
  { label: "<$50M", value: "50m" },
  { label: "$50M+", value: "50m+" },
] as const;

const RISK_FILTERS = [
  { label: "All", value: "all" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
] as const;

type McapFilter = (typeof MCAP_FILTERS)[number]["value"];
type RiskFilter = (typeof RISK_FILTERS)[number]["value"];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("trending");
  const [trending, setTrending] = useState<DexToken[]>([]);
  const [newPairs, setNewPairs] = useState<DexToken[]>([]);
  const [searchResults, setSearchResults] = useState<DexToken[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [mcapFilter, setMcapFilter] = useState<McapFilter>("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [minVolume, setMinVolume] = useState("");
  const [minLiquidity, setMinLiquidity] = useState("");

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens/trending");
      const data = await res.json();
      if (res.ok) setTrending(Array.isArray(data) ? data : []);
      else setError(data.error ?? "Failed to fetch");
    } catch {
      setError("Failed to fetch trending tokens");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNewPairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tokens/new");
      const data = await res.json();
      if (res.ok) setNewPairs(Array.isArray(data) ? data : []);
      else setError(data.error ?? "Failed to fetch");
    } catch {
      setError("Failed to fetch new pairs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    fetchNewPairs();
  }, [fetchTrending, fetchNewPairs]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setTab("search");
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/tokens/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      if (res.ok) setSearchResults(Array.isArray(data) ? data.slice(0, 20) : []);
      else setError(data.error ?? "Search failed");
    } catch {
      setError("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  const rawTokens =
    tab === "trending"
      ? trending
      : tab === "new"
        ? newPairs
        : searchResults;

  // Apply filters
  const filteredTokens = useMemo(() => {
    return rawTokens.filter((t) => {
      // MCap filter
      const mcap = t.marketCap ?? t.fdv ?? 0;
      switch (mcapFilter) {
        case "100k": if (mcap >= 100_000) return false; break;
        case "1m": if (mcap >= 1_000_000) return false; break;
        case "10m": if (mcap >= 10_000_000) return false; break;
        case "50m": if (mcap >= 50_000_000) return false; break;
        case "50m+": if (mcap < 50_000_000) return false; break;
      }

      // Risk filter
      if (riskFilter !== "all") {
        const risk = analyzeRisk(t);
        if (risk.level !== riskFilter) return false;
      }

      // Min volume
      const minVol = parseFloat(minVolume);
      if (minVol > 0 && t.volume.h24 < minVol) return false;

      // Min liquidity
      const minLiq = parseFloat(minLiquidity);
      if (minLiq > 0 && (t.liquidity?.usd ?? 0) < minLiq) return false;

      return true;
    });
  }, [rawTokens, mcapFilter, riskFilter, minVolume, minLiquidity]);

  const hasActiveFilters =
    mcapFilter !== "all" ||
    riskFilter !== "all" ||
    minVolume !== "" ||
    minLiquidity !== "";

  function clearFilters() {
    setMcapFilter("all");
    setRiskFilter("all");
    setMinVolume("");
    setMinLiquidity("");
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Privacy banner */}
      <div className="flex items-start gap-3 p-3 bg-terminal/5 border border-terminal/20 rounded">
        <Lock className="h-4 w-4 text-terminal shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="text-terminal font-bold">Private research mode.</span>{" "}
          When you click &quot;encrypted_risk_analysis&quot;, your query is encrypted
          with Arcium RescueCipher before leaving your device. No one — not even
          SolRouter&apos;s servers — can see what tokens you&apos;re researching. Your
          alpha stays yours.
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-terminal" />
            token_dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time Solana token data · Risk scoring · DexScreener
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`text-xs border-border ${hasActiveFilters ? "text-terminal border-terminal/30" : ""}`}
          >
            <Filter className="h-3 w-3 mr-1.5" />
            filters
            {hasActiveFilters && (
              <span className="ml-1 h-4 w-4 rounded-full bg-terminal text-background text-[9px] flex items-center justify-center">
                !
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTrending();
              fetchNewPairs();
            }}
            disabled={isLoading}
            className="text-xs border-border"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            />
            refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by token name, symbol, or mint address..."
            className="pl-9 text-xs font-mono bg-background border-border h-9"
          />
        </div>
        <Button
          type="submit"
          disabled={isSearching}
          size="sm"
          className="bg-terminal text-background hover:bg-terminal/90 text-xs h-9"
        >
          {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : "search"}
        </Button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-terminal hover:underline flex items-center gap-0.5"
              >
                <X className="h-2.5 w-2.5" />
                clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* MCap filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase">
                market cap
              </label>
              <div className="flex flex-wrap gap-1">
                {MCAP_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setMcapFilter(f.value)}
                    className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                      mcapFilter === f.value
                        ? "border-terminal/30 bg-terminal/10 text-terminal"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase">
                risk level
              </label>
              <div className="flex flex-wrap gap-1">
                {RISK_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setRiskFilter(f.value)}
                    className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                      riskFilter === f.value
                        ? "border-terminal/30 bg-terminal/10 text-terminal"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min volume */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase">
                min 24h volume ($)
              </label>
              <Input
                type="number"
                value={minVolume}
                onChange={(e) => setMinVolume(e.target.value)}
                placeholder="e.g. 10000"
                className="h-8 text-[10px] font-mono bg-background border-border"
              />
            </div>

            {/* Min liquidity */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase">
                min liquidity ($)
              </label>
              <Input
                type="number"
                value={minLiquidity}
                onChange={(e) => setMinLiquidity(e.target.value)}
                placeholder="e.g. 5000"
                className="h-8 text-[10px] font-mono bg-background border-border"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { id: "trending" as Tab, label: "Trending", icon: TrendingUp, count: trending.length },
          { id: "new" as Tab, label: "New Pairs", icon: Sparkles, count: newPairs.length },
          { id: "search" as Tab, label: "Search", icon: Search, count: searchResults.length },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-colors ${
              tab === t.id
                ? "border-terminal text-terminal"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
            {t.count > 0 && (
              <span className="text-[9px] opacity-60">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Results info */}
      {hasActiveFilters && (
        <div className="text-[10px] text-muted-foreground">
          Showing {filteredTokens.length} of {rawTokens.length} tokens
          {filteredTokens.length < rawTokens.length && (
            <button
              onClick={clearFilters}
              className="ml-2 text-terminal hover:underline"
            >
              clear filters
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded">
          {error}
        </div>
      )}

      {/* Token grid */}
      {isLoading && rawTokens.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 text-terminal animate-spin" />
          <span className="ml-2 text-xs text-muted-foreground">
            loading tokens...
          </span>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <div className="text-xs text-muted-foreground">
            {hasActiveFilters
              ? "No tokens match your filters."
              : tab === "search" && !query
                ? "Enter a search query above."
                : "No tokens found."}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-terminal hover:underline"
            >
              clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTokens.map((token) => (
            <TokenCard key={token.pairAddress} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
