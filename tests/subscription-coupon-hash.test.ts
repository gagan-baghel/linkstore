import test from "node:test"
import assert from "node:assert/strict"

import { getCouponHashingSource, hashSubscriptionCouponCode, isCouponHashingAvailable } from "@/lib/subscription-coupon-hash"

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

test("coupon hash helper uses its dedicated secret", () => {
  withEnv(
    {
      COUPON_HASH_SECRET: "coupon-secret-a",
      AUTH_JWT_SECRET: "auth-secret-a",
    },
    () => {
      assert.equal(getCouponHashingSource(), "coupon_secret")
      const first = hashSubscriptionCouponCode("free_month")

      withEnv(
        {
          COUPON_HASH_SECRET: "coupon-secret-a",
          AUTH_JWT_SECRET: "auth-secret-b",
        },
        () => {
          const second = hashSubscriptionCouponCode("FREE_MONTH")
          assert.equal(second, first)
        },
      )
    },
  )
})

test("coupon hash helper falls back to the auth secret when a dedicated coupon secret is not set", () => {
  withEnv(
    {
      COUPON_HASH_SECRET: undefined,
      AUTH_JWT_SECRET: "auth-secret-a",
    },
    () => {
      assert.equal(isCouponHashingAvailable(), true)
      assert.equal(getCouponHashingSource(), "auth_secret")
      const first = hashSubscriptionCouponCode("FREE_MONTH")

      withEnv(
        {
          COUPON_HASH_SECRET: undefined,
          AUTH_JWT_SECRET: "auth-secret-a",
        },
        () => {
          const second = hashSubscriptionCouponCode("free_month")
          assert.equal(second, first)
        },
      )
    },
  )
})

test("coupon hash helper reports missing secrets in production", () => {
  withEnv(
    {
      NODE_ENV: "production",
      COUPON_HASH_SECRET: undefined,
      AUTH_JWT_SECRET: undefined,
    },
    () => {
      assert.equal(isCouponHashingAvailable(), false)
      assert.equal(getCouponHashingSource(), "unavailable")
      assert.throws(() => hashSubscriptionCouponCode("FREE_MONTH"), /Coupon hashing requires COUPON_HASH_SECRET or AUTH_JWT_SECRET/)
    },
  )
})
