/**
 * AI Lock Status Component
 * 
 * Displays AI lock status and provides user-friendly messaging
 * about when AI assistance will become available
 */

import { useEffect } from "react"
import { useAILock, useChallengeStart } from "@/hooks/useAILock"

interface AILockStatusProps {
  challengeId?: number
  className?: string
  showWhenUnlocked?: boolean
}

export function AILockStatus({ challengeId, className = "", showWhenUnlocked = false }: AILockStatusProps) {
  const { isAILocked, formattedTime, error, checkLockStatus } = useAILock()
  const { startChallenge, isStarting, hasStarted } = useChallengeStart(challengeId)

  // Refresh status when component mounts
  useEffect(() => {
    checkLockStatus()
  }, [checkLockStatus])

  const handleStartChallenge = async () => {
    await startChallenge()
    // Refresh lock status after starting
    await checkLockStatus()
  }

  if (error) {
    return (
      <div className={`p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">AI Status Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Unable to check AI lock status: {error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show start button if not locked and not started yet (and user is likely authenticated)
  if (!isAILocked && !hasStarted && !error?.includes('authentication')) {
    return (
      <div className={`p-3 bg-blue-50 border border-blue-200 rounded-md ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Ready to Start Challenge</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Starting will lock AI assistance for 10 minutes to encourage independent problem-solving.</p>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <button
              onClick={handleStartChallenge}
              disabled={isStarting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isStarting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isStarting ? "Starting..." : "Start Challenge"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isAILocked) {
    return (
      <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-md ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">AI Assistance Locked</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Try solving this challenge on your own first.</p>
              {formattedTime && (
                <p className="font-medium">AI help available in: {formattedTime}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showWhenUnlocked) {
    return (
      <div className={`p-3 bg-green-50 border border-green-200 rounded-md ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">AI Assistance Available</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>You can now ask for AI help with this challenge.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

/**
 * Compact AI Lock Indicator
 * Shows a small icon and time remaining when locked
 */
interface AILockIndicatorProps {
  challengeId?: number
  className?: string
}

export function AILockIndicator({ className = "" }: AILockIndicatorProps) {
  const { isAILocked, formattedTime } = useAILock()

  if (!isAILocked) return null

  return (
    <div className={`inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md ${className}`}>
      <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      AI locked {formattedTime && `(${formattedTime})`}
    </div>
  )
}
