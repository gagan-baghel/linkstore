import type { Metadata } from "next"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ProductForm } from "@/components/product-form"

export const metadata: Metadata = {
  title: "New Product - AffiliateHub",
  description: "Add a new affiliate product to your store",
}

export default async function NewProductPage() {
  await getSafeServerSession()

  return (
    <DashboardShell>
      <DashboardHeader heading="Add Product" text="Add a new affiliate product to your store." />
      <div className="grid gap-4 sm:gap-6 md:gap-8">
        <ProductForm />
      </div>
    </DashboardShell>
  )
}
