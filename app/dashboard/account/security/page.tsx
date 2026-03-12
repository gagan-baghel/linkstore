import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SessionSecurityCard } from "@/components/session-security-card"
import { getSafeServerSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Security Settings - AffiliateHub",
  description: "Manage sign-in and session security settings",
}

export default async function AccountSecurityPage() {
  const session = await getSafeServerSession()
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Security Settings"
        text="Google manages account authentication. AffiliateHub manages your signed app sessions."
      />
      <div className="space-y-4">
        <div className="rounded-xl border border-[#d8e2f3] bg-white p-4 text-sm text-[#4f5f7a]">
          Password changes, 2-step verification, and account recovery happen in Google. Use the control below to
          invalidate older AffiliateHub sessions.
        </div>
        <SessionSecurityCard email={session.user.email || ""} />
      </div>
    </DashboardShell>
  )
}
