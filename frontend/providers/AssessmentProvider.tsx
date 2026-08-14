"use client"

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { checkPendingAssessment } from "@/features/assessment/api"
import type { PendingAssessmentResponse } from "@/features/assessment/types"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { pendingAssessmentFrom } from "@/lib/pending-assessment"

interface AssessmentContextValue {
  pendingAssessment: PendingAssessmentResponse | null
  isLoading: boolean
  hasCheckedAssessment: boolean
  error: string | null
  hasPendingAssessment: boolean
  recheckAssessment: (options?: { resetChecked?: boolean }) => Promise<PendingAssessmentResponse | null>
}

export const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useCurrentUser()
  const [pendingAssessment, setPendingAssessment] = useState<PendingAssessmentResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCheckedAssessment, setHasCheckedAssessment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestVersionRef = useRef(0)

  const recheckAssessment = useCallback(async (options?: { resetChecked?: boolean }) => {
    const requestVersion = ++requestVersionRef.current
    if (options?.resetChecked) {
      setHasCheckedAssessment(false)
    }
    setIsLoading(true)
    setError(null)

    try {
      const response = await checkPendingAssessment()
      const nextAssessment = pendingAssessmentFrom(response)
      if (requestVersion === requestVersionRef.current) {
        setPendingAssessment(nextAssessment)
        setHasCheckedAssessment(true)
      }
      return nextAssessment
    } catch (cause) {
      if (requestVersion === requestVersionRef.current) {
        setError(cause instanceof Error ? cause.message : "Failed to check pending assessment")
        setHasCheckedAssessment(true)
      }
      return null
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const task = window.setTimeout(() => void recheckAssessment({ resetChecked: true }), 0)
    return () => window.clearTimeout(task)
  }, [currentUser?.user_name, recheckAssessment])

  const value = useMemo(
    () => ({
      pendingAssessment,
      isLoading,
      hasCheckedAssessment,
      error,
      hasPendingAssessment: pendingAssessment !== null,
      recheckAssessment,
    }),
    [pendingAssessment, isLoading, hasCheckedAssessment, error, recheckAssessment],
  )

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>
}
