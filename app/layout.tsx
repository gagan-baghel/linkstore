import type { Metadata } from "next"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const metadataBase = (() => {
  const candidate = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  try {
    return new URL(candidate)
  } catch {
    return new URL("http://localhost:3000")
  }
})()

export const metadata: Metadata = {
  title: "AffiliateHub - Create Your Affiliate Storefront",
  description: "Build your own affiliate marketing storefront and start earning commissions",
  metadataBase,
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
  openGraph: {
    images: ["/og-image.png"],
  },
  twitter: {
    images: ["/og-image.png"],
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
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
