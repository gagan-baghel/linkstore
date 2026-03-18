import type { Metadata } from "next"
import Link from "next/link"
import { PublicNavbar } from "@/components/public-navbar"
import { PublicFooter } from "@/components/public-footer"
import { getSupportEmail } from "@/lib/runtime-config"

export const metadata: Metadata = {
  title: "Contact Support - Linkstore",
  description: "How to contact Linkstore support for account and billing help.",
}

export default function ContactPage() {
  const supportEmail = getSupportEmail() || "support@example.com"

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 dark:bg-[#0B0F19]">
      <PublicNavbar />
      <main className="relative z-10 flex-1 px-4 py-16 sm:px-8 lg:py-24 w-full">
        <article className="mx-auto w-full max-w-3xl space-y-10 text-slate-800 dark:text-slate-200">
          <header className="space-y-4 border-b border-slate-200/50 pb-8 dark:border-slate-800/80">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">Contact Support</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">We typically respond within 1 business day.</p>
          </header>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Support Email</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              <a className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Include in your message</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">Account email, issue summary, affected URL or order ID, and screenshots when relevant.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Related pages</h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              <Link className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300" href="/refunds">
                Refund policy
              </Link>{" "}
              and{" "}
              <Link className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300" href="/terms">
                terms of service
              </Link>
              .
            </p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}
