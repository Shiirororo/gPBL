/**
 * AI Lock Feature Configuration
 */

export const AI_LOCK_CONFIG = {
  // Duration in minutes for AI assistance lock
  LOCK_DURATION_MINUTES: 10,
  
  // Polling interval for lock status updates (in milliseconds)
  STATUS_POLL_INTERVAL: 10000, // 10 seconds
  
  // API endpoints
  ENDPOINTS: {
    LOCK_STATUS: '/api/ai/lock-status/',
    CHALLENGE_START: '/api/challenges/challenge/{id}/start/',
  },
  
  // Error messages
  MESSAGES: {
    AI_LOCKED: 'AI assistance is locked. Please try solving the challenge on your own first.',
    LOCK_ERROR: 'Unable to check AI lock status.',
    START_ERROR: 'Failed to start challenge session.',
    GENERIC_ERROR: 'An unexpected error occurred.',
  },
  
  // UI Settings
  UI: {
    // Auto-hide success messages after this duration (ms)
    SUCCESS_MESSAGE_DURATION: 3000,
    
    // Show lock indicator when time remaining is less than this (seconds)
    SHOW_INDICATOR_THRESHOLD: 60,
  },
} as const

export type AILockConfig = typeof AI_LOCK_CONFIG
