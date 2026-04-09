"use client";

import type { ReactNode } from "react";
import { ApiKeyProvider } from "@/lib/api-key-context";
import { ApiKeyModal } from "@/components/api-key-modal";
import { SessionProvider } from "@/lib/session-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiKeyProvider>
      <SessionProvider>
        <ApiKeyModal />
        {children}
      </SessionProvider>
    </ApiKeyProvider>
  );
}
