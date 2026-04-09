"use client";

import { useState } from "react";
import { useApiKey } from "@/lib/api-key-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, ExternalLink } from "lucide-react";

export function ApiKeyModal() {
  const { showModal, setShowModal, saveKey, isValidating, error, apiKey } =
    useApiKey();
  const [input, setInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const key = input.trim();
    if (!key) return;
    await saveKey(key);
  }

  return (
    <Dialog
      open={showModal}
      onOpenChange={setShowModal}
    >
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-mono">
            <Shield className="h-4 w-4 text-terminal" />
            {">"} enter_api_key
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your key is stored locally and only sent to SolRouter&apos;s
            encrypted API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="sk_solrouter_..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-xs bg-background border-border"
              disabled={isValidating}
              autoFocus
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isValidating || !input.trim()}
            className="w-full bg-terminal text-background hover:bg-terminal/90 text-xs font-mono"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                validating...
              </>
            ) : (
              "> connect"
            )}
          </Button>

          <div className="text-[10px] text-muted-foreground space-y-1">
            <p>
              Need a key?{" "}
              <a
                href="https://solrouter.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline inline-flex items-center gap-0.5"
              >
                solrouter.com/api
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
            <p>
              Free devnet USDC:{" "}
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal hover:underline inline-flex items-center gap-0.5"
              >
                faucet.circle.com
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
