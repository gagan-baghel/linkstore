import { normalizeAffiliateUrl } from "@/lib/affiliate-url"

export interface ProductMetadata {
  title?: string
  description?: string
  image?: string
}

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────

function decodeEscapedUrl(value: string): string {
  return value
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .trim()
}

function normalizeImageCandidate(candidate?: string): string | undefined {
  if (!candidate) return undefined
  const cleaned = decodeEscapedUrl(candidate.replace(/^["']|["']$/g, "").trim())
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://") || cleaned.startsWith("//")) {
    return cleaned.startsWith("//") ? `https:${cleaned}` : cleaned
  }
  return undefined
}

function absoluteUrl(base: string, maybeRelative?: string): string | undefined {
  if (!maybeRelative) return undefined
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return undefined
  }
}

// ─────────────────────────────────────────────
// Meta-tag extraction (OG / Twitter / standard)
// ─────────────────────────────────────────────

function extractMetaContent(html: string, names: string[]): string | undefined {
  for (const name of names) {
    // property/name before content
    const a = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    )
    const ma = html.match(a)
    if (ma?.[1]) return ma[1].trim()

    // content before property/name
    const b = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["'][^>]*>`,
      "i",
    )
    const mb = html.match(b)
    if (mb?.[1]) return mb[1].trim()
  }
  return undefined
}

function extractTitle(html: string): string | undefined {
  const title = extractMetaContent(html, ["og:title", "twitter:title"])
  if (title) return title
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1]?.trim()
}

// ─────────────────────────────────────────────
// Scoring — pick the best image from candidates
// ─────────────────────────────────────────────

