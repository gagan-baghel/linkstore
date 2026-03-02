import type { Metadata } from "next"
import Link from "next/link"
import { UserProfile } from "@clerk/nextjs"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Security Settings - AffiliateHub",
  description: "Manage password and account security settings",
}

export default function AccountSecurityPage() {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

  return (
    <DashboardShell>
      <DashboardHeader heading="Security Settings" text="Manage password, recovery, and account protection from Clerk." />
      <div className="space-y-4">
        <div className="rounded-xl border border-[#d8e2f3] bg-white p-4">
          <p className="text-sm text-[#4f5f7a]">Forgot your password? Open the reset flow directly from sign-in.</p>
          <div className="mt-3">
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="h-9 border-[#cfd8ea] bg-white text-xs text-[#1f2a44] hover:bg-[#f3f6fc] sm:text-sm"
              >
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>

        {hasClerkKey ? (
          <div className="overflow-x-auto rounded-xl border border-[#d8e2f3] bg-white p-2 sm:p-4">
            <div className="mx-auto w-fit min-w-[320px]">
              <UserProfile
                routing="path"
                path="/dashboard/account/security"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-none",
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            Security settings are unavailable until Clerk keys are configured in your environment.
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
