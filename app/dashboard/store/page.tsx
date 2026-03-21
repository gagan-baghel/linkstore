import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { StoreForm } from "@/components/store-form"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buildStorefrontUrl, getRequestOrigin } from "@/lib/storefront-url"

export const metadata: Metadata = {
  title: "Store Settings - Linkstore",
  description: "Manage your store settings",
}

export default async function StoreSettingsPage() {
  const requestHeaders = await headers()
  const requestOrigin = getRequestOrigin(requestHeaders)
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  let user: any | null = null
  let hasDataError = false

  try {
    user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id })
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
          <StoreForm
            storeBannerText={user?.storeBannerText || ""}
            storeBio={user?.storeBio || ""}
            username={user?.username || ""}
            storeUrl={buildStorefrontUrl(user?.username || "", requestOrigin)}
            storeLogo={user?.storeLogo || ""}
            leadCaptureChannel={user?.leadCaptureChannel || "email"}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
