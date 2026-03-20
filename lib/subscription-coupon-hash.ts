import crypto from "crypto"

import { normalizeSubscriptionCouponCode } from "./subscription-coupons"

const COUPON_HASH_SECRET_ENV = "COUPON_HASH_SECRET"

export function hasCouponHashSecretConfigured() {
  return Boolean(process.env[COUPON_HASH_SECRET_ENV]?.trim())
}

function getCouponHashSecret() {
  const configured = process.env[COUPON_HASH_SECRET_ENV]?.trim()
  if (configured) return configured

  throw new Error(`${COUPON_HASH_SECRET_ENV} is required.`)
}

export function hashSubscriptionCouponCode(input: string) {
  const normalized = normalizeSubscriptionCouponCode(input)
  return crypto.createHmac("sha256", getCouponHashSecret()).update(`subscription-coupon:${normalized}`).digest("hex")
}
