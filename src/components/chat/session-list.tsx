"use client";

import { Plus, Trash2, MessageSquare } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { Button } from "@/components/ui/button";

export function SessionList() {
  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
  } = useSession();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          sessions
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => createSession()}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-terminal"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.length === 0 && (
          <div className="text-[10px] text-muted-foreground/50 text-center py-4">
            no sessions yet
          </div>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group flex items-center gap-2 px-2 py-1.5 text-xs rounded cursor-pointer transition-colors ${
              session.id === activeSessionId
                ? "bg-terminal/10 text-terminal"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            onClick={() => switchSession(session.id)}
          >
            <MessageSquare className="h-3 w-3 shrink-0" />
            <span className="truncate flex-1">{session.name}</span>
            <span className="text-[9px] opacity-50">
              {session.messages.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
