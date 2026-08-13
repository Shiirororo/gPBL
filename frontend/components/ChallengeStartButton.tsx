/**
 * Challenge Start Button Component
 * 
 * Button to start a challenge session which creates the AI lock
 */

import { useState } from "react"
import { useChallengeStart } from "@/hooks/useAILock"

interface ChallengeStartButtonProps {
  challengeId: number
  onStart?: () => void
  className?: string
  children?: React.ReactNode
}

export function ChallengeStartButton({ 
  challengeId, 
  onStart,
  className = "",
  children = "Start Challenge"
}: ChallengeStartButtonProps) {
  const { startChallenge, isStarting, error, hasStarted } = useChallengeStart(challengeId)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async () => {
    const success = await startChallenge()
    if (success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000) // Hide success message after 3s
      onStart?.()
    }
  }

  if (hasStarted && showSuccess) {
    return (
      <div className={`inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md ${className}`}>
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Challenge Started!
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isStarting || hasStarted}
        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isStarting && (
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {isStarting ? "Starting..." : hasStarted ? "Started" : children}
      </button>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          Failed to start challenge: {error}
        </div>
      )}
      
      {hasStarted && (
        <div className="text-xs text-gray-600">
          Challenge session active. AI assistance will be available in 10 minutes.
        </div>
      )}
    </div>
  )
}
