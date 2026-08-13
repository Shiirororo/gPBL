"use client";

import * as React from "react";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";

import { Message } from "@/components/ui/message";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent,
  MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace";
import { useAIConversationController } from "@/providers/AIConversationProvider";

export default function ChatBox() {
  const [draft, setDraft] = React.useState("");
  const { messages, aiError, conversationId, loading } = useChallengeWorkspace();
  const { sendMessage, isSending, isInitializing, isSaving } = useAIConversationController();
  const disabled = !draft.trim() || loading || isSending || isInitializing || conversationId === null;

  const send = React.useCallback(async () => {
    if (disabled) return;
    const sent = await sendMessage(draft);
    if (sent) setDraft("");
  }, [disabled, draft, sendMessage]);

  return (
    <div className="flex w-full max-w-[600px] h-[750px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 dark:shadow-black/60">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <div className="relative shrink-0">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">AI</div>
          <span className="absolute bottom-0 right-0 block size-2.5 rounded-full border-2 border-card bg-emerald-400" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">gPBL Assistant</span>
          <span className="text-[11px] text-emerald-500">
            {isInitializing ? "Opening conversation..." : isSaving ? "Saving code..." : "Active now"}
          </span>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col bg-background dark:bg-zinc-950">
        <MessageScrollerProvider>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent className="py-4">
                {messages.length === 0 && <p className="px-4 text-sm text-muted-foreground">Ask for a hint about your current code.</p>}
                {messages.map((message) => (
                  <MessageScrollerItem key={message.id} scrollAnchor={message.role === "user"}>
                    <Message role={message.role} content={message.content} timestamp="" />
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {aiError && <p className="border-t border-border px-3 py-2 text-xs text-red-400">{aiError}</p>}
      <div className="flex items-end gap-2 border-t border-border bg-card px-3 py-3">
        <textarea
          aria-label="Type a message"
          placeholder="Ask the AI assistant..."
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!disabled) void send();
            }
          }}
          className="flex-1 resize-none rounded-2xl border border-border bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button type="button" aria-label="Send message" disabled={disabled} onClick={() => void send()} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40">
          <PaperPlaneTiltIcon weight="fill" className="size-4" />
        </button>
      </div>
    </div>
  );
}
