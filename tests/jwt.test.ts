import { test } from "node:test"
import assert from "node:assert/strict"

import { createSessionToken, verifySessionToken } from "../lib/auth"


test("createSessionToken produces a verifiable token", async () => {
  const token = await createSessionToken({ userId: "user_123", authVersion: 2 })
  const payload = await verifySessionToken(token)

  assert.ok(payload)
  assert.equal(payload?.sub, "user_123")
  assert.equal(payload?.sv, 2)
})
