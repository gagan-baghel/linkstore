import assert from "node:assert/strict"
import test from "node:test"

import { buildInsights, getTopPerformers, type InsightInput } from "../lib/insights"

const base: InsightInput = {
  products: [
    { id: "a", name: "Serum", productNumber: 12, outbound7d: 5, outbound30d: 30 },
    { id: "b", name: "Shirt", productNumber: 8, outbound7d: 9, outbound30d: 10 },
    { id: "c", name: "Mug", productNumber: 3, outbound7d: 0, outbound30d: 0 },
  ],
  storeViews30: 200,
  outboundClicks7: 14,
  outboundClicks30: 40,
  sources: [{ name: "instagram", value: 150 }, { name: "direct", value: 50 }],
  devices: [{ name: "mobile", value: 180 }, { name: "desktop", value: 20 }],
}

test("top performers rank by 30-day clicks and skip zero-click products", () => {
  assert.deepEqual(getTopPerformers(base.products).map((p) => p.id), ["a", "b"])
})

test("insights cover best seller, trending, pace, source, mobile and idle products", () => {
  const ids = buildInsights(base).map((i) => i.id)
  assert.deepEqual(ids, ["top-product", "rising", "pace-up", "top-source", "mobile", "idle"])
  assert.match(buildInsights(base)[0].title, /#12 Serum/)
  assert.match(buildInsights(base)[0].detail, /75%.*Pin it/)
})

test("no advice from tiny samples; empty store gets a getting-started tip", () => {
  assert.deepEqual(buildInsights({ ...base, storeViews30: 0 }).map((i) => i.id), ["no-traffic"])
  const tiny = buildInsights({ ...base, storeViews30: 5, outboundClicks30: 3, outboundClicks7: 3, sources: [], devices: [] })
  assert.deepEqual(tiny.map((i) => i.id), ["rising"])
})

test("generic 'storefront'/'direct' labels are never reported as a channel", () => {
  const ids = buildInsights({ ...base, sources: [{ name: "storefront", value: 190 }, { name: "instagram", value: 10 }] }).map((i) => i.id)
  assert.ok(!ids.includes("top-source"))
})
