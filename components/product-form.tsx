"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { normalizeAffiliateUrl, tryNormalizeAffiliateUrl } from "@/lib/affiliate-url"

const productFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  affiliateUrl: z.string().refine((value) => !!tryNormalizeAffiliateUrl(value), {
    message: "Please enter a valid affiliate URL.",
  }),
  images: z.array(z.string()).optional().default([]),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  initialData?: {
    id: string
    title: string
    category?: string
    description: string
    affiliateUrl: string
    images: string[]
    videoUrl?: string
  }
  isEditing?: boolean
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps = {}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      category: initialData?.category || "General",
      description: initialData?.description || "",
      affiliateUrl: initialData?.affiliateUrl || "",
      images: initialData?.images || [],
    },
  })

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      const normalizedAffiliateUrl = normalizeAffiliateUrl(data.affiliateUrl)
      const payload = { ...data, affiliateUrl: normalizedAffiliateUrl }
      const url = isEditing ? `/api/products/${initialData?.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || (isEditing ? "Failed to update product" : "Failed to create product"))
      }

      toast({
        title: "Success",
        description: isEditing ? "Your product has been updated." : "Your product has been created.",
      })

      router.push("/dashboard/products")
      router.refresh()
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchFromAffiliateLink() {
    const rawAffiliateUrl = form.getValues("affiliateUrl").trim()
    if (!rawAffiliateUrl) {
      setError("Please enter an affiliate URL first.")
      return
    }
    const affiliateUrl = tryNormalizeAffiliateUrl(rawAffiliateUrl)
    if (!affiliateUrl) {
      setError("Please enter a valid affiliate URL.")
      return
    }
    form.setValue("affiliateUrl", affiliateUrl, { shouldValidate: true })

    setError(null)
    setIsFetchingMetadata(true)

    try {
      const response = await fetch("/api/products/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ affiliateUrl }),
      })

      let data: any = {}
      try {
        data = await response.json()
      } catch {
        data = {}
      }
      if (!response.ok) {
        throw new Error(data.message || "Could not fetch product metadata from this URL.")
      }

      const metadata = data.metadata || {}
      if (metadata.title && !form.getValues("title")) {
        form.setValue("title", metadata.title, { shouldValidate: true })
      }
      if (metadata.description && !form.getValues("description")) {
        form.setValue("description", metadata.description, { shouldValidate: true })
      }
      if (Array.isArray(metadata.images) && metadata.images.length > 0 && form.getValues("images").length === 0) {
        form.setValue("images", metadata.images, { shouldValidate: true })
      }

      toast({
        title: "Metadata fetched",
        description:
          form.getValues("images").length > 0
            ? "Title/description updated. Existing uploaded image kept."
            : "Product details were fetched from the affiliate link.",
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Could not fetch metadata from the affiliate URL.")
    } finally {
      setIsFetchingMetadata(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3 sm:space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input className="h-9 text-sm" placeholder="Enter product title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input className="h-9 text-sm" placeholder="e.g. Electronics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter product description" className="min-h-[88px]" {...field} />
              </FormControl>
              <FormDescription className="text-xs">Short and clear works best.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="affiliateUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Affiliate URL</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input className="h-9 text-sm" placeholder="https://example.com/product?ref=yourid" {...field} />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full shrink-0 px-3 text-xs sm:w-auto sm:text-sm"
                    onClick={fetchFromAffiliateLink}
                    disabled={isLoading || isFetchingMetadata}
                  >
                    {isFetchingMetadata ? "Fetching..." : "Auto Fetch"}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                Visitors are redirected to this URL on click.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormControl>
                <ImageUpload images={field.value} onChange={(images) => field.onChange(images)} maxImages={5} />
              </FormControl>
              <FormDescription>
                Upload up to 5 images (stored on Cloudinary), or use "Auto Fetch". Uploaded image will be shown in your store.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="h-9 w-full px-4 text-xs sm:w-auto sm:px-6 sm:text-sm">
          {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Product" : "Create Product"}
        </Button>
      </form>
    </Form>
  )
}
