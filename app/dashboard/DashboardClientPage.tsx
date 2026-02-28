"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Circle,
  ClipboardCopy,
  ExternalLink,
  PlusCircle,
  Share2,
  ShoppingBag,
  Store,
  Upload,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

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
    <div className="rounded-lg border border-[#d8e2f3] bg-white p-3 shadow-[0_1px_3px_rgba(18,36,64,0.04),0_4px_12px_rgba(18,36,64,0.06)] sm:p-4">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#5f6b7e] sm:text-xs">{title}</p>
        <span className="text-[#8a94a8]">{icon}</span>
      </div>
      <div className="text-xl font-semibold text-[#1c1917] sm:text-2xl">{value}</div>
      <p className="mt-1 text-[11px] text-[#8a94a8] sm:text-xs">{hint}</p>
    </div>
  )
}

export default function DashboardClientPage({
  session,
  initialData,
}: {
  session: any
  initialData?: DashboardInitialData | null
}) {
  const [totalProducts, setTotalProducts] = useState(initialData?.totalProducts ?? 0)
  const [user, setUser] = useState<any>(initialData?.user ?? null)
  const [recentProducts, setRecentProducts] = useState<any[]>(initialData?.recentProducts ?? [])
  const [quickMetrics, setQuickMetrics] = useState<DashboardInitialData["quickMetrics"]>(initialData?.quickMetrics)
  const [linkHealth, setLinkHealth] = useState<DashboardInitialData["linkHealth"]>(initialData?.linkHealth)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setTotalProducts(data.totalProducts || 0)
        setUser(data.user || null)
        setRecentProducts(data.recentProducts || [])
        setQuickMetrics(data.quickMetrics)
        setLinkHealth(data.linkHealth)
        setError(null)
      } catch (fetchError) {
        console.error("Could not fetch dashboard data:", fetchError)
        setError("Failed to load dashboard data. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [initialData, session.user.id])

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const storePath = user?.username ? `/stores/${encodeURIComponent(user.username)}` : ""
  const fullStoreUrl = storePath ? `${baseUrl}${storePath}` : "Store URL will be available shortly"

  const checklist = useMemo(
    () => [
      {
        id: "store",
        label: "Store profile configured",
        done: Boolean((user?.storeBannerText || "").trim()) && Boolean((user?.storeBio || "").trim()),
        href: "/dashboard/store",
      },
      {
        id: "product",
        label: "At least one product published",
        done: totalProducts > 0,
        href: "/dashboard/products/new",
      },
      {
        id: "share",
        label: "Store link ready to share",
        done: Boolean(user?.username),
        href: "/dashboard/account",
      },
      {
        id: "health",
        label: "No broken product links",
        done: (linkHealth?.brokenCount || 0) === 0,
        href: "/dashboard/products",
      },
    ],
    [linkHealth?.brokenCount, totalProducts, user?.storeBannerText, user?.storeBio, user?.username],
  )

  const completedChecklistItems = checklist.filter((item) => item.done).length
  const completionPercent = Math.round((completedChecklistItems / checklist.length) * 100)

  const copyToClipboard = () => {
    if (!user?.username) return
    navigator.clipboard.writeText(fullStoreUrl)
    toast({
      title: "Copied",
      description: "Store URL copied to clipboard",
    })
  }

  const shareStoreLink = async () => {
    if (!user?.username) return

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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link href="/dashboard/products/bulk">
            <Button variant="outline" className="h-8 w-full text-xs sm:h-9 sm:w-auto sm:text-sm">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
          </Link>
          <Link href="/dashboard/products/new">
            <Button className="h-8 w-full text-xs sm:h-9 sm:w-auto sm:text-sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">{error}</div>}

      <div className="mb-4 grid gap-3 md:mb-6 md:grid-cols-2 lg:grid-cols-3">
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

      <div className="mb-4 grid gap-3 md:mb-6 md:gap-4 lg:grid-cols-[1.55fr_1fr]">
        <section className="space-y-3 rounded-xl border border-[#d8e2f3] bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 text-xs font-semibold text-[#1c1917] sm:text-sm">
              <Share2 className="h-4 w-4 text-indigo-500" />
              Affiliate Store Link
            </h2>
            <p className="text-[11px] text-[#8a94a8] sm:text-xs">Share this link in socials, bios, newsletters, and videos.</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-[#5f6b7e] sm:text-xs">Your public URL</p>
            <Input
              className="h-9 font-mono text-xs sm:text-sm"
              value={fullStoreUrl}
              readOnly
              disabled={isLoading || !user?.username}
            />
            <p className="text-[11px] text-[#8a94a8] sm:text-xs">Use this exact link anywhere you share your storefront.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button variant="outline" className="h-8 w-full text-xs sm:h-9 sm:w-auto sm:text-sm" onClick={copyToClipboard} disabled={isLoading || !user?.username}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" className="h-8 w-full text-xs sm:h-9 sm:w-auto sm:text-sm" onClick={shareStoreLink} disabled={isLoading || !user?.username}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="h-8 w-full text-xs sm:h-9 sm:w-auto sm:text-sm" asChild disabled={isLoading || !user?.username}>
              <a href={storePath || "#"} target="_blank" rel="noopener noreferrer">
                Open Store
              </a>
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-[#d8e2f3] bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h2 className="text-xs font-semibold text-[#1c1917] sm:text-sm">Setup Progress</h2>
            <p className="text-[11px] text-[#8a94a8] sm:text-xs">
              {completedChecklistItems}/{checklist.length} completed ({completionPercent}%)
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e7eefb]">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
          {checklist.map((item) => (
            <Link key={item.id} href={item.href} className="flex items-center justify-between border-b border-[#e7eefb] py-2 last:border-0 sm:py-2.5">
              <span className="flex items-center gap-2 text-xs text-[#5f6b7e] sm:text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-[#bcc9de]" />
                )}
                {item.label}
              </span>
              <span className={item.done ? "text-[11px] font-medium text-emerald-600 sm:text-xs" : "text-[11px] text-[#8a94a8] sm:text-xs"}>
                {item.done ? "Done" : "Open"}
              </span>
            </Link>
          ))}
        </section>
      </div>

      <section className="rounded-xl border border-[#d8e2f3] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-xs font-semibold text-[#1c1917] sm:text-sm">Recent Products</h2>
          <p className="text-[11px] text-[#8a94a8] sm:text-xs">Fast access to recently added products.</p>
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
            {recentProducts.map((product: any) => (
              <div key={product._id.toString()} className="overflow-hidden rounded-lg border border-[#d8e2f3] bg-white">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={product.images?.[0] || "/placeholder.svg?height=200&width=300"}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                  <div className="p-3">
                    <h3 className="mb-1 line-clamp-1 text-xs font-semibold text-[#1c1917] sm:text-sm">{product.title}</h3>
                    <p className="mb-3 line-clamp-2 text-[11px] text-[#5f6b7e] sm:text-xs">{product.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/dashboard/products/${product._id.toString()}/edit`}>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                          Edit
                        </Button>
                      </Link>
                      <a href={`/api/track/${product._id.toString()}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="h-8 px-3 text-xs">View</Button>
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
            <p className="mb-4 text-xs text-[#5f6b7e]">Add your first affiliate product to start tracking performance.</p>
            <Link href="/dashboard/products/new">
              <Button>
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
