/**
 * AI Lock Feature Integration
 * 
 * Handles AI assistance locks that prevent users from accessing AI help
 * for the first 10 minutes after starting a challenge.
 */

import { useCallback, useEffect, useState } from "react"
import { aiAPI } from "@/features/ai/api"

interface AILockStatus {
  ai_locked: boolean
  remaining_seconds: number
  locked_until: string | null
}

interface ChallengeStartResponse {
  session_id: number
  challenge_id: number
  challenge_title: string
  started_at: string
  ai_locked: boolean
  ai_locked_until: string | null
  ai_lock_duration_minutes: number
  message: string
  session_created: boolean
}

/**
 * Hook to manage AI lock status and challenge session
 */
export function useAILock(challengeId?: number) {
  const [lockStatus, setLockStatus] = useState<AILockStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check current lock status
  const checkLockStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/ai/lock-status/', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })
      
      if (!response.ok) {
        throw new Error('Failed to check lock status')
      }
      
      const status: AILockStatus = await response.json()
      setLockStatus(status)
      return status
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check lock status'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Start a challenge session (creates AI lock)
  const startChallenge = useCallback(async (challengeId: number) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/challenges/${challengeId}/start/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start challenge' }))
        throw new Error(errorData.error || 'Failed to start challenge')
      }
      
      const result: ChallengeStartResponse = await response.json()
      
      // Update lock status after starting challenge
      await checkLockStatus()
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start challenge'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [checkLockStatus])

  // Auto-refresh lock status when locked
  useEffect(() => {
    if (!lockStatus?.ai_locked) return

    const interval = setInterval(() => {
      checkLockStatus()
    }, 10000) // Check every 10 seconds when locked

    return () => clearInterval(interval)
  }, [lockStatus?.ai_locked, checkLockStatus])

  // Initial load
  useEffect(() => {
    checkLockStatus()
  }, [checkLockStatus])

  // Helper function to format remaining time
  const formatRemainingTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }, [])

  // Check if AI is currently locked
  const isAILocked = lockStatus?.ai_locked ?? false
  const remainingTime = lockStatus?.remaining_seconds ?? 0
  const formattedTime = remainingTime > 0 ? formatRemainingTime(remainingTime) : null

  return {
    // State
    lockStatus,
    isLoading,
    error,
    isAILocked,
    remainingTime,
    formattedTime,
    
    // Actions
    checkLockStatus,
    startChallenge,
    
    // Computed
    canUseAI: !isAILocked,
    lockMessage: isAILocked 
      ? `AI assistance is locked. Try solving on your own first. ${formattedTime} remaining.`
      : null,
  }
}

/**
 * Hook specifically for challenge start functionality with session tracking
 */
export function useChallengeStart(challengeId?: number) {
  const { startChallenge, isLoading, error } = useAILock(challengeId)
  const [hasAttemptedStart, setHasAttemptedStart] = useState(false)

  // Check if we've already started this challenge in this session
  const sessionKey = `challenge_started_${challengeId}`
  const hasStartedInSession = typeof window !== 'undefined' && 
    sessionStorage.getItem(sessionKey) === 'true'

  const handleStartChallenge = useCallback(async () => {
    if (!challengeId || hasAttemptedStart || hasStartedInSession) return false

    setHasAttemptedStart(true)
    
    try {
      await startChallenge(challengeId)
      // Mark as started in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(sessionKey, 'true')
      }
      return true
    } catch (err) {
      // Don't throw errors for authentication issues - just log and continue
      if (err instanceof Error && err.message.includes('authentication')) {
        console.warn('Skipping challenge start due to authentication:', err.message)
      } else {
        console.error('Failed to start challenge:', err)
      }
      return false
    }
  }, [challengeId, hasAttemptedStart, hasStartedInSession, startChallenge, sessionKey])

  return {
    startChallenge: handleStartChallenge,
    isStarting: isLoading,
    error,
    hasStarted: hasAttemptedStart || hasStartedInSession,
  }
}
