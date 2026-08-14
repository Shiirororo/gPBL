import type { AIMessage } from "@/providers/ChallengeWorkspaceProvider"

export function createOptimisticUserMessage(
  requestId: string,
  question: string,
  codeSnapshot: string,
): AIMessage {
  return {
    id: `pending-user-${requestId}`,
    role: "user",
    content: question.trim(),
    codeSnapshot,
  }
}
