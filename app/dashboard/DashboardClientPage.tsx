"use client"

import { memo, startTransition, useEffect, useState } from "react"
import type { ElementType } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { ExternalLink, Sparkles, Link2, ShoppingBag, Palette, AlertCircle, CheckCircle2 } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { AddProductModal } from "@/components/add-product-modal"
import { SocialLinksForm } from "@/components/social-links-form"
import { StoreForm } from "@/components/store-form"
import { StoreThemeForm } from "@/components/store-theme-form"
import { StorefrontClient } from "@/components/storefront-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { buildStorefrontUrl } from "@/lib/storefront-url"
import { SUBSCRIPTION_UPGRADE_BASE_PATH } from "@/lib/subscription-routing"

interface DashboardInitialData {
  user: any
  totalProducts?: number
  recentProducts?: any[]
}

interface SetupStep {
  id: "links" | "products" | "design" | "theme"
  title: string
  description: string
  icon: ElementType
  completed: boolean
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="h-36 w-full animate-pulse rounded-3xl bg-muted" />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="h-[520px] w-full animate-pulse rounded-3xl bg-muted" />
      <div className="h-[520px] w-full animate-pulse rounded-3xl bg-muted" />
    </div>
  </div>
)

const DashboardPreviewCard = memo(function DashboardPreviewCard({
  isStorePublic,
  openStoreHref,
  previewMostBought,
  previewProducts,
  previewRecentProducts,
  previewUser,
}: {
  isStorePublic: boolean
  openStoreHref: string
  previewMostBought: any
  previewProducts: any
  previewRecentProducts: any
  previewUser: any
}) {
  return (
    <Card className="rounded-3xl border-slate-200/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-[#444]">Preview</CardTitle>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a
              href={openStoreHref}
              target={isStorePublic ? "_blank" : "_self"}
              rel={isStorePublic ? "noopener noreferrer" : undefined}
            >
              Open
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="relative w-[280px] rounded-[2.5rem] border bg-gradient-to-b from-slate-900 to-slate-800 p-3 shadow-xl">
            <div className="absolute left-1/2 top-2 h-4 w-32 -translate-x-1/2 rounded-full bg-slate-700" />
            <div className="relative overflow-hidden rounded-[2rem] bg-black">
              <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2rem] bg-white">
                {previewUser ? (
                  <div className="absolute inset-0">
                    <StorefrontClient
                      user={previewUser}
                      products={previewProducts}
                      recentProducts={previewRecentProducts}
                      mostBoughtProducts={previewMostBought}
                      previewMode="mobile"
                      disableTracking
                    />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="rounded-full bg-slate-100 p-3">
                      <Palette className="h-6 w-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">Preview unavailable</p>
                    <p className="text-xs text-slate-500">Load your profile data to see a live preview.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 flex justify-center">
              <div className="h-1 w-12 rounded-full bg-slate-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

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
  const [user, setUser] = useState<any>(initialData?.user ?? null)
  const [previewStoreData, setPreviewStoreData] = useState<any | null>(null)
  const [totalProducts, setTotalProducts] = useState<number>(initialData?.totalProducts ?? user?.productCount ?? 0)
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState(initialOrigin)
  const searchParams = useSearchParams()
  const panelParam = searchParams.get("panel") as "links" | "products" | "design" | "theme" | null
  const [activeSetupPanel, setActiveSetupPanel] = useState<"links" | "products" | "design" | "theme" | null>(
    panelParam ?? "links",
  )

  useEffect(() => {
    if (!panelParam) return
    if (panelParam !== activeSetupPanel) {
      setActiveSetupPanel(panelParam)
    }
  }, [panelParam, activeSetupPanel])

  useEffect(() => {
    if (typeof window === "undefined" || !activeSetupPanel) return
    const url = new URL(window.location.href)
    if (url.searchParams.get("panel") === activeSetupPanel) return
    url.searchParams.set("panel", activeSetupPanel)
    window.history.replaceState(window.history.state, "", `${url.pathname}?${url.searchParams.toString()}`)
  }, [activeSetupPanel])

  useEffect(() => {
    const currentOrigin = window.location.origin
    if (currentOrigin !== origin) {
      setOrigin(currentOrigin)
    }
  }, [origin])

  useEffect(() => {
    if (!user?.username) return
    let cancelled = false

    async function fetchPreviewStore() {
      try {
        const response = await fetch("/api/storefront/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user.username }),
        })
        if (!response.ok) return
        const payload = await response.json().catch(() => null)
        if (!cancelled && payload?.store) {
          setPreviewStoreData(payload.store)
        }
      } catch (error) {
        console.error("Failed to load preview store data:", error)
      }
    }

    void fetchPreviewStore()

    return () => {
      cancelled = true
    }
  }, [user?.username])

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
          setUser(data.user || null)
          if (typeof data.totalProducts === "number") {
            setTotalProducts(data.totalProducts)
          }
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
  const previewStoreUrl = user?.username ? buildStorefrontUrl(user.username, baseUrl) : ""
  const initialRecentProducts = Array.isArray(initialData?.recentProducts) ? (initialData?.recentProducts ?? []) : []
  const previewProductsFallback = initialRecentProducts
  const previewUser = previewStoreData?.user ?? user
  const previewProducts = previewStoreData?.products ?? previewProductsFallback
  const previewRecentProducts = previewStoreData?.recentProducts ?? initialRecentProducts
  const previewMostBought = previewStoreData?.trending ?? initialRecentProducts

  const productsHref = canUseShopActions
    ? "/dashboard/products"
    : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard/products")}`
  const openStoreHref = isStorePublic
    ? storeUrl
    : canUseShopActions
      ? "/dashboard?panel=design"
      : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard?panel=design")}`
  const socialLinksHref = canUseShopActions
    ? "/dashboard?panel=links"
    : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard?panel=links")}`
  const storeSettingsHref = canUseShopActions
    ? "/dashboard?panel=design"
    : `${subscriptionRedirectBase}&from=${encodeURIComponent("/dashboard?panel=design")}`

  const setupSteps: SetupStep[] = [
    {
      id: "links",
      title: "Add Social Links",
      description: "Connect your social profiles",
      icon: Link2,
      completed: Boolean(user?.socialFacebook || user?.socialTwitter || user?.socialInstagram),
    },
    {
      id: "products",
      title: "Add Products",
      description: "Start adding affiliate products",
      icon: ShoppingBag,
      completed: totalProducts > 0,
    },
    {
      id: "design",
      title: "Settings",
      description: "Store details and branding",
      icon: Palette,
      completed: Boolean(user?.storeLogo || user?.storeBannerText),
    },
    {
      id: "theme",
      title: "Theme & Design",
      description: "Pick colors and styling",
      icon: Palette,
      completed: Boolean(user?.storeLogo || user?.storeBannerText),
    },
  ]

  const completedSteps = setupSteps.filter((step) => step.completed).length
  const totalSteps = setupSteps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  const quickActions = [
    {
      id: "products",
      title: "Add products",
      description: "Create affiliate links in minutes",
      href: productsHref,
      icon: ShoppingBag,
      tone: "sky",
    },
    {
      id: "links",
      title: "Update social links",
      description: "Connect every profile you own",
      href: socialLinksHref,
      icon: Link2,
      tone: "violet",
    },
    {
      id: "design",
      title: "Design your store",
      description: "Brand colors, banners, and bio",
      href: storeSettingsHref,
      icon: Palette,
      tone: "amber",
    },
    {
      id: "open",
      title: "Preview storefront",
      description: "See what shoppers see",
      href: openStoreHref,
      icon: ExternalLink,
      tone: "emerald",
      external: isStorePublic,
    },
  ] as const

  const actionToneStyles: Record<(typeof quickActions)[number]["tone"], string> = {
    sky: "bg-sky-50 text-sky-700 ring-sky-100/70",
    violet: "bg-violet-50 text-violet-700 ring-violet-100/70",
    amber: "bg-amber-50 text-amber-700 ring-amber-100/70",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100/70",
  }

  const handlePanelChange = (panel: "links" | "products" | "design" | "theme") => {
    if (panel === activeSetupPanel) return
    startTransition(() => {
      setActiveSetupPanel(panel)
    })
  }

  const renderSetupPanel = () => {
    switch (activeSetupPanel) {
      case "links":
        return (
          <div className="dashboard-quick-setup space-y-5">
            <div className="min-w-0 space-y-5">
              <SocialLinksForm
                socialFacebook={user?.socialFacebook || ""}
                socialTwitter={user?.socialTwitter || ""}
                socialInstagram={user?.socialInstagram || ""}
                socialYoutube={user?.socialYoutube || ""}
                socialWebsite={user?.socialWebsite || ""}
                socialWhatsapp={user?.socialWhatsapp || ""}
                socialWhatsappMessage={user?.socialWhatsappMessage || ""}
                customLinks={user?.customLinks || []}
              />
            </div>
            {/* <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tips</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>Use full URLs for every profile.</li>
                  <li>WhatsApp links convert best for high intent traffic.</li>
                  <li>Keep only active profiles to reduce bounce.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
                <p className="mt-2 text-sm font-medium text-slate-900">Build trust before the click.</p>
              </div>
            </aside> */}
          </div>
        )
      case "products":
        return (
          <div className="dashboard-quick-setup space-y-5">
            <div className="min-w-0 space-y-5">
              <div>
                <p className="text-sm text-slate-500">Create an affiliate link and make it shoppable.</p>
              </div>
              <AddProductModal
                triggerLabel="Add product"
                triggerVariant="default"
                triggerClassName="h-11 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-6 text-white shadow-[0_16px_30px_rgba(14,165,233,0.3)] hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 sm:w-auto"
                onProductsCreated={(count) => setTotalProducts((prev) => Math.max(0, prev + count))}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {totalProducts} product{totalProducts === 1 ? "" : "s"} live
                </div>
                <Button variant="outline" size="sm" className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100" asChild>
                  <Link href="/dashboard/products">View all products</Link>
                </Button>
              </div>
              {initialRecentProducts.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent products</p>
                  <div className="mt-3 space-y-2">
                    {initialRecentProducts.slice(0, 3).map((product: any) => (
                      <div key={product._id} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image
                              src={(product.images && product.images[0]) || "/placeholder.jpg"}
                              alt={product.title || "Product"}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{product.title}</p>
                            <p className="truncate text-xs text-slate-500">{product.category || "General"}</p>
                          </div>
                        </div>
                        <Link href={`/dashboard/products/${product._id.toString()}/edit`} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* <aside className="space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Checklist</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li>Short title that matches the product page.</li>
                  <li>Choose a category to keep your store tidy.</li>
                  <li>Add one clean image for better clicks.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
                <p className="mt-2 text-sm font-medium text-slate-900">Get your first product live.</p>
              </div>
            </aside> */}
          </div>
        )
      case "design":
        return (
          <div className="dashboard-quick-setup items-start gap-6 ">
            {/* <div className="min-w-0 space-y-5"> */}
            {/* <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                      Design
                    </div>
                    <h4 className="text-base font-semibold text-slate-900">Store design</h4>
                    <p className="text-sm text-slate-500">Update your banner, bio, and branding in one focused flow.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100 sm:self-start"
                    asChild
                  >
                    <Link href={storeSettingsHref}>Open design settings</Link>
                  </Button>
                </div>
              </div> */}

            <StoreForm
              storeBannerText={user?.storeBannerText || ""}
              storeBio={user?.storeBio || ""}
              storeUrl={previewStoreUrl}
              storeLogo={user?.storeLogo || ""}
              leadCaptureChannel={user?.leadCaptureChannel || "email"}
            />
            {/* </div> */}

            {/* <aside className="space-y-4 lg:pt-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Design playbook</p>
                <div className="mt-3 space-y-3 text-xs text-slate-600">
                  <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2">
                    Keep your banner under 6 words for faster scanning.
                  </div>
                  <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2">
                    Use a high-contrast logo to stay crisp on mobile.
                  </div>
                  <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2">
                    Make the bio feel like a short, confident pitch.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Goal</p>
                <p className="mt-2 text-sm font-medium text-slate-900">Make your store look unmistakably yours.</p>
                <p className="mt-1 text-xs text-slate-500">Aim for a clear banner, short bio, and a single logo style.</p>
              </div>
            </aside> */}
          </div>
        )
      case "theme":
        return (
          <StoreThemeForm
            themeMode={user?.themeMode || "light"}
            themeBackgroundColor={user?.themeBackgroundColor}
            themeBackgroundPattern={user?.themeBackgroundPattern}
            themeNameColor={user?.themeNameColor}
            themeBioColor={user?.themeBioColor}
            themeNameFont={user?.themeNameFont}
            themeBioFont={user?.themeBioFont}
            themePrimaryColor={user?.themePrimaryColor}
            themeAccentColor={user?.themeAccentColor}
            themeButtonStyle={user?.themeButtonStyle}
            themeCardStyle={user?.themeCardStyle}
            themeFooterVisible={user?.themeFooterVisible}
            onLiveChange={(values) => {
              setUser((prev: any) => (prev ? { ...prev, ...values } : prev))
              setPreviewStoreData((prev: any) =>
                prev?.user ? { ...prev, user: { ...prev.user, ...values } } : prev,
              )
            }}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <LoadingSkeleton />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Welcome${user?.storeBannerText ? `, ${user.storeBannerText}` : user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        text="Everything you need to run, optimize, and grow your affiliate storefront."
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-6">
          {/* <Card className="rounded-3xl border-slate-200/70 bg-white/80 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    Studio
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                    Design, publish, and grow in one place.
                  </h2>
                  <p className="text-sm text-slate-500">
                    Build a storefront that feels like your brand, then ship links that convert.
                  </p>
                </div>
                <Button
                  className="rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-5 text-white shadow-[0_12px_24px_rgba(14,165,233,0.28)] hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500"
                  asChild
                >
                  <Link href={storeSettingsHref}>Open design studio</Link>
                </Button>
              </div>
            </CardContent>
          </Card> */}

          {/* <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const card = (
                <Card
                  key={action.id}
                  className="group rounded-3xl border-slate-200/70 bg-white/80 shadow-[0_16px_36px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-2xl ring-1",
                          actionToneStyles[action.tone],
                        )}
                      >
                        <action.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )

              if (action.external) {
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {card}
                  </a>
                )
              }

              return (
                <Link key={action.id} href={action.href} className="block">
                  {card}
                </Link>
              )
            })}
          </div> */}

          {renderSetupPanel()}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {!isStorePublic && (
            <Card className="rounded-3xl border-slate-200/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-sky-500" />
                      <h3 className="font-semibold text-slate-900">Checklist</h3>
                    </div>
                    <p className="text-sm text-slate-500">Finish these steps to launch your Linkstore.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-full">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {completedSteps}/{totalSteps}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {setupSteps.map((step) => (
                      <Button
                        key={step.id}
                        variant="ghost"
                        className={cn(
                          "h-auto justify-start rounded-2xl border border-transparent px-3 py-2 text-left",
                          activeSetupPanel === step.id
                            ? "border-sky-100/70 bg-sky-50 text-slate-900"
                            : "hover:bg-slate-50",
                        )}
                        onClick={() => handlePanelChange(step.id)}
                      >
                        <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">
                          <step.icon className="h-4 w-4 text-slate-600" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{step.title}</span>
                          <span className="block text-xs text-slate-500">{step.description}</span>
                        </span>
                        {step.completed && <CheckCircle2 className="h-4 w-4 text-sky-500" />}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DashboardPreviewCard
            isStorePublic={isStorePublic}
            openStoreHref={openStoreHref}
            previewMostBought={previewMostBought}
            previewProducts={previewProducts}
            previewRecentProducts={previewRecentProducts}
            previewUser={previewUser}
          />
        </div>
      </section>
    </DashboardShell>
  )
}
