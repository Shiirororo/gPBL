"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useAIConversation } from "@/hooks/useAIConversation";
import { useAutosaveDraft } from "@/hooks/useAutosaveDraft";

type AIConversationController = ReturnType<typeof useAIConversation> & {
  isSaving: boolean;
};

const AIConversationContext = createContext<AIConversationController | null>(null);

export function AIConversationProvider({ children }: { children: ReactNode }) {
  const conversation = useAIConversation();
  const { isSaving } = useAutosaveDraft();

  return (
    <AIConversationContext.Provider value={{ ...conversation, isSaving }}>
      {children}
    </AIConversationContext.Provider>
  );
}

export function useAIConversationController(): AIConversationController {
  const controller = useContext(AIConversationContext);
  if (!controller) {
    throw new Error(
      "useAIConversationController must be used inside AIConversationProvider.",
    );
  }
  return controller;
}
