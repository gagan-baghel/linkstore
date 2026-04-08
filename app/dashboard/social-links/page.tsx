import { redirect } from "next/navigation"

export default async function SocialLinksPage() {
  redirect("/dashboard?panel=links")
}
