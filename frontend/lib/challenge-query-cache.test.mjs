import assert from "node:assert/strict"
import test from "node:test"

import { QueryClient } from "@tanstack/react-query"

import {
  CHALLENGE_CACHE_STALE_TIME_MS,
  challengeQueryKeys,
} from "./challenge-query-policy.ts"

test("reuses a fresh challenge-list response instead of requesting it twice", async () => {
  const queryClient = new QueryClient()
  let requestCount = 0
  const queryFn = async () => {
    requestCount += 1
    return [{ challenge_id: 1, title: "Cached challenge" }]
  }

  const options = {
    queryKey: challengeQueryKeys.list(),
    queryFn,
    staleTime: CHALLENGE_CACHE_STALE_TIME_MS,
  }

  const firstResult = await queryClient.fetchQuery(options)
  const secondResult = await queryClient.fetchQuery(options)

  assert.equal(requestCount, 1)
  assert.strictEqual(secondResult, firstResult)
})
