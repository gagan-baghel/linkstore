"use client"

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState, type ComponentType, type FormEvent } from "react"
import Image from "next/image"
import {
  Facebook,
  Globe,
  Instagram,
  Link2,
  Mail,
  MessageCircle,
  MoreVertical,
  Phone,
  Search,
  ShoppingBag,
  Twitter,
  X,
  Youtube,
  Sparkles,
  Share2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"

interface StorefrontUser {
  _id: string
  name: string
  username?: string
  image?: string
  storeLogo?: string
  storeBio?: string
  storeBannerText?: string
  contactInfo?: string
  themeMode?: "light" | "dark"
  themePrimaryColor?: string
  themeAccentColor?: string
  themeButtonStyle?: "pill" | "rounded" | "square"
  themeCardStyle?: "soft" | "outline" | "solid"
  themeFooterVisible?: boolean
  themeBackgroundColor?: string
  themeBackgroundPattern?:
    | "solid"
    | "gradient"
    | "mesh"
    | "confetti"
    | "grid"
    | "waves"
    | "aurora"
    | "sunset"
    | "neon"
    | "paper"
    | "dots"
    | "stripes"
    | "topo"
    | "noise"
    | "zigzag"
    | "halftone"
    | "ripple"
    | "petals"
    | "diagonal"
    | "stars"
    | "gradient-radial"
    | "glow"
    | "checkers"
    | "chevron"
    | "blobs"
    | "prism"
    | "lava"
    | "hologram"
    | "blocks"
    | "glyphs"
    | "pixel"
    | "tartan"
    | "arches"
    | "swoosh"
    | "orbit"
    | "ribbon"
    | "bubble"
    | "petal-arc"
  themeNameColor?: string
  themeBioColor?: string
  themeNameFont?:
    | "system"
    | "serif"
    | "grotesk"
    | "rounded"
    | "mono"
    | "display"
    | "condensed"
    | "elegant"
    | "handwritten"
    | "modern"
    | "soft"
    | "editorial"
    | "tech"
    | "classic"
    | "headline"
  themeBioFont?:
    | "system"
    | "serif"
    | "grotesk"
    | "rounded"
    | "mono"
    | "display"
    | "condensed"
    | "elegant"
    | "handwritten"
    | "modern"
    | "soft"
    | "editorial"
    | "tech"
    | "classic"
    | "headline"
  socialFacebook?: string
  socialTwitter?: string
  socialInstagram?: string
  socialYoutube?: string
  socialWebsite?: string
  socialWhatsapp?: string
  socialWhatsappMessage?: string
  customLinks?: Array<{ label?: string; url: string }>
  leadCaptureChannel?: "email" | "whatsapp"
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
  previewMode?: "mobile" | "desktop"
  disableTracking?: boolean
}

interface SocialItem {
  key: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const SOCIAL_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  instagram: "#E1306C",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  website: "#64748b",
  "contact-email": "#64748b",
  "contact-phone": "#64748b",
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

const FONT_FAMILIES: Record<string, string> = {
  system: "system-ui, -apple-system, Segoe UI, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  grotesk: "'Trebuchet MS', 'Segoe UI', sans-serif",
  rounded: "'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif",
  mono: "'Courier New', Courier, monospace",
  display: "'Trebuchet MS', 'Segoe UI', sans-serif",
  condensed: "'Arial Narrow', 'Trebuchet MS', sans-serif",
  elegant: "Georgia, 'Times New Roman', serif",
  handwritten: "'Comic Sans MS', 'Bradley Hand', cursive",
  modern: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  soft: "'Arial Rounded MT Bold', 'Segoe UI', sans-serif",
  editorial: "'Times New Roman', Georgia, serif",
  tech: "'Segoe UI', 'Tahoma', sans-serif",
  classic: "Georgia, 'Times New Roman', serif",
  headline: "'Trebuchet MS', 'Segoe UI', sans-serif",
}

function getReadableTextColor(hexColor: string) {
  const hex = hexColor.replace("#", "")
  if (hex.length !== 3 && hex.length !== 6) return "#ffffff"
  const normalized = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#0f172a" : "#ffffff"
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
      key: "whatsapp",
      label: "WhatsApp",
      value: buildWhatsAppUrl(user.socialWhatsapp, user.socialWhatsappMessage),
      icon: MessageCircle,
    },
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
    ...(user.customLinks || []).map((link, index) => ({
      key: `custom-${index}`,
      label: (link.label || "").trim() || "Link",
      value: link.url,
      icon: Link2,
    })),
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

export function StorefrontClient({
  user,
  products,
  recentProducts,
  mostBoughtProducts,
  previewMode,
  disableTracking = false,
}: StorefrontClientProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<"performance" | "latest" | "name">("performance")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"links" | "shop">("links")
  const [desktopMediaMenuOpen, setDesktopMediaMenuOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [source, setSource] = useState("storefront")
  const [medium, setMedium] = useState("")
  const [campaign, setCampaign] = useState("")
  const [content, setContent] = useState("")
  const [term, setTerm] = useState("")
  const [collectionSlug, setCollectionSlug] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [currentPath, setCurrentPath] = useState("")
  const [leadEmail, setLeadEmail] = useState("")
  const [leadWhatsapp, setLeadWhatsapp] = useState("")
  const [leadConsent, setLeadConsent] = useState(false)
  const [leadCaptureMessage, setLeadCaptureMessage] = useState("")
  const [leadCaptureError, setLeadCaptureError] = useState("")
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)
  const [isLeadPopupOpen, setIsLeadPopupOpen] = useState(false)
  const trackStoreViewOnce = useRef(false)
  const desktopMediaMenuRef = useRef<HTMLDivElement | null>(null)

  const themeMode = user.themeMode || "light"
  const isDarkMode = themeMode === "dark"
  const primaryColor = user.themePrimaryColor || (isDarkMode ? "#e2e8f0" : "#0f172a")
  const accentColor = user.themeAccentColor || "#6366f1"
  const backgroundColor = user.themeBackgroundColor || (isDarkMode ? "#0b1120" : "#f8fafc")
  const backgroundPattern = user.themeBackgroundPattern || "solid"
  const nameColor = user.themeNameColor || (isDarkMode ? "#e2e8f0" : "#0f172a")
  const bioColor = user.themeBioColor || (isDarkMode ? "#cbd5f5" : "#475569")
  const nameFontKey = user.themeNameFont || "system"
  const bioFontKey = user.themeBioFont || "system"
  const nameFontFamily = FONT_FAMILIES[nameFontKey] || FONT_FAMILIES.system
  const bioFontFamily = FONT_FAMILIES[bioFontKey] || FONT_FAMILIES.system
  const buttonRadiusClass =
    user.themeButtonStyle === "square" ? "rounded-lg" : user.themeButtonStyle === "rounded" ? "rounded-2xl" : "rounded-full"
  const cardStyle = user.themeCardStyle || "soft"
  const cardSurfaceClass =
    cardStyle === "solid"
      ? isDarkMode
        ? "bg-slate-900 text-slate-100"
        : "bg-white text-slate-900"
      : cardStyle === "outline"
        ? isDarkMode
          ? "border border-slate-700 bg-transparent text-slate-100"
          : "border border-slate-200 bg-transparent text-slate-900"
        : isDarkMode
        ? "border border-slate-700 bg-slate-900/85 text-slate-100"
        : "border border-white/65 bg-white/90 text-slate-900"
  const mobileLinkCardClass = isDarkMode
    ? cardSurfaceClass
    : "border border-slate-200/90 bg-white/96 text-slate-900 backdrop-blur-sm"
  const primaryTextColor = getReadableTextColor(primaryColor)
  const footerVisible = user.themeFooterVisible !== false

  const backgroundStyle = useMemo(() => {
    const base: Record<string, string | number> = { backgroundColor }
    if (backgroundPattern === "gradient") {
      base.backgroundImage = "linear-gradient(140deg, rgba(59,130,246,0.18), rgba(16,185,129,0.18), rgba(14,165,233,0.12))"
    } else if (backgroundPattern === "mesh") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.25), transparent 50%), radial-gradient(circle at 40% 80%, rgba(14,165,233,0.2), transparent 60%)"
    } else if (backgroundPattern === "confetti") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(236,72,153,0.35) 0 10%, transparent 11%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.35) 0 8%, transparent 9%), radial-gradient(circle at 30% 80%, rgba(16,185,129,0.35) 0 9%, transparent 10%), radial-gradient(circle at 70% 70%, rgba(245,158,11,0.35) 0 8%, transparent 9%)"
    } else if (backgroundPattern === "grid") {
      base.backgroundImage = "linear-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.12) 1px, transparent 1px)"
      base.backgroundSize = "22px 22px"
    } else if (backgroundPattern === "waves") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 10%, rgba(14,165,233,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(99,102,241,0.25), transparent 60%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.22), transparent 55%)"
    } else if (backgroundPattern === "aurora") {
      base.backgroundImage =
        "linear-gradient(120deg, rgba(14,165,233,0.32), rgba(16,185,129,0.24), rgba(59,130,246,0.2)), radial-gradient(circle at 15% 20%, rgba(236,72,153,0.2), transparent 55%)"
    } else if (backgroundPattern === "sunset") {
      base.backgroundImage =
        "linear-gradient(140deg, rgba(251,191,36,0.32), rgba(248,113,113,0.3), rgba(244,63,94,0.22))"
    } else if (backgroundPattern === "neon") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(34,211,238,0.38), transparent 55%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.38), transparent 55%), radial-gradient(circle at 50% 80%, rgba(59,130,246,0.32), transparent 60%)"
    } else if (backgroundPattern === "paper") {
      base.backgroundImage = "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)"
      base.backgroundSize = "18px 18px"
    } else if (backgroundPattern === "dots") {
      base.backgroundImage = "radial-gradient(rgba(15,23,42,0.18) 1px, transparent 1px)"
      base.backgroundSize = "16px 16px"
    } else if (backgroundPattern === "stripes") {
      base.backgroundImage = "repeating-linear-gradient(45deg, rgba(15,23,42,0.12) 0 10px, transparent 10px 20px)"
    } else if (backgroundPattern === "topo") {
      base.backgroundImage = "repeating-radial-gradient(circle at 30% 30%, rgba(15,23,42,0.12) 0 2px, transparent 3px 10px)"
    } else if (backgroundPattern === "noise") {
      base.backgroundImage =
        "repeating-linear-gradient(0deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 2px), repeating-linear-gradient(90deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 2px)"
      base.backgroundSize = "12px 12px"
    } else if (backgroundPattern === "zigzag") {
      base.backgroundImage = "repeating-linear-gradient(135deg, rgba(15,23,42,0.14) 0 6px, transparent 6px 12px)"
    } else if (backgroundPattern === "halftone") {
      base.backgroundImage = "radial-gradient(rgba(15,23,42,0.22) 1px, transparent 2px)"
      base.backgroundSize = "14px 14px"
    } else if (backgroundPattern === "ripple") {
      base.backgroundImage = "repeating-radial-gradient(circle at 50% 50%, rgba(15,23,42,0.12) 0 2px, transparent 3px 14px)"
    } else if (backgroundPattern === "petals") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 20%, rgba(236,72,153,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(14,165,233,0.25), transparent 55%), radial-gradient(circle at 40% 80%, rgba(16,185,129,0.25), transparent 60%)"
    } else if (backgroundPattern === "diagonal") {
      base.backgroundImage = "repeating-linear-gradient(135deg, rgba(15,23,42,0.1) 0 8px, transparent 8px 16px)"
    } else if (backgroundPattern === "stars") {
      base.backgroundImage = "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 2px)"
      base.backgroundSize = "18px 18px"
    } else if (backgroundPattern === "gradient-radial") {
      base.backgroundImage =
        "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.3), transparent 60%)"
    } else if (backgroundPattern === "glow") {
      base.backgroundImage =
        "radial-gradient(circle at 50% 20%, rgba(99,102,241,0.35), transparent 60%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.25), transparent 55%)"
    } else if (backgroundPattern === "checkers") {
      base.backgroundImage =
        "linear-gradient(45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(15,23,42,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(15,23,42,0.08) 75%)"
      base.backgroundSize = "20px 20px"
    } else if (backgroundPattern === "chevron") {
      base.backgroundImage = "repeating-linear-gradient(135deg, rgba(15,23,42,0.12) 0 6px, transparent 6px 12px), repeating-linear-gradient(45deg, rgba(15,23,42,0.08) 0 6px, transparent 6px 12px)"
    } else if (backgroundPattern === "blobs") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 30%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 70% 20%, rgba(236,72,153,0.25), transparent 50%), radial-gradient(circle at 60% 80%, rgba(16,185,129,0.22), transparent 55%)"
    } else if (backgroundPattern === "prism") {
      base.backgroundImage =
        "linear-gradient(120deg, rgba(14,165,233,0.3), rgba(99,102,241,0.25), rgba(236,72,153,0.22)), repeating-linear-gradient(45deg, rgba(15,23,42,0.08) 0 8px, transparent 8px 16px)"
    } else if (backgroundPattern === "lava") {
      base.backgroundImage =
        "radial-gradient(circle at 20% 70%, rgba(249,115,22,0.4), transparent 55%), radial-gradient(circle at 70% 20%, rgba(244,63,94,0.35), transparent 50%), radial-gradient(circle at 80% 80%, rgba(234,179,8,0.3), transparent 55%)"
    } else if (backgroundPattern === "hologram") {
      base.backgroundImage =
        "linear-gradient(135deg, rgba(14,165,233,0.28), rgba(168,85,247,0.26), rgba(34,211,238,0.22)), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 6px)"
    } else if (backgroundPattern === "blocks") {
      base.backgroundImage =
        "linear-gradient(0deg, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(15,23,42,0.12) 12px, transparent 12px), linear-gradient(90deg, rgba(15,23,42,0.12) 12px, transparent 12px)"
      base.backgroundSize = "96px 96px"
    } else if (backgroundPattern === "glyphs") {
      base.backgroundImage =
        "radial-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.12) 2px, transparent 2px)"
      base.backgroundSize = "48px 48px"
    } else if (backgroundPattern === "pixel") {
      base.backgroundImage =
        "linear-gradient(0deg, rgba(15,23,42,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.1) 1px, transparent 1px)"
      base.backgroundSize = "28px 28px"
    } else if (backgroundPattern === "tartan") {
      base.backgroundImage =
        "linear-gradient(0deg, rgba(15,23,42,0.18) 2px, transparent 2px), linear-gradient(90deg, rgba(15,23,42,0.18) 2px, transparent 2px), linear-gradient(0deg, rgba(15,23,42,0.08) 10px, transparent 10px), linear-gradient(90deg, rgba(15,23,42,0.08) 10px, transparent 10px)"
      base.backgroundSize = "80px 80px"
    } else if (backgroundPattern === "arches") {
      base.backgroundImage =
        "radial-gradient(circle at 50% 0%, rgba(15,23,42,0.12) 0 18px, transparent 19px), radial-gradient(circle at 0% 50%, rgba(15,23,42,0.08) 0 18px, transparent 19px)"
      base.backgroundSize = "96px 96px"
    } else if (backgroundPattern === "swoosh") {
      base.backgroundImage =
        "radial-gradient(circle at 10% 20%, rgba(14,165,233,0.32), transparent 60%), radial-gradient(circle at 90% 10%, rgba(168,85,247,0.28), transparent 55%), linear-gradient(135deg, rgba(251,191,36,0.2), transparent 70%)"
    } else if (backgroundPattern === "orbit") {
      base.backgroundImage =
        "radial-gradient(circle at 50% 50%, rgba(15,23,42,0.18) 0 2px, transparent 3px), radial-gradient(circle at 30% 30%, rgba(59,130,246,0.28), transparent 55%), radial-gradient(circle at 70% 60%, rgba(16,185,129,0.24), transparent 60%)"
    } else if (backgroundPattern === "ribbon") {
      base.backgroundImage =
        "linear-gradient(160deg, rgba(59,130,246,0.3), transparent 60%), linear-gradient(20deg, rgba(236,72,153,0.28), transparent 65%)"
    } else if (backgroundPattern === "bubble") {
      base.backgroundImage =
        "radial-gradient(circle at 15% 20%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 60% 80%, rgba(16,185,129,0.2), transparent 60%)"
    } else if (backgroundPattern === "petal-arc") {
      base.backgroundImage =
        "radial-gradient(circle at 50% 10%, rgba(236,72,153,0.22), transparent 60%), radial-gradient(circle at 0% 70%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(circle at 100% 70%, rgba(59,130,246,0.2), transparent 60%)"
    }
    return base
  }, [backgroundColor, backgroundPattern])
  const deferredQuery = useDeferredValue(query)

  const normalizedProducts = useMemo(
    () => products.map((product) => ({ ...product, category: normalizeCategory(product.category) })),
    [products],
  )
  const latestProducts = useMemo(() => {
    if (Array.isArray(recentProducts) && recentProducts.length > 0) {
      return recentProducts.map((product) => ({ ...product, category: normalizeCategory(product.category) }))
    }
    return [...normalizedProducts].sort((a, b) => b.createdAt - a.createdAt)
  }, [normalizedProducts, recentProducts])

  const socialItems = useMemo(() => buildSocialItems(user), [user])
  const featuredProducts = useMemo(() => latestProducts.slice(0, 6), [latestProducts])
  const mobileFilteredProducts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    if (!normalizedQuery) return latestProducts
    return latestProducts.filter((product) => {
      const category = normalizeCategory(product.category)
      return product.title.toLowerCase().includes(normalizedQuery) || category.toLowerCase().includes(normalizedQuery)
    })
  }, [deferredQuery, latestProducts])

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
    const normalizedQuery = deferredQuery.trim().toLowerCase()
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
  }, [deferredQuery, normalizedProducts, selectedCategories, sortBy])

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
  const normalizedUsername = (user.username || "").trim().replace(/^@+/, "")
  const storeUsernameLabel = normalizedUsername ? `@${normalizedUsername}` : displayName
  const leadCaptureChannel = user.leadCaptureChannel === "whatsapp" ? "whatsapp" : "email"
  const leadPopupStorageKey = `linkstore_lead_popup_seen:${(normalizedUsername || user._id).toLowerCase()}`
  const usesFallbackLogo = !hasCustomStoreLogo(user)
  const mobileSocialIcons = socialItems.filter((item) => item.key === "instagram" || item.key === "youtube").slice(0, 2)
  const hasCreatorLinks = socialItems.length > 0
  const desktopMediaMenuItems = useMemo(() => {
    if (socialItems.length === 0) return []

    const startAngle = 182
    const endAngle = 266
    const radius = socialItems.length > 4 ? 108 : 92

    return socialItems.map((item, index) => {
      const angle = socialItems.length === 1 ? 225 : startAngle + ((endAngle - startAngle) * index) / (socialItems.length - 1)
      const radians = (angle * Math.PI) / 180

      return {
        ...item,
        offsetX: Number((Math.cos(radians) * radius).toFixed(2)),
        offsetY: Number((Math.sin(radians) * radius).toFixed(2)),
      }
    })
  }, [socialItems])
  const showcaseProducts = useMemo(() => {
    if (Array.isArray(mostBoughtProducts) && mostBoughtProducts.length > 0) {
      return mostBoughtProducts.slice(0, 6).map((product) => ({
        id: product._id,
        image: getProductImage(product),
        title: product.title,
        href: buildTrackHref(product._id),
        trackId: product._id,
      }))
    }

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
    setMedium((params.get("utm_medium") || "").toLowerCase())
    setCampaign(params.get("utm_campaign") || "")
    setContent(params.get("utm_content") || "")
    setTerm(params.get("utm_term") || "")
    setCollectionSlug((params.get("collection") || "").toLowerCase())
    setSessionId(createSessionId())
    setCurrentPath(window.location.pathname)
    setShareUrl(window.location.href)
  }, [])

  useEffect(() => {
    if (!hasCreatorLinks && desktopMediaMenuOpen) {
      setDesktopMediaMenuOpen(false)
    }
  }, [desktopMediaMenuOpen, hasCreatorLinks])

  useEffect(() => {
    if (!desktopMediaMenuOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!desktopMediaMenuRef.current?.contains(event.target as Node)) {
        setDesktopMediaMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopMediaMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [desktopMediaMenuOpen])

  function trackEvent(eventType: "store_view" | "product_card_click", productId?: string) {
    if (disableTracking) return
    const payload = {
      eventType,
      productId,
      storeUsername: user.username || "store",
      source,
      medium,
      campaign,
      content,
      term,
      referrer: document.referrer || "",
      device: getDeviceType(),
      path: window.location.pathname,
      sessionId,
      collectionSlug,
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
    if (disableTracking) return
    if (trackStoreViewOnce.current) return
    if (!sessionId || !user._id) return
    trackStoreViewOnce.current = true
    trackEvent("store_view")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user._id, source])

  useEffect(() => {
    if (!sessionId || !user._id) return
    if (sessionStorage.getItem(leadPopupStorageKey)) return

    const timer = window.setTimeout(() => {
      setIsLeadPopupOpen(true)
    }, 30_000)

    return () => window.clearTimeout(timer)
  }, [leadPopupStorageKey, sessionId, user._id])

  function buildTrackHref(productId: string) {
    const params = new URLSearchParams()
    if (source) params.set("source", source)
    if (medium) params.set("utm_medium", medium)
    if (campaign) params.set("utm_campaign", campaign)
    if (content) params.set("utm_content", content)
    if (term) params.set("utm_term", term)
    if (sessionId) params.set("sessionId", sessionId)
    if (currentPath) params.set("path", currentPath)
    if (collectionSlug) params.set("collection", collectionSlug)
    return `/api/track/${productId}?${params.toString()}`
  }

  async function submitLeadCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLeadSubmitting) return

    setLeadCaptureMessage("")
    setLeadCaptureError("")

    if (!leadConsent) {
      setLeadCaptureError("Please confirm that we can contact you.")
      return
    }

    if (leadCaptureChannel === "email" && !leadEmail.trim()) {
      setLeadCaptureError("Add your email to continue.")
      return
    }

    if (leadCaptureChannel === "whatsapp" && !leadWhatsapp.trim()) {
      setLeadCaptureError("Add your WhatsApp number to continue.")
      return
    }

    setIsLeadSubmitting(true)

    try {
      const response = await fetch("/api/audience-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeUsername: user.username || "store",
          email: leadCaptureChannel === "email" ? leadEmail : "",
          whatsapp: leadCaptureChannel === "whatsapp" ? leadWhatsapp : "",
          consent: leadConsent,
          source,
          medium,
          campaign,
          content,
          term,
          collectionSlug,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setLeadCaptureError(payload.message || "Unable to save your contact right now.")
        return
      }

      setLeadEmail("")
      setLeadWhatsapp("")
      setLeadConsent(false)
      setLeadCaptureMessage("You’re in. Expect fresh drops, deal alerts, and restock updates here.")
      sessionStorage.setItem(leadPopupStorageKey, "1")
      window.setTimeout(() => setIsLeadPopupOpen(false), 800)
    } catch {
      setLeadCaptureError("Unable to save your contact right now.")
    } finally {
      setIsLeadSubmitting(false)
    }
  }

  function handleLeadPopupChange(nextOpen: boolean) {
    setIsLeadPopupOpen(nextOpen)
    if (!nextOpen) {
      sessionStorage.setItem(leadPopupStorageKey, "1")
    }
  }

  function renderLeadCaptureForm() {
    return (
      <>
        {collectionSlug ? (
          <p className="text-[11px] font-medium text-[#64748b]">From: {collectionSlug}</p>
        ) : null}
        <form onSubmit={submitLeadCapture} className="mt-4 grid gap-3">
          {leadCaptureChannel === "email" ? (
            <Input
              type="email"
              value={leadEmail}
              onChange={(event) => setLeadEmail(event.target.value)}
              placeholder="Email address"
              aria-label="Email address"
              className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
            />
          ) : (
            <Input
              type="tel"
              value={leadWhatsapp}
              onChange={(event) => setLeadWhatsapp(event.target.value)}
              placeholder="WhatsApp number"
              aria-label="WhatsApp number"
              className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
            />
          )}
          <Button
            type="submit"
            disabled={isLeadSubmitting}
            className={cn("h-10 w-full px-4", buttonRadiusClass)}
            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
          >
            {isLeadSubmitting ? "Joining..." : "Join now"}
          </Button>
          <label className="flex items-start gap-2 text-xs leading-5">
            <input
              type="checkbox"
              checked={leadConsent}
              onChange={(event) => setLeadConsent(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span className={isDarkMode ? "text-slate-300" : "text-slate-600"}>
              I’d like to join this creator’s updates list and hear about new recommendations, deals, and restocks.
            </span>
          </label>
          {leadCaptureError ? <p className="text-xs font-medium text-rose-600">{leadCaptureError}</p> : null}
          {leadCaptureMessage ? <p className="text-xs font-medium text-emerald-600">{leadCaptureMessage}</p> : null}
        </form>
      </>
    )
  }

  function toggleCategory(category: string) {
    startTransition(() => {
      setSelectedCategories((prev) =>
        prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
      )
    })
  }

  function clearFilters() {
    startTransition(() => {
      setSelectedCategories([])
      setQuery("")
      setSortBy("performance")
    })
  }

  function renderShowcaseCard() {
    const cardTone = !hasCreatorLinks ? "bg-black text-white" : mobileLinkCardClass

    const captionClass = !hasCreatorLinks ? "text-white/70" : isDarkMode ? "text-slate-400" : "text-slate-500"

    return (
      <div className={cn("overflow-hidden rounded-2xl p-3 shadow-none", cardTone)}>
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
        <button
          type="button"
          onClick={() => setActiveTab("shop")}
          className={cn(
            "mt-3 w-full rounded-2xl border px-4 py-3 text-left shadow-none",
            isDarkMode ? "border-slate-700 bg-slate-900/85 text-slate-100" : "border-white/70 bg-white text-slate-900",
          )}
        >
          <p className="text-[18px] font-extrabold">See Full Shop</p>
          <p className={cn("mt-0.5 text-xs", captionClass)}>{latestProducts.length} products</p>
        </button>
      </div>
    )
  }

  function renderStoreFooter() {
    if (!footerVisible) return null

    return (
      <footer className={cn("mt-8 flex items-center justify-center pb-6 text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>
        <span className="mr-1">Powered by</span>
        <a href="/" className="font-semibold" style={{ color: accentColor }}>
          Linkstore
        </a>
      </footer>
    )
  }

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden",
          previewMode === "mobile" ? "block" : "lg:hidden",
          isDarkMode ? "text-slate-100" : "text-slate-900",
        )}
        style={backgroundStyle}
      >
        <div className="absolute left-3 top-3 z-20">
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className={cn(
              "app-surface grid h-9 w-9 place-items-center rounded-full border shadow-none",
              isDarkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-white/70 bg-white text-slate-700",
            )}
            aria-label="Join Linkstore"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className={cn(
              "app-surface grid h-9 w-9 place-items-center rounded-full border shadow-none",
              isDarkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-white/70 bg-white text-slate-700",
            )}
            aria-label="Share store"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <main className="relative z-10 mx-auto w-full max-w-md px-2 pb-6 pt-7">
          <section className="app-reveal pt-2 text-center">
            <div
              className={cn(
                "mx-auto h-20 w-20 overflow-hidden rounded-full border shadow-none",
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

            <h1
              className={cn("mt-2 text-[28px] font-extrabold tracking-tight")}
              style={{ color: nameColor, fontFamily: nameFontFamily }}
            >
              {displayName}
            </h1>
            <p className={cn("mx-auto mt-1 max-w-sm text-[12px] leading-[1.4]")} style={{ color: bioColor, fontFamily: bioFontFamily }}>
              {bannerText}
            </p>

            <div className="mt-3 flex items-center justify-center gap-3">
              {mobileSocialIcons.map((item) => {
                const Icon = item.icon
                const iconColor = SOCIAL_COLORS[item.key] || "#6366f1"
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "app-surface grid h-8 w-8 place-items-center rounded-full border",
                      isDarkMode ? "border-slate-600 bg-slate-900 text-slate-100" : "border-white/65 bg-white text-slate-700",
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-4 w-4" style={{ color: iconColor }} />
                  </a>
                )
              })}
            </div>

          </section>

          <div
            className={cn(
              "mx-auto mt-4 flex w-full rounded-full border p-1 text-[13px] font-semibold shadow-none",
              isDarkMode ? "bg-slate-800 text-slate-200" : "bg-white text-slate-700",
            )}
          >
            <button
              type="button"
              onClick={() => startTransition(() => setActiveTab("links"))}
              className={cn(
                "flex-1 py-1.5 transition",
                buttonRadiusClass,
                activeTab === "links"
                  ? "shadow-none"
                  : isDarkMode
                    ? "text-slate-300"
                    : "text-slate-600",
              )}
              style={activeTab === "links" ? { backgroundColor: primaryColor, color: primaryTextColor } : undefined}
            >
              Links
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => setActiveTab("shop"))}
              className={cn(
                "flex-1 py-1.5 transition",
                buttonRadiusClass,
                activeTab === "shop"
                  ? "shadow-none"
                  : isDarkMode
                    ? "text-slate-300"
                    : "text-slate-600",
              )}
              style={activeTab === "shop" ? { backgroundColor: primaryColor, color: primaryTextColor } : undefined}
            >
              Shop
            </button>
          </div>

          {activeTab === "links" ? (
            <section className="mt-4 space-y-3" aria-busy={query !== deferredQuery}>
              {/* {hasCreatorLinks ? (
                <div
                  className={cn(
                    "app-reveal rounded-2xl border px-3 py-3 text-left shadow-none",
                    isDarkMode ? "border-slate-700 bg-slate-900/85 text-slate-100" : "border-white/65 bg-white/90 text-slate-900",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Verified creator links</p>
                  <p className={cn("mt-1 text-xs leading-5", isDarkMode ? "text-slate-300" : "text-slate-600")}>
                    Use these direct creator channels if you want to confirm identity or see how products are used before opening retailer links.
                  </p>
                </div>
              ) : null} */}
              {socialItems.map((item, index) => {
                const Icon = item.icon
                const iconColor = SOCIAL_COLORS[item.key] || "#6366f1"
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "app-reveal app-surface flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-none",
                      mobileLinkCardClass,
                    )}
                    style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
                  >
                    <div className={cn("grid h-10 w-10 place-items-center rounded-lg", isDarkMode ? "bg-slate-800" : "bg-slate-100")}>
                      <Icon className="h-5 w-5" style={{ color: iconColor }} />
                    </div>
                    <p className="flex-1 text-[14px] font-semibold tracking-tight">{item.label}</p>
                    <MoreVertical className={cn("h-4 w-4", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                  </a>
                )
              })}
              {socialItems.length === 0 && (
                <div className={cn("rounded-2xl border px-4 py-4 text-center text-xs", mobileLinkCardClass)}>
                  No social or custom links yet.
                </div>
              )}
              {renderShowcaseCard()}
            </section>
          ) : (
            <section className="mt-4" aria-busy={query !== deferredQuery}>
              <div className={cn("app-reveal flex items-center gap-2.5 rounded-full border px-3 py-2 shadow-none", mobileLinkCardClass)}>
                <Search className={cn("h-4 w-4", isDarkMode ? "text-slate-400" : "text-slate-500")} />
                <input
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    startTransition(() => setQuery(nextValue))
                  }}
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
                  {mobileFilteredProducts.map((product, index) => (
                    <a
                      key={product._id}
                      href={buildTrackHref(product._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent("product_card_click", product._id)}
                      aria-label={`Open ${product.title} in a new tab`}
                      className={cn(
                        "app-reveal app-surface content-auto overflow-hidden rounded-xl border shadow-none",
                        isDarkMode ? "border-slate-700 bg-slate-900" : "border-white/65 bg-white",
                      )}
                      style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
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
        {renderStoreFooter()}
        <div className="fixed bottom-3 left-0 right-0 z-20 mx-auto w-[calc(100%-1.2rem)] max-w-md">
          <div
            className={cn(
              "app-surface flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 shadow-none",
              isDarkMode ? "border-slate-700 bg-slate-900/95 text-slate-100" : "border-white/70 bg-white/95 text-slate-900",
            )}
          >
            <div>
              <p className="text-sm font-semibold">Join creators on Linkstore today</p>
            </div>
            <a
              href="/"
              className={cn("px-3 py-1.5 text-xs font-semibold", buttonRadiusClass)}
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
            >
              Join
            </a>
          </div>
        </div>
      </div>

      <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join Linkstore</DialogTitle>
            <DialogDescription>Start your creator storefront in minutes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <a
              href="/"
              className={cn("inline-flex w-full items-center justify-center px-4 py-2 text-sm font-semibold", buttonRadiusClass)}
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
            >
              Join Linkstore
            </a>
            <p className="text-xs text-slate-500">Create, customize, and share your store in minutes.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share your store</DialogTitle>
            <DialogDescription>Copy and share your Linkstore URL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {shareUrl}
            </div>
            <Button
              type="button"
              onClick={async () => {
                if (!shareUrl) return
                if (navigator.share) {
                  try {
                    await navigator.share({ title: displayName, url: shareUrl })
                    return
                  } catch { }
                }
                try {
                  await navigator.clipboard.writeText(shareUrl)
                } catch { }
              }}
              className={buttonRadiusClass}
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
            >
              Copy link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden pb-8",
          previewMode === "mobile" ? "hidden" : "hidden lg:block",
          isDarkMode ? "text-slate-100" : "text-slate-900",
        )}
        style={backgroundStyle}
      >
        <header className={cn("sticky top-0 z-40", isDarkMode ? "border-b border-slate-700/80 bg-slate-900" : "border-b border-slate-200 bg-white")}>
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
                  <p
                    className={cn("truncate text-sm font-bold leading-tight sm:text-lg md:text-xl")}
                    style={{ color: nameColor, fontFamily: nameFontFamily }}
                  >
                    {storeTitle}
                  </p>
                  <p
                    className={cn("mt-0.5 hidden text-[11px] leading-5 md:block")}
                    style={{ color: bioColor, fontFamily: bioFontFamily }}
                  >
                    {storeUsernameLabel}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={query}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      startTransition(() => setQuery(nextValue))
                    }}
                    placeholder="Search products"
                    aria-label="Search products"
                    className={cn(
                      "h-8 w-32 pl-7 text-[11px] shadow-none focus-visible:ring-2 sm:h-9 sm:w-56 sm:pl-8 sm:text-xs md:w-72 md:text-sm",
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

        <main className="w-full space-y-3 px-2 pt-2 sm:space-y-4 sm:px-3 sm:pt-3 md:px-4 lg:px-5" aria-busy={query !== deferredQuery}>
          <section id="catalog">
            <div className="mb-3 flex items-center justify-between">
              <h2 className={cn("text-base font-bold tracking-tight sm:text-lg md:text-xl", isDarkMode ? "text-slate-100" : "text-slate-800")}>All Products</h2>
            </div>

            {groupedProducts.length > 0 ? (
              groupedProducts.map((section) => (
                <div key={section.category} className="content-auto mb-4 last:mb-0">
                  <div className="mb-2">
                    <h3 className={cn("text-[11px] font-semibold uppercase tracking-wide sm:text-xs", isDarkMode ? "text-slate-300" : "text-slate-500")}>{section.category}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {section.products.map((product, productIndex) => (
                      <a
                        key={product._id}
                        href={buildTrackHref(product._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("product_card_click", product._id)}
                        aria-label={`Open ${product.title} in a new tab`}
                        className={cn(
                          "app-reveal app-surface content-auto group relative overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2",
                          isDarkMode ? "border-slate-700 bg-slate-900/80 focus-visible:ring-slate-500" : "border-white/65 bg-white/80 focus-visible:ring-white",
                        )}
                        style={{ animationDelay: `${Math.min(productIndex, 9) * 30}ms` }}
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
        {renderStoreFooter()}

        {hasCreatorLinks ? (
          <div className="pointer-events-none fixed bottom-6 right-6 z-50 hidden lg:block">
            <div ref={desktopMediaMenuRef} className="pointer-events-auto relative h-16 w-16">
              {desktopMediaMenuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDesktopMediaMenuOpen(false)}
                    aria-label={`Open ${item.label}`}
                    className="absolute bottom-2 right-2 flex items-center gap-2 transition-all duration-300 ease-out"
                    style={{
                      transform: desktopMediaMenuOpen
                        ? `translate(${item.offsetX}px, ${item.offsetY}px) scale(1)`
                        : "translate(0px, 0px) scale(0.55)",
                      opacity: desktopMediaMenuOpen ? 1 : 0,
                      pointerEvents: desktopMediaMenuOpen ? "auto" : "none",
                      transitionDelay: desktopMediaMenuOpen ? `${index * 35}ms` : "0ms",
                    }}
                  >
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide shadow-sm transition-opacity duration-200",
                        isDarkMode
                          ? "border-slate-700 bg-slate-950/95 text-slate-100"
                          : "border-slate-200 bg-white/95 text-slate-700",
                        desktopMediaMenuOpen ? "opacity-100" : "opacity-0",
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-full border shadow-[0_14px_30px_rgba(15,23,42,0.24)] ring-4",
                        isDarkMode
                          ? "border-slate-700 bg-slate-900 text-slate-100 ring-slate-950/70"
                          : "border-white/80 bg-white text-slate-700 ring-white/75",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                  </a>
                )
              })}

              <button
                type="button"
                onClick={() => setDesktopMediaMenuOpen((open) => !open)}
                aria-label={desktopMediaMenuOpen ? "Close media links" : "Open media links"}
                aria-expanded={desktopMediaMenuOpen}
                className={cn(
                  "absolute bottom-0 right-0 grid h-16 w-16 place-items-center rounded-full border text-white shadow-[0_18px_44px_rgba(15,23,42,0.3)] transition-transform duration-300 hover:scale-[1.03]",
                  desktopMediaMenuOpen ? "scale-[0.98]" : "scale-100",
                )}
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              >
                <span className="sr-only">Media links</span>
                {desktopMediaMenuOpen ? <X className="h-6 w-6" /> : <Globe className="h-6 w-6" />}
              </button>
            </div>
          </div>
        ) : null}

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="left" className={cn("max-w-sm p-0", isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
            <SheetHeader className={cn("border-b", isDarkMode ? "border-slate-700" : "border-slate-200")}>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Sort and filter products by category.</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-4">
              <div>
                <p className={cn("mb-2 text-xs font-medium uppercase tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-500")}>Sort</p>
                <Select
                  value={sortBy}
                  onValueChange={(value: "performance" | "latest" | "name") => {
                    startTransition(() => setSortBy(value))
                  }}
                >
                  <SelectTrigger className={cn("w-full", isDarkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-300 bg-white")}>
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
                              : "border-slate-300 bg-white hover:bg-slate-50",
                        )}
                        style={active ? { backgroundColor: primaryColor } : undefined}
                      >
                        <span>{category.name}</span>
                        <span className={cn("text-xs", active ? "text-white/80" : isDarkMode ? "text-slate-400" : "text-slate-500")}>{category.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button variant="outline" className={cn("w-full", isDarkMode ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-300 bg-white")} onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={isLeadPopupOpen} onOpenChange={handleLeadPopupChange}>
          <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-w-md sm:p-7">
            <DialogHeader className="pr-10 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Join the inner circle</p>
              <DialogTitle className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                Get first access to new drops, coupon alerts, and restocks
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-600">
                Leave your {leadCaptureChannel === "whatsapp" ? "WhatsApp number" : "email"} to stay in the loop whenever {displayName} shares a fresh recommendation, deal, or restock.
              </DialogDescription>
            </DialogHeader>
            {renderLeadCaptureForm()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
