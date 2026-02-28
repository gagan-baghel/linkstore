export const SUBSCRIPTION_UPGRADE_BASE_PATH = "/dashboard/store?upgrade=1"

export function getSubscriptionRedirectPath(fromPath: string) {
  return `${SUBSCRIPTION_UPGRADE_BASE_PATH}&from=${encodeURIComponent(fromPath)}`
}

