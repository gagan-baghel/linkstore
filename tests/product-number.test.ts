import assert from "node:assert/strict"
import test from "node:test"

import {
  getEffectiveProductNumbers,
  getNextProductNumber,
  matchesProductQuery,
  parseProductNumberQuery,
} from "../lib/product-number"

test("legacy products are numbered by creation order; stored numbers win", () => {
  const numbers = getEffectiveProductNumbers([
    { _id: "c", createdAt: 30 },
    { _id: "a", createdAt: 10 },
    { _id: "b", createdAt: 20, productNumber: 7 },
  ])
  assert.equal(numbers.get("a"), 1)
  assert.equal(numbers.get("b"), 7)
  assert.equal(numbers.get("c"), 3)
})

test("next number never reuses a deleted product's number", () => {
  // #2 was deleted; #3 remains, so the next product must be #4, not #3.
  assert.equal(getNextProductNumber([{ _id: "a", createdAt: 1, productNumber: 1 }, { _id: "c", createdAt: 3, productNumber: 3 }]), 4)
  assert.equal(getNextProductNumber([]), 1)
})

test("number queries accept 12, #12 and '# 12'", () => {
  assert.equal(parseProductNumberQuery("12"), 12)
  assert.equal(parseProductNumberQuery(" #12 "), 12)
  assert.equal(parseProductNumberQuery("# 12"), 12)
  assert.equal(parseProductNumberQuery("12a"), null)
  assert.equal(parseProductNumberQuery("serum"), null)
})

test("search matches number, title, category and description", () => {
  const product = { title: "Vitamin C Serum", category: "Skincare", description: "Brightening glow", productNumber: 12 }
  assert.ok(matchesProductQuery(product, "#12"))
  assert.ok(matchesProductQuery(product, "serum"))
  assert.ok(matchesProductQuery(product, "skin"))
  assert.ok(matchesProductQuery(product, "glow"))
  assert.ok(matchesProductQuery(product, ""))
  assert.ok(!matchesProductQuery(product, "#13"))
  assert.ok(!matchesProductQuery(product, "lipstick"))
})

test("price hint comes from product meta tags or JSON-LD offers", async () => {
  const { extractPrice } = await import("../lib/product-price")
  assert.equal(
    extractPrice('<meta property="product:price:amount" content="1299.00"><meta property="product:price:currency" content="INR">'),
    "₹1,299",
  )
  assert.equal(
    extractPrice('<script type="application/ld+json">{"@type":"Product","offers":{"price":"24.5","priceCurrency":"USD"}}</script>'),
    "$24.5",
  )
  assert.equal(extractPrice("<html>no price here</html>"), undefined)
})
