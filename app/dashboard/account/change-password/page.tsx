import type { Metadata } from "next"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { PasswordForm } from "@/components/password-form"

export const metadata: Metadata = {
  title: "Change Password - AffiliateHub",
  description: "Change your account password",
}

export default async function ChangePasswordPage() {
  const session = await getSafeServerSession()

  return (
    <DashboardShell>
      <DashboardHeader heading="Change Password" text="Update your account password." />
      <div className="grid gap-4 sm:gap-6 md:gap-8">
        <PasswordForm />
      </div>
    </DashboardShell>
  )
}
