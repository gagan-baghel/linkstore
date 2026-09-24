import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { convexQuery } from "@/lib/convex"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"
import { buildStorefrontUrl, getRequestOrigin } from "@/lib/storefront-url"
import { AddProductModal } from "@/components/add-product-modal"
import { ProductsManager, type ManagedProduct } from "@/components/products-manager"

export const metadata: Metadata = {
  title: "Products - Linkstore",
  description: "Manage your affiliate products",
}

export default async function ProductsPage() {
  const session = await getSafeServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  if (!session.user.hasActiveSubscription) {
    redirect(getSubscriptionRedirectPath("/dashboard/products"))
  }

  let productsData: any[] | null = null
  try {
    productsData = await convexQuery<{ userId: string; includeArchived?: boolean; withClicks30d?: boolean }, any[]>(
      "products:listByUser",
      { userId: session.user.id, includeArchived: true, withClicks30d: true },
    )
  } catch (error) {
    console.error("Error fetching products:", error)
  }

  if (!productsData) {
    return (
      <DashboardShell>
        <DashboardHeader heading="My Products" />
        <Alert variant="destructive">
          <AlertDescription>We couldn&apos;t load your products. Refresh the page to try again.</AlertDescription>
        </Alert>
      </DashboardShell>
    )
  }

  const products: ManagedProduct[] = productsData.map((product) => ({
    _id: String(product._id),
    title: product.title,
    affiliateUrl: product.affiliateUrl,
    category: product.category || "General",
    images: Array.isArray(product.images) ? product.images : [],
    price: product.price || "",
    description: product.description || "",
    productNumber: product.productNumber,
    isPinned: product.isPinned === true,
    clicks30d: product.clicks30d ?? 0,
    isArchived: product.isArchived === true,
    isLinkHealthy: product.isLinkHealthy !== false,
    updatedAt: product.updatedAt,
    createdAt: product.createdAt,
  }))
  const storeUrl = session.user.username
    ? buildStorefrontUrl(session.user.username, getRequestOrigin(await headers()))
    : ""

  return (
    <DashboardShell>
      <DashboardHeader
        heading="My Products"
        text="Every product gets a number (#12) — mention it in captions and followers find it instantly."
      >
        <AddProductModal
          triggerLabel="Add products"
          triggerClassName="h-9 w-full rounded-full border border-slate-900 bg-slate-900 px-4 text-xs text-white shadow-none hover:bg-slate-800 sm:w-auto sm:text-sm"
          openOnLoad
        />
      </DashboardHeader>
      {products.length === 0 ? (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="post" />
          <EmptyPlaceholder.Title>Add your first product</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            Paste any product link (Amazon, Myntra, Flipkart, Nykaa…) and we&apos;ll fill in the title and image for you.
            Use the &ldquo;Add products&rdquo; button above to get started.
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      ) : (
        <ProductsManager products={products} storeUrl={storeUrl} />
      )}
    </DashboardShell>
  )
}
