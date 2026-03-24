
import type React from "react"
import { Bebas_Neue, Cutive_Mono, Space_Grotesk } from "next/font/google"

import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
})

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
})

const monoFont = Cutive_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
})

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} font-body relative min-h-screen overflow-hidden bg-[#6367FF] text-[#000000]`}
    >
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="container flex flex-1 items-start py-10 md:py-16">{children}</main>
        <PublicFooter />
      </div>
    </div>
  )
}
