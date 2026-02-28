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
import { getSubscriptionAccessState, hasPremiumAccess } from "@/lib/subscription-access"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSafeServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  const accessState = await getSubscriptionAccessState(session.user.id)
  const canUseShopFeatures = hasPremiumAccess(accessState)

  return (
    <div className="dashboard-minimal min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="dashboard-sidebar hidden min-h-screen border-r border-slate-200 bg-white md:block">
        <div className="px-6 py-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src="/favicon-32x32.png" alt="AffiliateHub logo" width={32} height={32} />
            </div>
            <span>AffiliateHub</span>
          </Link>
        </div>
        <div className="px-4 pb-6">
          <DashboardNav canUseShopFeatures={canUseShopFeatures} />
        </div>
      </aside>

      <main className="flex min-h-screen flex-col bg-slate-50">
        <header className="dashboard-topbar sticky top-0 z-40 border-b border-slate-200 bg-white">
          <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:px-4 md:min-h-16 md:px-6">
            <div className="min-w-0 flex-1">
              <DashboardTopbarContext />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <DashboardSignOutButton />
              <UserAccountNav
                user={{
                  name: session.user.name || "",
                  email: session.user.email || "",
                  image: session.user.image,
                }}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 bg-slate-50">{children}</div>
        <MobileDashboardNav canUseShopFeatures={canUseShopFeatures} />
      </main>
    </div>
  )
}
