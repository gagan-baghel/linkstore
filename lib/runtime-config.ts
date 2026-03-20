import { hasAuthJwtSecretConfigured } from "@/lib/auth-config"

type ReadinessCheck = {
  key: string
  required: boolean
  configured: boolean
  note?: string
}

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return ""
}

export function getRazorpayCredentials() {
  const keyId = readEnv("RAZORPAY_KEY_ID")
  const keySecret = readEnv("RAZORPAY_KEY_SECRET")

  return {
    keyId,
    keySecret,
    configured: Boolean(keyId && keySecret),
  }
}

export function getGoogleOAuthCredentials() {
  const clientId = readEnv("GOOGLE_CLIENT_ID")
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET")

  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  }
}

export function getRuntimeReadinessChecks(): ReadinessCheck[] {
  const isProduction = process.env.NODE_ENV === "production"
  const convexConfigured = Boolean(readEnv("CONVEX_URL"))
  const authConfigured = hasAuthJwtSecretConfigured() || !isProduction
  const razorpay = getRazorpayCredentials()
  const googleOAuth = getGoogleOAuthCredentials()
  const appUrlConfigured = Boolean(readEnv("NEXT_PUBLIC_APP_URL"))
  const supportEmailConfigured = Boolean(readEnv("SUPPORT_EMAIL", "NEXT_PUBLIC_SUPPORT_EMAIL"))
  const cloudinaryConfigured = Boolean(
    readEnv("CLOUDINARY_CLOUD_NAME") && readEnv("CLOUDINARY_API_KEY") && readEnv("CLOUDINARY_API_SECRET"),
  )

  return [
    { key: "CONVEX_URL", required: true, configured: convexConfigured },
    {
      key: "AUTH_JWT_SECRET",
      required: true,
      configured: authConfigured,
      note: "Required in production. Also used to derive billing encryption and hashing keys. Development falls back to an in-repo dev secret unless you override it.",
    },
    {
      key: "GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET",
      required: true,
      configured: googleOAuth.configured,
      note: "Required for Google-only authentication.",
    },
    {
      key: "NEXT_PUBLIC_APP_URL",
      required: isProduction,
      configured: appUrlConfigured,
      note: "Required in production for canonical metadata, redirects, and cookie consistency.",
    },
    {
      key: "RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET",
      required: true,
      configured: razorpay.configured,
    },
    { key: "RAZORPAY_WEBHOOK_SECRET", required: true, configured: Boolean(readEnv("RAZORPAY_WEBHOOK_SECRET")) },
    {
      key: "CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET",
      required: false,
      configured: cloudinaryConfigured,
      note: "Required only for image uploads.",
    },
    {
      key: "SUPPORT_EMAIL | NEXT_PUBLIC_SUPPORT_EMAIL",
      required: false,
      configured: supportEmailConfigured,
      note: "Used in support contact page and customer communications.",
    },
  ]
}

export function getMissingRequiredRuntimeConfig() {
  return getRuntimeReadinessChecks()
    .filter((check) => check.required && !check.configured)
    .map((check) => check.key)
}

export function getSupportEmail() {
  return readEnv("SUPPORT_EMAIL", "NEXT_PUBLIC_SUPPORT_EMAIL")
}

export function getSubscriptionCouponCode() {
  return readEnv("SUBSCRIPTION_COUPON_CODE")
}

export function getSubscriptionCouponCodeHash() {
  return readEnv("SUBSCRIPTION_COUPON_CODE_HASH")
}

export function getSubscriptionCouponExpiresAt() {
  return readEnv("SUBSCRIPTION_COUPON_EXPIRES_AT")
}

export function getSubscriptionCouponMaxRedemptions() {
  return readEnv("SUBSCRIPTION_COUPON_MAX_REDEMPTIONS")
}

export function getSubscriptionCouponOnlyForInactive() {
  const value = readEnv("SUBSCRIPTION_COUPON_ONLY_FOR_INACTIVE")
  if (!value) return true

  const normalized = value.trim().toLowerCase()
  return !["0", "false", "no", "off"].includes(normalized)
}
