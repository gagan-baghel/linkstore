"use client"

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react"
import Image from "next/image"
import {
  Facebook,
  Globe,
  Instagram,
  Mail,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Twitter,
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
  const key = "linkstore_session_id"
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

function createContactItem(contactInfo?: string): SocialItem | null {
  const trimmed = (contactInfo || "").trim()
  if (!trimmed) return null

  if (/^mailto:/i.test(trimmed)) {
    return { key: "contact-email", label: "Email", href: trimmed, icon: Mail }
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { key: "contact-email", label: "Email", href: `mailto:${trimmed}`, icon: Mail }
  }

  if (/^tel:/i.test(trimmed)) {
    return { key: "contact-phone", label: "Call", href: trimmed, icon: Phone }
  }

  if (/^\+?[\d\s().-]{7,}$/.test(trimmed)) {
    const normalizedPhone = trimmed.replace(/[^\d+]/g, "")
    if (normalizedPhone) {
      return { key: "contact-phone", label: "Call", href: `tel:${normalizedPhone}`, icon: Phone }
    }
  }

  const href = ensureUrl(trimmed)
  return href ? { key: "contact-website", label: "Website", href, icon: Globe } : null
}

function truncateTitle(value: string, max = 24) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}

function getProductImage(product: StorefrontProduct) {
  const first = product.images?.[0]
  if (!first || first.trim().length === 0) return "/placeholder.svg"
  return first
}

function getProfileImage(user: StorefrontUser) {
  const storeLogo = (user.storeLogo || "").trim()
  return storeLogo || "/placeholder-logo.png"
}

function hasCustomStoreLogo(user: StorefrontUser) {
  return (user.storeLogo || "").trim().length > 0
}

function buildSocialItems(user: StorefrontUser): SocialItem[] {
  const raw: Array<Omit<SocialItem, "href"> & { value?: string }> = [
    {
      key: "twitter",
      label: "Twitter",
      value: user.socialTwitter,
      icon: Twitter,
    },
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
      value: user.socialWebsite,
      icon: Globe,
    },
  ]

  const socialItems = raw
    .map((item) => ({ ...item, href: ensureUrl(item.value || "") }))
    .filter((item) => item.href.length > 0)
    .map(({ value, ...item }) => item)

  const contactItem = createContactItem(user.contactInfo)
  const mergedItems = contactItem ? [...socialItems, contactItem] : socialItems
  const seen = new Set<string>()

  return mergedItems.filter((item) => {
    const normalizedHref = item.href.trim().toLowerCase()
    if (!normalizedHref || seen.has(normalizedHref)) return false
    seen.add(normalizedHref)
    return true
  })
}

