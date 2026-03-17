import { test } from "node:test"
import assert from "node:assert/strict"

import { normalizeAffiliateUrl, tryNormalizeAffiliateUrl } from "../lib/affiliate-url"


test("normalizeAffiliateUrl adds https for bare domains", () => {
  const result = normalizeAffiliateUrl("example.com/product")
  assert.equal(result, "https://example.com/product")
})

test("normalizeAffiliateUrl rejects credentialed URLs", () => {
  assert.throws(() => normalizeAffiliateUrl("https://user:pass@example.com"))
})

test("tryNormalizeAffiliateUrl returns null on invalid input", () => {
  const result = tryNormalizeAffiliateUrl("not a url")
  assert.equal(result, null)
})
