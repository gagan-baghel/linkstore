"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { Facebook, Globe, Instagram, MessageCircle, Twitter, Youtube, Trash2 } from "lucide-react"

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
  customLinks: z
    .array(
      z.object({
        label: z.string().max(40).optional().or(z.literal("")),
        url: z.string().url({ message: "Please enter a valid URL" }),
      }),
    )
    .optional(),
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
  customLinks?: Array<{ label?: string; url: string }>
}

export function SocialLinksForm({
  socialFacebook = "",
  socialTwitter = "",
  socialInstagram = "",
  socialYoutube = "",
  socialWebsite = "",
  socialWhatsapp = "",
  socialWhatsappMessage = "",
  customLinks = [],
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
      customLinks,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customLinks",
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
    ...((values.customLinks || [])
      .filter((item) => item.url?.trim())
      .map((item, index) => ({
        name: item.label?.trim() || `Link ${index + 1}`,
        value: item.url?.trim() || "",
        icon: Globe,
      }))),
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
      const normalizedCustomLinks =
        data.customLinks
          ?.map((item) => ({
            label: item.label?.trim() || "",
            url: item.url.trim(),
          }))
          .filter((item) => item.url.length > 0) ?? []

      const response = await fetch("/api/store/social-links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, customLinks: normalizedCustomLinks }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message =
          errorPayload && typeof errorPayload === "object" && "message" in errorPayload
            ? String(errorPayload.message)
            : "Failed to update social links"
        throw new Error(message)
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
    <div className="social-links-form grid gap-3.5 lg:gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-6 sm:shadow-none">
          {/* <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Social Media Links</h2>
          </div> */}
          <h4 className="mb-2 text-base font-semibold text-slate-900">Social links</h4>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="socialFacebook"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
                  </FormLabel>
                  <FormControl>
                    <Input className="mt-2 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://facebook.com/yourusername" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">Use the public URL to your profile.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialTwitter"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Twitter className="h-4 w-4 text-[#1DA1F2]" /> Twitter
                  </FormLabel>
                  <FormControl>
                    <Input className="mt-2 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://twitter.com/yourusername" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">Add your latest account URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialInstagram"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Instagram className="h-4 w-4 text-[#E1306C]" /> Instagram
                  </FormLabel>
                  <FormControl>
                    <Input className="mt-2 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://instagram.com/yourusername" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">Most creators drive the most traffic here.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialYoutube"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Youtube className="h-4 w-4 text-[#FF0000]" /> YouTube
                  </FormLabel>
                  <FormControl>
                    <Input className="mt-2 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://youtube.com/@yourchannel" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">Paste your channel link or handle.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialWebsite"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Globe className="h-4 w-4 text-slate-500" /> Personal Website
                  </FormLabel>
                  <FormControl>
                    <Input className="mt-2 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="https://yourdomain.com" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">Your homepage or portfolio.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialWhatsapp"
              render={({ field }) => (
                <FormItem className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input className="mt-2 h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="+91 98765 43210" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">Use the full international number with country code.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <details className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">Edit WhatsApp message</summary>
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="socialWhatsappMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <MessageCircle className="h-4 w-4 text-[#25D366]" /> Prefilled Message
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="mt-2 min-h-24 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                          placeholder={DEFAULT_WHATSAPP_MESSAGE}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-slate-500">This message opens in WhatsApp.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </details>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="mb-2 text-base font-semibold text-slate-900">Custom links</h4>
                {/* <p className="text-xs text-slate-500">Add any other link you want to show.</p> */}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 border-slate-300 bg-white text-slate-800"
                onClick={() => append({ label: "", url: "" })}
              >
                + Add link
              </Button>
            </div>

            <div className="grid gap-3">
              {fields.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  No custom links added yet.
                </div>
              )}
              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                  <FormField
                    control={form.control}
                    name={`customLinks.${index}.label`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700">Label</FormLabel>
                        <FormControl>
                          <Input
                            className="h-9 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                            placeholder="e.g. TikTok"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`customLinks.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-slate-700">URL</FormLabel>
                        <FormControl>
                          <Input
                            className="h-9 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                            placeholder="https://"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 text-slate-500 hover:text-slate-900"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="mt-4 h-11 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-6 text-white shadow-[0_16px_30px_rgba(14,165,233,0.3)] hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 sm:w-auto" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Links"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
