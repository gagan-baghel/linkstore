import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { getSubscriptionRedirectPath } from "@/lib/subscription-routing"

export default async function NewProductPage() {
  const session = await getSafeServerSession()
  if (!session?.user.id) {
    redirect("/auth/login")
  }

  if (!session.user.hasActiveSubscription) {
    redirect(getSubscriptionRedirectPath("/dashboard/products/new"))
  }

  redirect("/dashboard/products?add=1")
}
