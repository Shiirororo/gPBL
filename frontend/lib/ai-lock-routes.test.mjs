import assert from "node:assert/strict"
import test from "node:test"

import { challengeStartPath } from "./ai-lock-routes.ts"

test("builds the Next.js challenge start API path", () => {
  assert.equal(challengeStartPath(1), "/api/challenges/1/start")
  assert.equal(challengeStartPath(42), "/api/challenges/42/start")
})

test("rejects invalid challenge IDs", () => {
  assert.throws(() => challengeStartPath(0), /positive integer/)
  assert.throws(() => challengeStartPath(Number.NaN), /positive integer/)
})
