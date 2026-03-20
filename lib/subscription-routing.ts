export const SUBSCRIPTION_UPGRADE_BASE_PATH = "/dashboard/account?upgrade=1"

export function getSubscriptionRedirectPath(fromPath: string) {
  return `${SUBSCRIPTION_UPGRADE_BASE_PATH}&from=${encodeURIComponent(fromPath)}`
}

export function sanitizeSubscriptionReturnPath(fromPath: string | null | undefined) {
  if (!fromPath) return "/dashboard"
  const trimmed = fromPath.trim()
  if (!trimmed.startsWith("/dashboard") || trimmed.startsWith("//")) {
    return "/dashboard"
  }
  return trimmed
}
