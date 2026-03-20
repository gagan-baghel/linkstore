import crypto from "crypto"

import { getAuthJwtSecret } from "./auth-config"
import { normalizeSubscriptionCouponCode } from "./subscription-coupons"

export function hashSubscriptionCouponCode(input: string) {
  const normalized = normalizeSubscriptionCouponCode(input)
  return crypto.createHmac("sha256", getAuthJwtSecret()).update(`subscription-coupon:${normalized}`).digest("hex")
}
