import type React from "react"
import { redirect } from "next/navigation"
import Image from "next/image"
import { getSafeServerSession } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserAccountNav } from "@/components/user-account-nav"
import { DashboardSignOutButton } from "@/components/dashboard-signout-button"
import { DashboardTopbarContext } from "@/components/dashboard-topbar-context"
import { MobileDashboardNav } from "@/components/mobile-dashboard-nav"
import Link from "next/link"
import { convexQuery } from "@/lib/convex"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSafeServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(() => null)
  if (user?.onboardingCompleted === false) {
    redirect("/onboarding")
  }

  const canUseShopFeatures = Boolean(session.user.hasActiveSubscription)

  return (
    <div className="dashboard-minimal min-h-screen overflow-x-clip md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="dashboard-sidebar hidden h-screen md:sticky md:top-0 md:flex md:flex-col">
        <div className="shrink-0 px-6 pb-5 pt-7">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold text-slate-900 border-b border-gray-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_10px_20px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
              <Image src="/linkstoreLogo.png" alt="Linkstore logo" width={30} height={30} />
            </div>
            <span className="font-display tracking-[0.18em]">linkstore</span>
          </Link>
          {/* <Button className="mt-6 w-full justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-white shadow-[0_14px_26px_rgba(14,165,233,0.32)] hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500">
            <Plus className="h-4 w-4" />
            New design
          </Button> */}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-6">
          {/* <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Workspace</p> */}
          <DashboardNav canUseShopFeatures={canUseShopFeatures} />
          <div className="mt-auto border-t border-slate-200/80 pt-4">
            <DashboardSignOutButton className="w-full justify-start text-slate-700 hover:bg-white/70" />
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-transparent">
        <header className="dashboard-topbar sticky top-0 z-40">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <DashboardTopbarContext />
            </div>
            {/* <div className="hidden w-full max-w-[34rem] md:flex">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search your links, products, and audiences"
                  className="h-11 rounded-full border-slate-200/80 bg-slate-50 pl-11 text-sm shadow-none ring-1 ring-transparent focus-visible:ring-2 focus-visible:ring-sky-300/60"
                />
              </div>
            </div> */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {/* <Button className="hidden rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-5 text-white shadow-[0_12px_24px_rgba(14,165,233,0.28)] hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 sm:inline-flex">
                <Plus className="h-4 w-4" />
                Create
              </Button> */}
              <UserAccountNav
                user={{
                  name: session.user.name || "",
                  email: session.user.email || "",
                  image: session.user.image,
                }}
              />
            </div>
          </div>
          {/* <div className="px-4 pb-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search dashboard"
                className="h-11 rounded-full border-slate-200/80 bg-slate-50 pl-11 text-sm shadow-none ring-1 ring-transparent focus-visible:ring-2 focus-visible:ring-sky-300/60"
              />
            </div>
          </div> */}
        </header>

        <div className="flex-1 bg-transparent">{children}</div>
        <MobileDashboardNav canUseShopFeatures={canUseShopFeatures} />
      </main>
    </div>
  )
}
