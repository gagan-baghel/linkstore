// Kept free of server-only imports so it can be unit tested directly.

// Matches product:price:* and og:price:* meta tags in either attribute order.
function readMeta(html: string, suffix: string) {
  const name = `(?:product|og):${suffix}`
  const match =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"))
  return match?.[1]?.trim()
}

const CURRENCY_SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" }

function formatPrice(rawAmount: unknown, rawCurrency: unknown) {
  const value = Number(String(rawAmount ?? "").replace(/[^\d.]/g, ""))
  if (!Number.isFinite(value) || value <= 0) return undefined
  const currency = String(rawCurrency ?? "").trim().toUpperCase()
  const formatted = value.toLocaleString(currency === "INR" || !currency ? "en-IN" : "en-US", { maximumFractionDigits: 2 })
  const symbol = CURRENCY_SYMBOLS[currency]
  return symbol ? `${symbol}${formatted}` : currency ? `${currency} ${formatted}` : formatted
}

// A hint for the creator to confirm: prices change, so it is never refreshed automatically.
export function extractPrice(html: string): string | undefined {
  const metaAmount = readMeta(html, "price:amount")
  if (metaAmount) {
    return formatPrice(metaAmount, readMeta(html, "price:currency"))
  }

  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = scriptRe.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]?.trim() || "null")
      const nodes = (Array.isArray(data) ? data : [data]).flatMap((node) => (Array.isArray(node?.["@graph"]) ? node["@graph"] : [node]))
      for (const node of nodes) {
        const offers = Array.isArray(node?.offers) ? node.offers[0] : node?.offers
        const price = formatPrice(offers?.price ?? offers?.lowPrice, offers?.priceCurrency)
        if (price) return price
      }
    } catch { /* skip */ }
  }
  return undefined
}
