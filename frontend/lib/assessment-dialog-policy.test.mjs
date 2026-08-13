import assert from "node:assert/strict"
import test from "node:test"

import { canCloseAssessment } from "./assessment-dialog-policy.ts"

test("only completed assessments can close", () => {
  assert.equal(canCloseAssessment("COMPLETED"), true)
  assert.equal(canCloseAssessment("PENDING"), false)
  assert.equal(canCloseAssessment(undefined), false)
})
