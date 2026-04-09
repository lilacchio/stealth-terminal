"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Message } from "@/hooks/useChat";

const SESSIONS_KEY = "stealth_terminal_sessions";

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  activeSession: Session | null;
  createSession: (name?: string) => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  updateSessionMessages: (id: string, messages: Message[]) => void;
}

const SessionContext = createContext<SessionState | null>(null);

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  // Persist sessions on change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const createSession = useCallback((name?: string): string => {
    const id = `session-${Date.now()}`;
    const session: Session = {
      id,
      name: name ?? `session_${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}`,
      createdAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(id);
    return id;
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (activeSessionId === id) {
          setActiveSessionId(next.length > 0 ? next[0].id : null);
        }
        if (next.length === 0) {
          localStorage.removeItem(SESSIONS_KEY);
        }
        return next;
      });
    },
    [activeSessionId]
  );

  const renameSession = useCallback((id: string, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  const updateSessionMessages = useCallback(
    (id: string, messages: Message[]) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, messages } : s))
      );
    },
    []
  );

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? null;

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        createSession,
        switchSession,
        deleteSession,
        renameSession,
        updateSessionMessages,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx)
    throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
