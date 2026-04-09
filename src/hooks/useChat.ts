"use client";

import { useState, useCallback, useRef } from "react";
import { useApiKey } from "@/lib/api-key-context";
import { chat, type ModelId, type ChatResponse } from "@/lib/solrouter";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  encrypted?: boolean;
  attestationId?: string;
  model?: string;
  usage?: ChatResponse["usage"];
  cost?: number;
}

export interface ChatConfig {
  chatId?: string;
  model: ModelId;
  encrypted: boolean;
  useLiveSearch: boolean;
  systemPrompt?: string;
}

export function useChat() {
  const { apiKey, refreshBalance } = useApiKey();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const sendMessage = useCallback(
    async (content: string, config: ChatConfig) => {
      if (!apiKey || !content.trim() || loadingRef.current) return;

      const userMsg: Message = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      loadingRef.current = true;
      setError(null);

      try {
        const response = await chat(apiKey, content.trim(), {
          model: config.model,
          encrypted: config.encrypted,
          chatId: config.chatId,
          useLiveSearch: config.useLiveSearch,
          systemPrompt: config.systemPrompt,
        });

        const assistantMsg: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: response.message,
          timestamp: Date.now(),
          encrypted: response.encrypted,
          attestationId: response.privacyAttestationId,
          model: response.model,
          usage: response.usage,
          cost: response.cost,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        refreshBalance();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to get response";
        setError(msg);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [apiKey, refreshBalance]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