function scoreImageCandidate(url: string): number {
  const u = url.toLowerCase()
  let score = 0

  // CDN boosts
  if (/rukminim\d?\.flixcart\.com\/image/.test(u)) score += 150  // Flipkart CDN
  if (/images\.meesho\.com/.test(u)) score += 150                 // Meesho CDN
  if (/m\.media-amazon\.com\/images/.test(u)) score += 140        // Amazon CDN
  if (/images-amazon\.com/.test(u)) score += 120
  if (/media\.myntra\.com/.test(u)) score += 130                  // Myntra CDN
  if (/images\.nykaa\.com/.test(u)) score += 130                  // Nykaa CDN
  if (/cdn\.shopify\.com/.test(u)) score += 120                   // Shopify CDN
  if (/assets\.ajio\.com/.test(u)) score += 130                   // AJIO CDN

  // Path / extension boosts
  if (/\/image\//.test(u)) score += 30
  if (/\.(jpg|jpeg|png|webp)(\?|$)/.test(u)) score += 20
  if (/\/product[s]?\//.test(u)) score += 25
  if (/\/p\/|\/dp\//.test(u)) score += 10

  // Penalise logos, icons, tiny images
  if (/logo|favicon|icon|sprite|brandmark|placeholder|banner|bg-/i.test(u)) score -= 200
  if (/\.svg(\?|$)/.test(u)) score -= 150
  if (/\.gif(\?|$)/.test(u)) score -= 80

  // Size hints in path (e.g. /412/412/)
  const sizeMatch = u.match(/\/(\d{2,4})\/(\d{2,4})\//)
  if (sizeMatch) {
    const w = Number(sizeMatch[1])
    const h = Number(sizeMatch[2])
    if (w >= 300 || h >= 300) score += 50
    if (w <= 100 || h <= 100) score -= 60
  }

  return score
}

function pickBestImage(baseUrl: string, candidates: (string | undefined)[]): string | undefined {
  let best: { image: string; score: number } | null = null
  for (const raw of candidates) {
    const absolute = absoluteUrl(baseUrl, raw)
    if (!absolute) continue
    const score = scoreImageCandidate(absolute)
    if (!best || score > best.score) {
      best = { image: absolute, score }
    }
  }
  return best?.image
}

// ─────────────────────────────────────────────
// Strategy 1 — Standard HTML scrape (OG tags + inline patterns)
// ─────────────────────────────────────────────

function extractJsonLdImages(html: string): string[] {
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const images: string[] = []
  let m: RegExpExecArray | null
  while ((m = scriptRe.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]?.trim() || "null")
      const nodes = Array.isArray(data) ? data : [data]
      for (const node of nodes) {
        const img = node?.image
        if (typeof img === "string") { const n = normalizeImageCandidate(img); if (n) images.push(n) }
        if (Array.isArray(img)) { for (const i of img) { const n = normalizeImageCandidate(i); if (n) images.push(n) } }
      }
    } catch { /* skip */ }
  }
  return images
}

function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const candidates = new Set<string>()
  const push = (raw?: string) => { const n = normalizeImageCandidate(raw); if (n) candidates.add(n) }

  // JSON key patterns embedded in page scripts
  const jsonKeyPatterns: RegExp[] = [
    /"hiRes"\s*:\s*"([^"]+)"/i,
    /"large"\s*:\s*"([^"]+)"/i,
    /"mainUrl"\s*:\s*"([^"]+)"/i,
    /"imageUrl"\s*:\s*"([^"]+)"/i,
    /"imageUrls"\s*:\s*\[\s*"([^"]+)"/i,
    /"url"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/i,
    /"original"\s*:\s*"([^"]+)"/i,
    /"src"\s*:\s*"([^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"/i,
  ]
  for (const re of jsonKeyPatterns) { push(html.match(re)?.[1]) }

  // Direct CDN URL patterns
  const cdnPatterns: RegExp[] = [
    // Flipkart CDN
    /https?:\/\/rukminim\d?\.flixcart\.com\/image[^"'\s<>()]+/gi,
    // Meesho CDN
    /https?:\/\/images\.meesho\.com\/images\/products\/[^"'\s<>()]+/gi,
    // Amazon CDN
    /https?:\/\/m\.media-amazon\.com\/images\/[^"'\s<>()]+/gi,
    /https?:\/\/images-amazon\.com\/images\/[^"'\s<>()]+/gi,
    // Generic product image URLs
    /https?:\/\/[^"'\s<>()]+\/[^"'\s<>()]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>()]*)?/gi,
  ]
  for (const re of cdnPatterns) {
    const matches = html.match(re) || []
    for (const raw of matches) push(raw)
  }

  // JSON-LD
  for (const img of extractJsonLdImages(html)) push(img)

  // OG / twitter meta tags
  push(extractMetaContent(html, ["og:image", "twitter:image", "twitter:image:src"]))

  return Array.from(candidates)
}

// ─────────────────────────────────────────────
// Strategy 2 — Flipkart: window.__INITIAL_STATE__ parsing
// ─────────────────────────────────────────────

function extractFlipkartImage(html: string): string | undefined {
  // Flipkart stores product data in a script variable:
  // window.__INITIAL_STATE__ = {...}  OR  _SSR_ = {...}
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*<\/script)/i,
    /_SSR_\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*<\/script)/i,
    /__DATA__\s*=\s*(\{[\s\S]*?\})(?:\s*;|\s*<\/script)/i,
  ]

  for (const re of patterns) {
    const m = html.match(re)
    if (!m?.[1]) continue
    try {
      const data = JSON.parse(m[1])
      const candidates = gatherImageUrlsFromObject(data, 5)
      const cdnUrls = candidates.filter((u) => /rukminim\d?\.flixcart\.com\/image/i.test(u))
      if (cdnUrls.length > 0) return cdnUrls[0]
      if (candidates.length > 0) return candidates[0]
    } catch { /* skip */ }
  }

  // Fallback: raw CDN matches (escaped or not)
  const rawCdn = html.match(/https?:\\?\/\\?\/rukminim\d?\.flixcart\.com\\?\/image[^"'\\s<>()\\\\]+/gi)
  if (rawCdn?.[0]) return normalizeImageCandidate(rawCdn[0])

  return undefined
}

// ─────────────────────────────────────────────
// Strategy 3 — __NEXT_DATA__ (Meesho, many Next.js e-commerce sites)
// ─────────────────────────────────────────────

function extractNextDataImage(html: string): string | undefined {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!m?.[1]) return undefined
  try {
    const data = JSON.parse(m[1])
    const candidates = gatherImageUrlsFromObject(data, 8)
    // Prefer Meesho CDN
    const meesho = candidates.filter((u) => /images\.meesho\.com/i.test(u))
    if (meesho.length > 0) return meesho[0]
    if (candidates.length > 0) return candidates[0]
  } catch { /* skip */ }
  return undefined
}

// ─────────────────────────────────────────────
// Deep object traversal to gather image URLs
// ─────────────────────────────────────────────

const IMAGE_KEY_HINTS = new Set([
  "image", "images", "img", "imageUrl", "imageUrls", "imgUrl", "imgUrls",
  "thumbnail", "thumbnailUrl", "photo", "photos", "picture", "pictures",
  "productImage", "productImages", "mainImage", "hiRes", "large", "original",
  "src", "url", "mediaUrl", "coverImage", "avatar",
])

const IMAGE_URL_RE = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i

function gatherImageUrlsFromObject(obj: unknown, maxDepth = 6): string[] {
  const results: string[] = []
  if (maxDepth <= 0 || obj === null || obj === undefined) return results

  if (typeof obj === "string") {
    const n = normalizeImageCandidate(obj)
    if (n && IMAGE_URL_RE.test(n)) results.push(n)
    return results
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...gatherImageUrlsFromObject(item, maxDepth - 1))
      if (results.length > 20) break
    }
    return results
  }

  if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (IMAGE_KEY_HINTS.has(key.toLowerCase())) {
        results.push(...gatherImageUrlsFromObject(value, maxDepth - 1))
      } else {
        results.push(...gatherImageUrlsFromObject(value, maxDepth - 1))
      }
      if (results.length > 30) break
    }
  }

  return results
}

