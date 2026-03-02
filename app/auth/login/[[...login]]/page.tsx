import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Rocket, Sparkles } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Login - AffiliateHub",
  description: "Login to your AffiliateHub account",
}

export default function LoginPage() {
  return (
    <div className="grid w-full items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="w-full rounded-[2rem] border border-white/65 bg-linear-to-br from-white/88 to-indigo-50/84 p-7 shadow-[14px_14px_30px_rgba(155,171,219,0.3),-11px_-11px_24px_rgba(255,255,255,0.86)] dark:border-white/10 dark:bg-linear-to-br dark:from-slate-900/88 dark:to-slate-800/78 dark:shadow-none sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue managing your storefront.</p>
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/auth/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Don&apos;t have an account? Sign up
          </Link>
        </p>
      </div>

      <div className="hidden rounded-[2rem] border border-white/65 bg-linear-to-br from-sky-500/78 via-indigo-500/75 to-violet-500/75 p-8 text-white shadow-[14px_14px_30px_rgba(121,104,226,0.35),-11px_-11px_24px_rgba(255,255,255,0.2)] dark:border-white/15 dark:from-sky-500/55 dark:via-indigo-500/55 dark:to-violet-500/55 dark:shadow-none lg:block">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          Optimized for daily workflow
        </span>
        <h2 className="mt-5 text-4xl font-extrabold tracking-tight">Your growth dashboard is ready</h2>
        <p className="mt-3 max-w-md text-white/90">
          Jump back into product updates, link sharing, and conversion-focused decisions.
        </p>
        <div className="mt-8 space-y-3">
          {[
            "Track 30-day clicks and conversion rates",
            "Manage products and store design quickly",
            "Share one storefront URL everywhere",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-white" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Rocket className="h-4 w-4" />
            Back to building momentum
          </div>
          <p className="mt-1 text-sm text-white/85">Focus on the actions that improve traffic quality and affiliate intent.</p>
        </div>
      </div>
    </div>
  )
}
