import Link from "next/link"
import Image from "next/image"

import { getSafeServerSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export async function PublicNavbar() {
  const session = await getSafeServerSession()
  const isLoggedIn = !!session

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/45 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/55">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/favicon-32x32.png" alt="AffiliateHub logo" width={32} height={32} />
          </div>
          <span>AffiliateHub</span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button>Open Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="rounded-full px-5 text-sm font-medium tracking-wide text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-colors">Log in</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="rounded-full border border-indigo-200/50 bg-indigo-500/20 backdrop-blur-md px-5 text-sm font-medium tracking-wide text-indigo-700 hover:bg-indigo-500/30 dark:border-indigo-400/30 dark:text-indigo-300 dark:hover:bg-indigo-400/20 transition-colors shadow-sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

