"use client"

import { startTransition, type ReactNode, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  CheckCircle2,
  Circle,
  ClipboardCopy,
  ExternalLink,
  PlusCircle,
  Share2,
  ShoppingBag,
  Store,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { buildStorefrontUrl } from "@/lib/storefront-url"
import { SUBSCRIPTION_UPGRADE_BASE_PATH } from "@/lib/subscription-routing"

interface DashboardInitialData {
  user: any
  totalProducts: number
  recentProducts: any[]
  quickMetrics?: {
    storeViews30: number
    cardClicks30: number
    outboundClicks30: number
    conversionRate30: number
  }
  linkHealth?: {
    brokenCount: number
    staleCount: number
    brokenProducts: Array<{ id: string; title: string; status?: number; error?: string }>
  }
}

function MetricCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string
  value: string | number
  hint: string
  icon: ReactNode
}) {
  return (
    <div className="app-reveal app-surface content-auto rounded-[1.15rem] border border-[#d8e2f3] bg-white/92 p-3 shadow-[0_10px_30px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-4">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f6b7e] sm:text-xs">{title}</p>
        <span className="text-[#8a94a8]">{icon}</span>
      </div>
      <div className="text-[1.15rem] font-semibold tracking-tight text-[#1c1917] sm:text-2xl">{value}</div>
      <p className="mt-1 text-[10px] leading-4 text-[#8a94a8] sm:text-xs">{hint}</p>
    </div>
  )
}

