import Link from "next/link"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.4-.2-2.1H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.9-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2l-3.2 2.5C4.8 19.7 8.1 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.3 13.8c-.2-.6-.4-1.2-.4-1.8s.1-1.3.4-1.8L3.1 7.7C2.4 9.1 2 10.5 2 12s.4 2.9 1.1 4.3l3.2-2.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.9C16.9 2.9 14.7 2 12 2 8.1 2 4.8 4.3 3.1 7.7l3.2 2.5C7.1 7.8 9.3 6 12 6z"
      />
    </svg>
  )
}

export function GoogleAuthPanel({
  description,
  ctaLabel,
  alternateHref,
  alternateLabel,
  alternatePrompt,
  nextPath = "/dashboard",
  error,
}: {
  description: string
  ctaLabel: string
  alternateHref: string
  alternateLabel: string
  alternatePrompt: string
  nextPath?: string
  error?: string | null
}) {
  return (
    <div className="grid gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Link href={`/api/auth/google/start?next=${encodeURIComponent(nextPath)}`} className="block">
        <Button
          variant="outline"
          className="h-12 w-full rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-[0_16px_34px_rgba(15,23,42,0.08)] hover:bg-slate-50"
        >
          <GoogleMark />
          {ctaLabel}
        </Button>
      </Link>

      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
        {description}
      </div>

      <div className="border-t border-slate-200/50 pt-6 text-center dark:border-slate-800/80">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {alternatePrompt}{" "}
          <Link
            href={alternateHref}
            className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {alternateLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}
