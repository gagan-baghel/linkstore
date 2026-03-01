import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PlusCircle } from "lucide-react"

import { getSafeServerSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { DashboardShell } from "@/components/dashboard-shell"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { ProductsTable } from "@/components/products-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { convexQuery } from "@/lib/convex"
import { getSubscriptionAccessState, hasPremiumAccess } from "@/lib/subscription-access"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export const metadata: Metadata = {
  title: "Products - AffiliateHub",
  description: "Manage your affiliate products",
}

export default async function ProductsPage() {
  const session = await getSafeServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  const accessState = await getSubscriptionAccessState(session.user.id)
  if (!hasPremiumAccess(accessState)) {
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
          description: product.description,
          affiliateUrl: product.affiliateUrl,
          category: product.category || "General",
          images: product.images,
          videoUrl: product.videoUrl,
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

    return (
      <DashboardShell>
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-end">
          <Link href="/dashboard/products/new">
            <Button className="h-8 w-full rounded-md border border-slate-900 bg-slate-900 px-3 text-xs text-white shadow-none hover:bg-slate-800 sm:h-9 sm:w-auto sm:text-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
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
              <Link href="/dashboard/products/new">
                <Button className="h-10 rounded-md border border-slate-900 bg-slate-900 px-5 text-white shadow-none hover:bg-slate-800">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </EmptyPlaceholder>
          ) : (
            <ProductsTable products={products} />
          )}
        </div>
      </DashboardShell>
    )
  } catch (error) {
    console.error("Error fetching products:", error)
    return (
      <DashboardShell>
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-end">
          <Link href="/dashboard/products/new">
            <Button className="h-8 w-full rounded-md border border-slate-900 bg-slate-900 px-3 text-xs text-white shadow-none hover:bg-slate-800 sm:h-9 sm:w-auto sm:text-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
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