export default function DashboardClientPage({
  session,
  initialData,
  initialOrigin,
}: {
  session: any
  initialData?: DashboardInitialData | null
  initialOrigin: string
}) {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(Boolean(session?.user?.hasActiveSubscription))
  const [totalProducts, setTotalProducts] = useState(initialData?.totalProducts ?? 0)
  const [user, setUser] = useState<any>(initialData?.user ?? null)
  const [recentProducts, setRecentProducts] = useState<any[]>(initialData?.recentProducts ?? [])
  const [quickMetrics, setQuickMetrics] = useState<DashboardInitialData["quickMetrics"]>(initialData?.quickMetrics)
  const [linkHealth, setLinkHealth] = useState<DashboardInitialData["linkHealth"]>(initialData?.linkHealth)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState(initialOrigin)

  useEffect(() => {
    const currentOrigin = window.location.origin
    if (currentOrigin !== origin) {
      setOrigin(currentOrigin)
    }
  }, [origin])

  useEffect(() => {
    let cancelled = false

    async function syncSubscriptionState() {
      try {
        const response = await fetch("/api/subscription/status", { method: "GET", cache: "no-store" })
        const data = await response.json().catch(() => null)
        if (!cancelled && response.ok) {
          startTransition(() => {
            setHasActiveSubscription(Boolean(data?.access?.hasActiveSubscription))
          })
        }
      } catch (error) {
        console.error("Dashboard subscription sync failed:", error)
      }
    }

    void syncSubscriptionState()

    const handleFocus = () => {
      void syncSubscriptionState()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      cancelled = true
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  useEffect(() => {
    if (initialData) return

    async function fetchData() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/dashboard-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: session.user.id }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          const apiMessage =
            data && typeof data === "object" && "message" in data && typeof data.message === "string"
              ? data.message
              : ""

          if (response.status === 401) {
            setError("Your session has expired. Please sign in again.")
            return
          }

          throw new Error(apiMessage || `HTTP error! status: ${response.status}`)
        }

        startTransition(() => {
          setTotalProducts(data.totalProducts || 0)
          setUser(data.user || null)
          setRecentProducts(data.recentProducts || [])
          setQuickMetrics(data.quickMetrics)
          setLinkHealth(data.linkHealth)
          setError(null)
        })
      } catch (fetchError) {
        const fallbackMessage =
          fetchError instanceof Error && fetchError.message
            ? fetchError.message
            : "Failed to load dashboard data. Please refresh the page."
        setError(fallbackMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [initialData, session.user.id])

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const isStorePublic = Boolean(hasActiveSubscription && user?.username && user?.storeEnabled === true)
  const canUseShopActions = hasActiveSubscription
  const subscriptionRedirectBase = SUBSCRIPTION_UPGRADE_BASE_PATH
  const storeUrl = isStorePublic ? buildStorefrontUrl(user.username, baseUrl) : ""
  const hasStoreProfile = Boolean((user?.storeBannerText || "").trim()) && Boolean((user?.storeBio || "").trim())
  const hasBrokenLinks = (linkHealth?.brokenCount || 0) > 0
  const fullStoreUrl = storeUrl || "Store URL will be available shortly"
  const addProductHref = canUseShopActions
    ? "/dashboard/products/new"
    : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard/products/new")}`
  const productsHref = canUseShopActions
    ? "/dashboard/products"
    : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard/products")}`
  const openStoreHref = isStorePublic
    ? storeUrl
    : canUseShopActions
      ? "/dashboard/store"
      : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard/store")}`
  const checklist = useMemo(
    () => [
      {
        id: "store",
        label: "Store profile configured",
        done: hasStoreProfile,
        href: "/dashboard/store",
      },
      {
        id: "product",
        label: "At least one product published",
        done: totalProducts > 0,
        href: addProductHref,
      },
      {
        id: "share",
        label: "Store link ready to share",
        done: isStorePublic,
        href: openStoreHref,
      },
      {
        id: "health",
        label: "No broken product links",
        done: !hasBrokenLinks,
        href: productsHref,
      },
    ],
    [addProductHref, hasBrokenLinks, hasStoreProfile, isStorePublic, openStoreHref, productsHref, totalProducts],
  )

  const completedChecklistItems = checklist.filter((item) => item.done).length
  const completionPercent = Math.round((completedChecklistItems / checklist.length) * 100)
  const showSetupProgress = completionPercent < 100

  const copyToClipboard = () => {
    if (!isStorePublic) {
      window.location.href = canUseShopActions ? "/dashboard/store" : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard/store")}`
      return
    }
    navigator.clipboard.writeText(fullStoreUrl)
    toast({
      title: "Copied",
      description: "Store URL copied to clipboard",
    })
  }

  const shareStoreLink = async () => {
    if (!isStorePublic) {
      window.location.href = canUseShopActions ? "/dashboard/store" : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard/store")}`
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.storeBannerText || user?.name || "My"} Affiliate Store`,
          text: "Explore my favorite products",
          url: fullStoreUrl,
        })
      } catch {
        // Ignore user-cancelled shares.
      }
      return
    }

    copyToClipboard()
    toast({
      title: "Share not available",
      description: "Link copied. Paste it where you want to share.",
    })
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        text="Everything you need to run, optimize, and grow your affiliate storefront."
      >
        <div className="hidden w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-row sm:items-center">
          <Link href={addProductHref}>
            <Button className="h-10 w-full border border-[#3e55df] bg-[#4a63f6] text-sm text-white shadow-none hover:bg-[#3f56de] sm:h-9 sm:w-auto sm:text-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      {error && <div className="app-reveal mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">{error}</div>}

      <div className="mb-4 grid grid-cols-2 gap-2.5 md:mb-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Products"
          value={isLoading ? "..." : totalProducts}
          hint={totalProducts > 0 ? "Active products in storefront" : "Add your first product"}
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Store Views (30d)"
          value={isLoading ? "..." : quickMetrics?.storeViews30 || 0}
          hint="Top funnel reach"
          icon={<Store className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Outbound Clicks (30d)"
          value={isLoading ? "..." : quickMetrics?.outboundClicks30 || 0}
          hint="Affiliate intent"
          icon={<ExternalLink className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div
        className={
          showSetupProgress
            ? "mb-5 grid gap-4 border-t border-[#e7eefb] pt-4 md:mb-7 md:gap-6 md:pt-6 lg:grid-cols-[1.55fr_1fr] lg:items-start lg:divide-x lg:divide-[#e7eefb]"
            : "mb-5 border-t border-[#e7eefb] pt-4 md:mb-7 md:pt-6"
        }
      >
        <section className={showSetupProgress ? "space-y-3 lg:pr-6" : "max-w-3xl space-y-3"}>
          <div className="space-y-1 pb-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#162033]">
              <Share2 className="h-4 w-4 text-indigo-500" />
              Affiliate Store Link
            </h2>
            <p className="text-xs text-[#60708a]">Share this link in socials, bios, newsletters, and videos.</p>
          </div>
          <div className="app-reveal app-surface rounded-[1.15rem] border border-[#d8e2f3] bg-white/86 p-3">
            <p className="text-xs font-semibold text-[#41506a]">Your public URL</p>
            <Input
              className="h-9 rounded-2xl border-[#cfd8ea] bg-white font-mono text-[11px] text-[#1f2a44] sm:h-10 sm:text-sm"
              value={fullStoreUrl}
              readOnly
              disabled={isLoading || !isStorePublic}
              aria-label="Your public storefront URL"
            />
            <p className="text-xs text-[#60708a]">
              {isStorePublic
                ? "Use this exact link anywhere you share your storefront."
                : canUseShopActions
                  ? "Finish your store profile, then this public link becomes ready to share."
                  : "Activate your plan to unlock your public storefront URL."}
            </p>
          </div>
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60708a]">Quick Actions</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                variant="outline"
                className="h-9 w-full rounded-full border-[#4a63f6] bg-[#4a63f6] text-[11px] text-white shadow-none hover:bg-[#3f56de] disabled:opacity-60 sm:w-auto sm:text-sm"
                onClick={copyToClipboard}
                disabled={isLoading}
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="h-9 w-full rounded-full border-[#c9d8ff] bg-[#edf2ff] text-[11px] text-[#2c3f7f] shadow-none hover:bg-[#dfe8ff] disabled:opacity-60 sm:w-auto sm:text-sm"
                onClick={shareStoreLink}
                disabled={isLoading}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                className="h-9 w-full rounded-full border-[#cfd8ea] bg-white text-[11px] text-[#1f2a44] shadow-none hover:bg-[#f3f6fc] disabled:opacity-60 sm:w-auto sm:text-sm"
                asChild
                disabled={isLoading}
              >
                <a
                  href={openStoreHref}
                  target={isStorePublic ? "_blank" : "_self"}
                  rel={isStorePublic ? "noopener noreferrer" : undefined}
                >
                  Open Store
                </a>
              </Button>
            </div>
          </div>
        </section>

        {showSetupProgress ? (
          <section className="space-y-3 border-t border-[#e7eefb] pt-4 lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[#162033]">Setup Progress</h2>
              <p className="text-xs text-[#60708a]">
                {completedChecklistItems}/{checklist.length} completed ({completionPercent}%)
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#dbe5fb]">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            {checklist.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="app-surface flex items-center justify-between rounded-2xl border border-[#e7eefb] bg-white/78 px-3 py-2.5 transition-colors hover:bg-[#f8fbff]"
              >
                <span className="flex items-center gap-2 text-[11px] text-[#4f5f7a] sm:text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-[#bcc9de]" />
                  )}
                  {item.label}
                </span>
                <span className={item.done ? "text-xs font-semibold text-emerald-600" : "text-xs font-medium text-indigo-700"}>
                  {item.done ? "Done" : "Open"}
                </span>
              </Link>
            ))}
          </section>
        ) : null}
      </div>

      <section className="border-t border-[#e7eefb] pt-5 sm:pt-6">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-sm font-semibold text-[#162033]">Recent Products</h2>
          <p className="text-xs text-[#60708a]">Fast access to recently added products.</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse text-center">
              <div className="mx-auto mb-4 h-4 w-32 rounded bg-muted" />
              <div className="mx-auto h-4 w-48 rounded bg-muted" />
            </div>
          </div>
        ) : recentProducts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {recentProducts.map((product: any, index: number) => (
              <div
                key={product._id.toString()}
                className="app-reveal app-surface content-auto overflow-hidden rounded-[1.2rem] border border-[#d8e2f3] bg-white shadow-[0_10px_28px_rgba(87,107,149,0.08)]"
                style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/placeholder.svg?height=200&width=300"}
                    alt={product.title}
                    className="object-cover"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                  <div className="p-3">
                    <h3 className="mb-1 line-clamp-1 text-[11px] font-semibold text-[#1c1917] sm:text-sm">{product.title}</h3>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Link
                        href={
                          canUseShopActions
                            ? `/dashboard/products/${product._id.toString()}/edit`
                            : `${subscriptionRedirectBase}&from=${encodeURIComponent(`/dashboard/products/${product._id.toString()}/edit`)}`
                        }
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full border-[#cfd8ea] bg-white px-3 text-[11px] text-[#1f2a44] shadow-none hover:bg-[#f3f6fc] hover:text-[#12213c]"
                        >
                          Edit
                        </Button>
                      </Link>
                      <a href={`/api/track/${product._id.toString()}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="h-8 rounded-full border border-[#3e55df] bg-[#4a63f6] px-3 text-[11px] text-white shadow-none hover:bg-[#3f56de]">
                          View
                        </Button>
                      </a>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <ShoppingBag className="mx-auto mb-2 h-12 w-12 text-[#bcc9de]" />
            <h3 className="mb-1 text-sm font-semibold text-[#1c1917]">No products yet</h3>
            <p className="mb-4 text-xs text-[#4f5f7a]">Add your first affiliate product to start tracking performance.</p>
            <Link href={addProductHref}>
              <Button className="border border-[#3e55df] bg-[#4a63f6] text-white shadow-none hover:bg-[#3f56de]">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
