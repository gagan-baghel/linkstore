import test from "node:test"
import assert from "node:assert/strict"

import { hashSubscriptionCouponCode, hasCouponHashSecretConfigured } from "@/lib/subscription-coupon-hash"

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

test("coupon hash helper reports missing secret", () => {
  withEnv(
    {
      COUPON_HASH_SECRET: undefined,
    },
    () => {
      assert.equal(hasCouponHashSecretConfigured(), false)
      assert.throws(() => hashSubscriptionCouponCode("FREE_MONTH"), /COUPON_HASH_SECRET is required/)
    },
  )
})
