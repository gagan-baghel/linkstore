import type { Metadata } from "next"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy - AffiliateHub",
  description: "How subscription cancellations and refunds are handled.",
}

export default function RefundsPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#0B0F19]">
      <PublicNavbar />
      <main className="relative z-10 flex-1 px-4 py-16 sm:px-8 lg:py-24 w-full">
        <article className="mx-auto w-full max-w-3xl space-y-10 text-slate-800 dark:text-slate-200">
          <header className="space-y-4 border-b border-slate-200/50 pb-8 dark:border-slate-800/80">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">Refund & Cancellation Policy</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Last updated: March 2, 2026</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Subscription Cancellation</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              You can request cancellation any time. Access remains active for the current paid period unless otherwise required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Refund Eligibility</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Refund decisions are reviewed case-by-case for duplicate charges, billing errors, or failed service activation. Approved
              refunds are issued to the original payment method.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Chargebacks and Disputes</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              If a payment is disputed or reversed, subscription access may be suspended while the case is investigated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Support</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Contact support with your account email, payment date, and order reference to help us resolve billing issues faster.
            </p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div >
  )
}
