import type { Metadata } from "next"

import { ChangePasswordForm } from "@/components/change-password-form"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"

export const metadata: Metadata = {
  title: "Security Settings - AffiliateHub",
  description: "Manage password and account security settings",
}

export default function AccountSecurityPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Security Settings"
        text="Manage your password directly in AffiliateHub with first-party session controls."
      />
      <div className="space-y-4">
        <div className="rounded-xl border border-[#d8e2f3] bg-white p-4 text-sm text-[#4f5f7a]">
          Changing your password signs out older sessions by rotating your account auth version.
        </div>
        <ChangePasswordForm />
      </div>
    </DashboardShell>
  )
}
