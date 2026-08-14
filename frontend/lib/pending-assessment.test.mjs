import assert from "node:assert/strict"
import test from "node:test"

import { pendingAssessmentFrom } from "./pending-assessment.ts"

test("keeps a pending assessment returned after an accepted submission", () => {
  const assessment = { has_pending: true, assessment_id: 7, status: "PENDING" }

  assert.strictEqual(pendingAssessmentFrom(assessment), assessment)
})

test("clears the shared assessment state when none is pending", () => {
  assert.equal(pendingAssessmentFrom({ has_pending: false }), null)
  assert.equal(pendingAssessmentFrom(null), null)
})

test("ignores malformed pending assessments without an assessment id", () => {
  assert.equal(pendingAssessmentFrom({ has_pending: true }), null)
})
