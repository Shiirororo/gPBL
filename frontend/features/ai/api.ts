import type {
  AIConversation,
  AIConversationDetail,
  AIExchange,
  ConversationStatus,
  SaveDraftInput,
  SendMessageInput,
} from "./types"

export class AIAPIError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = "AIAPIError"
  }

  get isAILocked(): boolean {
    return this.status === 423 && this.code === "ai_locked"
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const body = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string }
    detail?: string
  }
  if (!response.ok) {
    throw new AIAPIError(
      body.error?.message ?? body.detail ?? "The AI request failed.",
      response.status,
      body.error?.code,
    )
  }
  return body as T
}

const base = "/api/ai/conversations"

export const aiAPI = {
  list: (challengeId?: number) =>
    request<AIConversation[]>(
      challengeId ? `${base}?challenge_id=${challengeId}` : base,
    ),
  create: (challengeId: number) =>
    request<AIConversation>(base, {
      method: "POST",
      body: JSON.stringify({ challenge_id: challengeId }),
    }),
  detail: (conversationId: number) =>
    request<AIConversationDetail>(`${base}/${conversationId}`),
  saveDraft: (conversationId: number, input: SaveDraftInput) =>
    request<AIConversation>(`${base}/${conversationId}/draft`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  sendMessage: (conversationId: number, input: SendMessageInput) =>
    request<AIExchange>(`${base}/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  close: (conversationId: number, status: Exclude<ConversationStatus, "active">) =>
    request<AIConversation>(`${base}/${conversationId}/close`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
}
