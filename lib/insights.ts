// Turns raw analytics into "best performers" and plain-language next steps.
// Pure so the rules can be unit tested; thresholds avoid advice on tiny samples.

export interface ProductPerformance {
  id: string
  name: string
  image?: string
  productNumber?: number
  isPinned?: boolean
  outbound7d: number
  outbound30d: number
}

export interface InsightInput {
  products: ProductPerformance[]
  storeViews30: number
  outboundClicks7: number
  outboundClicks30: number
  sources: Array<{ name: string; value: number }>
  devices: Array<{ name: string; value: number }>
}

export interface Insight {
  id: string
  tone: "good" | "warn" | "tip"
  title: string
  detail: string
  href?: string
}

const MIN_VIEWS_FOR_ADVICE = 20
const MIN_CLICKS_FOR_ADVICE = 10
const GENERIC_SOURCES = new Set(["storefront", "direct", "unknown", "shortlink", ""])

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)
const label = (p: ProductPerformance) => (p.productNumber ? `#${p.productNumber} ${p.name}` : p.name)

export function getTopPerformers(products: ProductPerformance[], limit = 5) {
  return products
    .filter((p) => p.outbound30d > 0)
    .sort((a, b) => b.outbound30d - a.outbound30d || b.outbound7d - a.outbound7d)
    .slice(0, limit)
}

export function buildInsights(input: InsightInput): Insight[] {
  const { products, storeViews30, outboundClicks7, outboundClicks30 } = input
  const insights: Insight[] = []

  if (storeViews30 === 0) {
    return [
      {
        id: "no-traffic",
        tone: "tip",
        title: "No visitors yet",
        detail: "Put your store link in your Instagram/YouTube bio and mention a product number (like #12) in your next post.",
        href: "/dashboard",
      },
    ]
  }

  const [top] = getTopPerformers(products, 1)
  if (top && outboundClicks30 >= MIN_CLICKS_FOR_ADVICE) {
    const share = pct(top.outbound30d, outboundClicks30)
    insights.push({
      id: "top-product",
      tone: "good",
      title: `${label(top)} is your best seller`,
      detail: top.isPinned
        ? `It drives ${share}% of your clicks and it's already pinned. Feature it in your next post too.`
        : `It drives ${share}% of your clicks. Pin it so every visitor sees it first.`,
      href: "/dashboard/products",
    })
  }

  // Rising: this week's share of a product's clicks is well above its monthly pace.
  const rising = products
    .filter((p) => p.outbound7d >= 3 && p.id !== top?.id && p.outbound7d / Math.max(p.outbound30d, 1) >= 0.6)
    .sort((a, b) => b.outbound7d - a.outbound7d)[0]
  if (rising) {
    insights.push({
      id: "rising",
      tone: "good",
      title: `${label(rising)} is trending`,
      detail: `${rising.outbound7d} of its ${rising.outbound30d} clicks came this week. Ride the wave with a story or reel.`,
    })
  }

  // Week pace vs 30-day average (7/30 of the month's clicks is "normal").
  if (outboundClicks30 >= MIN_CLICKS_FOR_ADVICE) {
    const expected = (outboundClicks30 * 7) / 30
    const change = Math.round(((outboundClicks7 - expected) / expected) * 100)
    if (change >= 25) {
      insights.push({ id: "pace-up", tone: "good", title: `Clicks are up ${change}% this week`, detail: "Compared with your 30-day average. Whatever you posted is working, so do more of it." })
    } else if (change <= -25) {
      insights.push({ id: "pace-down", tone: "warn", title: `Clicks are down ${Math.abs(change)}% this week`, detail: "Compared with your 30-day average. A fresh post pointing to a product number usually brings them back." })
    }
  }

  // Untagged visits are labelled "storefront"/"direct"; they say nothing about the channel.
  const topSource = input.sources
    .filter((s) => !GENERIC_SOURCES.has(s.name.toLowerCase()))
    .sort((a, b) => b.value - a.value)[0]
  const sourceTotal = input.sources.reduce((sum, s) => sum + s.value, 0)
  if (topSource && sourceTotal >= MIN_VIEWS_FOR_ADVICE && pct(topSource.value, sourceTotal) >= 40) {
    insights.push({
      id: "top-source",
      tone: "tip",
      title: `${pct(topSource.value, sourceTotal)}% of your traffic comes from ${topSource.name}`,
      detail: "That's your strongest channel. Tag links with ?utm_source=... elsewhere to find your next one.",
    })
  }

  const mobile = input.devices.find((d) => d.name.toLowerCase() === "mobile")?.value ?? 0
  const deviceTotal = input.devices.reduce((sum, d) => sum + d.value, 0)
  if (deviceTotal >= MIN_VIEWS_FOR_ADVICE && pct(mobile, deviceTotal) >= 70) {
    insights.push({
      id: "mobile",
      tone: "tip",
      title: `${pct(mobile, deviceTotal)}% of shoppers are on phones`,
      detail: "Use bright, square product photos. That's what they see first in a 2-column grid.",
    })
  }

  const idle = products.filter((p) => p.outbound30d === 0)
  if (storeViews30 >= MIN_VIEWS_FOR_ADVICE && idle.length > 0 && products.length >= 3) {
    insights.push({
      id: "idle",
      tone: "warn",
      title: `${idle.length} product${idle.length === 1 ? " has" : "s have"} no clicks in 30 days`,
      detail: "Try a better photo or price, or hide them so your winners stand out.",
      href: "/dashboard/products",
    })
  }

  return insights
}
