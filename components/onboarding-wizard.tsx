"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const profileSchema = z.object({
  storeBannerText: z.string().trim().min(2, "Add at least 2 characters.").max(120, "Keep it under 120 characters."),
  storeBio: z.string().trim().max(500, "Bio must be 500 characters or less.").optional().or(z.literal("")),
})

const socialSchema = z.object({
  socialFacebook: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  socialTwitter: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  socialInstagram: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  socialYoutube: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  socialWebsite: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  socialWhatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  socialWhatsappMessage: z.string().trim().max(500).optional().or(z.literal("")),
})

export type OnboardingInitialValues = {
  storeBannerText: string
  storeBio: string
  contactInfo: string
  storeLogo: string
  leadCaptureChannel: "email" | "whatsapp"
  socialFacebook: string
  socialTwitter: string
  socialInstagram: string
  socialYoutube: string
  socialWebsite: string
  socialWhatsapp: string
  socialWhatsappMessage: string
}

export function OnboardingWizard({ initialValues }: { initialValues: OnboardingInitialValues }) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      storeBannerText: initialValues.storeBannerText || "Store",
      storeBio: initialValues.storeBio || "",
    },
  })

  const socialForm = useForm<z.infer<typeof socialSchema>>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      socialFacebook: initialValues.socialFacebook || "",
      socialTwitter: initialValues.socialTwitter || "",
      socialInstagram: initialValues.socialInstagram || "",
      socialYoutube: initialValues.socialYoutube || "",
      socialWebsite: initialValues.socialWebsite || "",
      socialWhatsapp: initialValues.socialWhatsapp || "",
      socialWhatsappMessage: initialValues.socialWhatsappMessage || "",
    },
  })

  const steps = useMemo(
    () => [
      { id: "profile", label: "Profile" },
      { id: "social", label: "Social links" },
    ],
    [],
  )

  const isProfileStep = stepIndex === 0

  const handleProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSaving(true)
    try {
      const payload = {
        storeBannerText: data.storeBannerText,
        storeBio: data.storeBio || "",
        contactInfo: initialValues.contactInfo || "",
        storeLogo: initialValues.storeLogo || "",
        socialFacebook: initialValues.socialFacebook || "",
        socialTwitter: initialValues.socialTwitter || "",
        socialInstagram: initialValues.socialInstagram || "",
        socialYoutube: initialValues.socialYoutube || "",
        socialWebsite: initialValues.socialWebsite || "",
        socialWhatsapp: initialValues.socialWhatsapp || "",
        socialWhatsappMessage: initialValues.socialWhatsappMessage || "",
        leadCaptureChannel: initialValues.leadCaptureChannel || "email",
      }

      const response = await fetch("/api/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message || "Failed to save profile"
        throw new Error(message)
      }

      toast({
        title: "Profile saved",
        description: "Nice! Let's connect your socials next.",
      })

      setStepIndex(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save profile"
      toast({
        title: "Could not save",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSocialSubmit = async (data: z.infer<typeof socialSchema>) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/store/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const message = (await response.json().catch(() => null))?.message || "Failed to save social links"
        throw new Error(message)
      }

      const completeResponse = await fetch("/api/onboarding/complete", { method: "PUT" })
      if (!completeResponse.ok) {
        const message = (await completeResponse.json().catch(() => null))?.message || "Failed to complete onboarding"
        throw new Error(message)
      }

      toast({
        title: "All set",
        description: "Your Linkstore is ready to go.",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to finish onboarding"
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-[2rem] border border-[#dfe6f4] bg-white/90 p-6 shadow-[0_24px_70px_rgba(74,93,130,0.18)] sm:p-10">
        <div className="flex flex-col gap-6 border-b border-[#e6edf9] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6b7a91]">Get started</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#111827]">Set up your Linkstore</h1>
            <p className="mt-2 text-sm text-[#5c6b83]">Two quick steps and you're ready to share your bio link.</p>
          </div>
          <div className="flex items-center gap-3">
            {steps.map((step, index) => {
              const isActive = index === stepIndex
              const isComplete = index < stepIndex
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold " +
                      (isComplete
                        ? "bg-[#111827] text-white"
                        : isActive
                          ? "bg-[#6367ff] text-white"
                          : "border border-[#d1d9e8] text-[#8a97ad]")
                    }
                  >
                    {index + 1}
                  </div>
                  <span
                    className={
                      "text-xs font-semibold uppercase tracking-[0.18em] " +
                      (isActive ? "text-[#111827]" : "text-[#8a97ad]")
                    }
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-6">
          {isProfileStep ? (
            <Form {...profileForm}>
              <form className="grid gap-6" onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={profileForm.control}
                    name="storeBannerText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input placeholder="Creator. Educator. Builder." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="storeBio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Tell visitors what you do and why they should follow." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#7c8aa3]">You can edit this later in Settings.</p>
                  <Button type="submit" className="bg-[#111827] text-white hover:bg-[#0f172a]" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...socialForm}>
              <form className="grid gap-6" onSubmit={socialForm.handleSubmit(handleSocialSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={socialForm.control}
                    name="socialInstagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/you" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="socialYoutube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/@you" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="socialTwitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter / X</FormLabel>
                        <FormControl>
                          <Input placeholder="https://x.com/you" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="socialWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="socialFacebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/you" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={socialForm.control}
                    name="socialWhatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="+91xxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={socialForm.control}
                  name="socialWhatsappMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp message</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Hey! I saw your Linkstore and..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#d1d9e8] text-[#111827]"
                    onClick={() => setStepIndex(0)}
                    disabled={isSaving}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="bg-[#111827] text-white hover:bg-[#0f172a]" disabled={isSaving}>
                    {isSaving ? "Finishing..." : "Finish"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
}
