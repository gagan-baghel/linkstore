"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  price: z.string().trim().max(40, "Keep the price under 40 characters.").optional().default(""),
  description: z.string().trim().max(600, "Keep the note under 600 characters.").optional().default(""),
})

const BULK_LIMIT = 25

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  initialData?: {
    id: string
    title: string
    category?: string
    affiliateUrl: string
    images: string[]
    price?: string
    description?: string
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
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [bulkInput, setBulkInput] = useState("")
  const [bulkProgress, setBulkProgress] = useState<string | null>(null)

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
      price: initialData?.price || "",
      description: initialData?.description || "",
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
      price: "",
      description: "",
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
      if (metadata.price && !form.getValues("price")) {
        form.setValue("price", metadata.price, { shouldValidate: true })
      }
      if (Array.isArray(metadata.images) && metadata.images.length > 0 && form.getValues("images").length === 0) {
        form.setValue("images", [metadata.images[0]], { shouldValidate: true })
      }
      const hasFetchedImage = Array.isArray(metadata.images) && metadata.images.length > 0
      if (!hasFetchedImage && form.getValues("images").length === 0) {
        setAffiliateFetchNote("We couldn't find an image on that page — upload one below.")
      } else {
        setAffiliateFetchNote(null)
      }
    } catch (err) {
      console.error(err)
      setAffiliateFetchNote("We couldn't read that page. Fill in the title and upload an image below.")
    } finally {
      setIsFetchingMetadata(false)
    }
  }

  const bulkUrls = useMemo(
    () =>
      Array.from(
        new Set(
          bulkInput
            .split(/[\s,]+/)
            .map((token) => tryNormalizeAffiliateUrl(token.trim()))
            .filter((url): url is string => Boolean(url)),
        ),
      ),
    [bulkInput],
  )

  // Sequential on purpose: keeps us inside the metadata/create rate limits and
  // lets us stop at the first plan/limit error instead of spamming failures.
  async function importBulk() {
    const urls = bulkUrls.slice(0, BULK_LIMIT)
    if (urls.length === 0) {
      setError("Paste at least one product link.")
      return
    }
    setIsLoading(true)
    setError(null)
    const category = form.getValues("category") || "General"
    let created = 0
    const failed: string[] = []

    for (const [index, affiliateUrl] of urls.entries()) {
      setBulkProgress(`Adding ${index + 1} of ${urls.length}…`)
      try {
        const metaResponse = await fetch("/api/products/metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ affiliateUrl }),
        })
        const metadata = metaResponse.ok ? ((await metaResponse.json().catch(() => ({})))?.metadata ?? {}) : {}
        const fallbackTitle = new URL(affiliateUrl).hostname.replace(/^www\./, "")
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateUrl,
            category,
            title: (metadata.title || fallbackTitle).slice(0, 160),
            images: Array.isArray(metadata.images) ? metadata.images.slice(0, 1) : [],
            price: metadata.price || "",
          }),
        })
        if (response.status === 402 || response.status === 409) {
          const data = await response.json().catch(() => ({}))
          failed.push(...urls.slice(index))
          setError(data.message || "Stopped: your plan limit was reached.")
          break
        }
        if (!response.ok) throw new Error()
        created += 1
      } catch {
        failed.push(affiliateUrl)
      }
    }

    setIsLoading(false)
    setBulkProgress(null)
    setBulkInput(failed.join("\n"))
    if (created > 0) {
      toast({
        title: `${created} product${created === 1 ? "" : "s"} added`,
        description: failed.length > 0 ? `${failed.length} link(s) need attention — they're still in the box.` : "Review titles and prices anytime.",
      })
      onProductsCreated?.(created)
      router.refresh()
    } else if (failed.length > 0) {
      setError((current) => current || "None of those links could be added. Check them and try again.")
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


  const categoryField = (
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
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => onSubmit())} className="min-w-0 w-full space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:space-y-6 sm:p-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isEditing ? (
            <p className="text-xs text-slate-500">Changes go live on your store right away.</p>
          ) : (
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold" role="tablist" aria-label="Add mode">
              {(["single", "bulk"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => {
                    setMode(value)
                    setError(null)
                  }}
                  className={mode === value ? "rounded-full bg-white px-3 py-1.5 text-slate-900 shadow-sm" : "px-3 py-1.5 text-slate-500"}
                >
                  {value === "single" ? "One link" : "Many links"}
                </button>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-9 border-slate-300 bg-white text-slate-800"
            onClick={() => setIsCategoryDialogOpen(true)}
          >
            Create Category
          </Button>
        </div>
        {mode === "bulk" && !isEditing ? (
          <div className="space-y-3">
            <label htmlFor="bulk-links" className="text-sm font-semibold text-slate-800">
              Product links
            </label>
            <Textarea
              id="bulk-links"
              value={bulkInput}
              onChange={(event) => setBulkInput(event.target.value)}
              rows={7}
              placeholder={"Paste up to 25 links — one per line\nhttps://amzn.to/...\nhttps://myntra.com/..."}
              className="border-slate-200 bg-white font-mono text-xs text-slate-900"
              disabled={isLoading}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {bulkUrls.length} valid link{bulkUrls.length === 1 ? "" : "s"}
                {bulkUrls.length > BULK_LIMIT ? ` — the first ${BULK_LIMIT} will be added` : ""}. We&apos;ll fetch each title, image and price.
              </span>
            </div>
            {categoryField}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={importBulk}
                disabled={isLoading || bulkUrls.length === 0}
                className="h-10 w-full rounded-md border border-slate-900 bg-slate-900 px-6 text-sm text-white hover:bg-slate-800 sm:w-auto"
              >
                {bulkProgress || `Add ${Math.min(bulkUrls.length, BULK_LIMIT) || ""} product${bulkUrls.length === 1 ? "" : "s"}`}
              </Button>
              <p className="text-xs text-slate-500" aria-live="polite">
                {bulkProgress ? "Keep this window open." : ""}
              </p>
            </div>
          </div>
        ) : (
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
                <p className="text-xs text-slate-500">Paste any link. We’ll auto‑fill the title, image and price.</p>
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-slate-800">
                  Price <span className="font-normal text-slate-400">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input className="h-11 border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. ₹1,299" {...field} />
                </FormControl>
                <p className="text-xs text-slate-500">Shown on your store as-is. Prices change, so keep it current.</p>
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

          <details className="rounded-2xl border border-slate-200 bg-white p-3" open={isEditing && Boolean(initialData?.description)}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">More options</summary>
            <div className="mt-3 space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-800">Your note</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        className="border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                        placeholder="Why you love it, size tips, discount code… (searchable on your store)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {categoryField}
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
