import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, Sparkles, Store, Rocket } from "lucide-react"

import { RegisterForm } from "@/components/register-form"
import { getSafeServerSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Register - AffiliateHub",
  description: "Create your AffiliateHub account",
}

export default async function RegisterPage() {
  const session = await getSafeServerSession()
  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <div className="grid min-h-[calc(100vh-140px)] w-full items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-24 xl:gap-32">
      {/* Left Column (Text & Features) - No Box */}
      <div className="hidden flex-col justify-center space-y-12 lg:flex pl-4 lg:pl-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <span>Start your affiliate journey</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl xl:text-6xl">
            Build your own<br />storefront in minutes
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">
            Create a clean product hub, share one link everywhere, and track the clicks that matter.
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <Rocket className="h-6 w-6 text-indigo-500" />
              Publish products fast
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Publish products with affiliate links in minutes to a mobile-ready public store.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <Store className="h-6 w-6 text-indigo-500" />
              Ready-to-share store URL
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Set up once, then use the exact same storefront transparent link across all channels.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <CheckCircle2 className="h-6 w-6 text-indigo-500" />
              Track and optimize weekly
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Track clicks natively to see what converts and optimize your sales weekly.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column (Glassmorphism Card) */}
      <div className="w-full max-w-lg mx-auto">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/40 p-8 shadow-2xl backdrop-blur-2xl dark:border-slate-700/50 dark:bg-[#131825]/60 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent" />

          <div className="relative z-10">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <Store className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create an account</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Set up your profile and launch your storefront.</p>
            </div>

            <RegisterForm />

            <div className="mt-8 border-t border-slate-200/50 pt-6 text-center dark:border-slate-800/80">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
