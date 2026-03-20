import { SUBSCRIPTION_DURATION_MS } from "./subscription"

export const SUBSCRIPTION_COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{3,63}$/
export const SUBSCRIPTION_COUPON_DURATION_MS = SUBSCRIPTION_DURATION_MS

export function normalizeSubscriptionCouponCode(input: string) {
  return input.trim().toUpperCase()
}

export function isValidSubscriptionCouponCode(input: string) {
  return SUBSCRIPTION_COUPON_CODE_PATTERN.test(normalizeSubscriptionCouponCode(input))
}

export function maskSubscriptionCouponCode(input: string) {
  const normalized = normalizeSubscriptionCouponCode(input)
  if (normalized.length <= 8) return normalized
  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`
}

export function canRedeemCouponForStatus(status: string | null | undefined) {
  return status !== "active"
}


export function computeSubscriptionExtensionExpiry(input: {
  currentExpiresAt?: number | null
  grantedAt: number
  durationMs?: number
}) {
  const durationMs = input.durationMs ?? SUBSCRIPTION_COUPON_DURATION_MS
  const baseStart =
    typeof input.currentExpiresAt === "number" && input.currentExpiresAt > input.grantedAt
      ? input.currentExpiresAt
      : input.grantedAt

  return {
    baseStart,
    expiresAt: baseStart + durationMs,
  }
}
