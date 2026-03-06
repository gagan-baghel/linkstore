import Link from "next/link"
import {
  ArrowRight,
  ChartNoAxesCombined,
  CheckCircle2,
  Compass,
  Layers3,
  LineChart,
  MousePointerClick,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react"

import { getSafeServerSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

const outcomes = [
  "One clean storefront URL for every channel",
  "Product pages designed to push outbound clicks",
  "Analytics that surface what converts, not just views",
]

const journeySteps = [
  {
    id: "01",
    title: "Create your account & pick your direction",
    description:
      "Start with email, secure your access, and define the storefront vibe you want to ship.",
  },
  {
    id: "02",
    title: "Add products & structure your catalog",
    description:
      "Paste affiliate links, tune titles and categories, and shape a storefront that feels curated instead of crowded.",
  },
  {
    id: "03",
    title: "Publish & distribute one destination",
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
    title: "Secure auth & account control",
    text: "First-party email/password authentication with signed session cookies and in-app password rotation controls.",
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
    a: "No. Authentication is handled directly in AffiliateHub with email and password so your auth stack stays first-party.",
  },
  {
    q: "How do I change my password?",
    a: "Open Account > Security Settings in the dashboard to rotate your password and invalidate older sessions.",
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
    <div className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900 selection:bg-indigo-500/30 dark:bg-[#0B0F19] dark:text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply dark:mix-blend-screen dark:opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <PublicNavbar />

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-white/5">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-10 xl:py-12">

            <div className="flex flex-col justify-center space-y-8 duration-1000 animate-in fade-in slide-in-from-bottom-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300/80 bg-white/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700 backdrop-blur-md dark:border-white/20 dark:bg-white/5 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Affiliate Commerce Engine</span>
              </div>

              <h1 className="max-w-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-transparent dark:from-white dark:via-indigo-100 dark:to-slate-300 sm:text-6xl lg:text-7xl xl:text-[5rem]">
                One Creator Store.
                <br />
                Zero Link Chaos.
              </h1>

              <p className="max-w-2xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300/90 sm:text-lg">
                AffiliateHub transforms your scattered promo links into a premium, conversion-optimized storefront. Curate products, track real buying intent, and scale your revenue with one definitive destination.
              </p>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                <Link href={primaryCtaHref}>
                  <Button size="lg" className="h-12 w-full sm:w-auto rounded-full border border-indigo-600/30 bg-indigo-600/10 backdrop-blur-md px-8 text-sm font-bold tracking-wide text-indigo-700 hover:bg-indigo-600/20 hover:border-indigo-600/50 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:hover:border-indigo-400/50 transition-all shadow-sm">
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href={isLoggedIn ? "/dashboard/products/new" : "/auth/login"}>
                  <Button size="lg" variant="outline" className="h-12 w-full sm:w-auto rounded-full border border-slate-300/60 bg-white/60 backdrop-blur-xl px-8 text-sm font-bold tracking-wide text-slate-800 hover:bg-white/90 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:border-white/20 transition-all shadow-sm">
                    {isLoggedIn ? "Add Product" : "Log In"}
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 pt-4 sm:grid-cols-3 sm:gap-6">
                {outcomes.map((line) => (
                  <div key={line} className="relative pl-4 delay-[200ms]">
                    <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-full bg-gradient-to-b from-indigo-500 to-sky-400 opacity-80" />
                    <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300">{line}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="delay-150 relative flex items-center justify-center duration-1000 animate-in fade-in slide-in-from-right-8">
              {/* Dashboard Preview Card */}
              <div className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/40 p-6 backdrop-blur-xl transition-all duration-500 dark:border-white/10 dark:bg-[#131825]/40 sm:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent" />

                <div className="relative space-y-8">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600 dark:text-slate-400">Live Pulse</p>
                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-6 border-b border-slate-200/50 pb-8 dark:border-white/10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                        Views
                      </div>
                      <p className="text-4xl font-black tracking-[-0.03em] text-slate-900 dark:text-white">48.2K</p>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">+18% this cycle</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        <MousePointerClick className="h-3.5 w-3.5 text-sky-500" />
                        Clicks
                      </div>
                      <p className="text-4xl font-black tracking-[-0.03em] text-slate-900 dark:text-white">7.4%</p>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">High intent</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        <LineChart className="h-4 w-4 text-violet-500" />
                        Top Category
                      </span>
                      <span className="font-black uppercase tracking-wide text-slate-900 dark:text-emerald-400">Creator Gear</span>
                    </div>
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                      <div className="absolute left-0 top-0 h-full w-[72%] rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/50 bg-white/50 p-4 dark:border-white/5 dark:bg-slate-800/30">
                    <div className="pb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <Rocket className="h-3.5 w-3.5" />
                      Action Items
                    </div>
                    <ul className="space-y-3 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                      <li className="flex items-start gap-2.5 transition-colors hover:text-slate-900 dark:hover:text-white">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        Optimize top converted products placement.
                      </li>
                      <li className="flex items-start gap-2.5 transition-colors hover:text-slate-900 dark:hover:text-white">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        Share new storefront link in bio.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS STRIP */}
        <section className="border-b border-indigo-900/10 bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 py-6 text-white dark:border-white/5">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-x-8 gap-y-4 px-5 text-[11px] font-bold uppercase tracking-[0.25em] sm:px-8">
            <span className="flex items-center gap-2 opacity-90"><ShieldCheck className="h-4 w-4" /> Built for creators</span>
            <span className="flex items-center gap-2 opacity-90"><Target className="h-4 w-4" /> Affiliate intent ready</span>
            <span className="flex items-center gap-2 opacity-90"><Zap className="h-4 w-4" /> Fast edits & ships</span>
            <span className="hidden items-center gap-2 opacity-90 md:flex"><Layers3 className="h-4 w-4" /> Responsive design</span>
          </div>
        </section>

        {/* WHY IT WORKS */}
        <section className="relative overflow-hidden border-b border-slate-200/80 py-20 dark:border-white/5 lg:py-32">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Why AffiliateHub</p>
              <h2 className="mt-4 max-w-xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                Stop losing revenue to scattered link chaos.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-white/10 dark:bg-[#131825] dark:hover:border-white/20">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">The Old Way</p>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Fragmented Experience</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Multiple bio links, random product drops across platforms, and completely obscured customer journey metrics.
                </p>
              </div>
              <div className="group rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-indigo-500/30 dark:bg-indigo-500/5 dark:hover:border-indigo-400/50">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">The New Way</p>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Curated Storefront</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  One premium destination, clear product storytelling, and highly actionable conversion & click tracking.
                </p>
              </div>
              <div className="col-span-full grid grid-cols-2 gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-white/5 dark:bg-white/[0.02]">
                <div>
                  <p className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">3.2x</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Journey depth increase</p>
                </div>
                <div>
                  <p className="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">42%</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Returning visitor lift</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CREATOR JOURNEY */}
        <section className="relative border-b border-slate-200/80 bg-white py-20 dark:border-white/5 dark:bg-[#080B12] lg:py-32">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="mb-16 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">The Blueprint</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-slate-900 dark:text-white sm:text-5xl">Seamless Creator Journey</h2>
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-4">
              {journeySteps.map((step, index) => (
                <div key={step.id} className="group relative">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-black text-indigo-600 ring-1 ring-indigo-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20 dark:group-hover:bg-indigo-500 dark:group-hover:text-white">
                    {step.id}
                  </div>
                  {index !== journeySteps.length - 1 && (
                    <div className="absolute left-20 right-0 top-8 hidden h-[2px] bg-gradient-to-r from-indigo-100 to-transparent dark:from-indigo-500/20 lg:block" />
                  )}
                  <h3 className="mb-3 text-xl font-bold uppercase leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES */}
        <section className="border-b border-slate-200/80 py-20 dark:border-white/5 lg:py-32">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="sticky top-24 self-start">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Features</p>
                <h2 className="mt-4 text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Built for power users.
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  Everything you need to run an affiliate empire without the bloat of traditional e-commerce platforms. Lightning-fast edits, uncompromising security, and deep aesthetic controls.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {featureRows.map((feature) => (
                  <div key={feature.title} className="group relative rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-[#131825] dark:hover:border-indigo-500/30">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-white/5 dark:text-white dark:group-hover:bg-indigo-500">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-lg font-bold uppercase tracking-tight text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="relative overflow-hidden border-b border-slate-200/80 bg-slate-100 py-20 dark:border-white/5 dark:bg-[#06080D] lg:py-32">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="mb-16 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Validation</p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.02em] text-slate-900 dark:text-white sm:text-5xl">Creators Trust AffiliateHub</h2>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {testimonials.map((item) => (
                <blockquote key={item.author} className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl dark:border-white/5 dark:bg-[#131825] dark:hover:border-white/10">
                  <p className="relative z-10 text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                    <span className="absolute -left-3 -top-3 -z-10 text-5xl opacity-50 text-indigo-200 dark:text-indigo-900">&ldquo;</span>
                    {item.quote}
                    <span className="text-indigo-200 dark:text-indigo-900">&rdquo;</span>
                  </p>
                  <footer className="mt-8 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 dark:from-indigo-600 dark:to-violet-600" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                      {item.author}
                    </p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQS */}
        <section className="border-b border-slate-200/80 py-20 dark:border-white/5 lg:py-32">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 sm:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-black uppercase tracking-[-0.02em] text-slate-900 dark:text-white sm:text-5xl">Common Questions</h2>
            </div>
            <div className="flex w-full flex-col space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-[#131825] dark:hover:border-indigo-500/50">
                  <h3 className="text-base font-bold uppercase tracking-wide text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">{faq.q}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
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
                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end">
                  <Link href={primaryCtaHref}>
                    <Button size="lg" className="h-12 w-full sm:w-auto rounded-full border border-white/40 bg-white text-sm font-bold uppercase tracking-wide text-indigo-700 shadow-lg hover:bg-white/90 hover:scale-[1.02] transition-all dark:border-white/40 dark:bg-white dark:text-indigo-700 dark:hover:bg-white/90">
                      {primaryCtaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={isLoggedIn ? "/dashboard/account/security" : "/auth/login"}>
                    <Button size="lg" variant="outline" className="h-12 w-full sm:w-auto rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-8 text-sm font-bold uppercase tracking-wide text-white hover:bg-white/20 hover:border-white/40 transition-all shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
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
