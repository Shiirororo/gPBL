export const CHALLENGE_CACHE_STALE_TIME_MS = 5 * 60 * 1_000
export const CHALLENGE_CACHE_GC_TIME_MS = 30 * 60 * 1_000

export const challengeQueryKeys = {
  all: ["challenges"] as const,
  list: () => [...challengeQueryKeys.all, "list"] as const,
  detail: (challengeId: number) =>
    [...challengeQueryKeys.all, "detail", challengeId] as const,
}

interface ChallengeIdentity {
  challenge_id: number
}

export function findCachedChallenge<T extends ChallengeIdentity>(
  challenges: readonly T[] | undefined,
  challengeId: number,
): T | undefined {
  return challenges?.find((challenge) => challenge.challenge_id === challengeId)
}
