import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AudienceLeadsManager } from "@/components/audience-leads-manager"
import { DashboardShell } from "@/components/dashboard-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"

export const metadata: Metadata = {
  title: "Audience - Linkstore",
  description: "Review captured shopper contacts from your storefront",
}

export default async function AudiencePage() {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  let leads: any[] = []
  let hasDataError = false

  try {
    leads = await convexQuery<{ userId: string }, any[]>("audienceLeads:listByUser", { userId: session.user.id })
  } catch (error) {
    console.error("Audience load error:", error)
    hasDataError = true
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {hasDataError ? (
            <Alert variant="destructive">
              <AlertDescription>Audience data is temporarily unavailable. Please refresh shortly.</AlertDescription>
            </Alert>
          ) : null}
          <AudienceLeadsManager leads={leads} />
        </div>
      </div>
    </DashboardShell>
  )
}
