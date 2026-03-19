import test from "node:test"
import assert from "node:assert/strict"

import {
  getAuthJwtSecret,
  getAuthSessionTtlDays,
  getAuthSessionTtlSeconds,
  hasAuthJwtSecretConfigured,
} from "@/lib/auth-config"
import { getConfiguredSubscriptionCoupon, getMissingRequiredRuntimeConfig, getSupportEmail } from "@/lib/runtime-config"

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

test("development readiness allows the auth secret fallback", () => {
  withEnv(
    {
      NODE_ENV: "development",
      CONVEX_URL: "https://example.convex.cloud",
      AUTH_JWT_SECRET: undefined,
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
      NEXT_PUBLIC_APP_URL: undefined,
      RAZORPAY_KEY_ID: "rzp_test_key",
      RAZORPAY_KEY_SECRET: "rzp_test_secret",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
      PAYMENTS_DATA_KEY: "payments-data-key",
    },
    () => {
      assert.deepEqual(getMissingRequiredRuntimeConfig(), [])
      assert.equal(hasAuthJwtSecretConfigured(), false)
      assert.equal(getAuthJwtSecret(), "linkstore-dev-auth-secret-change-me")
    },
  )
})

test("production readiness reports missing auth and app url configuration", () => {
  withEnv(
    {
      NODE_ENV: "production",
      CONVEX_URL: "https://example.convex.cloud",
      AUTH_JWT_SECRET: undefined,
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
      NEXT_PUBLIC_APP_URL: undefined,
      RAZORPAY_KEY_ID: "rzp_test_key",
      RAZORPAY_KEY_SECRET: "rzp_test_secret",
      RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
      PAYMENTS_DATA_KEY: "payments-data-key",
    },
    () => {
      const missing = getMissingRequiredRuntimeConfig().sort()
      assert.deepEqual(missing, ["AUTH_JWT_SECRET", "NEXT_PUBLIC_APP_URL"])
      assert.throws(() => getAuthJwtSecret(), /AUTH_JWT_SECRET is required/)
    },
  )
})

test("subscription coupon config normalizes and parses optional values", () => {
  withEnv(
    {
      SUBSCRIPTION_FREE_MONTH_COUPON_CODE: " free_month ",
      SUBSCRIPTION_FREE_MONTH_COUPON_LABEL: "Launch Free Month",
      SUBSCRIPTION_FREE_MONTH_COUPON_MAX_REDEMPTIONS: "100",
      SUBSCRIPTION_FREE_MONTH_COUPON_EXPIRES_AT: "2026-12-31T23:59:59+05:30",
    },
    () => {
      const coupon = getConfiguredSubscriptionCoupon()

      assert.equal(coupon.configured, true)
      assert.equal(coupon.code, "FREE_MONTH")
      assert.equal(coupon.label, "Launch Free Month")
      assert.equal(coupon.maxRedemptions, 100)
      assert.equal(coupon.expiresAt, Date.parse("2026-12-31T23:59:59+05:30"))
    },
  )
})

test("auth session ttl parsing falls back for invalid values", () => {
  withEnv({ AUTH_SESSION_TTL_DAYS: "14" }, () => {
    assert.equal(getAuthSessionTtlDays(), 14)
    assert.equal(getAuthSessionTtlSeconds(), 14 * 24 * 60 * 60)
  })

  withEnv({ AUTH_SESSION_TTL_DAYS: "0" }, () => {
    assert.equal(getAuthSessionTtlDays(), 7)
  })
})

test("support email prefers server-only configuration and falls back to public config", () => {
  withEnv(
    {
      SUPPORT_EMAIL: "support@example.com",
      NEXT_PUBLIC_SUPPORT_EMAIL: "public@example.com",
    },
    () => {
      assert.equal(getSupportEmail(), "support@example.com")
    },
  )

  withEnv(
    {
      SUPPORT_EMAIL: undefined,
      NEXT_PUBLIC_SUPPORT_EMAIL: "public@example.com",
    },
    () => {
      assert.equal(getSupportEmail(), "public@example.com")
    },
  )
})
