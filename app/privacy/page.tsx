import type { Metadata } from "next"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

export const metadata: Metadata = {
  title: "Privacy Policy - AffiliateHub",
  description: "How AffiliateHub collects, uses, and safeguards your data.",
}

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#0B0F19]">
      <PublicNavbar />
      <main className="relative z-10 flex-1 px-4 py-16 sm:px-8 lg:py-24 w-full">
        <article className="mx-auto w-full max-w-3xl space-y-10 text-slate-800 dark:text-slate-200">
          <header className="space-y-4 border-b border-slate-200/50 pb-8 dark:border-slate-800/80">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">Privacy Policy</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Last updated: March 2, 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">What We Collect</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              We collect account data (name, email), storefront content, product links, analytics events, and billing metadata needed
              to provide and secure the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">How We Use Data</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Data is used to authenticate accounts, operate your storefront, process subscription billing, prevent abuse, and improve
              product performance and reliability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Data Sharing</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              We share data only with infrastructure providers required to run the service (hosting, database, media storage, and
              payment processing). Authentication is handled directly by AffiliateHub. We do not sell personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Security</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              We apply access controls, request validation, security headers, and audit logging. No method is fully risk-free, but we
              continuously improve safeguards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Your Choices</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              You can update account information from the dashboard and request account deletion or data export through support.
            </p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}
