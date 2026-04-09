"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  BarChart3,
  ArrowLeftRight,
  ScanSearch,
  Terminal,
} from "lucide-react";

const sidebarItems = [
  { href: "/agent", label: "agent_chat", icon: MessageSquare },
  { href: "/dashboard", label: "token_data", icon: BarChart3 },
  { href: "/quotes", label: "swap_quotes", icon: ArrowLeftRight },
  { href: "/portfolio", label: "portfolio_scan", icon: ScanSearch },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 border-r border-border bg-card shrink-0 hidden md:flex flex-col">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
          <Terminal className="h-3 w-3" />
          navigation
        </div>
      </div>
      <nav className="flex flex-col p-2 gap-0.5">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2.5 py-2 text-xs transition-colors ${
                isActive
                  ? "text-terminal bg-terminal/10 border-l-2 border-terminal"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border-l-2 border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-border">
        <div className="text-[10px] text-muted-foreground/50">
          <div>solrouter_sdk v1.0.1</div>
          <div>arcium_encryption: on</div>
        </div>
      </div>
    </aside>
  );
}
