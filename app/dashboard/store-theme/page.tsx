import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { DashboardShell } from "@/components/dashboard-shell"
import { StoreThemeForm } from "@/components/store-theme-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSubscriptionAccessState, hasPremiumAccess } from "@/lib/subscription-access"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export const metadata: Metadata = {
  title: "Store Theme - AffiliateHub",
  description: "Customize your store theme and styles",
}

export default async function StoreThemePage() {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  const accessState = await getSubscriptionAccessState(session.user.id)
  if (!hasPremiumAccess(accessState)) {
    redirect(getSubscriptionRedirectPath("/dashboard/store-theme"))
  }

  let user: any | null = null
  let hasDataError = false

  try {
    user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id })
  } catch (error) {
    console.error("Store theme load error:", error)
    hasDataError = true
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {hasDataError && (
            <Alert variant="destructive">
              <AlertDescription>Store theme settings are temporarily unavailable. Please refresh shortly.</AlertDescription>
            </Alert>
          )}
          <StoreThemeForm
            themePrimaryColor={user?.themePrimaryColor || "#4f46e5"}
            themeAccentColor={user?.themeAccentColor || "#eef2ff"}
            themeBannerStyle={user?.themeBannerStyle || "gradient"}
            themeButtonStyle={user?.themeButtonStyle || "rounded"}
            themeCardStyle={user?.themeCardStyle || "shadow"}
            themeMode={user?.themeMode || "system"}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
