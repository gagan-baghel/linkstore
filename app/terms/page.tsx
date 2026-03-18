import type { Metadata } from "next"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

export const metadata: Metadata = {
  title: "Terms of Service - Linkstore",
  description: "The terms governing use of Linkstore.",
}

export default function TermsPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#0B0F19]">
      <PublicNavbar />
      <main className="relative z-10 flex-1 px-4 py-16 sm:px-8 lg:py-24 w-full">
        <article className="mx-auto w-full max-w-3xl space-y-10 text-slate-800 dark:text-slate-200">
          <header className="space-y-4 border-b border-slate-200/50 pb-8 dark:border-slate-800/80">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">Terms of Service</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Last updated: March 2, 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Eligibility and Accounts</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              You are responsible for maintaining account security and the accuracy of information shared on your storefront.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Acceptable Use</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              You may not use the service for unlawful, fraudulent, abusive, or infringing content. We may suspend accounts that violate
              these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Billing</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Subscription access is provided according to your active billing status. Failed or reversed payments can result in access
              downgrade or suspension.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Service Availability</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              We aim for high availability but do not guarantee uninterrupted service. Scheduled maintenance and incident recovery may
              affect access temporarily.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Limitation of Liability</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              The service is provided on an as-is basis. To the maximum extent permitted by law, liability is limited to amounts paid for
              the service in the previous billing cycle.
            </p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div >
  )
}
