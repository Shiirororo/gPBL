import assert from "node:assert/strict";
import test from "node:test";

import {
  canPasteInternalClipboard,
  createInternalClipboard,
} from "./restricted-clipboard.ts";

test("allows valid internal clipboard data from the same challenge", () => {
  const clipboard = createInternalClipboard("first\nsecond", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, "first\r\nsecond", 7, 2_000),
    true,
  );
});

test("blocks data copied outside the editor", () => {
  const clipboard = createInternalClipboard("internal", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, "external", 7, 2_000),
    false,
  );
});

test("blocks clipboard data from another challenge", () => {
  const clipboard = createInternalClipboard("internal", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, "internal", 8, 2_000),
    false,
  );
});

test("blocks expired internal clipboard data", () => {
  const clipboard = createInternalClipboard("internal", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, "internal", 7, 601_001),
    false,
  );
});
