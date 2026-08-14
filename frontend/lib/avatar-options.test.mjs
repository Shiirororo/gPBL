import assert from "node:assert/strict"
import test from "node:test"

import {
  AVAILABLE_AVATARS,
  DEFAULT_AVATAR,
  avatarPath,
  isAvailableAvatar,
} from "../features/profile/avatars.ts"

test("exposes the six bundled profile avatars", () => {
  assert.equal(AVAILABLE_AVATARS.length, 6)
  assert.equal(DEFAULT_AVATAR, "Avatar01.png")
  assert.equal(avatarPath("Avatar04.png"), "/avatars/Avatar04.png")
})

test("rejects avatar values outside the bundled allowlist", () => {
  assert.equal(isAvailableAvatar("Avatar06.png"), true)
  assert.equal(isAvailableAvatar("../../secret.png"), false)
})
