import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { BulkProductsForm } from "@/components/bulk-products-form"
import { getSubscriptionAccessState, hasPremiumAccess } from "@/lib/subscription-access"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export const metadata: Metadata = {
  title: "Bulk Upload - AffiliateHub",
  description: "Upload multiple affiliate products from CSV",
}

export default async function BulkUploadPage() {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  const accessState = await getSubscriptionAccessState(session.user.id)
  if (!hasPremiumAccess(accessState)) {
    redirect(getSubscriptionRedirectPath("/dashboard/products/bulk"))
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Bulk Upload Products" text="Paste CSV rows to create products faster." />
      <BulkProductsForm />
    </DashboardShell>
  )
}
