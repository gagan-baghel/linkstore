import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/dashboard-shell"
import { SocialLinksForm } from "@/components/social-links-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export const metadata: Metadata = {
  title: "Social Links - Linkstore",
  description: "Manage your creator social media links",
}

export default async function SocialLinksPage() {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  if (!session.user.hasActiveSubscription) {
    redirect(getSubscriptionRedirectPath("/dashboard/social-links"))
  }

  let user: any | null = null
  let hasDataError = false

  try {
    user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id })
  } catch (error) {
    console.error("Social links load error:", error)
    hasDataError = true
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {hasDataError && (
            <Alert variant="destructive">
              <AlertDescription>Social links are temporarily unavailable. Please refresh shortly.</AlertDescription>
            </Alert>
          )}
          <SocialLinksForm
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
