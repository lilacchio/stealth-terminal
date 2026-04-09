"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Wallet, KeyRound, RefreshCw } from "lucide-react";
import { useApiKey } from "@/lib/api-key-context";

const navItems = [
  { href: "/agent", label: "agent" },
  { href: "/dashboard", label: "dashboard" },
  { href: "/quotes", label: "quotes" },
  { href: "/portfolio", label: "portfolio" },
];

export function Header() {
  const pathname = usePathname();
  const { apiKey, balance, setShowModal, refreshBalance } = useApiKey();

  // Refresh balance on page navigation and every 30s
  useEffect(() => {
    if (apiKey) refreshBalance();
  }, [pathname, apiKey, refreshBalance]);

  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [apiKey, refreshBalance]);

  return (
    <header className="border-b border-border bg-card shrink-0">
      <div className="h-12 flex items-center px-3 sm:px-4 gap-2 sm:gap-6">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Shield className="h-4 w-4 text-terminal" />
          <span className="text-xs sm:text-sm font-bold tracking-wider text-terminal glow-green hidden sm:inline">
            {">"} STEALTH_TERMINAL
          </span>
          <span className="text-xs font-bold tracking-wider text-terminal glow-green sm:hidden">
            {">"} ST
          </span>
        </Link>

        {pathname === "/" ? (
          <Link
            href="/agent"
            className="ml-2 px-3 py-1.5 text-[10px] sm:text-xs font-bold tracking-wide bg-terminal text-background hover:bg-terminal/90 transition-colors rounded"
          >
            Open Terminal
          </Link>
        ) : (
          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs tracking-wide transition-colors whitespace-nowrap ${
                    isActive
                      ? "text-terminal bg-terminal/10 border border-terminal/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {apiKey ? (
              <>
                <Wallet className="h-3 w-3" />
                <span className="text-terminal hidden sm:inline">
                  {balance?.balanceFormatted ?? "..."}
                </span>
                <span className="text-terminal sm:hidden">
                  {balance ? `$${balance.balance.toFixed(1)}` : "..."}
                </span>
              </>
            ) : (
              <>
                <KeyRound className="h-3 w-3" />
                <span>set_key</span>
              </>
            )}
          </button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${apiKey ? "bg-terminal" : "bg-terminal/50"}`}
            />
            <span>{apiKey ? "connected" : "offline"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
