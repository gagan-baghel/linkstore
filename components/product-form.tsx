"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { normalizeAffiliateUrl, tryNormalizeAffiliateUrl } from "@/lib/affiliate-url"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const CATEGORY_STORAGE_KEY = "linkstore_product_categories"
const DEFAULT_CATEGORIES = ["General", "Electronics", "Fashion", "Home", "Beauty", "Books", "Accessories"]

const productFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  affiliateUrl: z.string().refine((value) => !!tryNormalizeAffiliateUrl(value), {
    message: "Please enter a valid affiliate URL.",
  }),
  images: z.array(z.string()).max(1).optional().default([]),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  initialData?: {
    id: string
    title: string
    category?: string
    affiliateUrl: string
    images: string[]
  }
  isEditing?: boolean
  redirectTo?: string | null
  onProductsCreated?: (count: number) => void
}

export function ProductForm({
  initialData,
  isEditing = false,
  redirectTo = "/dashboard/products",
  onProductsCreated,
}: ProductFormProps = {}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customCategoryInput, setCustomCategoryInput] = useState("")
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [affiliateFetchNote, setAffiliateFetchNote] = useState<string | null>(null)
  // single-add only

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CATEGORY_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const cleaned = parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length >= 2)
        .slice(0, 30)
      if (cleaned.length > 0) {
        setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...cleaned])))
      }
    } catch {
      // Ignore localStorage parse errors.
    }
  }, [])

  useEffect(() => {
    const currentCategory = (initialData?.category || "").trim()
    if (!currentCategory) return
    setCategories((prev) => (prev.some((item) => item.toLowerCase() === currentCategory.toLowerCase()) ? prev : [...prev, currentCategory]))
  }, [initialData?.category])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      category: initialData?.category || "General",
      affiliateUrl: initialData?.affiliateUrl || "",
      images: (initialData?.images || []).slice(0, 1),
    },
  })

  const categoryOptions = useMemo(() => Array.from(new Set(categories)), [categories])

  function addCustomCategory() {
    const normalized = customCategoryInput.trim()
    if (normalized.length < 2) {
      setError("Category name must be at least 2 characters.")
      return
    }
    const exists = categoryOptions.some((item) => item.toLowerCase() === normalized.toLowerCase())
    if (exists) {
      form.setValue("category", categoryOptions.find((item) => item.toLowerCase() === normalized.toLowerCase()) || normalized, {
        shouldValidate: true,
      })
      setCustomCategoryInput("")
      return
    }

    const next = [...categoryOptions, normalized]
    setCategories(next)
    form.setValue("category", normalized, { shouldValidate: true })
    setCustomCategoryInput("")
    setError(null)
    setIsCategoryDialogOpen(false)
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore localStorage write errors.
    }
  }

  async function createProduct(payload: ProductFormValues) {
    const normalizedAffiliateUrl = normalizeAffiliateUrl(payload.affiliateUrl)
    const body = { ...payload, affiliateUrl: normalizedAffiliateUrl }
    const url = isEditing ? `/api/products/${initialData?.id}` : "/api/products"
    const method = isEditing ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || (isEditing ? "Failed to update product" : "Failed to create product"))
    }
  }

  function clearForm() {
    form.reset({
      title: "",
      category: "General",
      affiliateUrl: "",
      images: [],
    })
    setAffiliateFetchNote(null)
    setError(null)
  }

  function getCurrentDraft() {
    const values = form.getValues()
    const hasInput =
      values.title.trim().length > 0 || values.affiliateUrl.trim().length > 0 || (Array.isArray(values.images) && values.images.length > 0)

    if (!hasInput) return null

    const parsed = productFormSchema.safeParse(values)
    if (!parsed.success) {
      return { error: "Please complete the current product fields before submitting." as const }
    }
    return { data: parsed.data }
  }

  async function onSubmit() {
    setIsLoading(true)
    setError(null)

    try {
      if (isEditing) {
        const parsed = productFormSchema.safeParse(form.getValues())
        if (!parsed.success) {
          await form.trigger()
          throw new Error("Please fix validation errors before saving.")
        }
        await createProduct(parsed.data)
        toast({
          title: "Success",
          description: "Your product has been updated.",
        })
        onProductsCreated?.(1)
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
        return
      }

      const currentDraft = getCurrentDraft()
      if (currentDraft?.error) {
        await form.trigger()
        throw new Error(currentDraft.error)
      }
      if (!currentDraft?.data) {
        throw new Error("Add a product first.")
      }

      await createProduct(currentDraft.data)

      toast({
        title: "Success",
        description: "Product created successfully.",
      })

      clearForm()
      onProductsCreated?.(1)
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchFromAffiliateLink(explicitUrl?: string) {
    const rawAffiliateUrl = (explicitUrl ?? form.getValues("affiliateUrl")).trim()
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
    setAffiliateFetchNote("Fetching...")
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
      if (Array.isArray(metadata.images) && metadata.images.length > 0 && form.getValues("images").length === 0) {
        form.setValue("images", [metadata.images[0]], { shouldValidate: true })
      }
      const hasFetchedImage = Array.isArray(metadata.images) && metadata.images.length > 0
      if (!hasFetchedImage && form.getValues("images").length === 0) {
        setAffiliateFetchNote("Can't fetch image from URL. Kindly upload a image.")
      } else {
        setAffiliateFetchNote(null)
      }
    } catch (err) {
      console.error(err)
      setAffiliateFetchNote("Can't fetch image from URL. Kindly upload a image.")
    } finally {
      setIsFetchingMetadata(false)
    }
  }

  async function handleAffiliateUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim()
    if (!pasted || isFetchingMetadata || isLoading) return

    const normalized = tryNormalizeAffiliateUrl(pasted)
    if (!normalized) return

    form.setValue("affiliateUrl", normalized, { shouldValidate: true, shouldDirty: true })
    await fetchFromAffiliateLink(normalized)
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => onSubmit())} className="min-w-0 w-full space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:space-y-6 sm:p-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">Add product</p>
            <p className="text-xs text-slate-500">Paste a link, we’ll fill the rest.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 border-slate-300 bg-white text-slate-800"
            onClick={() => setIsCategoryDialogOpen(true)}
          >
            Create Category
          </Button>
        </div>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="affiliateUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-800">Product link</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      className="h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder="Paste product URL"
                      {...field}
                      onPaste={async (e) => {
                        await handleAffiliateUrlPaste(e)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isFetchingMetadata}
                      onClick={() => fetchFromAffiliateLink()}
                      className="h-11 border-slate-300 bg-white text-sm text-slate-800"
                    >
                      {isFetchingMetadata ? "Fetching..." : "Auto-fill"}
                    </Button>
                  </div>
                </FormControl>
                <p className="text-xs text-slate-500">Paste any link. We’ll auto‑fill title and image.</p>
                {affiliateFetchNote && <p className="text-xs text-slate-500">{affiliateFetchNote}</p>}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-800">Title</FormLabel>
                <FormControl>
                  <Input className="h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="Enter product title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <FormLabel className="text-sm font-semibold text-slate-800">Product image</FormLabel>
                <FormControl>
                  <ImageUpload images={field.value} onChange={(images) => field.onChange(images)} maxImages={1} />
                </FormControl>
                <p className="mt-2 text-xs text-slate-500">One clean image works best.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <details className="rounded-2xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">More options</summary>
            <div className="mt-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-800">Category</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                        <SelectTrigger className="h-11 border-slate-200 bg-white text-sm text-slate-900">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </details>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" disabled={isLoading} className="h-10 w-full rounded-md border border-slate-900 bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 sm:w-auto sm:px-6">
              {isLoading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </div>
        </div>

        {/* single add only */}

        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <Input
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              placeholder="e.g. Gadgets"
              className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={addCustomCategory}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  )
}
