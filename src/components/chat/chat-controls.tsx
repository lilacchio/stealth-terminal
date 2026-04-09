"use client";

import { Lock, Unlock, Globe, GlobeOff, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MODELS, type ModelId } from "@/lib/solrouter";

interface ChatControlsProps {
  model: ModelId;
  onModelChange: (model: ModelId) => void;
  encrypted: boolean;
  onEncryptedChange: (v: boolean) => void;
  liveSearch: boolean;
  onLiveSearchChange: (v: boolean) => void;
}

export function ChatControls({
  model,
  onModelChange,
  encrypted,
  onEncryptedChange,
  liveSearch,
  onLiveSearchChange,
}: ChatControlsProps) {
  const currentModel = MODELS.find((m) => m.id === model) ?? MODELS[0];

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 border-b border-border bg-card/50">
      {/* Model selector */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center h-7 px-2 text-[10px] sm:text-[11px] font-mono border border-border bg-background rounded gap-1 hover:bg-accent transition-colors"
        >
          {currentModel.label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card border-border">
          {MODELS.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className={`text-xs font-mono ${
                m.id === model ? "text-terminal" : ""
              }`}
            >
              <span>{m.label}</span>
              <span className="ml-auto text-[9px] text-muted-foreground">
                {m.desc}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Encryption toggle */}
      <button
        onClick={() => !liveSearch && onEncryptedChange(!encrypted)}
        className={`flex items-center gap-1 h-7 px-2 text-[10px] sm:text-[11px] font-mono rounded border transition-colors ${
          encrypted || liveSearch
            ? "border-terminal/30 bg-terminal/10 text-terminal"
            : "border-border bg-background text-muted-foreground"
        } ${liveSearch ? "opacity-70 cursor-not-allowed" : ""}`}
        title={liveSearch ? "Encryption required for live search" : ""}
      >
        {encrypted || liveSearch ? (
          <Lock className="h-3 w-3" />
        ) : (
          <Unlock className="h-3 w-3" />
        )}
        {encrypted || liveSearch ? "encrypted" : "plain"}
        {liveSearch && !encrypted && (
          <span className="text-[8px] opacity-60">forced</span>
        )}
      </button>

      {/* Live search toggle */}
      <button
        onClick={() => onLiveSearchChange(!liveSearch)}
        className={`flex items-center gap-1 h-7 px-2 text-[10px] sm:text-[11px] font-mono rounded border transition-colors ${
          liveSearch
            ? "border-terminal/30 bg-terminal/10 text-terminal"
            : "border-border bg-background text-muted-foreground"
        }`}
      >
        {liveSearch ? (
          <Globe className="h-3 w-3" />
        ) : (
          <GlobeOff className="h-3 w-3" />
        )}
        live_search
      </button>
    </div>
  );
}
