import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Image from "next/image"

import { getSafeServerSession } from "@/lib/auth"
import { DashboardShell } from "@/components/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard-header"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { convexQuery } from "@/lib/convex"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"
import { AddProductModal } from "@/components/add-product-modal"
import { EditProductModal } from "@/components/edit-product-modal"
import { ProductVisibilityToggle } from "@/components/product-visibility-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

  try {
    const [productsData, linkHealthSummary] = await Promise.all([
      convexQuery<{ userId: string; limit?: number; includeArchived?: boolean }, any[]>("products:listByUser", {
        userId: session.user.id,
        includeArchived: true,
      }),
      convexQuery<{ userId: string }, any>("products:getLinkHealthSummary", { userId: session.user.id }),
    ])

    // Convert Mongoose documents to plain JavaScript objects
    const products = JSON.parse(
      JSON.stringify(
        productsData.map((product) => ({
          _id: product._id,
          title: product.title,
          affiliateUrl: product.affiliateUrl,
          category: product.category || "General",
          images: product.images,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          isArchived: product.isArchived === true,
          isLinkHealthy: product.isLinkHealthy !== false,
          lastLinkCheckAt: product.lastLinkCheckAt,
          lastLinkStatus: product.lastLinkStatus,
          lastLinkError: product.lastLinkError || "",
        })),
      ),
    )

    const getProductImage = (product: any) => {
      if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
        return product.images[0]
      }
      return "/placeholder.jpg"
    }

    const formatDate = (value: number | undefined) => {
      if (!value) return "Recently"
      try {
        return new Date(value).toLocaleDateString()
      } catch {
        return "Recently"
      }
    }

    return (
      <DashboardShell>
        <DashboardHeader heading="My Products" text="Manage your storefront catalog and keep links healthy." />
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <AddProductModal
            triggerLabel="Add Product"
            triggerClassName="h-9 w-full rounded-full border border-slate-900 bg-slate-900 px-4 text-xs text-white shadow-none hover:bg-slate-800 sm:w-auto sm:text-sm"
            openOnLoad
          />
        </div>
        <div>
          {linkHealthSummary?.brokenCount > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {linkHealthSummary.brokenCount} product link(s) are currently marked broken and hidden from storefront.
              </AlertDescription>
            </Alert>
          )}
          {products.length === 0 ? (
            <EmptyPlaceholder>
              <EmptyPlaceholder.Icon name="post" />
              <EmptyPlaceholder.Title>No products created</EmptyPlaceholder.Title>
              <EmptyPlaceholder.Description>
                You don&apos;t have any products yet. Start adding products to your store.
              </EmptyPlaceholder.Description>
              <AddProductModal
                triggerLabel="Add Product"
                triggerClassName="h-10 rounded-full border border-slate-900 bg-slate-900 px-5 text-white shadow-none hover:bg-slate-800"
                openOnLoad
              />
            </EmptyPlaceholder>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <Card
                  key={product._id}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border-slate-200/70 bg-white/90 shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)]",
                    product.isArchived ? "opacity-80" : "",
                  )}
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={getProductImage(product)}
                      alt={product.title || "Product"}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-white/90 text-slate-900"> {product.category || "General"} </Badge>
                      {product.isArchived && (
                        <Badge variant="outline" className="rounded-full border-white/60 bg-white/10 text-white">
                          Archived
                        </Badge>
                      )}
                      {!product.isLinkHealthy && (
                        <Badge variant="destructive" className="rounded-full">
                          Broken link
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="truncate text-base text-slate-900">{product.title}</CardTitle>
                    <p className="text-xs text-slate-500">Updated {formatDate(product.updatedAt || product.createdAt)}</p>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3 px-4 pb-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className={cn("h-2 w-2 rounded-full", product.isLinkHealthy ? "bg-emerald-400" : "bg-rose-400")} />
                        {product.isLinkHealthy ? "Healthy link" : "Needs attention"}
                      </div>
                      <ProductVisibilityToggle productId={product._id.toString()} isArchived={product.isArchived} />
                    </div>
                    <EditProductModal
                      product={product}
                      triggerLabel="Edit"
                      triggerVariant="outline"
                      triggerClassName="h-8 rounded-full border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardShell>
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    return (
      <DashboardShell>
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-end">
          <AddProductModal
            triggerLabel="Add Product"
            triggerClassName="h-8 w-full rounded-md border border-slate-900 bg-slate-900 px-3 text-xs text-white shadow-none hover:bg-slate-800 sm:h-9 sm:w-auto sm:text-sm"
            openOnLoad
          />
        </div>
        <div>
          <Alert variant="destructive">
            <AlertDescription>Error loading products. Please try again later.</AlertDescription>
          </Alert>
        </div>
      </DashboardShell>
    )
  }
}
