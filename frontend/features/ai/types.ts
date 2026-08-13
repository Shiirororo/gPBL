export type ConversationStatus = "active" | "completed" | "abandoned"
export type ExchangeStatus = "pending" | "completed" | "failed"

export interface AIExchange {
  exchange_id: number
  sequence: number
  user_question: string
  code_snapshot: string
  assistant_hint: string
  created_at: string
  request_id: string
  status: ExchangeStatus
}

export interface AIConversation {
  conversation_id: number
  challenge_id: number
  status: ConversationStatus
  current_code: string
  revision: number
  started_at: string
  updated_at: string
  ended_at: string | null
}

export interface AIConversationDetail extends AIConversation {
  exchanges: AIExchange[]
}

export interface SaveDraftInput {
  challenge_id: number
  code: string
  expected_revision: number
}

export interface SendMessageInput extends SaveDraftInput {
  question: string
  request_id: string
}

export interface APIErrorBody {
  error?: { code?: string; message?: string }
  detail?: string
}
