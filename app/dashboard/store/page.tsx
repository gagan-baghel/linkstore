import type { Metadata } from "next"
import Link from "next/link"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { StoreForm } from "@/components/store-form"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Store Settings - AffiliateHub",
  description: "Manage your store settings",
}

export default async function StoreSettingsPage() {
  const session = await getSafeServerSession()

  let user: any | null = null
  let hasDataError = false

  if (session?.user.id) {
    try {
      user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id })
    } catch (error) {
      console.error("Store settings load error:", error)
      hasDataError = true
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-3 flex sm:mb-5 sm:justify-end">
          <Link href="/dashboard/store-theme">
            <Button variant="outline" className="h-8 w-full rounded-md border-slate-300 bg-white px-3 text-xs shadow-none sm:h-9 sm:w-auto sm:text-sm">
              Edit Theme
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {hasDataError && (
            <Alert variant="destructive">
              <AlertDescription>Store settings are temporarily unavailable. Please refresh shortly.</AlertDescription>
            </Alert>
          )}
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
