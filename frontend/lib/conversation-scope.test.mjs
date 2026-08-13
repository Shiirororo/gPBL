import assert from "node:assert/strict";
import test from "node:test";

import { isConversationForChallenge } from "./conversation-scope.ts";

test("accepts a conversation belonging to the current challenge", () => {
  assert.equal(isConversationForChallenge({ challenge_id: 2 }, 2), true);
});

test("rejects a stale conversation from another challenge", () => {
  assert.equal(isConversationForChallenge({ challenge_id: 1 }, 2), false);
});

test("rejects a conversation while no challenge is loaded", () => {
  assert.equal(isConversationForChallenge({ challenge_id: 1 }, undefined), false);
});
