import { redirect } from "next/navigation"

export default async function StoreSettingsPage() {
  redirect("/dashboard?panel=design")
}
