import test from "node:test"
import assert from "node:assert/strict"

import {
  USERNAME_MAX_LENGTH,
  getUsernameValidationMessage,
  isValidUsername,
  normalizeUsernameInput,
} from "@/lib/username"

test("normalizeUsernameInput strips leading @ and lowercases", () => {
  assert.equal(normalizeUsernameInput("  @My-Store "), "my-store")
})

test("isValidUsername accepts safe storefront usernames", () => {
  assert.equal(isValidUsername("my-store"), true)
  assert.equal(isValidUsername("abc123"), true)
  assert.equal(isValidUsername("-bad"), false)
  assert.equal(isValidUsername("bad-"), false)
  assert.equal(isValidUsername("bad name"), false)
})

test("getUsernameValidationMessage explains invalid usernames", () => {
  assert.equal(getUsernameValidationMessage("ab"), "Username must be at least 3 characters.")
  assert.equal(
    getUsernameValidationMessage("a".repeat(USERNAME_MAX_LENGTH + 1)),
    `Username must be at most ${USERNAME_MAX_LENGTH} characters.`,
  )
  assert.equal(
    getUsernameValidationMessage("bad_name"),
    "Use lowercase letters, numbers, or hyphens. Hyphens cannot start or end the username.",
  )
})
