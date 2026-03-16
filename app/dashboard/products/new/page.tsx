import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ProductForm } from "@/components/product-form"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export const metadata: Metadata = {
  title: "New Product - AffiliateHub",
  description: "Add a new affiliate product to your store",
}

export default async function NewProductPage() {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  if (!session.user.hasActiveSubscription) {
    redirect(getSubscriptionRedirectPath("/dashboard/products/new"))
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Add Product" text="Add a new affiliate product to your store." />
      <div className="grid gap-4 sm:gap-6 md:gap-8">
        <ProductForm />
      </div>
    </DashboardShell>
  )
}
