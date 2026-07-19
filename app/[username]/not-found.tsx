import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function StoreNotFound() {
  return (
    <div className="container flex min-h-80 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Store Not Found</h1>
      <p className="max-w-xl text-muted-foreground">
        The store URL is incorrect or the username has changed. Please check the link and try again.
      </p>
      <Button asChild>
        <Link href="/">Go To Homepage</Link>
      </Button>
    </div>
  )
}
