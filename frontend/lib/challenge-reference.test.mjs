import assert from "node:assert/strict";
import test from "node:test";

import { getChallengeReference } from "./challenge-reference.ts";

test("returns database example and hint when both contain text", () => {
  assert.deepEqual(
    getChallengeReference("  return [0, 1]  ", "  Use a hash map.  "),
    {
      example: "return [0, 1]",
      hint: "Use a hash map.",
    },
  );
});

test("hides reference sections when database values are empty", () => {
  assert.deepEqual(getChallengeReference("  ", null), {
    example: null,
    hint: null,
  });
});
