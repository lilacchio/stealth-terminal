"use client";

import { Lock, Unlock, Bot, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/hooks/useChat";

export function ChatMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`group flex gap-3 px-4 py-3 ${isUser ? "" : "bg-card/50"}`}
    >
      <div
        className={`h-6 w-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-muted text-muted-foreground"
            : "bg-terminal/10 text-terminal"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {isUser ? "you" : "agent"}
          </span>
          {!isUser && message.model && (
            <span className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
              {message.model}
            </span>
          )}
          {!isUser && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              {message.encrypted ? (
                <>
                  <Lock className="h-2.5 w-2.5 text-terminal" />
                  <span className="text-terminal">encrypted</span>
                </>
              ) : (
                <>
                  <Unlock className="h-2.5 w-2.5" />
                  <span>plain</span>
                </>
              )}
            </span>
          )}
        </div>

        {isUser ? (
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="text-sm text-foreground leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:text-foreground prose-headings:font-bold prose-strong:text-foreground prose-code:text-terminal prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-table:text-xs prose-th:text-muted-foreground prose-th:font-bold prose-td:border-border prose-th:border-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && (
          <div className="flex items-center gap-3 pt-1">
            {message.usage && message.usage.totalTokens > 0 && (
              <span className="text-[9px] text-muted-foreground">
                {message.usage.totalTokens} tokens
              </span>
            )}
            {message.cost != null && message.cost > 0 && (
              <span className="text-[9px] text-muted-foreground">
                ${message.cost.toFixed(6)} USDC
              </span>
            )}
            {message.attestationId && (
              <span
                className="text-[9px] text-terminal/60 truncate max-w-[200px] cursor-help"
                title={`Privacy attestation: ${message.attestationId}`}
              >
                attest: {message.attestationId.slice(0, 12)}...
              </span>
            )}
            <button
              onClick={handleCopy}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3 w-3 text-terminal" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
