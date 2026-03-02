import type { Metadata } from "next"
import Link from "next/link"

import { getSupportEmail } from "@/lib/runtime-config"

export const metadata: Metadata = {
  title: "Contact Support - AffiliateHub",
  description: "How to contact AffiliateHub support for account and billing help.",
}

export default function ContactPage() {
  const supportEmail = getSupportEmail() || "support@example.com"

  return (
    <main className="container py-10">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Contact Support</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">We typically respond within 1 business day.</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Support Email</h2>
          <p className="text-sm leading-6">
            <a className="font-medium text-indigo-600 hover:underline dark:text-indigo-400" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Include in your message</h2>
          <p className="text-sm leading-6">Account email, issue summary, affected URL or order ID, and screenshots when relevant.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Related pages</h2>
          <p className="text-sm leading-6">
            <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/refunds">
              Refund policy
            </Link>{" "}
            and{" "}
            <Link className="text-indigo-600 hover:underline dark:text-indigo-400" href="/terms">
              terms of service
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
