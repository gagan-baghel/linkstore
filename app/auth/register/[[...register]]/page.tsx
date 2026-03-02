import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Sparkles, Store } from "lucide-react"
import { SignUp } from "@clerk/nextjs"

export const metadata: Metadata = {
  title: "Register - AffiliateHub",
  description: "Create your AffiliateHub account",
}

export default function RegisterPage() {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

  return (
    <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden rounded-[2rem] border border-white/65 bg-linear-to-br from-indigo-500/85 via-violet-500/75 to-sky-400/75 p-8 text-white shadow-[14px_14px_30px_rgba(121,104,226,0.35),-11px_-11px_24px_rgba(255,255,255,0.2)] dark:border-white/15 dark:from-indigo-500/58 dark:via-violet-500/55 dark:to-sky-500/52 dark:shadow-none lg:block">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          Start your affiliate journey
        </span>
        <h2 className="mt-5 text-4xl font-extrabold tracking-tight">Build your own storefront in minutes</h2>
        <p className="mt-3 max-w-md text-white/90">
          Create a clean product hub, share one link everywhere, and track the clicks that matter.
        </p>
        <div className="mt-8 space-y-3">
          {[
            "Publish products with affiliate links fast",
            "Get a mobile-ready public store instantly",
            "Track clicks and optimize weekly",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-white" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Store className="h-4 w-4" />
            Ready-to-share affiliate store URL
          </div>
          <p className="mt-1 text-sm text-white/85">Set up once, then use the same storefront link in all channels.</p>
        </div>
      </div>

      <div className="w-full rounded-[2rem] border border-white/65 bg-linear-to-br from-white/88 to-indigo-50/84 p-7 shadow-[14px_14px_30px_rgba(155,171,219,0.3),-11px_-11px_24px_rgba(255,255,255,0.86)] dark:border-white/10 dark:bg-linear-to-br dark:from-slate-900/88 dark:to-slate-800/78 dark:shadow-none sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground">Set up your profile and launch your store.</p>
        </div>
        {hasClerkKey ? (
          <div className="flex justify-center">
            <SignUp
              routing="path"
              path="/auth/register"
              signInUrl="/auth/login"
              forceRedirectUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "w-full border-none bg-transparent shadow-none p-0",
                },
              }}
            />
          </div>
        ) : (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Authentication is not configured. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in your
            environment.
          </div>
        )}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
