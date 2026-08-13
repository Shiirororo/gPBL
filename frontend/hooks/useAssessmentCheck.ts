'use client'

/**
 * Hook for checking and managing pending assessments.
 * Only performs the API call when the user is authenticated.
 */

import { useCallback, useEffect, useState } from 'react'
import { checkPendingAssessment } from '../features/assessment/api'
import { PendingAssessmentResponse } from '../features/assessment/types'

export function useAssessmentCheck(isAuthenticated = false) {
  const [pendingAssessment, setPendingAssessment] = useState<PendingAssessmentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recheckAssessment = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await checkPendingAssessment()
      // null means unauthenticated — no pending assessment
      setPendingAssessment(response?.has_pending ? response : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check pending assessment'
      setError(errorMessage)
      console.error('Assessment check error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Check on mount and whenever auth state changes
  useEffect(() => {
    recheckAssessment()
  }, [recheckAssessment])

  return {
    pendingAssessment,
    isLoading,
    error,
    hasPendingAssessment: !!pendingAssessment,
    recheckAssessment,
  }
}
