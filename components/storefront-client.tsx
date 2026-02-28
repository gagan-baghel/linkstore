"use client"

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react"
import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Lock,
  MoreVertical,
  Search,
  Share2,
  ShoppingBag,
  X,
  Youtube,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ThemeButtonStyle = "rounded" | "pill" | "square"
type ThemeMode = "system" | "light" | "dark"

interface StorefrontUser {
  _id: string
  name: string
  username?: string
  image?: string
  storeLogo?: string
  storeBio?: string
  storeBannerText?: string
  contactInfo?: string
  socialFacebook?: string
  socialTwitter?: string
  socialInstagram?: string
  socialYoutube?: string
  socialWebsite?: string
  themePrimaryColor?: string
  themeButtonStyle?: ThemeButtonStyle
  themeMode?: ThemeMode
}

interface StorefrontProduct {
  _id: string
  title: string
  description: string
  category?: string
  affiliateUrl: string
  images?: string[]
  createdAt: number
  clicks7d?: number
  clicks30d?: number
  outbound7d?: number
  outbound30d?: number
  performanceScore?: number
}

interface StorefrontClientProps {
  user: StorefrontUser
  products: StorefrontProduct[]
  recentProducts?: StorefrontProduct[]
  mostBoughtProducts?: StorefrontProduct[]
}

interface SocialItem {
  key: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

function normalizeCategory(category?: string) {
  const normalized = (category || "").trim()
  return normalized.length > 0 ? normalized : "General"
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet"
  if (ua.includes("mobi") || ua.includes("android")) return "mobile"
  return "desktop"
}

function createSessionId() {
  const key = "affiliatehub_session_id"
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  sessionStorage.setItem(key, next)
  return next
}

function ensureUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function truncateTitle(value: string, max = 20) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}

function getProductImage(product: StorefrontProduct) {
  const first = product.images?.[0]
  if (!first || first.trim().length === 0) return "/placeholder.svg"
  return first
}

function getProfileImage(user: StorefrontUser) {
  return user.storeLogo || user.image || "/placeholder-user.jpg"
}

function buildSocialItems(user: StorefrontUser): SocialItem[] {
  const raw: Array<Omit<SocialItem, "href"> & { value?: string }> = [
    {
      key: "youtube",
      label: "Youtube",
      value: user.socialYoutube,
      icon: Youtube,
    },
    {
      key: "instagram",
      label: "Instagram",
      value: user.socialInstagram,
      icon: Instagram,
    },
    {
      key: "facebook",
      label: "Facebook",
      value: user.socialFacebook,
      icon: Facebook,
    },
    {
      key: "website",
      label: "Website",
      value: user.socialWebsite || user.contactInfo,
      icon: Globe,
    },
  ]

  return raw
    .map((item) => ({ ...item, href: ensureUrl(item.value || "") }))
    .filter((item) => item.href.length > 0)
    .map(({ value, ...item }) => item)
}

