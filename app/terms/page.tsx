import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - AffiliateHub",
  description: "The terms governing use of AffiliateHub.",
}

export default function TermsPage() {
  return (
    <main className="container py-10">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: March 2, 2026</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Eligibility and Accounts</h2>
          <p className="text-sm leading-6">
            You are responsible for maintaining account security and the accuracy of information shared on your storefront.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Acceptable Use</h2>
          <p className="text-sm leading-6">
            You may not use the service for unlawful, fraudulent, abusive, or infringing content. We may suspend accounts that violate
            these terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Billing</h2>
          <p className="text-sm leading-6">
            Subscription access is provided according to your active billing status. Failed or reversed payments can result in access
            downgrade or suspension.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Service Availability</h2>
          <p className="text-sm leading-6">
            We aim for high availability but do not guarantee uninterrupted service. Scheduled maintenance and incident recovery may
            affect access temporarily.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Limitation of Liability</h2>
          <p className="text-sm leading-6">
            The service is provided on an as-is basis. To the maximum extent permitted by law, liability is limited to amounts paid for
            the service in the previous billing cycle.
          </p>
        </section>
      </article>
    </main>
  )
}
