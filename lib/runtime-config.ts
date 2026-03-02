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
  const keyId = readEnv("RAZORPAY_KEY_ID", "RAZORPAY_KEY")
  const keySecret = readEnv("RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET")

  return {
    keyId,
    keySecret,
    configured: Boolean(keyId && keySecret),
  }
}

export function getRuntimeReadinessChecks(): ReadinessCheck[] {
  const isProduction = process.env.NODE_ENV === "production"
  const convexConfigured = Boolean(readEnv("CONVEX_URL", "NEXT_PUBLIC_CONVEX_URL"))
  const clerkConfigured = Boolean(readEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") && readEnv("CLERK_SECRET_KEY"))
  const paymentsDataKeyConfigured = Boolean(readEnv("PAYMENTS_DATA_KEY"))
  const razorpay = getRazorpayCredentials()
  const appUrlConfigured = Boolean(readEnv("NEXT_PUBLIC_APP_URL"))
  const supportEmailConfigured = Boolean(readEnv("SUPPORT_EMAIL", "NEXT_PUBLIC_SUPPORT_EMAIL"))
  const cloudinaryConfigured = Boolean(
    readEnv("CLOUDINARY_CLOUD_NAME") && readEnv("CLOUDINARY_API_KEY") && readEnv("CLOUDINARY_API_SECRET"),
  )

  return [
    { key: "CONVEX_URL | NEXT_PUBLIC_CONVEX_URL", required: true, configured: convexConfigured },
    { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY", required: true, configured: clerkConfigured },
    {
      key: "NEXT_PUBLIC_APP_URL",
      required: isProduction,
      configured: appUrlConfigured,
      note: "Required in production for canonical metadata and callback consistency.",
    },
    {
      key: "RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET",
      required: true,
      configured: razorpay.configured,
      note: "Legacy fallback supported: RAZORPAY_KEY + RAZORPAY_SECRET",
    },
    { key: "RAZORPAY_WEBHOOK_SECRET", required: true, configured: Boolean(readEnv("RAZORPAY_WEBHOOK_SECRET")) },
    { key: "PAYMENTS_DATA_KEY", required: true, configured: paymentsDataKeyConfigured },
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
