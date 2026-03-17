import { test } from "node:test"
import assert from "node:assert/strict"

import { checkRateLimit } from "../lib/security"


test("checkRateLimit enforces max within window", () => {
  const key = `test:${Date.now()}`
  const options = { key, windowMs: 1000, max: 2 }

  const first = checkRateLimit(options)
  const second = checkRateLimit(options)
  const third = checkRateLimit(options)

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, true)
  assert.equal(third.allowed, false)
})
