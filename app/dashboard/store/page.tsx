import type { Metadata } from "next"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { StoreForm } from "@/components/store-form"
import { SubscriptionStatusCard } from "@/components/subscription-status-card"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const metadata: Metadata = {
  title: "Store Settings - AffiliateHub",
  description: "Manage your store settings",
}

export default async function StoreSettingsPage() {
  const session = await getSafeServerSession()

  let user: any | null = null
  let subscriptionAccess: any | null = null
  let hasDataError = false

  if (session?.user.id) {
    try {
      const [resolvedUser, resolvedAccess] = await Promise.all([
        convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }),
        convexQuery<{ userId: string }, any | null>("subscriptions:getAccessState", { userId: session.user.id }),
      ])
      user = resolvedUser
      subscriptionAccess = resolvedAccess
    } catch (error) {
      console.error("Store settings load error:", error)
      hasDataError = true
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {hasDataError && (
            <Alert variant="destructive">
              <AlertDescription>Store settings are temporarily unavailable. Please refresh shortly.</AlertDescription>
            </Alert>
          )}
          <SubscriptionStatusCard
            initialAccess={subscriptionAccess}
            userName={user?.name || ""}
            userEmail={user?.email || ""}
          />
          <StoreForm
            storeBannerText={user?.storeBannerText || ""}
            storeBio={user?.storeBio || ""}
            contactInfo={user?.contactInfo || ""}
            username={user?.username || ""}
            storeLogo={user?.storeLogo || ""}
            socialFacebook={user?.socialFacebook || ""}
            socialTwitter={user?.socialTwitter || ""}
            socialInstagram={user?.socialInstagram || ""}
            socialYoutube={user?.socialYoutube || ""}
            socialWebsite={user?.socialWebsite || ""}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
