'use client'

/**
 * Assessment Gate Component
 *
 * Globally intercepts user navigation and forces completion of pending assessments.
 * Renders as overlay on top of any page content until assessment is completed.
 * Only runs the check when the user is authenticated.
 */

import { ReactNode, useContext, useEffect, useState } from 'react'
import { useAssessmentCheck } from '@/hooks/useAssessmentCheck'
import { CodeAssessmentModal } from './CodeAssessmentModal'
import { UserContext } from '@/providers/UserProvider'

interface AssessmentGateProps {
  children: ReactNode
}

export function AssessmentGate({ children }: AssessmentGateProps) {
  const userCtx = useContext(UserContext)
  const isAuthenticated = !!userCtx?.currentUser
  const { pendingAssessment, isLoading, hasPendingAssessment, recheckAssessment } = useAssessmentCheck(isAuthenticated)
  const [showAssessment, setShowAssessment] = useState(false)

  // Show assessment modal when we have a pending assessment
  useEffect(() => {
    setShowAssessment(hasPendingAssessment)
  }, [hasPendingAssessment])

  const handleAssessmentComplete = () => {
    setShowAssessment(false)
    // Re-check to ensure it's actually complete
    setTimeout(() => recheckAssessment(), 500)
  }

  // Show loading state initially
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main app content */}
      <div className={showAssessment ? 'pointer-events-none' : ''}>
        {children}
      </div>

      {/* Assessment modal overlay */}
      {showAssessment && pendingAssessment && (
        <>
          {/* Backdrop to prevent interaction with main content */}
          <div className="fixed inset-0 bg-black/50 z-40" />
          
          {/* Assessment modal */}
          <CodeAssessmentModal
            assessmentId={pendingAssessment.assessment_id!}
            isOpen={true}
            onComplete={handleAssessmentComplete}
          />
        </>
      )}
    </>
  )
}
