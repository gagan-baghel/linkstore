import type React from "react"

import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -right-20 top-14 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute left-0 top-32 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/15" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicNavbar />
        <main className="container flex flex-1 items-center py-8 md:py-12">{children}</main>
        <PublicFooter />
      </div>
    </div>
  )
}