// ─────────────────────────────────────────────
// Strategy 4 — Jina.ai reader (correct: parse Markdown image syntax)
// ─────────────────────────────────────────────

async function fetchViaJina(url: string): Promise<string | undefined> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`
    const res = await fetch(jinaUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "Accept": "text/markdown,text/plain",
        "X-Return-Format": "markdown",
        "User-Agent": "Mozilla/5.0 (compatible; Linkstore/1.0)",
      },
      cache: "no-store",
    })
    if (!res.ok) return undefined
    const md = await res.text()

    // Parse markdown image syntax: ![alt](url)
    const mdImageRe = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/g
    const images: string[] = []
    let m: RegExpExecArray | null
    while ((m = mdImageRe.exec(md)) !== null) {
      const n = normalizeImageCandidate(m[1])
      if (n && !/logo|favicon|icon|banner/i.test(n)) images.push(n)
    }

    if (images.length > 0) {
      // Score and pick best
      return pickBestImage(url, images)
    }
  } catch { /* failed */ }
  return undefined
}

// ─────────────────────────────────────────────
// Strategy 5 — DuckDuckGo image search (free, no auth)
// ─────────────────────────────────────────────

async function fetchViaDuckDuckGoImages(title: string, hostname: string): Promise<string | undefined> {
  if (!title) return undefined
  try {
    const query = encodeURIComponent(`${title} ${hostname}`)
    // DuckDuckGo image search API
    const token = await getDDGToken()
    if (!token) return undefined

    const searchUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${query}&vqd=${token}&f=,,,,,&p=1`
    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Referer": "https://duckduckgo.com/",
        "Accept": "application/json",
      },
    })
    if (!res.ok) return undefined
    const json = await res.json()
    const results: { image?: string; thumbnail?: string }[] = json?.results || []
    for (const r of results.slice(0, 5)) {
      const imgUrl = r.image || r.thumbnail
      if (imgUrl && IMAGE_URL_RE.test(imgUrl)) return imgUrl
    }
  } catch { /* failed */ }
  return undefined
}

async function getDDGToken(): Promise<string | undefined> {
  try {
    const res = await fetch("https://duckduckgo.com/", {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      },
    })
    const html = await res.text()
    const m = html.match(/vqd=["']?([^"'&\s]+)/)
    return m?.[1]
  } catch { return undefined }
}

// ─────────────────────────────────────────────
// Main fetch function — orchestrates all strategies
// ─────────────────────────────────────────────

const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9,hi;q=0.8",
  "accept-encoding": "gzip, deflate, br",
  referer: "https://www.google.com/",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
  "upgrade-insecure-requests": "1",
}

