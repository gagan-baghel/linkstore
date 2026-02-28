"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, ShoppingBag, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ThemeButtonStyle = "rounded" | "pill" | "square"

interface StorefrontUser {
  _id: string
  name: string
  username?: string
  image?: string
  storeLogo?: string
  storeBannerText?: string
  themePrimaryColor?: string
  themeButtonStyle?: ThemeButtonStyle
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

export function StorefrontClient({ user, products }: StorefrontClientProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"performance" | "latest" | "name">("performance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [source, setSource] = useState("storefront")
  const [sessionId, setSessionId] = useState("")
  const [currentPath, setCurrentPath] = useState("")
  const trackStoreViewOnce = useRef(false)

  const themePrimaryColor = user.themePrimaryColor || "#2563eb"
  const themeButtonStyle = user.themeButtonStyle || "rounded"
  const buttonRadiusClass =
    themeButtonStyle === "pill" ? "rounded-full" : themeButtonStyle === "square" ? "rounded-none" : "rounded-md"

  const normalizedProducts = useMemo(
    () => products.map((product) => ({ ...product, category: normalizeCategory(product.category) })),
    [products],
  )

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

  const filteredProducts = useMemo(() => {
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
    for (const product of filteredProducts) {
      const category = normalizeCategory(product.category)
      const current = groups.get(category) || []
      current.push(product)
      groups.set(category, current)
    }

    const categoryOrder = categoryCounts.map((item) => item.name)
    return categoryOrder
      .map((category) => ({ category, products: groups.get(category) || [] }))
      .filter((section) => section.products.length > 0)
  }, [categoryCounts, filteredProducts])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resolvedSource = params.get("utm_source") || params.get("source") || "storefront"
    setSource(resolvedSource.toLowerCase())
    setSessionId(createSessionId())
    setCurrentPath(window.location.pathname)
  }, [])

  function trackEvent(eventType: "store_view" | "product_card_click", productId?: string) {
    const payload = {
      eventType,
      userId: user._id,
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

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16 sm:pb-14">
      <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/55 bg-white/50 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/75">
                  <ShoppingBag className="h-4.5 w-4.5" style={{ color: themePrimaryColor }} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-bold leading-tight text-slate-800 sm:text-2xl">
                  {user.storeBannerText || `${user.name}'s Affiliate Store`}
                </p>
              </div>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn("h-9 border-white/65 bg-white/70 px-2.5 sm:px-3", buttonRadiusClass)}
                onClick={() => setFiltersOpen(true)}
              >
                <Search className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sr-only sm:hidden">Filters</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 border border-white/65 bg-white/70", buttonRadiusClass)}
                onClick={() => setSearchOpen((prev) => !prev)}
                aria-label="Toggle search"
              >
                <SlidersHorizontal className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>

          {searchOpen && (
            <div className="pb-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="h-10 border-white/65 bg-white/85 pl-9"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] space-y-8 px-3 pt-5 sm:px-4 sm:pt-8 md:px-6">
        <section id="catalog" className="p-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">All Products</h2>
            <span className="rounded-full border border-white/65 bg-white/75 px-2.5 py-1 text-xs text-slate-600 sm:px-3 sm:text-sm">
              {filteredProducts.length} items
            </span>
          </div>

          {groupedProducts.length > 0 ? (
            groupedProducts.map((section) => (
              <div key={section.category} className="mb-6 last:mb-0">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{section.category}</h3>
                  <span className="text-xs text-slate-500">{section.products.length} products</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {section.products.map((product) => (
                    <a
                      key={product._id}
                      href={buildTrackHref(product._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent("product_card_click", product._id)}
                      className="group relative overflow-hidden rounded-2xl border border-white/65 bg-white/85 transition-transform hover:-translate-y-0.5"
                    >
                      <div className="aspect-square overflow-hidden bg-slate-100/70">
                        <img
                          src={product.images?.[0] || "/placeholder.svg?height=600&width=600"}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">{product.title}</h4>
                        <p className="mt-1 text-xs text-slate-500">{section.category}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/65 bg-white/70 p-10 text-center">
              <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-800">No products found</h3>
              <p className="mt-1 text-sm text-slate-600">
                {products.length === 0
                  ? "This store has not added products yet."
                  : "Try another search term or clear filters."}
              </p>
            </div>
          )}
        </section>
      </main>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[92vw] max-w-[360px] border-white/65 bg-white/95 p-0">
          <SheetHeader className="border-b border-white/65">
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Sort and filter products by category.</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 p-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Sort</p>
              <Select value={sortBy} onValueChange={(value: "performance" | "latest" | "name") => setSortBy(value)}>
                <SelectTrigger className="w-full border-white/65 bg-white">
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
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Categories</p>
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
                        active ? "border-transparent text-white" : "border-white/65 bg-white hover:bg-slate-50",
                      )}
                      style={active ? { backgroundColor: themePrimaryColor } : undefined}
                    >
                      <span>{category.name}</span>
                      <span className={cn("text-xs", active ? "text-white/80" : "text-slate-500")}>{category.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Button variant="outline" className="w-full border-white/65 bg-white" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
