import test from "node:test"
import assert from "node:assert/strict"

import {
  getConfiguredSubscriptionCoupon,
  getSubscriptionCouponEntryState,
  resolveSubscriptionCouponRedemptionPlan,
} from "@/lib/subscription-coupon-runtime"

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

test("coupon entry state is enabled when hashing can fall back to the auth secret", () => {
  withEnv(
    {
      NODE_ENV: "production",
      COUPON_HASH_SECRET: undefined,
      AUTH_JWT_SECRET: "auth-secret",
    },
    () => {
      assert.deepEqual(getSubscriptionCouponEntryState(), {
        enabled: true,
        hashingSource: "auth_secret",
        message: null,
      })
    },
  )
})

test("configured env coupon resolves to the dedicated configured-coupon mutation", () => {
  withEnv(
    {
      NODE_ENV: "production",
      AUTH_JWT_SECRET: "auth-secret",
      COUPON_HASH_SECRET: undefined,
      SUBSCRIPTION_FREE_MONTH_COUPON_CODE: "FREE_MONTH",
      SUBSCRIPTION_FREE_MONTH_COUPON_LABEL: "Launch Free Month",
      SUBSCRIPTION_FREE_MONTH_COUPON_MAX_REDEMPTIONS: "100",
      SUBSCRIPTION_FREE_MONTH_COUPON_EXPIRES_AT: "2026-12-31T23:59:59+05:30",
    },
    () => {
      const coupon = getConfiguredSubscriptionCoupon()
      assert.equal(coupon.usable, true)

      const plan = resolveSubscriptionCouponRedemptionPlan({
        couponCode: " free_month ",
        userId: "user_123",
      })

      assert.equal(plan.ok, true)
      if (!plan.ok) return
      assert.equal(plan.source, "env")
      assert.equal(plan.mutationName, "subscriptions:redeemConfiguredCoupon")
      assert.equal(plan.mutationArgs.userId, "user_123")
      assert.equal(plan.mutationArgs.couponLabel, "Launch Free Month")
      assert.equal(plan.mutationArgs.maxRedemptions, 100)
      assert.equal(plan.mutationArgs.expiresAt, Date.parse("2026-12-31T23:59:59+05:30"))
    },
  )
})

test("non-matching coupon codes resolve to the stored-coupon mutation path", () => {
  withEnv(
    {
      NODE_ENV: "production",
      AUTH_JWT_SECRET: "auth-secret",
      SUBSCRIPTION_FREE_MONTH_COUPON_CODE: "FREE_MONTH",
      SUBSCRIPTION_FREE_MONTH_COUPON_MAX_REDEMPTIONS: "100",
      SUBSCRIPTION_FREE_MONTH_COUPON_EXPIRES_AT: "2026-12-31T23:59:59+05:30",
    },
    () => {
      const plan = resolveSubscriptionCouponRedemptionPlan({
        couponCode: "TEAM2026",
        userId: "user_123",
      })

      assert.equal(plan.ok, true)
      if (!plan.ok) return
      assert.equal(plan.source, "stored")
      assert.equal(plan.mutationName, "subscriptions:redeemCoupon")
    },
  )
})

test("configured env coupon is rejected centrally when security limits are incomplete", () => {
  withEnv(
    {
      NODE_ENV: "production",
      AUTH_JWT_SECRET: "auth-secret",
      SUBSCRIPTION_FREE_MONTH_COUPON_CODE: "FREE_MONTH",
      SUBSCRIPTION_FREE_MONTH_COUPON_MAX_REDEMPTIONS: undefined,
      SUBSCRIPTION_FREE_MONTH_COUPON_EXPIRES_AT: undefined,
    },
    () => {
      const plan = resolveSubscriptionCouponRedemptionPlan({
        couponCode: "FREE_MONTH",
        userId: "user_123",
      })

      assert.equal(plan.ok, false)
      if (plan.ok) return
      assert.equal(plan.code, "CONFIGURED_COUPON_INCOMPLETE")
      assert.equal(plan.status, 503)
    },
  )
})