export function StorefrontClient({ user, products }: StorefrontClientProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"performance" | "latest" | "name">("performance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"links" | "shop">("links")
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
  const featuredProducts = useMemo(() => latestProducts.slice(0, 6), [latestProducts])
  const mobileFilteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return latestProducts
    return latestProducts.filter((product) => {
      const category = normalizeCategory(product.category)
      return product.title.toLowerCase().includes(normalizedQuery) || category.toLowerCase().includes(normalizedQuery)
    })
  }, [latestProducts, query])

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
        return product.title.toLowerCase().includes(normalizedQuery) || category.toLowerCase().includes(normalizedQuery)
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
    if (!banner) return "Store"
    return banner
  }, [user.storeBannerText])

  const bannerText =
    user.storeBio?.trim() ||
    "Find the product by searching the post number from the video caption. I may earn a small commission."
  const displayName = (user.name || "Store").trim()
  const usesFallbackLogo = !hasCustomStoreLogo(user)
  const mobileSocialIcons = socialItems.filter((item) => item.key === "instagram" || item.key === "youtube").slice(0, 2)
  const hasCreatorLinks = socialItems.length > 0
  const affiliateDisclosure =
    "Affiliate links may open external retailer pages in a new tab. The creator may earn a commission from qualifying purchases."
  const showcaseProducts = useMemo(() => {
    const pool = ["/placeholder.jpg", "/placeholder.svg", "/placeholder-user.jpg"]
    const items = featuredProducts.map((product) => ({
      id: product._id,
      image: getProductImage(product),
      title: product.title,
      href: buildTrackHref(product._id),
      trackId: product._id,
    }))

    if (items.length === 0) {
      return pool.map((image, idx) => ({
        id: `fill-${idx + 1}`,
        image,
        title: `Featured ${idx + 1}`,
        href: "",
        trackId: "",
      }))
    }

    if (items.length < 3) {
      pool.slice(0, 2).forEach((image, idx) => {
        items.push({
          id: `fill-extra-${idx + 1}`,
          image,
          title: `Featured ${idx + 1}`,
          href: "",
          trackId: "",
        })
      })
    }

    return items.slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredProducts, source, sessionId, currentPath])

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

  function renderShowcaseCard() {
    const cardTone = !hasCreatorLinks
      ? "bg-black text-white"
      : isDarkMode
        ? "border border-slate-700 bg-slate-900/80 text-slate-100"
        : "border border-white/65 bg-white/85 text-slate-900"

    const captionClass = !hasCreatorLinks ? "text-white/70" : isDarkMode ? "text-slate-400" : "text-slate-500"

    return (
      <div className={cn("overflow-hidden rounded-2xl p-3 shadow-[0_10px_26px_rgba(0,0,0,0.35)]", cardTone)}>
        <div className="grid grid-cols-3 gap-1">
          {showcaseProducts.slice(0, 1).map((product) =>
            product.href ? (
              <a
                key={product.id}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => product.trackId && trackEvent("product_card_click", product.trackId)}
                className="col-span-2 row-span-2 block overflow-hidden rounded-lg bg-white"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={product.image}
                    alt={product.title}
                    className="object-cover"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 66vw, 280px"
                  />
                </div>
              </a>
            ) : (
              <div key={product.id} className="col-span-2 row-span-2 block overflow-hidden rounded-lg bg-white">
                <div className="relative h-full w-full">
                  <Image
                    src={product.image}
                    alt={product.title}
                    className="object-cover"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 66vw, 280px"
                  />
                </div>
              </div>
            ),
          )}
          {showcaseProducts.slice(1, 6).map((product) =>
            product.href ? (
              <a
                key={product.id}
                href={product.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => product.trackId && trackEvent("product_card_click", product.trackId)}
                className="block overflow-hidden rounded-lg bg-white"
              >
                <div className="relative aspect-square">
                  <Image
                    src={product.image}
                    alt={product.title}
                    className="object-cover"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 33vw, 120px"
                  />
                </div>
              </a>
            ) : (
              <div key={product.id} className="block overflow-hidden rounded-lg bg-white">
                <div className="relative aspect-square">
                  <Image
                    src={product.image}
                    alt={product.title}
                    className="object-cover"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 33vw, 120px"
                  />
                </div>
              </div>
            ),
          )}
        </div>
        <button type="button" onClick={() => setActiveTab("shop")} className="mt-2.5 w-full rounded-xl py-1.5 text-center">
          <p className="text-[20px] font-extrabold">See Full Shop</p>
          <p className={cn("text-xs", captionClass)}>{latestProducts.length} products</p>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className={cn("relative min-h-screen overflow-x-hidden md:hidden", isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
        <div className={cn("pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full blur-3xl", isDarkMode ? "bg-sky-500/15" : "bg-sky-300/25")} />
        <div className={cn("pointer-events-none absolute right-0 top-0 h-60 w-60 rounded-full blur-3xl", isDarkMode ? "bg-violet-500/15" : "bg-violet-300/25")} />

        <main className="relative z-10 mx-auto w-full max-w-[430px] px-3 pb-6 pt-5">
          <section className="text-center">
            <div
              className={cn(
                "mx-auto h-20 w-20 overflow-hidden rounded-full border shadow-[0_8px_20px_rgba(0,0,0,0.18)]",
                isDarkMode ? "border-slate-700 bg-slate-800" : "border-white/65 bg-white",
              )}
            >
              <Image
                src={getProfileImage(user)}
                alt={displayName}
                className={cn(
                  "h-full w-full",
                  usesFallbackLogo ? "object-contain p-1.5" : "object-cover",
                  usesFallbackLogo && isDarkMode ? "mix-blend-lighten contrast-110 brightness-95" : "",
                )}
                width={80}
                height={80}
                unoptimized
                sizes="80px"
              />
            </div>

            <h1 className={cn("mt-2 text-[28px] font-extrabold tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>{displayName}</h1>
            <p className={cn("mx-auto mt-1 max-w-[300px] text-[12px] leading-[1.4]", isDarkMode ? "text-slate-300" : "text-slate-600")}>{bannerText}</p>

            <div className="mt-3 flex items-center justify-center gap-3">
              {mobileSocialIcons.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full border",
                      isDarkMode ? "border-slate-600 bg-slate-900 text-slate-100" : "border-white/65 bg-white text-slate-700",
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>

            <div
              className={cn(
                "mx-auto mt-3 max-w-[340px] rounded-2xl border px-3 py-2 text-left shadow-[0_10px_24px_rgba(0,0,0,0.12)]",
                isDarkMode ? "border-slate-700 bg-slate-900/90 text-slate-200" : "border-white/70 bg-white/92 text-slate-700",
              )}
            >
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Creator trust note
              </p>
              <p className={cn("mt-1 text-[11px] leading-5", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                {affiliateDisclosure}
              </p>
            </div>
          </section>

          <div
            className={cn(
              "mx-auto mt-4 flex w-[210px] rounded-full p-1 text-[13px] font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.16)]",
              isDarkMode ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700",
            )}
          >
            <button
              type="button"
              onClick={() => setActiveTab("links")}
              className={cn(
                "flex-1 rounded-full py-1.5 transition",
                activeTab === "links"
                  ? isDarkMode
                    ? "bg-slate-100 text-slate-900"
                    : "bg-slate-900 text-white"
                  : isDarkMode
                    ? "text-slate-300"
                    : "text-slate-600",
              )}
            >
              Links
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shop")}
              className={cn(
                "flex-1 rounded-full py-1.5 transition",
                activeTab === "shop"
                  ? isDarkMode
                    ? "bg-slate-100 text-slate-900"
                    : "bg-slate-900 text-white"
                  : isDarkMode
                    ? "text-slate-300"
                    : "text-slate-600",
              )}
            >
              Shop
            </button>
          </div>

          {activeTab === "links" ? (
            <section className="mt-4 space-y-3">
              {hasCreatorLinks ? (
                <div
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                    isDarkMode ? "border-slate-700 bg-slate-900/85 text-slate-100" : "border-white/65 bg-white/90 text-slate-900",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Verified creator links</p>
                  <p className={cn("mt-1 text-xs leading-5", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    Use these direct creator channels if you want to confirm identity or see how products are used before opening retailer links.
                  </p>
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
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.16)]",
                      isDarkMode ? "border-slate-700 bg-slate-900/85 text-slate-100" : "border-white/65 bg-white/90 text-slate-900",
                    )}
                  >
                    <div className={cn("grid h-10 w-10 place-items-center rounded-lg", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                      <Icon className={cn("h-5 w-5", isDarkMode ? "text-slate-100" : "text-slate-700")} />
                    </div>
                    <p className="flex-1 text-[14px] font-semibold tracking-tight">{item.label}</p>
                    <MoreVertical className={cn("h-4 w-4", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                  </a>
                )
              })}

              {renderShowcaseCard()}
            </section>
          ) : (
            <section className="mt-4">
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-full border px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.14)]",
                  isDarkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-white/65 bg-white text-slate-900",
                )}
              >
                <Search className={cn("h-4 w-4", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${displayName}'s products`}
                  aria-label={`Search ${displayName}'s products`}
                  className={cn(
                    "w-full border-none bg-transparent text-[13px] leading-tight outline-none",
                    isDarkMode ? "text-slate-100 placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400",
                  )}
                />
              </div>

              {mobileFilteredProducts.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {mobileFilteredProducts.map((product) => (
                    <a
                      key={product._id}
                      href={buildTrackHref(product._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent("product_card_click", product._id)}
                      aria-label={`Open ${product.title} in a new tab`}
                      className={cn(
                        "overflow-hidden rounded-xl border shadow-[0_8px_18px_rgba(0,0,0,0.14)]",
                        isDarkMode ? "border-slate-700 bg-slate-900" : "border-white/65 bg-white",
                      )}
                    >
                      <div className={cn("relative aspect-square overflow-hidden", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                        <Image
                          src={getProductImage(product)}
                          alt={product.title}
                          className="object-cover"
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, 160px"
                        />
                      </div>
                      <div className={cn("flex items-center gap-2 px-2.5 py-2", isDarkMode ? "text-slate-100" : "text-slate-800")}>
                        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold">{truncateTitle(product.title, 18)}</p>
                        <MoreVertical className={cn("h-3.5 w-3.5 shrink-0", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "mt-5 rounded-2xl border px-4 py-6 text-center",
                    isDarkMode ? "border-slate-700 bg-slate-900/85" : "border-white/65 bg-white/90",
                  )}
                >
                  <ShoppingBag className={cn("mx-auto h-7 w-7", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                  <h3 className={cn("mt-2 text-base font-bold", isDarkMode ? "text-slate-100" : "text-slate-900")}>No products found</h3>
                  <p className={cn("mt-1 text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    {products.length === 0 ? "This store has not added products yet." : "Try another search term."}
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <div className={cn("relative hidden min-h-screen overflow-x-hidden pb-8 md:block", isDarkMode ? "bg-slate-950 text-slate-100" : "")}>
        <div className={cn("pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full blur-3xl", isDarkMode ? "bg-sky-500/20" : "bg-sky-300/30")} />
        <div className={cn("pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full blur-3xl", isDarkMode ? "bg-violet-500/20" : "bg-violet-300/30")} />
        <div className={cn("pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full blur-3xl", isDarkMode ? "bg-emerald-500/20" : "bg-emerald-200/30")} />

        <header className={cn("sticky top-0 z-40 backdrop-blur-md", isDarkMode ? "border-b border-slate-700/80 bg-slate-900/80" : "border-b border-white/55 bg-white/60")}>
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5">
            <div className="flex items-center gap-1.5 py-1.5 sm:gap-2 sm:py-2">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Image
                  src={getProfileImage(user)}
                  alt={user.name}
                  className={cn(
                    "h-8 w-8 rounded-full sm:h-9 sm:w-9",
                    usesFallbackLogo ? "object-contain p-1" : "object-cover",
                    usesFallbackLogo && isDarkMode ? "mix-blend-lighten contrast-110 brightness-95" : "",
                  )}
                  width={36}
                  height={36}
                  unoptimized
                  sizes="36px"
                />
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-bold leading-tight sm:text-lg md:text-xl", isDarkMode ? "text-slate-100" : "text-slate-800")}>
                    {storeTitle}
                  </p>
                  <p className={cn("mt-0.5 hidden text-[11px] leading-5 md:block", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                    {affiliateDisclosure}
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
                    aria-label="Search products"
                    className={cn(
                      "h-8 w-[124px] pl-7 text-[11px] shadow-none focus-visible:ring-2 sm:h-9 sm:w-[220px] sm:pl-8 sm:text-xs md:w-[280px] md:text-sm",
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
                    "h-8 px-2 text-[11px] shadow-none sm:h-9 sm:px-3 sm:text-xs",
                    isDarkMode
                      ? "border-slate-600 bg-slate-900/90 text-slate-100 hover:bg-slate-800"
                      : "border-white/70 bg-white/92 text-slate-800 hover:bg-white",
                    buttonRadiusClass,
                  )}
                  onClick={() => setFiltersOpen(true)}
                >
                  <span className="text-[11px] font-semibold sm:text-xs md:text-sm">Filters</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full space-y-3 px-2 pt-2 sm:space-y-4 sm:px-3 sm:pt-3 md:px-4 lg:px-5">
          <section
            className={cn(
              "rounded-2xl border px-4 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)]",
              isDarkMode ? "border-slate-700 bg-slate-900/85" : "border-white/70 bg-white/88",
            )}
          >
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Creator storefront</p>
                <h2 className={cn("mt-2 text-xl font-semibold tracking-tight", isDarkMode ? "text-slate-100" : "text-slate-900")}>
                  Curated recommendations from {displayName}
                </h2>
                <p className={cn("mt-2 max-w-3xl text-sm leading-6", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                  {bannerText}
                </p>
              </div>
              <div className="grid gap-2">
                <div className={cn("rounded-xl border px-3 py-3", isDarkMode ? "border-slate-700 bg-slate-950/60" : "border-slate-200 bg-slate-50/90")}>
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Trust
                  </p>
                  <p className={cn("mt-1 text-xs leading-5", isDarkMode ? "text-slate-300" : "text-slate-600")}>{affiliateDisclosure}</p>
                </div>
                <div className={cn("rounded-xl border px-3 py-3", isDarkMode ? "border-slate-700 bg-slate-950/60" : "border-slate-200 bg-slate-50/90")}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Creator links</p>
                  <p className={cn("mt-1 text-xs leading-5", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    {hasCreatorLinks
                      ? `${socialItems.length} verified creator link${socialItems.length === 1 ? "" : "s"} available before you open retailer pages.`
                      : "No creator links added yet. Browse products directly below."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="catalog">
            <div className="mb-3 flex items-center justify-between">
              <h2 className={cn("text-base font-bold tracking-tight sm:text-lg md:text-xl", isDarkMode ? "text-slate-100" : "text-slate-800")}>All Products</h2>
            </div>

            {groupedProducts.length > 0 ? (
              groupedProducts.map((section) => (
                <div key={section.category} className="mb-4 last:mb-0">
                  <div className="mb-2">
                    <h3 className={cn("text-[11px] font-semibold uppercase tracking-wide sm:text-xs", isDarkMode ? "text-slate-300" : "text-slate-500")}>{section.category}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {section.products.map((product) => (
                      <a
                        key={product._id}
                        href={buildTrackHref(product._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("product_card_click", product._id)}
                        aria-label={`Open ${product.title} in a new tab`}
                        className={cn(
                          "group relative overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2",
                          isDarkMode ? "border-slate-700 bg-slate-900/80 focus-visible:ring-slate-500" : "border-white/65 bg-white/80 focus-visible:ring-white",
                        )}
                      >
                        <div className={cn("relative aspect-[4/5] overflow-hidden", isDarkMode ? "bg-slate-800/80" : "bg-slate-100/70")}>
                          <Image
                            src={product.images?.[0] || "/placeholder.svg?height=600&width=600"}
                            alt={product.title}
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 20vw, 220px"
                          />
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2.5 pb-2.5 pt-7 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                          <h4 className="line-clamp-2 text-xs font-semibold text-white sm:text-sm">{product.title}</h4>
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
