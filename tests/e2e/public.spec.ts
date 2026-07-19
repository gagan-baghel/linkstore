import { expect, test } from "@playwright/test"

test.describe("public pages", () => {
  test("landing page renders", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Linkstore/i)
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("login page renders with Google sign-in", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.getByText(/sign in to continue/i)).toBeVisible()
    await expect(page.getByText(/continue with google/i).first()).toBeVisible()
  })

  for (const path of ["/terms", "/privacy", "/refunds", "/contact"]) {
    test(`${path} responds 200`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    })
  }

  test("unknown storefront shows not-found", async ({ page }) => {
    await page.goto("/stores/definitely-not-a-real-store-e2e")
    await expect(page.getByText(/could not be found|not found/i).first()).toBeVisible()
  })
})
