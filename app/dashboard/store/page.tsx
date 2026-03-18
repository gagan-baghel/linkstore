import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { StoreForm } from "@/components/store-form"
import { SubscriptionStatusCard } from "@/components/subscription-status-card"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sanitizeSubscriptionReturnPath } from "@/lib/subscription-routing"
import { buildStorefrontUrl } from "@/lib/storefront-url"

export const metadata: Metadata = {
  title: "Store Settings - Linkstore",
  description: "Manage your store settings",
}

function getReturnLabel(path: string) {
  switch (path) {
    case "/dashboard/products/new":
      return "Add your first product"
    case "/dashboard/products":
      return "Manage products"
    case "/dashboard":
      return "Open dashboard"
    default:
      if (path.startsWith("/dashboard/products/") && path.endsWith("/edit")) {
        return "Resume product editing"
      }
      return "Continue setup"
  }
}

export default async function StoreSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string; from?: string }>
}) {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  const resolvedSearchParams = await searchParams
  const nextPath = sanitizeSubscriptionReturnPath(resolvedSearchParams?.from)
  const nextLabel = resolvedSearchParams?.upgrade === "1" ? getReturnLabel(nextPath) : ""

  let user: any | null = null
  let subscriptionAccess: any | null = null
  let hasDataError = false

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
            nextPath={nextLabel ? nextPath : undefined}
            nextLabel={nextLabel || undefined}
          />
          <StoreForm
            storeBannerText={user?.storeBannerText || ""}
            storeBio={user?.storeBio || ""}
            contactInfo={user?.contactInfo || ""}
            username={user?.username || ""}
            storeUrl={buildStorefrontUrl(user?.username || "")}
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
