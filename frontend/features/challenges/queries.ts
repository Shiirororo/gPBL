"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { getChallenge, getChallenges } from "./api"
import type { Challenge } from "./types"
import {
  CHALLENGE_CACHE_GC_TIME_MS,
  CHALLENGE_CACHE_STALE_TIME_MS,
  challengeQueryKeys,
  findCachedChallenge,
} from "@/lib/challenge-query-policy"

export function useChallengesQuery() {
  return useQuery({
    queryKey: challengeQueryKeys.list(),
    queryFn: ({ signal }) => getChallenges(signal),
    staleTime: CHALLENGE_CACHE_STALE_TIME_MS,
    gcTime: CHALLENGE_CACHE_GC_TIME_MS,
  })
}

export function useChallengeQuery(challengeId: number) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: challengeQueryKeys.detail(challengeId),
    queryFn: ({ signal }) => getChallenge(challengeId, signal),
    enabled: Number.isInteger(challengeId) && challengeId > 0,
    staleTime: CHALLENGE_CACHE_STALE_TIME_MS,
    gcTime: CHALLENGE_CACHE_GC_TIME_MS,
    initialData: () =>
      findCachedChallenge(
        queryClient.getQueryData<Challenge[]>(challengeQueryKeys.list()),
        challengeId,
      ),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(challengeQueryKeys.list())?.dataUpdatedAt,
  })
}
