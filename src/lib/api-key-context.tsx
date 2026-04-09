"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { validateApiKey, type BalanceResponse } from "@/lib/solrouter";

const STORAGE_KEY = "stealth_terminal_api_key";

interface ApiKeyState {
  apiKey: string | null;
  balance: BalanceResponse | null;
  isValidating: boolean;
  error: string | null;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  saveKey: (key: string) => Promise<boolean>;
  removeKey: () => void;
  refreshBalance: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyState | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      // Validate stored key
      validateApiKey(stored).then((bal) => {
        if (bal) {
          setBalance(bal);
        } else {
          // Invalid stored key — clear it
          localStorage.removeItem(STORAGE_KEY);
          setApiKey(null);
        }
      });
    }
  }, []);

  const saveKey = useCallback(async (key: string): Promise<boolean> => {
    setIsValidating(true);
    setError(null);
    const bal = await validateApiKey(key);
    setIsValidating(false);
    if (bal) {
      setApiKey(key);
      setBalance(bal);
      localStorage.setItem(STORAGE_KEY, key);
      setShowModal(false);
      return true;
    } else {
      setError("Invalid API key. Check your key and try again.");
      return false;
    }
  }, []);

  const removeKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setBalance(null);
    setShowModal(true);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!apiKey) return;
    const bal = await validateApiKey(apiKey);
    if (bal) setBalance(bal);
  }, [apiKey]);

  return (
    <ApiKeyContext.Provider
      value={{
        apiKey,
        balance,
        isValidating,
        error,
        showModal,
        setShowModal,
        saveKey,
        removeKey,
        refreshBalance,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider");
  return ctx;
}
