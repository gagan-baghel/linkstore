import { ImageResponse } from "next/og"

import { assertSafePublicHttpUrlForServerFetch } from "@/lib/affiliate-url-server"
import { getCachedStoreData } from "@/lib/store-cache"

export const alt = "Creator storefront on Linkstore"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const MAX_IMAGE_BYTES = 1_500_000

// Every multi-child <div> needs display:flex, and text must be one node (use template strings).
// Satori only decodes PNG/JPEG, and one bad remote image would fail the whole
// card, so creator images are prefetched (SSRF-guarded) and inlined or dropped.
async function toDataUrl(url?: string) {
  if (!url || !/^https?:\/\//i.test(url)) return null
  try {
    await assertSafePublicHttpUrlForServerFetch(url)
    const response = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "error" })
    const type = response.headers.get("content-type")?.split(";")[0] || ""
    if (!response.ok || !["image/png", "image/jpeg"].includes(type)) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null
    return `data:${type};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export default async function StoreOpengraphImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const store = await getCachedStoreData(username).catch(() => null)
  const user = store?.user
  const products: any[] = store?.products || []
  const name = (user?.storeBannerText || user?.name || username).trim()
  const accent = user?.themeAccentColor || "#6367FF"

  const [avatar, ...productImages] = await Promise.all([
    toDataUrl(user?.storeLogo),
    ...products.slice(0, 6).map((product) => toDataUrl(product.images?.[0])),
  ])
  const tiles = productImages.filter(Boolean).slice(0, 3) as string[]

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f8fafc", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, flex: 1, gap: 22 }}>
          <div
            style={{
              display: "flex",
              width: 128,
              height: 128,
              borderRadius: 64,
              overflow: "hidden",
              background: accent,
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 60,
              fontWeight: 800,
            }}
          >
            {avatar ? <img src={avatar} width={128} height={128} style={{ objectFit: "cover" }} alt="" /> : name.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#0f172a", lineHeight: 1.05, maxWidth: 560 }}>{name}</div>
          <div style={{ fontSize: 30, color: "#475569" }}>{`@${user?.username || username}`}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
            <div style={{ display: "flex", background: accent, color: "white", fontSize: 26, fontWeight: 700, padding: "12px 26px", borderRadius: 999 }}>
              {products.length > 0 ? `Shop ${products.length} pick${products.length === 1 ? "" : "s"}` : "Shop my picks"}
            </div>
            <div style={{ fontSize: 22, color: "#94a3b8" }}>on linkstore</div>
          </div>
        </div>
        {tiles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "48px 56px 48px 0", width: 460 }}>
            <img src={tiles[0]} width={404} height={tiles.length > 1 ? 330 : 534} style={{ objectFit: "cover", borderRadius: 28 }} alt="" />
            {tiles.length > 1 ? (
              <div style={{ display: "flex", gap: 16 }}>
                {tiles.slice(1).map((tile, index) => (
                  <img key={index} src={tile} width={tiles.length > 2 ? 194 : 404} height={188} style={{ objectFit: "cover", borderRadius: 24 }} alt="" />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    ),
    size,
  )
}
