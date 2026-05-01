"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Copy, ExternalLink, Upload } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const storeFormSchema = z.object({
  storeBannerText: z.string().min(2, {
    message: "Store banner text must be at least 2 characters.",
  }),
  storeBio: z.string().max(500).optional().or(z.literal("")),
  storeLogo: z.string().optional(),
  leadCaptureChannel: z.enum(["email", "whatsapp"]).default("email"),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

interface StoreFormProps {
  storeBannerText: string
  storeBio: string
  storeUrl: string
  storeLogo?: string
  leadCaptureChannel?: "email" | "whatsapp"
}

export function StoreForm({
  storeBannerText,
  storeBio,
  storeUrl,
  storeLogo = "",
  leadCaptureChannel = "email",
}: StoreFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const defaultValues: StoreFormValues = {
    storeBannerText: storeBannerText || "",
    storeBio: storeBio || "",
    storeLogo: storeLogo || "",
    leadCaptureChannel,
  }

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues,
  })

  const normalizedStoreUrl = storeUrl.trim()

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", files[0])

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload logo")
      }

      const data = await response.json()
      form.setValue("storeLogo", data.url)

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function onSubmit(data: StoreFormValues) {
    setIsLoading(true)

    try {
      const response = await fetch("/api/store", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to update store settings")
      }

      toast({
        title: "Success",
        description: "Your store settings have been updated.",
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

  async function handleCopyStoreUrl() {
    if (!normalizedStoreUrl) return

    try {
      await navigator.clipboard.writeText(normalizedStoreUrl)
      toast({
        title: "Store link copied",
        description: "Your storefront URL is ready to share.",
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Copy failed",
        description: "Could not copy the storefront URL. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4 rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-5 sm:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">Storefront URL</h3>
            {/* <p className="mt-1 text-sm text-slate-600">Open your public store directly from settings or copy the link to share it.</p> */}
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">{normalizedStoreUrl || "Store URL unavailable"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-auto sm:min-w-36">
            {normalizedStoreUrl ? (
              <Button asChild className="h-10 bg-slate-900 text-sm text-white hover:bg-slate-800">
                <a href={normalizedStoreUrl} target="_blank" rel="noreferrer noopener">
                  Open Store
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button type="button" className="h-10 bg-slate-900 text-sm text-white hover:bg-slate-800" disabled>
                Open Store
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-10 border-slate-300 bg-white text-sm text-slate-800"
              onClick={handleCopyStoreUrl}
              disabled={!normalizedStoreUrl}
            >
              Copy Link
              <Copy className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-[1.4rem] border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_rgba(87,107,149,0.08)] sm:p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Store Identity</h3>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-700"
                  onClick={() => form.reset(defaultValues)}
                >
                  Reset changes
                </button>
              </div>
              <FormField
                control={form.control}
                name="storeBannerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-700">Store Banner Text</FormLabel>
                    <FormControl>
                      <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="Your Store Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storeBio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-700">Store Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell visitors about your store and what products you recommend..."
                        className="min-h-32 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
              <FormField
                control={form.control}
                name="leadCaptureChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-700">Wishlist Sign-up Method</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none"
                      >
                        <option value="email">Email</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Branding</h3>
              <FormField
                control={form.control}
                name="storeLogo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col items-center rounded-md border border-slate-200 bg-slate-50 p-4">
                      <Avatar className="h-20 w-20">
                        {field.value ? (
                          <AvatarImage src={field.value || "/placeholder-logo.png"} alt="Store logo" />
                        ) : (
                          <AvatarFallback className="bg-primary/10">
                            <Upload className="h-8 w-8 text-primary" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="mt-4 flex w-full flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="relative h-9 w-full border-slate-300 bg-white text-xs text-slate-700 shadow-none"
                          disabled={isUploading}
                          onClick={() => document.getElementById("logo-upload")?.click()}
                        >
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleLogoUpload}
                            disabled={isUploading}
                          />
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploading ? "Uploading..." : field.value ? "Change Logo" : "Upload Logo"}
                        </Button>
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full px-2 text-xs text-red-500 hover:text-red-700"
                            onClick={() => form.setValue("storeLogo", "")}
                          >
                            Remove Logo
                          </Button>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-start border-t border-slate-100 pt-5">
              <Button
                type="submit"
                size="sm"
                className="h-10 w-full rounded-md border border-slate-900 bg-slate-900 px-3 text-sm text-white shadow-none hover:bg-slate-800 sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
