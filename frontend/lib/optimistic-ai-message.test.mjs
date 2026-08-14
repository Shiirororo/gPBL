import assert from "node:assert/strict"
import test from "node:test"

import { createOptimisticUserMessage } from "./optimistic-ai-message.ts"

test("creates a user message immediately while the AI request is pending", () => {
  assert.deepEqual(
    createOptimisticUserMessage("request-1", "  Explain this loop  ", "for item in items: pass"),
    {
      id: "pending-user-request-1",
      role: "user",
      content: "Explain this loop",
      codeSnapshot: "for item in items: pass",
    },
  )
})
