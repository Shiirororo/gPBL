"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { aiAPI, AIAPIError } from "@/features/ai/api"
import type { AIConversationDetail, ConversationStatus } from "@/features/ai/types"
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace"
import type { AIMessage } from "@/providers/ChallengeWorkspaceProvider"

function messagesFrom(detail: AIConversationDetail): AIMessage[] {
  return detail.exchanges.flatMap((exchange) => {
    const result: AIMessage[] = [{
      id: `${exchange.exchange_id}-user`, role: "user", content: exchange.user_question,
      sequence: exchange.sequence, codeSnapshot: exchange.code_snapshot,
    }]
    if (exchange.assistant_hint) result.push({
      id: `${exchange.exchange_id}-assistant`, role: "assistant",
      content: exchange.assistant_hint, sequence: exchange.sequence,
    })
    return result
  })
}

export function useAIConversation() {
  const workspace = useChallengeWorkspace()
  const { conversationId, currentCode, revision, setConversation, setCurrentCode, setAIError } = workspace
  const challengeId = workspace.challenge?.challenge_id
  const starterCode = workspace.challenge?.starter_code ?? ""
  const [isSending, setIsSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const requestRef = useRef<{
    id: string
    conversationId: number
    question: string
    code: string
    revision: number
  } | null>(null)

  const loadDetail = useCallback(async (id: number, restoreCode = true) => {
    const detail = await aiAPI.detail(id)
    setConversation(detail.conversation_id, detail.revision, messagesFrom(detail))
    if (restoreCode) setCurrentCode(detail.current_code)
    return detail
  }, [setConversation, setCurrentCode])

  const initialize = useCallback(async (isCurrent: () => boolean = () => true) => {
    if (!challengeId) return
    setIsInitializing(true)
    setAIError(null)
    try {
      const conversations = await aiAPI.list(challengeId)
      if (!isCurrent()) return
      const active = conversations.find((item) => item.status === "active")
      if (active) {
        const detail = await aiAPI.detail(active.conversation_id)
        if (!isCurrent()) return
        setConversation(detail.conversation_id, detail.revision, messagesFrom(detail))
        setCurrentCode(detail.current_code)
      } else {
        const created = await aiAPI.create(challengeId)
        if (!isCurrent()) return
        setConversation(created.conversation_id, created.revision, [])
        setCurrentCode(created.current_code || starterCode)
      }
    } catch (error) {
      if (isCurrent()) setAIError(error instanceof Error ? error.message : "Unable to open the AI conversation.")
    } finally {
      if (isCurrent()) setIsInitializing(false)
    }
  }, [challengeId, setConversation, setCurrentCode, setAIError, starterCode])

  // Challenge thay đổi thì hủy quyền cập nhật state của request cũ.
  useEffect(() => {
    let current = true
    const task = window.setTimeout(() => void initialize(() => current), 0)
    return () => { current = false; window.clearTimeout(task) }
  }, [initialize])

  const sendMessage = useCallback(async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || isSending || conversationId === null) return false
    setIsSending(true)
    setAIError(null)
    const previousRequest = requestRef.current
    const samePayload = previousRequest !== null &&
      previousRequest.conversationId === conversationId &&
      previousRequest.question === trimmed &&
      previousRequest.code === currentCode &&
      previousRequest.revision === revision
    const request = samePayload
      ? previousRequest
      : {
          id: crypto.randomUUID(),
          conversationId,
          question: trimmed,
          code: currentCode,
          revision,
        }
    requestRef.current = request
    try {
      await aiAPI.sendMessage(conversationId, {
        question: trimmed, code: currentCode,
        expected_revision: revision, request_id: request.id,
      })
      // Lấy revision và history chính xác từ server sau khi AI hoàn tất.
      await loadDetail(conversationId, false)
      requestRef.current = null
      return true
    } catch (error) {
      if (error instanceof AIAPIError && [409, 503].includes(error.status)) {
        await loadDetail(conversationId, false).catch(() => undefined)
      }
      if (error instanceof AIAPIError && error.code === "ai_unavailable") requestRef.current = null
      setAIError(error instanceof Error ? error.message : "Unable to send the message.")
      return false
    } finally {
      setIsSending(false)
    }
  }, [conversationId, currentCode, isSending, loadDetail, revision, setAIError])

  const startNew = useCallback(async () => {
    if (!challengeId) return
    const created = await aiAPI.create(challengeId)
    setConversation(created.conversation_id, created.revision, [])
    setCurrentCode(created.current_code || starterCode)
    setAIError(null)
  }, [challengeId, setConversation, setCurrentCode, setAIError, starterCode])

  const close = useCallback(async (status: Exclude<ConversationStatus, "active">) => {
    if (conversationId === null) return
    await aiAPI.close(conversationId, status)
    setConversation(null, 0, [])
  }, [conversationId, setConversation])

  return { initialize, loadDetail, sendMessage, startNew, close, isSending, isInitializing }
}
