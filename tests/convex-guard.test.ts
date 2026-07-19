import test from "node:test"
import assert from "node:assert/strict"

import { SERVER_SECRET_ARG, assertServerCall } from "@/lib/convex-guard"

const original = process.env.SERVER_SHARED_SECRET

test.afterEach(() => {
  if (original === undefined) delete process.env.SERVER_SHARED_SECRET
  else process.env.SERVER_SHARED_SECRET = original
})

test("fails closed when the secret is not configured", () => {
  delete process.env.SERVER_SHARED_SECRET
  assert.throws(() => assertServerCall({ [SERVER_SECRET_ARG]: "anything" }), /not configured/)
})

test("rejects a call missing or mismatching the secret", () => {
  process.env.SERVER_SHARED_SECRET = "expected-secret"
  assert.throws(() => assertServerCall({}), /Unauthorized/)
  assert.throws(() => assertServerCall({ [SERVER_SECRET_ARG]: "wrong" }), /Unauthorized/)
  assert.throws(() => assertServerCall(null), /Unauthorized/)
})

test("accepts a call carrying the matching secret", () => {
  process.env.SERVER_SHARED_SECRET = "expected-secret"
  assert.doesNotThrow(() => assertServerCall({ [SERVER_SECRET_ARG]: "expected-secret" }))
})
