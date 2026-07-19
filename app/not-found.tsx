import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container flex min-h-80 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
      <p className="max-w-xl text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <Button asChild>
        <Link href="/">Go To Homepage</Link>
      </Button>
    </div>
  )
}
