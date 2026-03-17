import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CheckCircle2, Rocket, Sparkles } from "lucide-react"

import { GoogleAuthPanel } from "@/components/google-auth-panel"
import { getSafeServerSession } from "@/lib/auth"
import { getGoogleAuthErrorMessage } from "@/lib/google-auth"

export const metadata: Metadata = {
  title: "Login - AffiliateHub",
  description: "Login to your AffiliateHub account",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const session = await getSafeServerSession()
  if (session?.user?.id) {
    redirect("/dashboard")
  }

  const resolvedSearchParams = await searchParams
  const error = getGoogleAuthErrorMessage(resolvedSearchParams?.error)
  const nextPath = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : "/dashboard"
  const showDevLogin = process.env.NODE_ENV !== "production"

  return (
    <div className="grid min-h-[calc(100vh-140px)] w-full items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-24 xl:gap-32">
      {/* Left Column (Text & Features) - No Box */}
      <div className="hidden flex-col justify-center space-y-12 lg:flex pl-4 lg:pl-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <span>Secure first-party access</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl xl:text-6xl">
            Your growth<br />dashboard is ready
          </h1>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>Log in to continue managing</span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <Rocket className="h-6 w-6 text-indigo-500" />
              Back to building momentum
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Focus on the actions that improve traffic quality and affiliate intent.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <CheckCircle2 className="h-6 w-6 text-indigo-500" />
              Manage products
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Jump back into product updates, link sharing, and conversion-focused decisions.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
              <CheckCircle2 className="h-6 w-6 text-indigo-500" />
              Track 30-day clicks
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
              Receive detailed insights on all your numbers in real-time.
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
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Use Google to continue managing your storefront.</p>
            </div>

            <GoogleAuthPanel
              description="Google is the only sign-in method. Your verified Google email is used to create or link your AffiliateHub account automatically."
              ctaLabel="Continue with Google"
              alternateHref="/auth/register"
              alternateLabel="Create one"
              alternatePrompt="Need your first account?"
              nextPath={nextPath}
              error={error}
              showDevLogin={showDevLogin}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
