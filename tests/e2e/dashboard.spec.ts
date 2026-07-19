import { expect, test } from "@playwright/test"

import { devLogin } from "./helpers"

test.describe("dashboard pages", () => {
  test.beforeEach(async ({ page }) => {
    await devLogin(page)
  })

  for (const path of [
    "/dashboard",
    "/dashboard/products",
    "/dashboard/products/new",
    "/dashboard/analytics",
    "/dashboard/store",
    "/dashboard/social-links",
    "/dashboard/account",
    "/dashboard/audience",
  ]) {
    test(`${path} renders for a signed-in user`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")))
      await expect(page.locator("main, [class*=dashboard], h1, h2").first()).toBeVisible()
    })
  }
})
