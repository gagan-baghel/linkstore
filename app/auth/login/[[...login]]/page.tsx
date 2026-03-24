import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CheckCircle2, Rocket, Sparkles, Star } from "lucide-react"

import { GoogleAuthPanel } from "@/components/google-auth-panel"
import { getSafeServerSession } from "@/lib/auth"
import { getGoogleAuthErrorMessage } from "@/lib/google-auth"

export const metadata: Metadata = {
  title: "Login - Linkstore",
  description: "Login to your Linkstore account",
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
    <div className="grid w-full items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">

      {/* Left Column */}
      <div className="space-y-10">

        <div className="space-y-6">
          <h1 className="font-display text-[42px] leading-none tracking-tight text-white sm:text-[64px]">
            Login in to your
            <br />
            <span className="bg-[#FFDBFD] px-2 text-[#6367FF]">
              creator
            </span>
            {" "}dashboard
          </h1>

          <p className="max-w-xl text-base text-white/90">
            Manage your products, track clicks, and keep everything in one place.
          </p>

        </div>

        {/* <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#C9BEFF] bg-[#FFDBFD] p-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-black">
              <Rocket className="h-5 w-5 text-[#6367FF]" />
              Quick setup
            </div>
            <p className="mt-2 text-sm text-[#6367FF]">
              Get your storefront live in minutes.
            </p>
          </div>

          <div className="rounded-2xl border border-[#C9BEFF] bg-white p-4">
            <div className="flex items-center gap-3 text-lg font-semibold text-black">
              <Star className="h-5 w-5 text-[#6367FF]" />
              Simple tracking
            </div>
            <p className="mt-2 text-sm text-[#6367FF]">
              See what people click and explore.
            </p>
          </div>
        </div> */}

        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.25em] text-white/70">
          built for creators
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full max-w-lg lg:justify-self-end">
        <div className="relative overflow-hidden rounded-3xl border border-[#C9BEFF] bg-[#FFDBFD] p-8 sm:p-10">
          {/* <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 to-transparent" /> */}

          <div className="relative z-10">
            <div className="mb-10 text-center">

              <h2 className="mt-3 font-display text-3xl leading-none text-black">
                Sign in to continue
              </h2>
            </div>

            <GoogleAuthPanel
              ctaLabel="Continue with Google"
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
