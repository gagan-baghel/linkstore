import { getCouponHashingSource, hashSubscriptionCouponCode, isCouponHashingAvailable, type CouponHashingSource } from "./subscription-coupon-hash"
import {
  SUBSCRIPTION_COUPON_DURATION_MS,
  maskSubscriptionCouponCode,
  normalizeSubscriptionCouponCode,
} from "./subscription-coupons"

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return ""
}

function parseOptionalPositiveInteger(raw: string) {
  if (!raw) return undefined
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function parseOptionalTimestamp(raw: string) {
  if (!raw) return undefined

  if (/^\d+$/.test(raw)) {
    const numeric = Number.parseInt(raw, 10)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined
  }

  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export type ConfiguredSubscriptionCoupon = {
  configured: boolean
  usable: boolean
  code: string
  label: string
  durationMs: number
  maxRedemptions?: number
  expiresAt?: number
  hasRedemptionLimit: boolean
  hasExpiry: boolean
}

export type SubscriptionCouponEntryState = {
  enabled: boolean
  hashingSource: CouponHashingSource
  message: string | null
}

export type SubscriptionCouponRedemptionPlan =
  | {
      ok: false
      status: number
      code: string
      message: string
      entryState: SubscriptionCouponEntryState
      normalizedCode: string
      codeHint: string
    }
  | {
      ok: true
      source: "stored" | "env"
      mutationName: "subscriptions:redeemCoupon" | "subscriptions:redeemConfiguredCoupon"
      mutationArgs: Record<string, any>
      entryState: SubscriptionCouponEntryState
      normalizedCode: string
      codeHint: string
      codeHash: string
    }

export function getConfiguredSubscriptionCoupon(): ConfiguredSubscriptionCoupon {
  const rawCode = readEnv("SUBSCRIPTION_FREE_MONTH_COUPON_CODE")
  const code = rawCode ? normalizeSubscriptionCouponCode(rawCode) : ""
  const maxRedemptions = parseOptionalPositiveInteger(readEnv("SUBSCRIPTION_FREE_MONTH_COUPON_MAX_REDEMPTIONS"))
  const expiresAt = parseOptionalTimestamp(readEnv("SUBSCRIPTION_FREE_MONTH_COUPON_EXPIRES_AT"))
  const hasRedemptionLimit = typeof maxRedemptions === "number"
  const hasExpiry = typeof expiresAt === "number"

  return {
    configured: Boolean(code),
    usable: Boolean(code && hasRedemptionLimit && hasExpiry),
    code,
    label: readEnv("SUBSCRIPTION_FREE_MONTH_COUPON_LABEL") || "Free Month Access",
    durationMs: SUBSCRIPTION_COUPON_DURATION_MS,
    maxRedemptions,
    expiresAt,
    hasRedemptionLimit,
    hasExpiry,
  }
}

export function getSubscriptionCouponEntryState(): SubscriptionCouponEntryState {
  const hashingSource = getCouponHashingSource()
  const enabled = isCouponHashingAvailable()

  return {
    enabled,
    hashingSource,
    message: enabled ? null : "Coupon redemption is temporarily unavailable.",
  }
}

export function resolveSubscriptionCouponRedemptionPlan(input: {
  couponCode: string
  userId: string
}): SubscriptionCouponRedemptionPlan {
  const normalizedCode = normalizeSubscriptionCouponCode(input.couponCode)
  const codeHint = maskSubscriptionCouponCode(normalizedCode)
  const entryState = getSubscriptionCouponEntryState()

  if (!entryState.enabled) {
    return {
      ok: false,
      status: 503,
      code: "COUPON_SYSTEM_UNAVAILABLE",
      message: entryState.message || "Coupon redemption is temporarily unavailable.",
      entryState,
      normalizedCode,
      codeHint,
    }
  }

  const configuredCoupon = getConfiguredSubscriptionCoupon()
  const isConfiguredCoupon = configuredCoupon.configured && configuredCoupon.code === normalizedCode

  if (isConfiguredCoupon && !configuredCoupon.usable) {
    return {
      ok: false,
      status: 503,
      code: "CONFIGURED_COUPON_INCOMPLETE",
      message: "Configured coupon is incomplete. Set both a redemption limit and an expiry before use.",
      entryState,
      normalizedCode,
      codeHint,
    }
  }

  const codeHash = hashSubscriptionCouponCode(normalizedCode)

  if (isConfiguredCoupon) {
    return {
      ok: true,
      source: "env",
      mutationName: "subscriptions:redeemConfiguredCoupon",
      mutationArgs: {
        userId: input.userId,
        codeHash,
        codeHint,
        couponLabel: configuredCoupon.label,
        durationMs: configuredCoupon.durationMs,
        maxRedemptions: configuredCoupon.maxRedemptions,
        expiresAt: configuredCoupon.expiresAt,
      },
      entryState,
      normalizedCode,
      codeHint,
      codeHash,
    }
  }

  return {
    ok: true,
    source: "stored",
    mutationName: "subscriptions:redeemCoupon",
    mutationArgs: {
      userId: input.userId,
      codeHash,
      codeHint,
    },
    entryState,
    normalizedCode,
    codeHint,
    codeHash,
  }
}
