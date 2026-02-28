import type { Metadata } from "next"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { BulkProductsForm } from "@/components/bulk-products-form"

export const metadata: Metadata = {
  title: "Bulk Upload - AffiliateHub",
  description: "Upload multiple affiliate products from CSV",
}

export default async function BulkUploadPage() {
  await getSafeServerSession()

  return (
    <DashboardShell>
      <DashboardHeader heading="Bulk Upload Products" text="Paste CSV rows to create products faster." />
      <BulkProductsForm />
    </DashboardShell>
  )
}
