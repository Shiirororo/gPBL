export function challengeStartPath(challengeId: number): string {
  if (!Number.isInteger(challengeId) || challengeId < 1) {
    throw new Error("Challenge ID must be a positive integer.")
  }

  return `/api/challenges/${challengeId}/start`
}
