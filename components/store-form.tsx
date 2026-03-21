"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Copy, ExternalLink, Upload, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const CATEGORY_STORAGE_KEY = "linkstore_product_categories"

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
  username: string
  storeUrl: string
  storeLogo?: string
  leadCaptureChannel?: "email" | "whatsapp"
}

export function StoreForm({
  storeBannerText,
  storeBio,
  username,
  storeUrl,
  storeLogo = "",
  leadCaptureChannel = "email",
}: StoreFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newCategory, setNewCategory] = useState("")

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

  const values = form.watch()
  const logoFallback = (username?.trim().charAt(0) || "S").toUpperCase()
  const normalizedStoreUrl = storeUrl.trim()

  function handleAddCategory() {
    const normalized = newCategory.trim()
    if (normalized.length < 2) {
      toast({
        title: "Category is too short",
        description: "Use at least 2 characters.",
        variant: "destructive",
      })
      return
    }
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY)
      let existing: string[] = []
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          existing = parsed.filter((item) => typeof item === "string")
        }
      }
      const merged = Array.from(new Set([...existing, normalized])).slice(0, 30)
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(merged))
      setNewCategory("")
      toast({
        title: "Category added",
        description: `"${normalized}" is now available in Product form.`,
      })
    } catch {
      toast({
        title: "Could not save category",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

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

      setIsEditing(false)
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
    <div className="w-full pb-24 sm:pb-20">
      <section className="mb-4 rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] sm:rounded-xl sm:p-5 sm:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">Storefront URL</h3>
            <p className="mt-1 text-sm text-slate-600">Open your public store directly from settings or copy the link to share it.</p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="truncate text-sm font-medium text-slate-900">{normalizedStoreUrl || "Store URL unavailable"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-auto sm:min-w-36">
            <Button asChild className="h-10 bg-slate-900 text-sm text-white hover:bg-slate-800" disabled={!normalizedStoreUrl}>
              <a href={normalizedStoreUrl || "#"} target="_blank" rel="noreferrer noopener">
                Open Store
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
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
      </section>

      {!isEditing ? (
        <div className="grid gap-4 md:grid-cols-12 md:gap-5">
          <section className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] md:col-span-8 md:rounded-xl md:p-5 md:shadow-none">
            <h3 className="text-sm font-semibold text-slate-900">Store Identity</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Store Banner Text</p>
                <p className="mt-1 text-sm text-slate-900">{values.storeBannerText || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Store Bio</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{values.storeBio?.trim() || "No bio added yet."}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] md:col-span-4 md:rounded-xl md:p-5 md:shadow-none">
            <h3 className="text-sm font-semibold text-slate-900">Branding</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-slate-200">
                <AvatarImage src={values.storeLogo || "/placeholder-logo.png"} alt="Store logo" />
                <AvatarFallback>{logoFallback}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-slate-700">{values.storeLogo?.trim() ? "Store logo is set." : "No logo uploaded yet."}</p>
            </div>
          </section>

          <section className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] md:col-span-12 md:rounded-xl md:p-5 md:shadow-none">
            <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wishlist Sign-up Method</p>
                <p className="mt-1 text-sm text-slate-800 capitalize">{values.leadCaptureChannel || "email"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.2rem] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_rgba(87,107,149,0.08)] md:col-span-12 md:rounded-xl md:p-5 md:shadow-none">
            <h3 className="text-sm font-semibold text-slate-900">Product Categories</h3>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Create category (e.g. Gadgets)"
                className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
              />
              <Button type="button" variant="outline" className="h-10 border-slate-300 bg-white text-slate-800" onClick={handleAddCategory}>
                Add Category
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Store Identity</h3>
                <FormField
                  control={form.control}
                  name="storeBannerText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-700">Store Banner Text</FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="Your Store Name" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Displayed as the main heading on your store page.</FormDescription>
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
                      <FormDescription className="text-xs">Optional short intro shown on your public store page.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              <section className="space-y-4 border-t border-slate-200 pt-5">
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
                      <FormDescription className="text-xs">
                        Choose whether shoppers join with Email or WhatsApp. Email is the default.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            </div>

            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-20">
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
                      <FormDescription className="mt-2 text-center text-xs">Displayed in your store header.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="sm"
                  className="mt-5 h-10 w-full rounded-md border border-slate-900 bg-slate-900 px-3 text-sm text-white shadow-none hover:bg-slate-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </aside>
          </form>
        </Form>
      )}

      <div className="fixed bottom-[5.4rem] right-3 z-40 sm:bottom-6 sm:right-6">
        {!isEditing ? (
          <Button
            type="button"
            className="h-10 border border-[#3e55df] bg-[#4a63f6] px-4 text-sm text-white shadow-none hover:bg-[#3f56de]"
            onClick={() => setIsEditing(true)}
          >
            Edit Store
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-10 border-[#cfd8ea] bg-white px-4 text-sm text-[#1f2a44] shadow-none hover:bg-[#f3f6fc]"
            onClick={() => {
              form.reset(defaultValues)
              setIsEditing(false)
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Edit
          </Button>
        )}
      </div>
    </div>
  )
}
