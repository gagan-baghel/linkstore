import test from "node:test"
import assert from "node:assert/strict"

import {
  hashSubscriptionCouponCode,
  normalizeSubscriptionCouponCode,
  validateSubscriptionCoupon,
} from "@/lib/subscription-coupon"

function withEnv(overrides: Record<string, string | undefined>, callback: () => void) {
  const keys = Object.keys(overrides)
  const previous = new Map(keys.map((key) => [key, process.env[key]]))

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    callback()
  } finally {
    for (const key of keys) {
      const value = previous.get(key)
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test("normalizeSubscriptionCouponCode trims and normalizes case", () => {
  assert.equal(normalizeSubscriptionCouponCode("  free-month  "), "FREE-MONTH")
  assert.equal(normalizeSubscriptionCouponCode(""), "")
  assert.equal(normalizeSubscriptionCouponCode(undefined), "")
})

test("validateSubscriptionCoupon matches the configured env coupon", () => {
  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: "Free-Month",
      SUBSCRIPTION_COUPON_EXPIRES_AT: "2099-01-01T00:00:00Z",
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: "25",
      SUBSCRIPTION_COUPON_ONLY_FOR_INACTIVE: "true",
    },
    () => {
      const result = validateSubscriptionCoupon("free-month", Date.parse("2026-01-01T00:00:00Z"))
      assert.equal(result.ok, true)
      if (!result.ok) return
      assert.equal(result.maxRedemptions, 25)
      assert.equal(result.onlyForInactive, true)
    },
  )
})

test("validateSubscriptionCoupon supports storing only a coupon hash in env", () => {
  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: undefined,
      SUBSCRIPTION_COUPON_CODE_HASH: hashSubscriptionCouponCode("Free-Month"),
      SUBSCRIPTION_COUPON_EXPIRES_AT: "2099-01-01T00:00:00Z",
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: "25",
    },
    () => {
      assert.equal(validateSubscriptionCoupon("FREE-MONTH", Date.parse("2026-01-01T00:00:00Z")).ok, true)
      assert.equal(validateSubscriptionCoupon("wrong-code", Date.parse("2026-01-01T00:00:00Z")).ok, false)
    },
  )
})

test("validateSubscriptionCoupon rejects expired or unsafe coupon configs", () => {
  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: "Free-Month",
      SUBSCRIPTION_COUPON_EXPIRES_AT: "2025-01-01T00:00:00Z",
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: "25",
    },
    () => {
      assert.deepEqual(validateSubscriptionCoupon("free-month", Date.parse("2026-01-01T00:00:00Z")), {
        ok: false,
        reason: "expired",
      })
    },
  )

  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: "Free-Month",
      SUBSCRIPTION_COUPON_EXPIRES_AT: undefined,
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: "25",
    },
    () => {
      assert.deepEqual(validateSubscriptionCoupon("free-month"), {
        ok: false,
        reason: "misconfigured",
      })
    },
  )
})

test("validateSubscriptionCoupon fails when no coupon is configured", () => {
  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: undefined,
      SUBSCRIPTION_COUPON_CODE_HASH: undefined,
      SUBSCRIPTION_COUPON_EXPIRES_AT: undefined,
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: undefined,
    },
    () => {
      assert.deepEqual(validateSubscriptionCoupon("FREE-MONTH"), {
        ok: false,
        reason: "not_configured",
      })
    },
  )
})

test("validateSubscriptionCoupon respects the inactive-only toggle", () => {
  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: "Free-Month",
      SUBSCRIPTION_COUPON_EXPIRES_AT: "2099-01-01T00:00:00Z",
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: "25",
      SUBSCRIPTION_COUPON_ONLY_FOR_INACTIVE: "false",
    },
    () => {
      const result = validateSubscriptionCoupon("free-month", Date.parse("2026-01-01T00:00:00Z"))
      assert.equal(result.ok, true)
      if (!result.ok) return
      assert.equal(result.onlyForInactive, false)
    },
  )
})

test("validateSubscriptionCoupon rejects invalid codes", () => {
  withEnv(
    {
      SUBSCRIPTION_COUPON_CODE: "Free-Month",
      SUBSCRIPTION_COUPON_EXPIRES_AT: "2099-01-01T00:00:00Z",
      SUBSCRIPTION_COUPON_MAX_REDEMPTIONS: "25",
    },
    () => {
      assert.deepEqual(validateSubscriptionCoupon("wrong-code", Date.parse("2026-01-01T00:00:00Z")), {
        ok: false,
        reason: "invalid",
      })
    },
  )
})
