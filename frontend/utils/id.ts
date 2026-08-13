/**
 * Generate a UUID v4 compatible ID
 * Uses crypto.randomUUID() when available, falls back to a custom implementation
 */
export function generateId(): string {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a shorter unique ID (8 characters)
 * Useful for request IDs where full UUID isn't needed
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}
