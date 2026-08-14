import assert from "node:assert/strict"
import test from "node:test"

import {
  CHALLENGE_CACHE_GC_TIME_MS,
  CHALLENGE_CACHE_STALE_TIME_MS,
  challengeQueryKeys,
  findCachedChallenge,
} from "./challenge-query-policy.ts"

const challenges = [
  { challenge_id: 1, title: "One" },
  { challenge_id: 2, title: "Two" },
]

test("uses stable query keys for the challenge list and details", () => {
  assert.deepEqual(challengeQueryKeys.list(), ["challenges", "list"])
  assert.deepEqual(challengeQueryKeys.detail(2), ["challenges", "detail", 2])
})

test("keeps challenge data fresh for five minutes and cached for thirty", () => {
  assert.equal(CHALLENGE_CACHE_STALE_TIME_MS, 5 * 60 * 1_000)
  assert.equal(CHALLENGE_CACHE_GC_TIME_MS, 30 * 60 * 1_000)
})

test("seeds a detail query from the cached list", () => {
  assert.equal(findCachedChallenge(challenges, 2)?.title, "Two")
  assert.equal(findCachedChallenge(challenges, 3), undefined)
  assert.equal(findCachedChallenge(undefined, 1), undefined)
})
