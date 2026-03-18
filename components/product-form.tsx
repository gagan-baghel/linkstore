"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { PlusCircle, Trash2 } from "lucide-react"

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
type QueuedProduct = {
  id: string
  title: string
  category: string
  affiliateUrl: string
  images: string[]
}

interface ProductFormProps {
  initialData?: {
    id: string
    title: string
    category?: string
    affiliateUrl: string
    images: string[]
  }
  isEditing?: boolean
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps = {}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customCategoryInput, setCustomCategoryInput] = useState("")
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [affiliateFetchNote, setAffiliateFetchNote] = useState<string | null>(null)
  const [queuedProducts, setQueuedProducts] = useState<QueuedProduct[]>([])

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
        router.push("/dashboard/products")
        router.refresh()
        return
      }

      const toCreate: ProductFormValues[] = queuedProducts.map((item) => ({
        title: item.title,
        category: item.category,
        affiliateUrl: item.affiliateUrl,
        images: item.images,
      }))

      const currentDraft = getCurrentDraft()
      if (currentDraft?.error) {
        await form.trigger()
        throw new Error(currentDraft.error)
      }
      if (currentDraft?.data) {
        toCreate.push(currentDraft.data)
      }

      if (toCreate.length === 0) {
        throw new Error("Add at least one product first.")
      }

      for (const payload of toCreate) {
        await createProduct(payload)
      }

      toast({
        title: "Success",
        description: `${toCreate.length} product${toCreate.length > 1 ? "s" : ""} created successfully.`,
      })

      setQueuedProducts([])
      clearForm()
      router.push("/dashboard/products")
      router.refresh()
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

  async function addAnotherToQueue() {
    setError(null)
    const parsed = productFormSchema.safeParse(form.getValues())
    if (!parsed.success) {
      await form.trigger()
      setError("Please fill required fields before adding another.")
      return
    }

    const draft: QueuedProduct = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: parsed.data.title.trim(),
      category: parsed.data.category.trim(),
      affiliateUrl: normalizeAffiliateUrl(parsed.data.affiliateUrl),
      images: parsed.data.images.slice(0, 1),
    }

    setQueuedProducts((prev) => [...prev, draft])
    clearForm()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => onSubmit())} className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6 sm:space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Product Details</p>
          <Button
            type="button"
            variant="outline"
            className="h-9 border-slate-300 bg-white text-slate-800"
            onClick={() => setIsCategoryDialogOpen(true)}
          >
            Create Category
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-800">Title</FormLabel>
                    <FormControl>
                      <Input className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="Enter product title" {...field} />
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
                    <FormLabel className="text-sm font-semibold text-slate-800">Category</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                        <SelectTrigger className="h-10 border-slate-300 bg-white text-sm text-slate-900">
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
            <FormField
              control={form.control}
              name="affiliateUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-800">Affiliate URL</FormLabel>
                  <FormControl>
                    <Input
                      className="h-10 border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder="https://example.com/product?ref=yourid"
                      {...field}
                      onPaste={async (e) => {
                        await handleAffiliateUrlPaste(e)
                      }}
                    />
                  </FormControl>
                  {affiliateFetchNote && <p className="text-xs text-slate-500">{affiliateFetchNote}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="submit" disabled={isLoading} className="h-10 w-full rounded-md border border-slate-900 bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 sm:w-auto sm:px-6">
                {isLoading
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                    ? "Update Product"
                    : `Create Product${queuedProducts.length > 0 ? ` (${queuedProducts.length + 1})` : ""}`}
              </Button>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={addAnotherToQueue}
                  className="h-10 w-full border-slate-300 bg-white px-4 text-sm text-slate-800 hover:bg-slate-100 sm:w-auto"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Another
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-800">Product Image</FormLabel>
                  <FormControl>
                    <ImageUpload images={field.value} onChange={(images) => field.onChange(images)} maxImages={1} />
                  </FormControl>
                  <p className="mt-1 text-xs text-slate-500">Upload one clear product image.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {!isEditing && queuedProducts.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-800">Queued Products ({queuedProducts.length})</p>
            <div className="space-y-2">
              {queuedProducts.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {index + 1}. {item.title}
                    </p>
                    <p className="truncate text-xs text-slate-600">
                      {item.category} • {item.affiliateUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 border-rose-200 bg-white px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setQueuedProducts((prev) => prev.filter((product) => product.id !== item.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

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
