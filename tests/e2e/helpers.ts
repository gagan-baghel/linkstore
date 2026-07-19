import { expect, type Page } from "@playwright/test"

// Signs in via the dev-only login route and lands on /dashboard.
export async function devLogin(page: Page) {
  await page.goto("/api/auth/dev-login")
  await expect(page).toHaveURL(/\/dashboard/)
}

// Product creation and the public storefront are subscription-gated.
// Applies the dev coupon from .env.local when the dev user's subscription lapsed.
export async function ensureActiveSubscription(page: Page) {
  const status = await page.request.get("/api/subscription/status")
  expect(status.ok()).toBe(true)
  const { access } = await status.json()
  if (access?.hasActiveSubscription) return

  const couponCode = process.env.SUBSCRIPTION_COUPON_CODE
  expect(couponCode, "SUBSCRIPTION_COUPON_CODE must be set in .env.local for e2e").toBeTruthy()

  const applied = await page.request.post("/api/subscription/coupon", {
    data: { couponCode },
  })
  expect(applied.ok(), `coupon redemption failed: ${await applied.text()}`).toBe(true)
}

export async function getDashboardUser(page: Page) {
  const res = await page.request.post("/api/dashboard-data", { data: {} })
  expect(res.ok()).toBe(true)
  const data = await res.json()
  expect(data.user?.username).toBeTruthy()
  return data.user as { _id: string; username: string; name: string; email: string }
}
