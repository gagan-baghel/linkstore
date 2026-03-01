"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Facebook, Instagram, Twitter, Upload, X, Youtube } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const CATEGORY_STORAGE_KEY = "affiliatehub_product_categories"

const storeFormSchema = z.object({
  storeBannerText: z.string().min(2, {
    message: "Store banner text must be at least 2 characters.",
  }),
  storeBio: z.string().max(500).optional().or(z.literal("")),
  contactInfo: z.string().optional(),
  storeLogo: z.string().optional(),
  socialFacebook: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialTwitter: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialInstagram: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialYoutube: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  socialWebsite: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

interface StoreFormProps {
  storeBannerText: string
  storeBio: string
  contactInfo: string
  username: string
  storeLogo?: string
  socialFacebook?: string
  socialTwitter?: string
  socialInstagram?: string
  socialYoutube?: string
  socialWebsite?: string
}

export function StoreForm({
  storeBannerText,
  storeBio,
  contactInfo,
  username,
  storeLogo = "",
  socialFacebook = "",
  socialTwitter = "",
  socialInstagram = "",
  socialYoutube = "",
  socialWebsite = "",
}: StoreFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  const defaultValues: StoreFormValues = {
    storeBannerText: storeBannerText || "",
    storeBio: storeBio || "",
    contactInfo: contactInfo || "",
    storeLogo: storeLogo || "",
    socialFacebook: socialFacebook || "",
    socialTwitter: socialTwitter || "",
    socialInstagram: socialInstagram || "",
    socialYoutube: socialYoutube || "",
    socialWebsite: socialWebsite || "",
  }

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues,
  })

  const values = form.watch()
  const logoFallback = (username?.trim().charAt(0) || "S").toUpperCase()

  const socialLinks = [
    { name: "Facebook", value: values.socialFacebook?.trim() || "", icon: <Facebook className="h-4 w-4" /> },
    { name: "Twitter", value: values.socialTwitter?.trim() || "", icon: <Twitter className="h-4 w-4" /> },
    { name: "Instagram", value: values.socialInstagram?.trim() || "", icon: <Instagram className="h-4 w-4" /> },
    { name: "YouTube", value: values.socialYoutube?.trim() || "", icon: <Youtube className="h-4 w-4" /> },
  ].filter((item) => item.value.length > 0)

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

  return (
    <div className="w-full pb-20">
      {!isEditing ? (
        <div className="grid gap-4 md:grid-cols-12 md:gap-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-8">
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

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-4">
            <h3 className="text-sm font-semibold text-slate-900">Branding</h3>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-slate-200">
                <AvatarImage src={values.storeLogo || "/placeholder-logo.png"} alt="Store logo" />
                <AvatarFallback>{logoFallback}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-slate-700">{values.storeLogo?.trim() ? "Store logo is set." : "No logo uploaded yet."}</p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-12">
            <h3 className="text-sm font-semibold text-slate-900">Contact & Social</h3>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                <p className="mt-1 text-sm text-slate-800">{values.contactInfo?.trim() || "No contact info added yet."}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Social Media Links</p>
                {socialLinks.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {socialLinks.map((item) => (
                      <a
                        key={item.name}
                        href={item.value}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-slate-300 hover:text-slate-900"
                      >
                        {item.icon}
                        <span className="truncate">{item.value}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No social links added yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-12">
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
                          className="min-h-[120px] border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
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
                <h3 className="text-sm font-semibold text-slate-900">Contact & Links</h3>
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-700">Contact Information (Optional)</FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="Email or phone number" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Optional way for visitors to reach you.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="bg-slate-200" />

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-700">Social Media Links</p>
                  <div className="grid gap-4 md:grid-cols-2">
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

                  </div>
                </div>
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

      <div className="fixed bottom-6 right-4 z-40 sm:right-6">
        {!isEditing ? (
          <Button
            type="button"
            className="h-10 border border-[#3e55df] bg-[#4a63f6] px-4 text-sm text-white shadow-[0_10px_24px_rgba(74,99,246,0.35)] hover:bg-[#3f56de]"
            onClick={() => setIsEditing(true)}
          >
            Edit Store
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-10 border-[#cfd8ea] bg-white px-4 text-sm text-[#1f2a44] shadow-[0_10px_24px_rgba(19,34,68,0.14)] hover:bg-[#f3f6fc]"
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