export function StorefrontClient({ user, products }: StorefrontClientProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"performance" | "latest" | "name">("performance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"links" | "shop">("shop")
  const [source, setSource] = useState("storefront")
  const [sessionId, setSessionId] = useState("")
  const [currentPath, setCurrentPath] = useState("")
  const [prefersDark, setPrefersDark] = useState(false)
  const trackStoreViewOnce = useRef(false)

  const themePrimaryColor = user.themePrimaryColor || "#2563eb"
  const themeButtonStyle = user.themeButtonStyle || "rounded"
  const themeMode = user.themeMode || "system"
  const buttonRadiusClass =
    themeButtonStyle === "pill" ? "rounded-full" : themeButtonStyle === "square" ? "rounded-none" : "rounded-md"
  const isDarkMode = themeMode === "dark" || (themeMode === "system" && prefersDark)

  const normalizedProducts = useMemo(
    () => products.map((product) => ({ ...product, category: normalizeCategory(product.category) })),
    [products],
  )

  const latestProducts = useMemo(
    () => [...normalizedProducts].sort((a, b) => b.createdAt - a.createdAt),
    [normalizedProducts],
  )

  const socialItems = useMemo(() => buildSocialItems(user), [user])

  const mobileFilteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return latestProducts

    return latestProducts.filter((product) => {
      const category = normalizeCategory(product.category)
      return (
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        category.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [latestProducts, query])

  const postOrderMap = useMemo(() => {
    const map = new Map<string, number>()
    latestProducts.forEach((product, index) => {
      map.set(product._id, latestProducts.length - index)
    })
    return map
  }, [latestProducts])

  const featuredProducts = useMemo(() => latestProducts.slice(0, 6), [latestProducts])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const product of normalizedProducts) {
      const category = normalizeCategory(product.category)
      counts.set(category, (counts.get(category) || 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [normalizedProducts])

  const desktopFilteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    let list = normalizedProducts

    if (selectedCategories.length > 0) {
      list = list.filter((product) => selectedCategories.includes(normalizeCategory(product.category)))
    }

    if (normalizedQuery) {
      list = list.filter((product) => {
        const category = normalizeCategory(product.category)
        return (
          product.title.toLowerCase().includes(normalizedQuery) ||
          category.toLowerCase().includes(normalizedQuery) ||
          product.description.toLowerCase().includes(normalizedQuery)
        )
      })
    }

    const sorted = [...list]
    if (sortBy === "name") {
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      return sorted
    }
    if (sortBy === "latest") {
      sorted.sort((a, b) => b.createdAt - a.createdAt)
      return sorted
    }

    sorted.sort((a, b) => {
      const aScore = a.performanceScore ?? 0
      const bScore = b.performanceScore ?? 0
      if (bScore !== aScore) return bScore - aScore
      return b.createdAt - a.createdAt
    })
    return sorted
  }, [normalizedProducts, query, selectedCategories, sortBy])

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, StorefrontProduct[]>()
    for (const product of desktopFilteredProducts) {
      const category = normalizeCategory(product.category)
      const current = groups.get(category) || []
      current.push(product)
      groups.set(category, current)
    }

    const categoryOrder = categoryCounts.map((item) => item.name)
    return categoryOrder
      .map((category) => ({ category, products: groups.get(category) || [] }))
      .filter((section) => section.products.length > 0)
  }, [categoryCounts, desktopFilteredProducts])

  const storeTitle = useMemo(() => {
    const banner = (user.storeBannerText || "").trim()
    const legacyDefault = `${(user.name || "").trim()}'s Affiliate Store`.trim()
    if (!banner) return "Store"
    if (banner.toLowerCase() === legacyDefault.toLowerCase()) return "Store"
    return banner
  }, [user.name, user.storeBannerText])

  const bannerText =
    user.storeBio?.trim() ||
    "Find the product by searching the post number from the video caption. I may earn a small commission."

  const displayName = (user.name || "Store").trim()
  const storePathLabel = user.username ? `linkstore/${user.username}` : "linkstore"

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resolvedSource = params.get("utm_source") || params.get("source") || "storefront"
    setSource(resolvedSource.toLowerCase())
    setSessionId(createSessionId())
    setCurrentPath(window.location.pathname)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => setPrefersDark(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener("change", sync)
    return () => mediaQuery.removeEventListener("change", sync)
  }, [])

  function trackEvent(eventType: "store_view" | "product_card_click", productId?: string) {
    const payload = {
      eventType,
      productId,
      storeUsername: user.username || "store",
      source,
      referrer: document.referrer || "",
      device: getDeviceType(),
      path: window.location.pathname,
      sessionId,
    }

    fetch("/api/events/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Ignore analytics transport failures to keep storefront interactions instant.
    })
  }

  useEffect(() => {
    if (trackStoreViewOnce.current) return
    if (!sessionId || !user._id) return
    trackStoreViewOnce.current = true
    trackEvent("store_view")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user._id, source])

  function buildTrackHref(productId: string) {
    const params = new URLSearchParams()
    if (source) params.set("source", source)
    if (sessionId) params.set("sessionId", sessionId)
    if (currentPath) params.set("path", currentPath)
    return `/api/track/${productId}?${params.toString()}`
  }

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    )
  }

  function clearFilters() {
    setSelectedCategories([])
    setQuery("")
    setSortBy("performance")
  }

  function renderMobileProductCard(product: StorefrontProduct) {
    const postNumber = postOrderMap.get(product._id) || 1

    return (
      <a
        key={product._id}
        href={buildTrackHref(product._id)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent("product_card_click", product._id)}
        className="block"
      >
        <article className="overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
          <div className="aspect-square overflow-hidden bg-white">
            <img
              src={getProductImage(product)}
              alt={product.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 text-white">
            <p className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight">
              {`Post ${postNumber} - ${truncateTitle(product.title, 24)}`}
            </p>
            <MoreVertical className="h-4 w-4 shrink-0 text-white/80" />
          </div>
        </article>
      </a>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="relative min-h-screen overflow-x-hidden bg-[#090909] text-white md:hidden">
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 18%, rgba(130, 0, 0, 0.52), transparent 38%), radial-gradient(circle at 75% 30%, rgba(89, 8, 8, 0.35), transparent 45%), linear-gradient(180deg, #090909 0%, #210305 33%, #2a0d0d 64%, #12080a 100%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[430px]">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08080b]/95 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full text-white/95"
                aria-label="Close"
              >
                <X className="h-8 w-8" />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/55">Threads</p>
                <p className="flex items-center gap-1.5 truncate text-2xl font-semibold leading-none text-white/95">
                  <Lock className="h-3.5 w-3.5" />
                  {storePathLabel}
                </p>
              </div>

              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white"
                aria-label="Menu"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="px-4 pb-14 pt-5">
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-full bg-[#d9d4d4] text-black shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                aria-label="Brand"
              >
                <span className="text-3xl font-black leading-none">*</span>
              </button>
              <button
                type="button"
                className="grid h-12 w-12 place-items-center rounded-full bg-[#d9d4d4] text-black shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                aria-label="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            <section className="text-center">
              <div className="mx-auto h-36 w-36 rounded-full bg-[#d40000] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
                <img
                  src={getProfileImage(user)}
                  alt={displayName}
                  className="h-full w-full rounded-full border-4 border-white object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>

              <h1 className="mt-4 text-[50px] font-extrabold leading-[0.92] tracking-tight">{displayName}</h1>
              <p className="mx-auto mt-3 max-w-[340px] text-[14px] font-semibold leading-[1.35] text-white/95">{bannerText}</p>

              <div className="mt-5 flex items-center justify-center gap-5">
                {socialItems.slice(0, 2).map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white"
                      aria-label={item.label}
                    >
                      <Icon className="h-6 w-6" />
                    </a>
                  )
                })}
              </div>
            </section>

            <div className="mx-auto mt-6 flex w-[264px] rounded-full bg-[#d3cccc] p-1 text-[30px] font-bold text-black shadow-[0_8px_20px_rgba(0,0,0,0.32)]">
              <button
                type="button"
                onClick={() => setActiveTab("links")}
                className={cn(
                  "flex-1 rounded-full py-2.5 transition",
                  activeTab === "links" ? "bg-black text-white" : "text-black",
                )}
              >
                Links
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("shop")}
                className={cn(
                  "flex-1 rounded-full py-2.5 transition",
                  activeTab === "shop" ? "bg-black text-white" : "text-black",
                )}
              >
                Shop
              </button>
            </div>

            {activeTab === "links" ? (
              <section className="mt-5 space-y-5">
                {featuredProducts.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl bg-black p-3 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                    <div className="grid grid-cols-3 gap-1">
                      {featuredProducts.slice(0, 1).map((product) => (
                        <a
                          key={product._id}
                          href={buildTrackHref(product._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent("product_card_click", product._id)}
                          className="col-span-2 row-span-2 block overflow-hidden rounded-lg bg-white"
                        >
                          <img
                            src={getProductImage(product)}
                            alt={product.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </a>
                      ))}

                      {featuredProducts.slice(1, 6).map((product) => (
                        <a
                          key={product._id}
                          href={buildTrackHref(product._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackEvent("product_card_click", product._id)}
                          className="block overflow-hidden rounded-lg bg-white"
                        >
                          <div className="aspect-square">
                            <img
                              src={getProductImage(product)}
                              alt={product.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        </a>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("shop")}
                      className="mt-3 w-full rounded-xl bg-black py-2 text-center"
                    >
                      <p className="text-2xl font-extrabold text-white">See Full Shop</p>
                      <p className="text-sm text-white/65">{latestProducts.length} products</p>
                    </button>
                  </div>
                ) : null}

                {socialItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-2xl bg-black px-3 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                    >
                      <div className="grid h-14 w-14 place-items-center rounded-lg bg-white">
                        <Icon className="h-8 w-8 text-black" />
                      </div>
                      <p className="flex-1 text-[31px] font-semibold tracking-tight text-white">{item.label}</p>
                      <MoreVertical className="h-5 w-5 text-white/80" />
                    </a>
                  )
                })}

                <a
                  href="/auth/register"
                  className="mt-8 block rounded-full bg-white px-5 py-4 text-center text-[35px] font-bold leading-tight text-black shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
                >
                  Join {user.username || displayName} on Linkstore
                </a>
              </section>
            ) : (
              <section className="mt-5">
                <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-black shadow-[0_8px_20px_rgba(0,0,0,0.28)]">
                  <Search className="h-5 w-5 text-black/65" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Search ${user.username || displayName}'s products`}
                    className="w-full border-none bg-transparent text-[24px] leading-tight text-black outline-none placeholder:text-black/40"
                  />
                </div>

                {mobileFilteredProducts.length > 0 ? (
                  <div className="mt-5 grid grid-cols-2 gap-4">{mobileFilteredProducts.map((product) => renderMobileProductCard(product))}</div>
                ) : (
                  <div className="mt-8 rounded-2xl bg-black/85 px-4 py-8 text-center">
                    <ShoppingBag className="mx-auto h-9 w-9 text-white/70" />
                    <h3 className="mt-3 text-2xl font-bold">No products found</h3>
                    <p className="mt-1 text-sm text-white/65">
                      {products.length === 0 ? "This store has not added products yet." : "Try another search term."}
                    </p>
                  </div>
                )}
              </section>
            )}

            <div className="mt-8 flex items-center justify-center">
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(0,0,0,0.25)]"
              >
                linkstore/you
                <ExternalLink className="h-4 w-4" style={{ color: themePrimaryColor }} />
              </a>
            </div>
          </main>
        </div>
      </div>

      <div className={cn("relative hidden min-h-screen overflow-x-hidden pb-10 sm:pb-8 md:block", isDarkMode ? "bg-slate-950 text-slate-100" : "") }>
        <div className={cn("pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full blur-3xl", isDarkMode ? "bg-sky-500/20" : "bg-sky-300/30")} />
        <div className={cn("pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full blur-3xl", isDarkMode ? "bg-violet-500/20" : "bg-violet-300/30")} />
        <div className={cn("pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full blur-3xl", isDarkMode ? "bg-emerald-500/20" : "bg-emerald-200/30")} />

        <header className={cn("sticky top-0 z-40 backdrop-blur-md", isDarkMode ? "border-b border-slate-700/80 bg-slate-900/80" : "border-b border-white/55 bg-white/60")}>
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5">
            <div className="flex items-center gap-2 py-2 sm:py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {user.storeLogo || user.image ? (
                  <img
                    src={user.storeLogo || user.image || "/placeholder.svg"}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-full", isDarkMode ? "bg-slate-800" : "bg-white/75")}>
                    <ShoppingBag className="h-4.5 w-4.5" style={{ color: themePrimaryColor }} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn("truncate text-base font-bold leading-tight sm:text-2xl", isDarkMode ? "text-slate-100" : "text-slate-800")}>
                    {storeTitle}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products"
                    className={cn(
                      "h-9 w-[150px] pl-8 text-xs shadow-none focus-visible:ring-2 sm:w-[240px] sm:text-sm md:w-[300px]",
                      isDarkMode
                        ? "border-slate-600 bg-slate-900/90 text-slate-100 placeholder:text-slate-400 focus-visible:ring-slate-500"
                        : "border-white/70 bg-white/92 text-slate-800 placeholder:text-slate-500 focus-visible:ring-white",
                      buttonRadiusClass,
                    )}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 px-2.5 shadow-none sm:px-3",
                    isDarkMode
                      ? "border-slate-600 bg-slate-900/90 text-slate-100 hover:bg-slate-800"
                      : "border-white/70 bg-white/92 text-slate-800 hover:bg-white",
                    buttonRadiusClass,
                  )}
                  onClick={() => setFiltersOpen(true)}
                >
                  <span className="text-xs font-semibold sm:text-sm">Filters</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full space-y-4 px-2 pt-3 sm:px-3 sm:pt-4 md:px-4 lg:px-5">
          <section id="catalog">
            <div className="mb-3 flex items-center justify-between">
              <h2 className={cn("text-xl font-bold tracking-tight sm:text-2xl", isDarkMode ? "text-slate-100" : "text-slate-800")}>All Products</h2>
            </div>

            {groupedProducts.length > 0 ? (
              groupedProducts.map((section) => (
                <div key={section.category} className="mb-4 last:mb-0">
                  <div className="mb-2">
                    <h3 className={cn("text-sm font-semibold uppercase tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-500")}>{section.category}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {section.products.map((product) => (
                      <a
                        key={product._id}
                        href={buildTrackHref(product._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("product_card_click", product._id)}
                        className={cn(
                          "group relative overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2",
                          isDarkMode ? "border-slate-700 bg-slate-900/80 focus-visible:ring-slate-500" : "border-white/65 bg-white/80 focus-visible:ring-white",
                        )}
                      >
                        <div className={cn("aspect-[4/5] overflow-hidden", isDarkMode ? "bg-slate-800/80" : "bg-slate-100/70")}>
                          <img
                            src={product.images?.[0] || "/placeholder.svg?height=600&width=600"}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pb-3 pt-8 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                          <h4 className="line-clamp-2 text-sm font-semibold text-white">{product.title}</h4>
                          <p className="mt-1 text-[11px] text-white/85">{section.category}</p>
                        </div>
                        <span className="sr-only">{product.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <ShoppingBag className={cn("mx-auto mb-3 h-10 w-10", isDarkMode ? "text-slate-500" : "text-slate-400")} />
                <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-slate-100" : "text-slate-800")}>No products found</h3>
                <p className={cn("mt-1 text-sm", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                  {products.length === 0
                    ? "This store has not added products yet."
                    : "Try another search term or clear filters."}
                </p>
              </div>
            )}
          </section>
        </main>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="left" className={cn("w-[92vw] max-w-[360px] p-0", isDarkMode ? "border-slate-700 bg-slate-900/95" : "border-white/65 bg-white/95")}>
            <SheetHeader className={cn("border-b", isDarkMode ? "border-slate-700" : "border-white/65")}>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Sort and filter products by category.</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4">
              <div>
                <p className={cn("mb-2 text-xs font-medium uppercase tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-500")}>Sort</p>
                <Select value={sortBy} onValueChange={(value: "performance" | "latest" | "name") => setSortBy(value)}>
                  <SelectTrigger className={cn("w-full", isDarkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-white/65 bg-white")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance (default)</SelectItem>
                    <SelectItem value="latest">Latest first</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className={cn("mb-2 text-xs font-medium uppercase tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-500")}>Categories</p>
                <div className="space-y-2">
                  {categoryCounts.map((category) => {
                    const active = selectedCategories.includes(category.name)
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          active
                            ? "border-transparent text-white"
                            : isDarkMode
                              ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                              : "border-white/65 bg-white hover:bg-slate-50",
                        )}
                        style={active ? { backgroundColor: themePrimaryColor } : undefined}
                      >
                        <span>{category.name}</span>
                        <span className={cn("text-xs", active ? "text-white/80" : isDarkMode ? "text-slate-400" : "text-slate-500")}>{category.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button variant="outline" className={cn("w-full", isDarkMode ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-white/65 bg-white")} onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
