import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSafeServerSession } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Login - Linkstore",
  description: "Login to your Linkstore account",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const session = await getSafeServerSession()
  if (session?.user?.id) {
    redirect("/dashboard")
  }

  const resolvedSearchParams = await searchParams
  const nextPath = typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : "/dashboard"
  redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`)
}
