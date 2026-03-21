import test from "node:test"
import assert from "node:assert/strict"

import { buildStorefrontUrl, extractStoreUsernameFromHostname } from "@/lib/storefront-url"

test("buildStorefrontUrl uses subdomain storefront URLs on localhost", () => {
  assert.equal(buildStorefrontUrl("Demo", "http://localhost:3000"), "http://demo.localhost:3000/store")
  assert.equal(buildStorefrontUrl("Demo", "http://127.0.0.1:3000"), "http://demo.localhost:3000/store")
})

test("buildStorefrontUrl keeps subdomain storefront URLs for non-local hosts", () => {
  assert.equal(buildStorefrontUrl("Demo", "https://linkstore.example"), "https://demo.linkstore.example/store")
})

test("extractStoreUsernameFromHostname still resolves subdomain storefront hosts", () => {
  assert.equal(extractStoreUsernameFromHostname("demo.localhost", "http://localhost:3000"), "demo")
  assert.equal(extractStoreUsernameFromHostname("demo.linkstore.example", "https://linkstore.example"), "demo")
})
