"use client"

import { useEffect, useRef, useState } from "react"

import { aiAPI, AIAPIError } from "@/features/ai/api"
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace"
import { isConversationForChallenge } from "@/lib/conversation-scope"

export function useAutosaveDraft(delay = 1200) {
  const workspace = useChallengeWorkspace()
  const { conversationId, currentCode, revision, setAIError, setRevision } = workspace
  const challengeId = workspace.challenge?.challenge_id
  const [isSaving, setIsSaving] = useState(false)
  const lastSavedCode = useRef<string | null>(null)

  useEffect(() => {
    if (conversationId === null || challengeId === undefined || currentCode === lastSavedCode.current) return
    let current = true

    const timer = window.setTimeout(async () => {
      setIsSaving(true)
      try {
        const saved = await aiAPI.saveDraft(conversationId, {
          challenge_id: challengeId,
          code: currentCode,
          expected_revision: revision,
        })
        if (!current || !isConversationForChallenge(saved, challengeId)) return
        lastSavedCode.current = currentCode
        setRevision(saved.revision)
      } catch (error) {
        if (error instanceof AIAPIError && error.status === 409) {
          // Chỉ lấy revision mới; code local mới hơn vẫn được giữ để lần debounce sau lưu lại.
          const latest = await aiAPI.detail(conversationId).catch(() => null)
          if (current && latest && isConversationForChallenge(latest, challengeId)) {
            setRevision(latest.revision)
          }
        } else {
          if (current) setAIError(error instanceof Error ? error.message : "Unable to save the draft.")
        }
      } finally {
        if (current) setIsSaving(false)
      }
    }, delay)

    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [
    delay,
    conversationId,
    challengeId,
    currentCode,
    revision,
    setAIError,
    setRevision,
  ])

  return { isSaving }
}
