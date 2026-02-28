import type { Metadata } from "next"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { AccountForm } from "@/components/account-form"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"

export const metadata: Metadata = {
  title: "Account - AffiliateHub",
  description: "Manage your account settings",
}

export default async function AccountPage() {
  const session = await getSafeServerSession()

  let user: any | null = null
  let hasDataError = false

  if (session?.user.id) {
    try {
      user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id })
    } catch (error) {
      console.error("Account page load error:", error)
      hasDataError = true
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-4 sm:gap-6 md:gap-8">
          {hasDataError && (
            <Alert variant="destructive">
              <AlertDescription>
                Account data is temporarily unavailable. Please refresh in a few seconds.
              </AlertDescription>
            </Alert>
          )}
          <AccountForm
            name={user?.name || ""}
            email={user?.email || ""}
            username={user?.username || ""}
          />
        </div>
      </div>
    </DashboardShell>
  )
}
