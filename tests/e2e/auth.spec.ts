import { expect, test } from "@playwright/test"

import { devLogin } from "./helpers"

test.describe("authentication", () => {
  test("unauthenticated /dashboard redirects to login with next param", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fdashboard/)
  })

  test("dev login creates a session and lands on dashboard", async ({ page }) => {
    await devLogin(page)
    const cookies = await page.context().cookies()
    expect(cookies.some((c) => c.name.includes("session") || c.name.includes("auth"))).toBe(true)
  })

  test("logout clears the session", async ({ page }) => {
    await devLogin(page)
    const res = await page.request.post("/api/auth/logout")
    expect(res.ok()).toBe(true)
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
