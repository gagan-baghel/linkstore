import Link from "next/link"
import {
  ArrowRight,
  ChartNoAxesCombined,
  CheckCircle2,
  Compass,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react"

import { getSafeServerSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

const outcomes = [
  "One clean storefront URL for every channel",
  "Product pages designed to push outbound clicks",
  "Analytics that surface what converts, not just what gets views",
]

const journeySteps = [
  {
    id: "01",
    title: "Create your account and pick your direction",
    description:
      "Start with Google or email, set your creator identity, and define the storefront vibe you want to ship.",
  },
  {
    id: "02",
    title: "Add products and structure your catalog",
    description:
      "Paste affiliate links, tune titles and categories, and shape a storefront that feels curated instead of crowded.",
  },
  {
    id: "03",
    title: "Publish and distribute one destination",
    description:
      "Use a single profile URL across socials, newsletters, and video descriptions to centralize buying intent.",
  },
  {
    id: "04",
    title: "Optimize weekly using conversion signals",
    description:
      "Read product-level performance and refine what you promote, where you place it, and how often you rotate it.",
  },
]

const featureRows = [
  {
    icon: Target,
    title: "Intent-led merchandising",
    text: "Highlight your strongest affiliate picks first and keep discovery paths clear across categories.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Creator-focused analytics",
    text: "Track store views, card clicks, and outbound conversions without digging through noisy dashboards.",
  },
  {
    icon: Layers3,
    title: "Theme control without design debt",
    text: "Adjust visual style quickly while staying consistent on mobile and desktop across the full store journey.",
  },
  {
    icon: ShieldCheck,
    title: "Secure auth and account recovery",
    text: "Clerk-backed authentication with email/password and Google sign-in, plus built-in recovery controls.",
  },
]

const testimonials = [
  {
    quote:
      "Our click-through rate jumped because the storefront finally looked intentional, not like a random link list.",
    author: "Lifestyle Creator",
  },
  {
    quote:
      "The product grid and quick edit cycle made weekly optimization easy. I now run this like a real revenue channel.",
    author: "Tech Reviewer",
  },
  {
    quote:
      "One URL, cleaner branding, better conversion tracking. It removed friction for both me and my audience.",
    author: "Fitness Coach",
  },
]

const faqs = [
  {
    q: "Can I sign in with Google?",
    a: "Yes. Use the Google option on the login form to sign in with your Google account.",
  },
  {
    q: "How do I recover my password?",
    a: "Use Account > Security Settings to manage password and recovery via Clerk.",
  },
  {
    q: "Does it work on mobile-first audiences?",
    a: "Yes. Storefront and dashboard flows are designed for mobile and desktop so creator workflows stay fast everywhere.",
  },
]

export default async function Home() {
  const session = await getSafeServerSession()
  const isLoggedIn = Boolean(session)
  const primaryCtaHref = isLoggedIn ? "/dashboard" : "/auth/register"
  const primaryCtaLabel = isLoggedIn ? "Open Dashboard" : "Start Building"

  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80 dark:opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-24 h-[32rem] w-[32rem] blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(125,211,252,0.30) 0%, transparent 62%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[30rem] w-[28rem] blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.28) 0%, transparent 64%)" }}
      />

      <PublicNavbar />

      <main className="relative z-10">
        <section className="border-b border-slate-200/90 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:py-24">
            <div className="space-y-8">
              <p className="inline-flex items-center gap-2 border border-slate-300/80 bg-white/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 dark:border-white/20 dark:bg-white/5 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                Affiliate Commerce Engine
              </p>

              <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl lg:text-7xl">
                One creator store.
                <br />
                Zero link chaos.
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                AffiliateHub turns scattered promos into a conversion-oriented storefront. Organize your products, track what matters,
                and move your audience from curiosity to action with one clear destination.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={primaryCtaHref}>
                  <Button size="lg" className="h-11 border border-indigo-600 bg-indigo-600 px-6 text-sm uppercase tracking-wide text-white hover:bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400">
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={isLoggedIn ? "/dashboard/products/new" : "/auth/login"}>
                  <Button size="lg" variant="outline" className="h-11 border-slate-300 bg-transparent px-6 text-sm uppercase tracking-wide hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                    {isLoggedIn ? "Add Product" : "Log In"}
                  </Button>
                </Link>
              </div>

              <div className="grid gap-2 pt-2 sm:grid-cols-3 sm:gap-4">
                {outcomes.map((line) => (
                  <div key={line} className="border-l-2 border-indigo-300 pl-3 dark:border-indigo-500">
                    <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative border border-slate-300/80 bg-white/55 p-5 backdrop-blur-sm dark:border-white/15 dark:bg-white/[0.03] sm:p-6">
              <div className="space-y-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-300">Live Performance Snapshot</p>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-5 dark:border-white/12">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Store Views</p>
                    <p className="mt-1 text-3xl font-black tracking-[-0.02em]">48.2K</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">+18% this month</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Outbound CTR</p>
                    <p className="mt-1 text-3xl font-black tracking-[-0.02em]">7.4%</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Above benchmark</p>
                  </div>
                </div>
                <div className="border-y border-slate-200/80 py-4 dark:border-white/12">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Top Category</span>
                    <span className="font-black uppercase tracking-wide">Creator Gear</span>
                  </div>
                  <div className="mt-3 h-2 bg-indigo-100 dark:bg-slate-700/70">
                    <div className="h-full w-[72%] bg-indigo-600 dark:bg-indigo-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <Rocket className="h-4 w-4" />
                    Weekly Actions
                  </div>
                  <ul className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      Rotate low-performing products from the top grid.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      Push top 3 picks to socials with one storefront link.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      Track category winners and double down on demand.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/90 bg-linear-to-r from-sky-600 via-indigo-600 to-violet-600 py-4 text-white dark:border-white/10 dark:from-sky-700 dark:via-indigo-700 dark:to-violet-700">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-5 text-[10px] font-bold uppercase tracking-[0.25em] sm:px-8">
            <span className="opacity-70">Built for creators</span>
            <span className="opacity-70">Optimized for affiliate intent</span>
            <span className="opacity-70">Fast edits, faster shipping</span>
            <span className="opacity-70">Mobile-first storefront</span>
            <span className="opacity-70">Conversion-focused analytics</span>
          </div>
        </section>

        <section className="border-b border-slate-200/90 py-16 dark:border-white/10 lg:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Why this works</p>
              <h2 className="mt-3 max-w-xl text-3xl font-black uppercase leading-tight tracking-[-0.02em] sm:text-5xl">
                Stop losing revenue in scattered links.
              </h2>
            </div>
            <div className="space-y-5">
              <div className="border-l-4 border-indigo-500 bg-white/60 p-4 dark:border-indigo-400 dark:bg-white/[0.03]">
                <p className="text-sm font-semibold uppercase tracking-wide">Old Flow</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Bio links, random product drops, and no cohesive buying journey.
                </p>
              </div>
              <div className="border-l-4 border-indigo-500 bg-white/60 p-4 dark:border-indigo-400 dark:bg-white/[0.03]">
                <p className="text-sm font-semibold uppercase tracking-wide">New Flow</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Curated storefront, clear product storytelling, and measurable conversion steps.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border-t-2 border-slate-300/80 pt-3 dark:border-white/20">
                  <p className="text-2xl font-black">3.2x</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Average journey depth</p>
                </div>
                <div className="border-t-2 border-slate-300/80 pt-3 dark:border-white/20">
                  <p className="text-2xl font-black">42%</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Returning visitor lift</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/90 py-16 dark:border-white/10 lg:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Creator Journey</p>
            <div className="mt-4 space-y-6">
              {journeySteps.map((step, index) => (
                <div
                  key={step.id}
                  className="grid items-start gap-3 border-t border-slate-200/80 py-6 first:border-t-0 dark:border-white/12 lg:grid-cols-[100px_1fr_200px]"
                >
                  <p className="text-4xl font-black tracking-[-0.03em] text-slate-900/30 dark:text-white/30">{step.id}</p>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{step.title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {index % 2 === 0 ? <Compass className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    {index % 2 === 0 ? "Planning + Setup" : "Execution + Scale"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/90 py-16 dark:border-white/10 lg:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Core Capabilities</p>
            <div className="mt-6 divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-white/12 dark:border-white/12">
              {featureRows.map((feature) => (
                <div key={feature.title} className="grid gap-4 py-6 lg:grid-cols-[56px_0.8fr_1.2fr] lg:items-start">
                  <feature.icon className="h-8 w-8 text-slate-900 dark:text-slate-100" />
                  <h3 className="text-lg font-black uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/90 py-16 dark:border-white/10 lg:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {testimonials.map((item) => (
                <blockquote key={item.author} className="border-l-4 border-indigo-500 bg-white/60 p-5 dark:border-indigo-400 dark:bg-white/[0.03]">
                  <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">&ldquo;{item.quote}&rdquo;</p>
                  <footer className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {item.author}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/90 py-16 dark:border-white/10 lg:py-24">
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">FAQs</p>
            <div className="mt-5 divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-white/12 dark:border-white/12">
              {faqs.map((faq) => (
                <div key={faq.q} className="py-5">
                  <h3 className="text-base font-black uppercase tracking-wide">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="relative overflow-hidden border border-indigo-400/40 bg-linear-to-r from-sky-600 via-indigo-600 to-violet-600 px-6 py-12 text-white dark:border-indigo-300/40 dark:from-sky-700 dark:via-indigo-700 dark:to-violet-700 dark:text-white sm:px-10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 22%, transparent 46%), linear-gradient(300deg, transparent 0%, rgba(255,255,255,0.08) 20%, transparent 55%)",
                }}
              />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">Ready To Convert Better</p>
                  <h2 className="mt-2 max-w-3xl text-3xl font-black uppercase leading-tight tracking-[-0.02em] sm:text-5xl">
                    Build a storefront your audience actually wants to shop.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-90">
                    Move from disconnected links to one high-performance destination and scale your affiliate outcomes with clarity.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link href={primaryCtaHref}>
                    <Button size="lg" className="h-11 border border-white/40 bg-white text-sm uppercase tracking-wide text-indigo-700 hover:bg-indigo-50 dark:border-white/40 dark:bg-white dark:text-indigo-700 dark:hover:bg-indigo-100">
                      {primaryCtaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={isLoggedIn ? "/dashboard/account/security" : "/auth/login"}>
                    <Button size="lg" variant="outline" className="h-11 border-white/50 bg-transparent text-sm uppercase tracking-wide text-white hover:bg-white/15 dark:border-white/50 dark:text-white dark:hover:bg-white/15">
                      Security Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
