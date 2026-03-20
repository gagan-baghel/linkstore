import test from "node:test"
import assert from "node:assert/strict"

import {
  canRedeemCouponForStatus,
  computeSubscriptionExtensionExpiry,
  isValidSubscriptionCouponCode,
  maskSubscriptionCouponCode,
  normalizeSubscriptionCouponCode,
} from "@/lib/subscription-coupons"

test("normalizeSubscriptionCouponCode trims and uppercases input", () => {
  assert.equal(normalizeSubscriptionCouponCode("  free-month_2026 "), "FREE-MONTH_2026")
})

test("isValidSubscriptionCouponCode accepts safe coupon formats", () => {
  assert.equal(isValidSubscriptionCouponCode("FREE30"), true)
  assert.equal(isValidSubscriptionCouponCode("WELCOME-2026"), true)
  assert.equal(isValidSubscriptionCouponCode("bad space"), false)
  assert.equal(isValidSubscriptionCouponCode("x"), false)
})

test("maskSubscriptionCouponCode hides middle characters for long codes", () => {
  assert.equal(maskSubscriptionCouponCode("FREEMONTH2026"), "FREE...2026")
  assert.equal(maskSubscriptionCouponCode("FREE2026"), "FREE2026")
})

test("computeSubscriptionExtensionExpiry extends from current active expiry when present", () => {
  const now = 1_000
  const currentExpiresAt = 5_000
  const { baseStart, expiresAt } = computeSubscriptionExtensionExpiry({
    currentExpiresAt,
    grantedAt: now,
    durationMs: 300,
  })

  assert.equal(baseStart, currentExpiresAt)
  assert.equal(expiresAt, currentExpiresAt + 300)
})

test("computeSubscriptionExtensionExpiry starts from grant time when subscription is inactive", () => {
  const now = 1_000
  const { baseStart, expiresAt } = computeSubscriptionExtensionExpiry({
    currentExpiresAt: 500,
    grantedAt: now,
    durationMs: 300,
  })

  assert.equal(baseStart, now)
  assert.equal(expiresAt, now + 300)
})

test("canRedeemCouponForStatus blocks stacking onto active subscriptions", () => {
  assert.equal(canRedeemCouponForStatus("active"), false)
  assert.equal(canRedeemCouponForStatus("inactive"), true)
  assert.equal(canRedeemCouponForStatus("expired"), true)
  assert.equal(canRedeemCouponForStatus("pending"), true)
})
