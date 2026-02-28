import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

import { getSafeServerSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"

export default async function Home() {
  const session = await getSafeServerSession()
  const isLoggedIn = !!session

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-16">
      <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl dark:bg-sky-500/20" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-300/35 blur-3xl dark:bg-violet-500/20" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-400/15" />

      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/45 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/55">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src="/favicon-32x32.png" alt="AffiliateHub logo" width={32} height={32} />
            </div>
            <span>AffiliateHub</span>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button>Open Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container pt-8 md:pt-12">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/65 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground shadow-[6px_6px_14px_rgba(155,171,219,0.2),-5px_-5px_11px_rgba(255,255,255,0.84)] dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:shadow-none">
              <Sparkles className="h-3.5 w-3.5" />
              Claymorphism Landing Experience
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl md:text-6xl dark:text-slate-100">
              Soft. Modern. Touchable.
              <span className="mt-1 block bg-linear-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
                Your affiliate brand, sculpted in clay.
              </span>
            </h1>

            <p className="max-w-xl text-base text-slate-600 md:text-lg dark:text-slate-300">
              A calm, premium landing page with tactile components, plush surfaces, and clean conversion-focused sections.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}>
                <Button size="lg" className="gap-2">
                  Launch Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  View Account
                </Button>
              </Link>
            </div>
          </div>

          <Card className="rounded-[2rem]">
            <CardContent className="space-y-4 p-5">
              <div className="rounded-3xl border border-white/60 bg-linear-to-br from-indigo-400/92 via-violet-400/88 to-sky-300/88 p-5 text-white shadow-[0_18px_30px_rgba(117,102,219,0.3)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Onboarding card</p>
                <h3 className="mt-2 text-2xl font-bold">Ready to create your storefront?</h3>
                <p className="mt-1 text-sm text-white/90">Set up your profile, add products, and share one polished link.</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/65 bg-white/78 p-4 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.86),inset_-2px_-2px_7px_rgba(161,176,215,0.16)] dark:border-white/10 dark:bg-slate-900/75 dark:shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Visibility</p>
                  <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">Public Profile</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Switch defaultChecked aria-label="Profile visibility" />
                    Enabled
                  </div>
                </div>

                <div className="rounded-2xl border border-white/65 bg-white/78 p-4 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.86),inset_-2px_-2px_7px_rgba(161,176,215,0.16)] dark:border-white/10 dark:bg-slate-900/75 dark:shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Theme Intensity</p>
                  <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">Balanced</p>
                  <div className="mt-4">
                    <Slider defaultValue={[62]} max={100} step={1} aria-label="Theme intensity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Soft Depth",
              text: "Large rounded cards with matte highlights and ambient shadows.",
            },
            {
              title: "Friendly Typography",
              text: "Rounded, readable type hierarchy for fast comprehension.",
            },
            {
              title: "Mobile-first Rhythm",
              text: "Generous spacing and clear actions across all screen sizes.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/65 bg-white/60 p-6 shadow-[10px_10px_22px_rgba(145,164,205,0.14),-8px_-8px_16px_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Built to feel premium and easy</h2>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Minimal friction, clear navigation, and tactile interactions from first visit.</p>
            </div>
            <Link href={isLoggedIn ? "/dashboard" : "/auth/register"}>
              <Button size="lg" className="gap-2">
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Plush matte surfaces with low-contrast depth",
              "Pill buttons with pressed-state feedback",
              "Subtle gradients with calm pastel blending",
              "Clean sections designed for quick decisions",
            ].map((line) => (
              <div key={line} className="flex items-center gap-2 rounded-xl border border-white/65 bg-white/75 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {line}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
