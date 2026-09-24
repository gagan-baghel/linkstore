import type { Metadata } from "next"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { getConfiguredAppUrl } from "@/lib/storefront-url"
import "./globals.css"

const title = "Linkstore — Your shoppable link in bio"
const description =
  "Turn your bio link into a storefront: numbered products followers can find instantly, short links, and insights on what actually sells."

export const metadata: Metadata = {
  title,
  description,
  metadataBase: getConfiguredAppUrl(),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  // og:image / twitter:image come from app/opengraph-image.tsx (1200×630).
  openGraph: {
    type: "website",
    siteName: "Linkstore",
    title,
    description,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="clay-gradient-bg font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
