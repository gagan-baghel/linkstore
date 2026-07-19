"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled application error:", error)
  }, [error])

  return (
    <div className="container flex min-h-80 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Something Went Wrong</h1>
      <p className="max-w-xl text-muted-foreground">
        We hit an unexpected error while loading this page. Trying again usually fixes it.
      </p>
      {/* digest is the only server-side handle on this error; surface it for support. */}
      {error.digest ? <p className="text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try Again</Button>
        <Button asChild variant="outline">
          <Link href="/">Go To Homepage</Link>
        </Button>
      </div>
    </div>
  )
}
