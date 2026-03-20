import crypto from "crypto"

import { getAuthJwtSecret, hasAuthJwtSecretConfigured } from "./auth-config"
import { normalizeSubscriptionCouponCode } from "./subscription-coupons"

const COUPON_HASH_SECRET_ENV = "COUPON_HASH_SECRET"

export type CouponHashingSource = "coupon_secret" | "auth_secret" | "dev_fallback" | "unavailable"

export function getCouponHashingSource(): CouponHashingSource {
  if (process.env[COUPON_HASH_SECRET_ENV]?.trim()) {
    return "coupon_secret"
  }

  if (hasAuthJwtSecretConfigured()) {
    return "auth_secret"
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev_fallback"
  }

  return "unavailable"
}

export function isCouponHashingAvailable() {
  return getCouponHashingSource() !== "unavailable"
}

function getCouponHashSecret() {
  const source = getCouponHashingSource()

  if (source === "coupon_secret") {
    return process.env[COUPON_HASH_SECRET_ENV]!.trim()
  }

  if (source === "auth_secret" || source === "dev_fallback") {
    return getAuthJwtSecret()
  }

  throw new Error("Coupon hashing requires COUPON_HASH_SECRET or AUTH_JWT_SECRET.")
}

export function hashSubscriptionCouponCode(input: string) {
  const normalized = normalizeSubscriptionCouponCode(input)
  return crypto.createHmac("sha256", getCouponHashSecret()).update(`subscription-coupon:${normalized}`).digest("hex")
}
