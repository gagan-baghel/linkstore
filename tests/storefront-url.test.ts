import test from "node:test"
import assert from "node:assert/strict"

import { buildStorefrontUrl, extractStoreUsernameFromHostname, getRequestOrigin } from "@/lib/storefront-url"

test("buildStorefrontUrl uses path-based storefront URLs", () => {
  assert.equal(buildStorefrontUrl("Demo", "http://localhost:3000"), "http://localhost:3000/demo")
  assert.equal(buildStorefrontUrl("Demo", "http://127.0.0.1:3000"), "http://127.0.0.1:3000/demo")
  assert.equal(buildStorefrontUrl("Demo", "https://linkstore.example"), "https://linkstore.example/demo")
  assert.equal(buildStorefrontUrl("Demo", "https://linkstore-tan.vercel.app"), "https://linkstore-tan.vercel.app/demo")
})

test("extractStoreUsernameFromHostname still resolves subdomain storefront hosts", () => {
  assert.equal(extractStoreUsernameFromHostname("demo.localhost", "http://localhost:3000"), "demo")
  assert.equal(extractStoreUsernameFromHostname("demo.linkstore.example", "https://linkstore.example"), "demo")
})

test("getRequestOrigin prefers forwarded deployment host", () => {
  const requestHeaders = new Headers({
    "x-forwarded-host": "linkstore-tan.vercel.app",
    "x-forwarded-proto": "https",
  })

  assert.equal(getRequestOrigin(requestHeaders), "https://linkstore-tan.vercel.app")
})

test("getRequestOrigin keeps localhost on local requests", () => {
  const requestHeaders = new Headers({
    host: "localhost:3000",
  })

  assert.equal(getRequestOrigin(requestHeaders), "http://localhost:3000")
})
