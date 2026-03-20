import {
  getSubscriptionCouponCode,
  getSubscriptionCouponCodeHash,
  getSubscriptionCouponExpiresAt,
  getSubscriptionCouponMaxRedemptions,
  getSubscriptionCouponOnlyForInactive,
} from "@/lib/runtime-config"
import { hashSensitive } from "@/lib/secure-data"

type CouponValidationFailureReason = "not_configured" | "misconfigured" | "expired" | "invalid"

type CouponValidationFailure = {
  ok: false
  reason: CouponValidationFailureReason
}

type CouponValidationSuccess = {
  ok: true
  couponHash: string
  expiresAt: number
  maxRedemptions: number
  onlyForInactive: boolean
}

export type SubscriptionCouponValidationResult = CouponValidationFailure | CouponValidationSuccess

export function normalizeSubscriptionCouponCode(value: string | null | undefined) {
  return (value || "").trim().toUpperCase()
}

export function hashSubscriptionCouponCode(value: string | null | undefined) {
  const normalizedValue = normalizeSubscriptionCouponCode(value)
  if (!normalizedValue) return ""

  return hashSensitive(`subscription_coupon:${normalizedValue}`)
}

function normalizeCouponHash(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

function parseCouponExpiry(value: string | null | undefined) {
  const rawValue = (value || "").trim()
  if (!rawValue) return null

  if (/^\d+$/.test(rawValue)) {
    const numericValue = Number(rawValue)
    if (!Number.isFinite(numericValue) || numericValue <= 0) return null
    return numericValue < 1_000_000_000_000 ? numericValue * 1000 : numericValue
  }

  const parsedValue = Date.parse(rawValue)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function parseCouponMaxRedemptions(value: string | null | undefined) {
  const rawValue = (value || "").trim()
  if (!rawValue) return null

  if (!/^\d+$/.test(rawValue)) return null
  const numericValue = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null
  return numericValue
}

export function validateSubscriptionCoupon(
  value: string | null | undefined,
  now = Date.now(),
): SubscriptionCouponValidationResult {
  const configuredCouponHash = normalizeCouponHash(getSubscriptionCouponCodeHash())
  const configuredCouponCode = normalizeSubscriptionCouponCode(getSubscriptionCouponCode())
  const couponHash = configuredCouponHash || hashSubscriptionCouponCode(configuredCouponCode)

  if (!couponHash) {
    return { ok: false, reason: "not_configured" }
  }

  const expiresAt = parseCouponExpiry(getSubscriptionCouponExpiresAt())
  const maxRedemptions = parseCouponMaxRedemptions(getSubscriptionCouponMaxRedemptions())
  if (!expiresAt || !maxRedemptions) {
    return { ok: false, reason: "misconfigured" }
  }

  if (expiresAt <= now) {
    return { ok: false, reason: "expired" }
  }

  const attemptedCouponHash = hashSubscriptionCouponCode(value)
  if (!attemptedCouponHash || attemptedCouponHash !== couponHash) {
    return { ok: false, reason: "invalid" }
  }

  return {
    ok: true,
    couponHash,
    expiresAt,
    maxRedemptions,
    onlyForInactive: getSubscriptionCouponOnlyForInactive(),
  }
}
