import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const alt = "Linkstore — your shoppable link in bio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const CARDS = [
  // No ₹ here: the bundled font lacks the glyph and would trigger a remote font fetch.
  { n: "#12", title: "Glow serum", meta: "Trending", tint: "#FFDBFD" },
  { n: "#8", title: "Linen shirt", meta: "Top pick", tint: "#C9BEFF" },
  { n: "#21", title: "Pour-over set", meta: "New", tint: "#EEF0FF" },
]

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/android-chrome-512x512.png"))
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 72,
          background: "linear-gradient(135deg, #6367FF 0%, #8494FF 60%, #C9BEFF 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={logoSrc} width={64} height={64} style={{ borderRadius: 16, background: "white" }} alt="" />
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4 }}>linkstore</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 620 }}>Your link in bio, now a shop.</div>
            <div style={{ fontSize: 28, opacity: 0.9, maxWidth: 600, lineHeight: 1.35 }}>
              Numbered products followers find instantly, short links, and insights on what sells.
            </div>
          </div>
          <div style={{ fontSize: 22, opacity: 0.85 }}>Built for creators · Instagram · YouTube</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, width: 360 }}>
          {CARDS.map((card, index) => (
            <div
              key={card.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: 18,
                borderRadius: 10,
                background: "white",
                color: "#0f172a",
                boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
                marginLeft: index === 1 ? 0 : 40,
              }}
            >
              <div style={{ display: "flex", width: 76, height: 76, borderRadius: 6, background: card.tint, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "white",
                    background: "rgba(0,0,0,0.7)",
                    padding: "2px 7px",
                    borderRadius: 8,
                  }}
                >
                  {card.n}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{card.title}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#6367FF" }}>{card.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
