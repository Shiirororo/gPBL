import assert from "node:assert/strict";
import test from "node:test";

import {
  canPasteInternalClipboard,
  createInternalClipboard,
} from "./restricted-clipboard.ts";

test("allows valid internal clipboard data from the same challenge", () => {
  const clipboard = createInternalClipboard("first\nsecond", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, 7, 2_000),
    true,
  );
});

test("keeps valid internal data even after the system clipboard changes", () => {
  const clipboard = createInternalClipboard("internal", 7, "copy", 1_000);

  assert.equal(canPasteInternalClipboard(clipboard, 7, 2_000), true);
});

test("blocks clipboard data from another challenge", () => {
  const clipboard = createInternalClipboard("internal", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, 8, 2_000),
    false,
  );
});

test("blocks expired internal clipboard data", () => {
  const clipboard = createInternalClipboard("internal", 7, "copy", 1_000);

  assert.equal(
    canPasteInternalClipboard(clipboard, 7, 601_001),
    false,
  );
});
