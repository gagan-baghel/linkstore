import crypto from "node:crypto"
import { test, expect } from "@playwright/test"

import { getAuthCookieName } from "../../lib/auth-config"
import { createSessionToken } from "../../lib/auth"
import { convexMutation } from "../../lib/convex"
import { loadLocalEnv } from "./env"

loadLocalEnv()

test("coupon activation unlocks premium product flow without payment", async ({ context, page }) => {
  const suffix = crypto.randomBytes(5).toString("hex")
  const email = `coupon-e2e-${suffix}@linkstore.local`
  const couponCode = process.env.SUBSCRIPTION_FREE_MONTH_COUPON_CODE?.trim()

  if (!couponCode) {
    throw new Error("SUBSCRIPTION_FREE_MONTH_COUPON_CODE must be configured for the coupon e2e test.")
  }

  const result = await convexMutation<
    {
      googleSub: string
      email: string
      emailVerified: boolean
      name: string
      image?: string
    },
    { ok: boolean; user?: { _id: string; authVersion?: number } }
  >("users:upsertGoogleUser", {
    googleSub: `coupon-e2e-${suffix}`,
    email,
    emailVerified: true,
    name: "Coupon E2E",
    image: "",
  })

  if (!result.ok || !result.user?._id) {
    throw new Error("Failed to create e2e user.")
  }

  const sessionToken = await createSessionToken({
    userId: result.user._id,
    authVersion: result.user.authVersion,
  })

  await context.addCookies([
    {
      name: getAuthCookieName(),
      value: sessionToken,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ])

  await page.goto("/dashboard/account?upgrade=1&from=%2Fdashboard%2Fproducts%2Fnew")
  await expect(page.getByRole("heading", { name: "Starter Monthly Plan" })).toBeVisible()

  await page.getByPlaceholder("Enter coupon code").fill(couponCode)
  await page.getByRole("button", { name: "Apply Coupon" }).click()

  await page.waitForURL("**/dashboard/products/new")
  await expect(page.getByRole("heading", { name: "Add Product" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Create Product" })).toBeVisible()

  await page.goto("/dashboard/products/new")
  await expect(page).toHaveURL(/\/dashboard\/products\/new$/)
  await expect(page.getByRole("heading", { name: "Add Product" })).toBeVisible()
})
