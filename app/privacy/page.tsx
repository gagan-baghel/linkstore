import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - AffiliateHub",
  description: "How AffiliateHub collects, uses, and safeguards your data.",
}

export default function PrivacyPage() {
  return (
    <main className="container py-10">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last updated: March 2, 2026</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">What We Collect</h2>
          <p className="text-sm leading-6">
            We collect account data (name, email), storefront content, product links, analytics events, and billing metadata needed
            to provide and secure the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">How We Use Data</h2>
          <p className="text-sm leading-6">
            Data is used to authenticate accounts, operate your storefront, process subscription billing, prevent abuse, and improve
            product performance and reliability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Data Sharing</h2>
          <p className="text-sm leading-6">
            We share data only with infrastructure providers required to run the service (authentication, hosting, database, and
            payment processing). We do not sell personal data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="text-sm leading-6">
            We apply access controls, request validation, security headers, and audit logging. No method is fully risk-free, but we
            continuously improve safeguards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Your Choices</h2>
          <p className="text-sm leading-6">
            You can update account information from the dashboard and request account deletion or data export through support.
          </p>
        </section>
      </article>
    </main>
  )
}
