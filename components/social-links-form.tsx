"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Facebook, Globe, Instagram, MessageCircle, Twitter, Youtube } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { DEFAULT_WHATSAPP_MESSAGE, buildWhatsAppUrl, isValidWhatsAppNumber, resolveWhatsAppMessage } from "@/lib/whatsapp"

const socialLinksFormSchema = z.object({
  socialFacebook: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialTwitter: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialInstagram: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialYoutube: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialWebsite: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialWhatsapp: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || isValidWhatsAppNumber(value), "Please enter a valid WhatsApp number with country code"),
  socialWhatsappMessage: z.string().max(500, { message: "Message must be 500 characters or less" }).optional().or(z.literal("")),
})

type SocialLinksFormValues = z.infer<typeof socialLinksFormSchema>

interface SocialLinksFormProps {
  socialFacebook?: string
  socialTwitter?: string
  socialInstagram?: string
  socialYoutube?: string
  socialWebsite?: string
  socialWhatsapp?: string
  socialWhatsappMessage?: string
}

export function SocialLinksForm({
  socialFacebook = "",
  socialTwitter = "",
  socialInstagram = "",
  socialYoutube = "",
  socialWebsite = "",
  socialWhatsapp = "",
  socialWhatsappMessage = "",
}: SocialLinksFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SocialLinksFormValues>({
    resolver: zodResolver(socialLinksFormSchema),
    defaultValues: {
      socialFacebook,
      socialTwitter,
      socialInstagram,
      socialYoutube,
      socialWebsite,
      socialWhatsapp,
      socialWhatsappMessage: socialWhatsappMessage || DEFAULT_WHATSAPP_MESSAGE,
    },
  })

  const values = form.watch()
  const activeLinks = [
    { name: "Facebook", value: values.socialFacebook?.trim() || "", icon: Facebook },
    { name: "Twitter", value: values.socialTwitter?.trim() || "", icon: Twitter },
    { name: "Instagram", value: values.socialInstagram?.trim() || "", icon: Instagram },
    { name: "YouTube", value: values.socialYoutube?.trim() || "", icon: Youtube },
    { name: "Website", value: values.socialWebsite?.trim() || "", icon: Globe },
    {
      name: "WhatsApp",
      value: values.socialWhatsapp?.trim() || "",
      href: buildWhatsAppUrl(values.socialWhatsapp, values.socialWhatsappMessage),
      secondary: resolveWhatsAppMessage(values.socialWhatsappMessage),
      icon: MessageCircle,
    },
  ]
    .map((item) => ({
      ...item,
      href: "href" in item ? item.href : item.value,
      secondary: "secondary" in item ? item.secondary : item.value,
    }))
    .filter((item) => item.value && item.href)

  async function onSubmit(data: SocialLinksFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/store/social-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update social links")
      }

      toast({
        title: "Success",
        description: "Your social links have been updated.",
      })

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-5 sm:shadow-none">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Social Media Links</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Add the channels you want visitors to verify before opening product links.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="socialFacebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Facebook className="h-4 w-4" /> Facebook
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://facebook.com/yourusername" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialTwitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Twitter className="h-4 w-4" /> Twitter
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://twitter.com/yourusername" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialInstagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Instagram className="h-4 w-4" /> Instagram
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://instagram.com/yourusername" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialYoutube"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Youtube className="h-4 w-4" /> YouTube
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://youtube.com/c/yourchannel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialWebsite"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Globe className="h-4 w-4" /> Personal Website
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://yourdomain.com" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Optional homepage, portfolio, newsletter, or creator website.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialWhatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Use the full international number with country code. Any country code is supported.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialWhatsappMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Prefilled Message
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder={DEFAULT_WHATSAPP_MESSAGE}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Visitors will see this message prefilled when WhatsApp opens. Leave your wording or keep the default.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="mt-4 h-10 w-full border border-slate-900 bg-slate-900 px-4 text-sm text-white shadow-none hover:bg-slate-800 sm:mt-5 sm:w-auto" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Social Links"}
          </Button>
        </form>
      </Form>

      <section className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-5 sm:shadow-none">
        <h2 className="text-base font-semibold text-slate-900">Current Links</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">These links show up on the public storefront as creator verification channels.</p>

        {activeLinks.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {activeLinks.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="truncate text-xs text-slate-500">{item.secondary}</p>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No social links added yet.
          </div>
        )}
      </section>
    </div>
  )
}
