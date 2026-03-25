import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSafeServerSession } from "@/lib/auth"
import { convexQuery } from "@/lib/convex"
import { OnboardingWizard } from "@/components/onboarding-wizard"

export const metadata: Metadata = {
  title: "Onboarding - Linkstore",
  description: "Set up your Linkstore profile and social links",
}

export default async function OnboardingPage() {
  const session = await getSafeServerSession()
  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const user = await convexQuery<{ userId: string }, any | null>("users:getById", { userId: session.user.id }).catch(() => null)

  // if (!user || user.onboardingCompleted !== false) {
  //   redirect("/dashboard")
  // }

  return (
    <div className="min-h-screen bg-[#f3f6ff] px-4 py-10 sm:px-8">
      <OnboardingWizard
        initialValues={{
          storeBannerText: user.storeBannerText || "Store",
          storeBio: user.storeBio || "",
          contactInfo: user.contactInfo || "",
          storeLogo: user.storeLogo || "",
          leadCaptureChannel: user.leadCaptureChannel || "email",
          socialFacebook: user.socialFacebook || "",
          socialTwitter: user.socialTwitter || "",
          socialInstagram: user.socialInstagram || "",
          socialYoutube: user.socialYoutube || "",
          socialWebsite: user.socialWebsite || "",
          socialWhatsapp: user.socialWhatsapp || "",
          socialWhatsappMessage: user.socialWhatsappMessage || "",
        }}
      />
    </div>
  )
}
