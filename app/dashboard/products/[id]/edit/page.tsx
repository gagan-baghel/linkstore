import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ProductForm } from "@/components/product-form"
import { convexQuery } from "@/lib/convex"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export const metadata: Metadata = {
  title: "Edit Product - AffiliateHub",
  description: "Edit your affiliate product",
}

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  if (!session.user.hasActiveSubscription) {
    redirect(getSubscriptionRedirectPath(`/dashboard/products/${id}/edit`))
  }

  let product: any | null = null
  try {
    product = await convexQuery<{ productId: string; userId: string }, any | null>("products:getByIdForUser", {
      productId: id,
      userId: session.user.id,
    })
  } catch (error) {
    console.error("Edit product load error:", error)
    return (
      <DashboardShell>
        <DashboardHeader heading="Edit Product" text="Make changes to your affiliate product." />
        <Alert variant="destructive">
          <AlertDescription>Product data is temporarily unavailable. Please refresh in a few seconds.</AlertDescription>
        </Alert>
      </DashboardShell>
    )
  }

  if (!product) {
    notFound()
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Edit Product" text="Make changes to your affiliate product." />
      <div className="grid gap-4 sm:gap-6 md:gap-8">
        <ProductForm
          initialData={{
            id: product._id,
            title: product.title,
            category: product.category || "General",
            affiliateUrl: product.affiliateUrl,
            images: product.images,
          }}
          isEditing
        />
      </div>
    </DashboardShell>
  )
}
