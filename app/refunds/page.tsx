import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy - AffiliateHub",
  description: "How subscription cancellations and refunds are handled.",
}

export default function RefundsPage() {
  return (
    <main className="container py-10">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Refund & Cancellation Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: March 2, 2026</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Subscription Cancellation</h2>
          <p className="text-sm leading-6">
            You can request cancellation any time. Access remains active for the current paid period unless otherwise required by law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Refund Eligibility</h2>
          <p className="text-sm leading-6">
            Refund decisions are reviewed case-by-case for duplicate charges, billing errors, or failed service activation. Approved
            refunds are issued to the original payment method.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Chargebacks and Disputes</h2>
          <p className="text-sm leading-6">
            If a payment is disputed or reversed, subscription access may be suspended while the case is investigated.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Support</h2>
          <p className="text-sm leading-6">
            Contact support with your account email, payment date, and order reference to help us resolve billing issues faster.
          </p>
        </section>
      </article>
    </main>
  )
}