function buildCandidateUrls(url: URL): string[] {
  const candidates: string[] = [url.toString()]

  // Flipkart: strip tracking params, keep only pid/lid
  if (/flipkart\.com$/i.test(url.hostname)) {
    const clean = new URL(url.toString())
    const KEEP = new Set(["pid", "lid"])
    for (const key of Array.from(clean.searchParams.keys())) {
      if (!KEEP.has(key.toLowerCase())) clean.searchParams.delete(key)
    }
    const cleanStr = clean.toString()
    if (!candidates.includes(cleanStr)) candidates.push(cleanStr)
  }

  // Meesho: canonical /p/<slug>
  if (/meesho\.com$/i.test(url.hostname)) {
    const slug = url.pathname.match(/(\/p\/[a-z0-9_-]+)/i)?.[1]
    if (slug) {
      const canonical = `${url.origin}${slug}`
      if (!candidates.includes(canonical)) candidates.push(canonical)
    }
  }

  // Always add query-stripped version
  const noQuery = `${url.origin}${url.pathname}`
  if (!candidates.includes(noQuery)) candidates.push(noQuery)

  return candidates
}

export async function fetchProductMetadata(affiliateUrl: string): Promise<ProductMetadata> {
  const normalizedUrl = normalizeAffiliateUrl(affiliateUrl)
  const parsedUrl = new URL(normalizedUrl)
  const hostname = parsedUrl.hostname.replace(/^www\./i, "")
  const candidateUrls = buildCandidateUrls(parsedUrl)

  let bestTitle: string | undefined
  let bestDescription: string | undefined
  let bestImage: string | undefined
  let lastError: Error | null = null

  // ── Strategy 1 & 2 & 3: Direct HTML fetch for each candidate URL ──
  for (const candidateUrl of candidateUrls) {
    try {
      const res = await fetch(candidateUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
        headers: BROWSER_HEADERS,
        cache: "no-store",
      })

      const html = await res.text()
      const resolvedUrl = res.url || candidateUrl

      // Title / description
      const title = extractTitle(html)
      const description = extractMetaContent(html, ["og:description", "twitter:description", "description"])
      if (title && !bestTitle) bestTitle = title
      if (description && !bestDescription) bestDescription = description

      // Gather image candidates from all HTML extraction methods
      const htmlImages = extractImagesFromHtml(html, resolvedUrl)

      // Site-specific strategies
      let siteSpecificImage: string | undefined

      if (/flipkart\.com$/i.test(parsedUrl.hostname)) {
        siteSpecificImage = extractFlipkartImage(html)
      }

      if (!siteSpecificImage) {
        siteSpecificImage = extractNextDataImage(html)
      }

      const allCandidates = [
        siteSpecificImage,
        ...htmlImages,
      ].filter((c): c is string => Boolean(c))

      const image = pickBestImage(resolvedUrl, allCandidates)
      if (image && !bestImage) bestImage = image

      // If we got everything, return early
      if (bestImage && bestTitle) {
        return { title: bestTitle, description: bestDescription, image: bestImage }
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Fetch failed")
    }
  }

  // ── Strategy 4: Jina.ai reader fallback (parses Markdown images) ──
  if (!bestImage) {
    try {
      const jinaImage = await fetchViaJina(normalizedUrl)
      if (jinaImage) bestImage = jinaImage
    } catch { /* ignore */ }
  }

  // ── Strategy 5: DuckDuckGo image search (last resort) ──
  if (!bestImage && bestTitle) {
    try {
      const ddgImage = await fetchViaDuckDuckGoImages(bestTitle, hostname)
      if (ddgImage) bestImage = ddgImage
    } catch { /* ignore */ }
  }

  // Return whatever we gathered, even partial
  if (bestImage || bestTitle || bestDescription) {
    return { title: bestTitle, description: bestDescription, image: bestImage }
  }

  throw lastError || new Error("Failed to fetch product metadata from the provided URL")
}
