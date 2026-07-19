import { expect, test } from "@playwright/test"

import { devLogin, ensureActiveSubscription, getDashboardUser } from "./helpers"

const PRODUCT_TITLE = `E2E Test Product ${Date.now()}`
const AFFILIATE_URL = "https://example.com/e2e-product"

test.describe("product + public storefront flow", () => {
  test("create product, see it on the public store, track a click, delete it", async ({ page }) => {
    await devLogin(page)
    await ensureActiveSubscription(page)
    const user = await getDashboardUser(page)

    // Create a product via the API the dashboard modal uses.
    // Passing an image skips the external metadata fetch and keeps the test fast.
    const created = await page.request.post("/api/products", {
      data: {
        title: PRODUCT_TITLE,
        affiliateUrl: AFFILIATE_URL,
        category: "General",
        images: ["/placeholder.jpg"],
      },
    })
    expect(created.status(), await created.text()).toBe(201)
    const { product } = await created.json()
    expect(product?._id).toBeTruthy()

    try {
      // It shows up in the dashboard products list.
      await page.goto("/dashboard/products")
      await expect(page.getByText(PRODUCT_TITLE).first()).toBeVisible()

      // The public storefront renders it without authentication.
      const anon = await page.context().browser()!.newContext()
      const publicPage = await anon.newPage()
      await publicPage.goto(new URL(`/stores/${user.username}`, page.url()).toString())
      await expect(publicPage.getByText(PRODUCT_TITLE).first()).toBeVisible({ timeout: 15_000 })
      await anon.close()

      // The click-tracking endpoint redirects to the affiliate URL.
      const track = await page.request.get(`/api/track/${product._id}`, { maxRedirects: 0 })
      expect([302, 307, 308]).toContain(track.status())
      expect(track.headers()["location"]).toContain("example.com")
    } finally {
      const deleted = await page.request.delete(`/api/products/${product._id}`)
      expect(deleted.ok(), await deleted.text()).toBe(true)
    }
  })
})
