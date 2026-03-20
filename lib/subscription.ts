export const SUBSCRIPTION_PLAN_CODE = "starter_monthly_149"
export const SUBSCRIPTION_PLAN_NAME = "Starter Monthly"
export const SUBSCRIPTION_PRICE_PAISE = 14900
export const SUBSCRIPTION_CURRENCY = "INR"
export const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000
export const SUBSCRIPTION_PRODUCT_LIMIT = 200

export const SUBSCRIPTION_STATUSES = ["inactive", "pending", "active", "expired", "cancelled"] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export type SubscriptionAccessState = {
  status: SubscriptionStatus
  effectiveStatus: SubscriptionStatus
  hasActiveSubscription: boolean
  canUsePremiumActions: boolean
  canAddProducts: boolean
  storeEnabled: boolean
  productLimit: number
  currentProductCount: number
  remainingProductSlots: number
  expiresAt: number | null
  ambiguous: boolean
  reason: string
}

export function getSubscriptionDurationDays() {
  return Math.floor(SUBSCRIPTION_DURATION_MS / (24 * 60 * 60 * 1000))
}

export function isActiveAccess(state: SubscriptionAccessState | null | undefined): boolean {
  return Boolean(state?.hasActiveSubscription && state?.canUsePremiumActions)
}
