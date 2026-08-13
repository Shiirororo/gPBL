"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { aiAPI, AIAPIError } from "@/features/ai/api"
import type { AIConversationDetail, ConversationStatus } from "@/features/ai/types"
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace"
import { isConversationForChallenge } from "@/lib/conversation-scope"
import type { AIMessage } from "@/providers/ChallengeWorkspaceProvider"
import { generateId } from "@/utils/id"

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
  const challengeIdRef = useRef(challengeId)
  const [isSending, setIsSending] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const requestRef = useRef<{
    id: string
    conversationId: number
    question: string
    code: string
    revision: number
    challengeId: number
  } | null>(null)

  useEffect(() => {
    challengeIdRef.current = challengeId
  }, [challengeId])

  const loadDetail = useCallback(async (
    id: number,
    restoreCode = true,
    expectedChallengeId = challengeIdRef.current,
  ) => {
    const detail = await aiAPI.detail(id)
    if (
      !isConversationForChallenge(detail, expectedChallengeId) ||
      challengeIdRef.current !== expectedChallengeId
    ) {
      return null
    }
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
      const active = conversations.find(
        (item) => item.status === "active" && isConversationForChallenge(item, challengeId),
      )
      if (active) {
        const detail = await aiAPI.detail(active.conversation_id)
        if (
          !isCurrent() ||
          challengeIdRef.current !== challengeId ||
          !isConversationForChallenge(detail, challengeId)
        ) return
        setConversation(detail.conversation_id, detail.revision, messagesFrom(detail))
        setCurrentCode(detail.current_code)
      } else {
        const created = await aiAPI.create(challengeId)
        if (
          !isCurrent() ||
          challengeIdRef.current !== challengeId ||
          !isConversationForChallenge(created, challengeId)
        ) return
        setConversation(created.conversation_id, created.revision, [])
        setCurrentCode(created.current_code || starterCode)
      }
    } catch (error) {
      if (isCurrent()) {
        if (error instanceof AIAPIError && error.isAILocked) {
          setAIError("AI assistance is currently locked. Please try solving the challenge on your own first.")
        } else {
          setAIError(error instanceof Error ? error.message : "Unable to open the AI conversation.")
        }
      }
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
    if (!trimmed || isSending || conversationId === null || challengeId === undefined) return false
    const requestChallengeId = challengeId
    setIsSending(true)
    setAIError(null)
    const previousRequest = requestRef.current
    const samePayload = previousRequest !== null &&
      previousRequest.conversationId === conversationId &&
      previousRequest.challengeId === requestChallengeId &&
      previousRequest.question === trimmed &&
      previousRequest.code === currentCode &&
      previousRequest.revision === revision
    const request = samePayload
      ? previousRequest
      : {
          id: generateId(),
          conversationId,
          challengeId: requestChallengeId,
          question: trimmed,
          code: currentCode,
          revision,
        }
    requestRef.current = request
    try {
      await aiAPI.sendMessage(conversationId, {
        challenge_id: requestChallengeId,
        question: trimmed, code: currentCode,
        expected_revision: revision, request_id: request.id,
      })
      // Lấy revision và history chính xác từ server sau khi AI hoàn tất.
      const detail = await loadDetail(conversationId, false, requestChallengeId)
      if (!detail) return false
      requestRef.current = null
      return true
    } catch (error) {
      if (challengeIdRef.current !== requestChallengeId) return false
      if (
        error instanceof AIAPIError &&
        [409, 503].includes(error.status)
      ) {
        await loadDetail(conversationId, false, requestChallengeId).catch(() => undefined)
      }
      if (error instanceof AIAPIError && error.code === "ai_unavailable") requestRef.current = null
      
      // Handle AI lock error specifically
      if (error instanceof AIAPIError && error.isAILocked) {
        setAIError("AI assistance is currently locked. Please try solving the challenge on your own first.")
        requestRef.current = null
      } else {
        setAIError(error instanceof Error ? error.message : "Unable to send the message.")
      }
      
      return false
    } finally {
      setIsSending(false)
    }
  }, [challengeId, conversationId, currentCode, isSending, loadDetail, revision, setAIError])

  const startNew = useCallback(async () => {
    if (!challengeId) return
    const created = await aiAPI.create(challengeId)
    if (
      challengeIdRef.current !== challengeId ||
      !isConversationForChallenge(created, challengeId)
    ) return
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
